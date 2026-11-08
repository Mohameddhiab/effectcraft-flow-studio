//! Silence detection.
//!
//! The signal is cut into short windows whose RMS level is measured in dB. Windows louder than a
//! threshold are speech. Two engines pick that threshold:
//!
//! - [`Engine::Fixed`]: exactly `threshold_db`.
//! - [`Engine::Adaptive`] (default): `threshold_db`, raised when the recording's noise floor is
//!   high (a noisy room never drops below a fixed -35 dB), with a 3 dB hysteresis so the decision
//!   does not flutter around the threshold.
//!
//! Short pauses (below `min_silence`) never become cuts, speech blips shorter than `min_speech`
//! are ignored, and every cut leaves `pad_after` / `pad_before` seconds of room next to the speech
//! it touches, so words are not clipped.

use serde::{Deserialize, Serialize};

use crate::{FlowError, Result};

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Engine {
    Fixed,
    #[default]
    Adaptive,
}

/// Parameters of [`analyze`]. Times are in seconds.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct SilenceParams {
    pub engine: Engine,
    /// Level below which a window is silence, in dB (negative).
    pub threshold_db: f64,
    /// Shortest silence worth cutting.
    pub min_silence: f64,
    /// Shortest burst of sound that counts as speech.
    pub min_speech: f64,
    /// Room kept before the speech that follows a cut.
    pub pad_before: f64,
    /// Room kept after the speech that precedes a cut.
    pub pad_after: f64,
    /// Measurement window in milliseconds.
    pub window_ms: f64,
}

impl Default for SilenceParams {
    fn default() -> Self {
        Self { engine: Engine::Adaptive, threshold_db: -35.0, min_silence: 0.4, min_speech: 0.08, pad_before: 0.1, pad_after: 0.1, window_ms: 20.0 }
    }
}

impl SilenceParams {
    /// Rejects values that would make the analysis meaningless (or non-finite).
    pub fn validate(&self) -> Result<()> {
        let check = |name: &str, v: f64, lo: f64, hi: f64| {
            if v.is_finite() && (lo..=hi).contains(&v) { Ok(()) } else { Err(FlowError::Param(format!("{name} must be between {lo} and {hi}"))) }
        };
        check("thresholdDb", self.threshold_db, -90.0, 0.0)?;
        check("minSilence", self.min_silence, 0.02, 60.0)?;
        check("minSpeech", self.min_speech, 0.0, 10.0)?;
        check("padBefore", self.pad_before, 0.0, 5.0)?;
        check("padAfter", self.pad_after, 0.0, 5.0)?;
        check("windowMs", self.window_ms, 5.0, 200.0)
    }
}

/// A span of time in seconds.
#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)]
pub struct Range {
    pub start: f64,
    pub end: f64,
}

impl Range {
    pub fn len(&self) -> f64 {
        (self.end - self.start).max(0.0)
    }

    pub fn is_empty(&self) -> bool {
        self.len() <= 0.0
    }
}

/// What [`analyze`] found.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Analysis {
    pub duration: f64,
    /// Ranges to cut.
    pub silent: Vec<Range>,
    /// Ranges to keep (the complement of `silent`).
    pub keep: Vec<Range>,
    pub silent_total: f64,
    pub keep_total: f64,
    /// The threshold actually used (higher than requested when the noise floor is high).
    pub threshold_used_db: f64,
    /// Level of the quietest tenth of the recording.
    pub noise_floor_db: f64,
    /// A coarse level curve (dB per slice) for drawing a waveform-like preview.
    pub levels: Vec<f32>,
}

const DB_FLOOR: f64 = -90.0;
const LEVEL_POINTS: usize = 240;

fn window_db(w: &[f32]) -> f64 {
    if w.is_empty() {
        return DB_FLOOR;
    }
    let sum: f64 = w.iter().map(|s| if s.is_finite() { f64::from(*s) * f64::from(*s) } else { 0.0 }).sum();
    let rms = (sum / w.len() as f64).sqrt();
    (20.0 * rms.max(1e-9).log10()).max(DB_FLOOR)
}

fn percentile(sorted: &[f64], q: f64) -> f64 {
    if sorted.is_empty() {
        return DB_FLOOR;
    }
    let idx = ((sorted.len() - 1) as f64 * q.clamp(0.0, 1.0)).round() as usize;
    sorted.get(idx).copied().unwrap_or(DB_FLOOR)
}

fn thresholds(db: &[f64], p: &SilenceParams) -> (f64, f64, f64) {
    let mut sorted = db.to_vec();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let floor = percentile(&sorted, 0.10);
    match p.engine {
        Engine::Fixed => (p.threshold_db, p.threshold_db, floor),
        Engine::Adaptive => {
            let loud = percentile(&sorted, 0.95);
            let enter = p.threshold_db.max((floor + 10.0).min(loud - 15.0));
            (enter, enter - 3.0, floor)
        }
    }
}

fn classify(db: &[f64], enter: f64, exit: f64) -> Vec<bool> {
    let mut on = false;
    db.iter()
        .map(|v| {
            if !on && *v >= enter {
                on = true;
            } else if on && *v < exit {
                on = false;
            }
            on
        })
        .collect()
}

/// Runs of `true` as `(first, last_exclusive)` window indices.
fn runs(flags: &[bool]) -> Vec<(usize, usize)> {
    let mut out = Vec::new();
    let mut start: Option<usize> = None;
    for (i, f) in flags.iter().enumerate() {
        match (*f, start) {
            (true, None) => start = Some(i),
            (false, Some(s)) => {
                out.push((s, i));
                start = None;
            }
            _ => {}
        }
    }
    if let Some(s) = start {
        out.push((s, flags.len()));
    }
    out
}

fn round_ms(v: f64) -> f64 {
    (v * 1000.0).round() / 1000.0
}

/// Merges speech runs separated by less than `min_silence`, then drops runs shorter than
/// `min_speech`. Returns speech spans in seconds.
fn speech_spans(flags: &[bool], win_s: f64, duration: f64, p: &SilenceParams) -> Vec<Range> {
    let mut spans: Vec<Range> = Vec::new();
    for (a, b) in runs(flags) {
        let r = Range { start: a as f64 * win_s, end: (b as f64 * win_s).min(duration) };
        match spans.last_mut() {
            Some(last) if r.start - last.end < p.min_silence => last.end = r.end,
            _ => spans.push(r),
        }
    }
    spans.retain(|s| s.len() >= p.min_speech);
    spans
}

/// Silent spans between speech spans (and around them), with padding applied.
fn silent_spans(speech: &[Range], duration: f64, p: &SilenceParams) -> Vec<Range> {
    let mut out = Vec::new();
    let mut cursor = 0.0;
    let mut after_speech = false;
    let mut push = |start: f64, end: f64, before_pad: f64, after_pad: f64| {
        let r = Range { start: start + after_pad, end: end - before_pad };
        if r.len() >= 0.02 && (end - start) >= p.min_silence {
            out.push(Range { start: round_ms(r.start), end: round_ms(r.end) });
        }
    };
    for s in speech {
        push(cursor, s.start, p.pad_before, if after_speech { p.pad_after } else { 0.0 });
        cursor = s.end;
        after_speech = true;
    }
    push(cursor, duration, 0.0, if after_speech { p.pad_after } else { 0.0 });
    out
}

fn complement(silent: &[Range], duration: f64) -> Vec<Range> {
    let mut out = Vec::new();
    let mut cursor = 0.0;
    for s in silent {
        if s.start > cursor {
            out.push(Range { start: round_ms(cursor), end: round_ms(s.start) });
        }
        cursor = s.end;
    }
    if duration > cursor {
        out.push(Range { start: round_ms(cursor), end: round_ms(duration) });
    }
    out
}

fn level_curve(db: &[f64]) -> Vec<f32> {
    if db.is_empty() {
        return Vec::new();
    }
    let points = LEVEL_POINTS.min(db.len());
    (0..points)
        .map(|i| {
            let a = i * db.len() / points;
            let b = ((i + 1) * db.len() / points).max(a + 1).min(db.len());
            db.get(a..b).map_or(DB_FLOOR, |s| s.iter().copied().fold(DB_FLOOR, f64::max)) as f32
        })
        .collect()
}

/// Finds what to keep and what to cut in mono `samples` at `rate` Hz.
pub fn analyze(samples: &[f32], rate: u32, p: &SilenceParams) -> Result<Analysis> {
    p.validate()?;
    if rate == 0 {
        return Err(FlowError::Audio("sample rate is zero".into()));
    }
    if samples.is_empty() {
        return Err(FlowError::Audio("no audio samples".into()));
    }
    let win = ((f64::from(rate) * p.window_ms / 1000.0).round() as usize).max(1);
    let db: Vec<f64> = samples.chunks(win).map(window_db).collect();
    let duration = samples.len() as f64 / f64::from(rate);
    let win_s = win as f64 / f64::from(rate);
    let (enter, exit, floor) = thresholds(&db, p);
    let flags = classify(&db, enter, exit);
    let speech = speech_spans(&flags, win_s, duration, p);
    let silent = silent_spans(&speech, duration, p);
    let keep = complement(&silent, duration);
    let silent_total = round_ms(silent.iter().map(Range::len).sum());
    let keep_total = round_ms(keep.iter().map(Range::len).sum());
    Ok(Analysis {
        duration: round_ms(duration),
        silent,
        keep,
        silent_total,
        keep_total,
        threshold_used_db: round_ms(enter),
        noise_floor_db: round_ms(floor),
        levels: level_curve(&db),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    const RATE: u32 = 16_000;

    fn tone(secs: f32, amp: f32) -> Vec<f32> {
        (0..(RATE as f32 * secs) as usize).map(|i| amp * (2.0 * std::f32::consts::PI * 300.0 * i as f32 / RATE as f32).sin()).collect()
    }

    fn quiet(secs: f32) -> Vec<f32> {
        vec![0.0; (RATE as f32 * secs) as usize]
    }

    fn cat(parts: &[Vec<f32>]) -> Vec<f32> {
        parts.iter().flatten().copied().collect()
    }

    fn near(a: f64, b: f64) -> bool {
        (a - b).abs() < 0.05
    }

    #[test]
    fn cuts_a_long_gap_and_keeps_padding() {
        // 0.5 s quiet | 1 s speech | 1 s quiet | 1 s speech | 0.5 s quiet
        let s = cat(&[quiet(0.5), tone(1.0, 0.3), quiet(1.0), tone(1.0, 0.3), quiet(0.5)]);
        let a = analyze(&s, RATE, &SilenceParams::default()).unwrap();
        assert_eq!(a.silent.len(), 3, "{:?}", a.silent);
        // Leading silence ends 0.1 s before the speech (pad_before).
        assert!(near(a.silent[0].start, 0.0) && near(a.silent[0].end, 0.4), "{:?}", a.silent[0]);
        // The middle gap keeps 0.1 s after the first speech and 0.1 s before the second.
        assert!(near(a.silent[1].start, 1.6) && near(a.silent[1].end, 2.4), "{:?}", a.silent[1]);
        // Trailing silence starts 0.1 s after the last speech.
        assert!(near(a.silent[2].start, 3.6) && near(a.silent[2].end, 4.0), "{:?}", a.silent[2]);
        assert!(near(a.duration, 4.0));
        assert!(near(a.silent_total + a.keep_total, a.duration));
        assert_eq!(a.keep.len(), 2);
    }

    #[test]
    fn short_pauses_are_not_cut() {
        let s = cat(&[tone(1.0, 0.3), quiet(0.2), tone(1.0, 0.3)]);
        let a = analyze(&s, RATE, &SilenceParams::default()).unwrap();
        assert!(a.silent.is_empty(), "{:?}", a.silent);
        assert!(near(a.keep_total, 2.2));
    }

    #[test]
    fn speech_blips_are_ignored() {
        // A 20 ms click inside a long silence is not speech.
        let s = cat(&[quiet(1.0), tone(0.02, 0.5), quiet(1.0), tone(1.0, 0.3)]);
        let a = analyze(&s, RATE, &SilenceParams { min_speech: 0.1, ..SilenceParams::default() }).unwrap();
        assert_eq!(a.silent.len(), 1, "{:?}", a.silent);
        assert!(near(a.silent[0].start, 0.0) && near(a.silent[0].end, 1.92), "{:?}", a.silent[0]);
    }

    #[test]
    fn adaptive_handles_a_noisy_floor_where_fixed_cannot() {
        // Room noise at about -28 dB (above the -35 dB default), speech at about -9 dB.
        let noise = |secs: f32| -> Vec<f32> {
            let mut x = 12345u32;
            (0..(RATE as f32 * secs) as usize)
                .map(|_| {
                    x = x.wrapping_mul(1_664_525).wrapping_add(1_013_904_223);
                    (((x >> 8) as f32 / 8_388_608.0) - 1.0) * 0.04
                })
                .collect()
        };
        let speech: Vec<f32> = tone(1.0, 0.5).iter().zip(noise(1.0)).map(|(a, b)| a + b).collect();
        let s = cat(&[noise(1.5), speech.clone(), noise(1.5), speech]);
        let fixed = analyze(&s, RATE, &SilenceParams { engine: Engine::Fixed, ..SilenceParams::default() }).unwrap();
        assert!(fixed.silent.is_empty(), "fixed engine should see only speech: {:?}", fixed.silent);
        let adaptive = analyze(&s, RATE, &SilenceParams::default()).unwrap();
        // Noise 0-1.5 s and 2.5-4.0 s are cut (minus the padding); the file ends on speech.
        assert_eq!(adaptive.silent.len(), 2, "{:?} (threshold {})", adaptive.silent, adaptive.threshold_used_db);
        assert!(near(adaptive.silent[0].end, 1.4) && near(adaptive.silent[1].start, 2.6) && near(adaptive.silent[1].end, 3.9));
        assert!(adaptive.threshold_used_db > -35.0);
    }

    #[test]
    fn all_silence_and_all_speech() {
        let a = analyze(&quiet(2.0), RATE, &SilenceParams::default()).unwrap();
        assert_eq!(a.silent.len(), 1);
        assert!(a.keep.is_empty());
        let b = analyze(&tone(2.0, 0.3), RATE, &SilenceParams::default()).unwrap();
        assert!(b.silent.is_empty());
        assert!(near(b.keep_total, 2.0));
    }

    #[test]
    fn hostile_input_is_an_error_not_a_panic() {
        assert!(analyze(&[], RATE, &SilenceParams::default()).is_err());
        assert!(analyze(&[0.1], 0, &SilenceParams::default()).is_err());
        let bad = SilenceParams { threshold_db: f64::NAN, ..SilenceParams::default() };
        assert!(analyze(&[0.1; 100], RATE, &bad).is_err());
        let bad = SilenceParams { window_ms: 0.0, ..SilenceParams::default() };
        assert!(analyze(&[0.1; 100], RATE, &bad).is_err());
        // NaN / inf samples count as silence instead of poisoning the levels.
        let s = vec![f32::NAN, f32::INFINITY, -f32::INFINITY, 0.0];
        assert!(analyze(&s, 100, &SilenceParams::default()).is_ok());
    }

    #[test]
    fn params_deserialize_with_defaults() {
        let p: SilenceParams = serde_json::from_str(r#"{"thresholdDb":-40,"engine":"fixed"}"#).unwrap();
        assert_eq!(p.threshold_db, -40.0);
        assert_eq!(p.engine, Engine::Fixed);
        assert_eq!(p.min_silence, 0.4);
    }

    #[test]
    fn levels_curve_is_bounded() {
        let s = cat(&[quiet(1.0), tone(1.0, 0.3)]);
        let a = analyze(&s, RATE, &SilenceParams::default()).unwrap();
        assert!(a.levels.len() <= LEVEL_POINTS && !a.levels.is_empty());
        assert!(a.levels.iter().all(|v| v.is_finite() && *v >= -90.0 && *v <= 0.0));
    }
}
