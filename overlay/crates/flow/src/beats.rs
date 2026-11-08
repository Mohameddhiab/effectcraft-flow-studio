//! Tempo and beat detection for music: an onset envelope, autocorrelation for the tempo, then a
//! phase search for the first beat. Beats are returned in seconds from the start of the audio.
//!
//! This is not a full music-information-retrieval engine: it favours four-on-the-floor material
//! (edits with drums, music beds, trailers) and reports a confidence so the panel can say when the
//! result is uncertain. No files, no process, no network: the helper decodes the audio.

use serde::{Deserialize, Serialize};

use crate::{FlowError, Result};

/// Analysis window and hop, in samples. At 16 kHz the hop is 32 ms, enough for 180 BPM.
const WIN: usize = 1024;
const HOP: usize = 512;

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct BeatParams {
    pub min_bpm: f64,
    pub max_bpm: f64,
    /// How strong an onset must be, from 0 (anything) to 1 (only the loudest hits).
    pub sensitivity: f64,
}

impl Default for BeatParams {
    fn default() -> Self {
        Self { min_bpm: 70.0, max_bpm: 180.0, sensitivity: 0.5 }
    }
}

impl BeatParams {
    pub fn validate(&self) -> Result<()> {
        let finite = self.min_bpm.is_finite() && self.max_bpm.is_finite() && self.sensitivity.is_finite();
        if !finite || !(30.0..=300.0).contains(&self.min_bpm) || !(30.0..=300.0).contains(&self.max_bpm) || self.min_bpm >= self.max_bpm {
            return Err(FlowError::Param("tempo range must be between 30 and 300 BPM, with min < max".into()));
        }
        if !(0.0..=1.0).contains(&self.sensitivity) {
            return Err(FlowError::Param("sensitivity must be between 0 and 1".into()));
        }
        Ok(())
    }
}

/// What [`analyze`] found.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Analysis {
    pub duration: f64,
    /// Estimated tempo, or 0 when no clear pulse was found.
    pub bpm: f64,
    /// 0 to 1: how periodic the onsets were.
    pub confidence: f64,
    /// Seconds between two beats (`60 / bpm`), or 0.
    pub beat_interval: f64,
    pub beats: Vec<f64>,
}

fn energy(samples: &[f32], at: usize) -> f64 {
    let end = (at + WIN).min(samples.len());
    let Some(w) = samples.get(at..end) else { return 0.0 };
    let sum: f64 = w.iter().map(|s| if s.is_finite() { f64::from(*s) * f64::from(*s) } else { 0.0 }).sum();
    sum / w.len().max(1) as f64
}

fn envelope(samples: &[f32]) -> Vec<f64> {
    if samples.len() < WIN {
        return Vec::new();
    }
    let mut frames = Vec::new();
    let mut at = 0usize;
    let mut prev = 0.0;
    while at + WIN <= samples.len() {
        let e = energy(samples, at);
        // Positive energy flux: a new hit raises the energy, a decay does not.
        frames.push((e - prev).max(0.0));
        prev = e;
        at += HOP;
    }
    frames
}

fn normalise(flux: &mut [f64]) -> f64 {
    let max = flux.iter().copied().fold(0.0, f64::max);
    if max <= 1.0e-9 || !max.is_finite() {
        return 0.0;
    }
    for v in flux.iter_mut() {
        *v = (*v / max).clamp(0.0, 1.0);
    }
    max
}

fn autocorrelation(flux: &[f64], lag: usize) -> f64 {
    if lag == 0 || lag >= flux.len() {
        return 0.0;
    }
    let _n = flux.len() - lag;
    let mut num = 0.0;
    let mut den = 0.0;
    for i in lag..flux.len() {
        num += flux[i] * flux[i - lag];
        den += flux[i] * flux[i];
    }
    if den <= 1.0e-12 { 0.0 } else { (num / den).clamp(0.0, 1.0) }
}

fn best_lag(flux: &[f64], rate: u32, p: &BeatParams) -> (usize, f64) {
    let hop_s = HOP as f64 / f64::from(rate);
    let min_lag = ((60.0 / p.max_bpm) / hop_s).floor().max(2.0) as usize;
    let max_lag = ((60.0 / p.min_bpm) / hop_s).ceil() as usize;
    let max_lag = max_lag.min(flux.len().saturating_sub(2));
    if max_lag <= min_lag {
        return (0, 0.0);
    }
    let mut best = (0usize, 0.0f64);
    for lag in min_lag..=max_lag {
        let c = autocorrelation(flux, lag);
        if c > best.1 {
            best = (lag, c);
        }
    }
    // Prefer the faster reading when a slower multiple is almost as strong: a 120 BPM track
    // also correlates at 60 BPM, which would place half as many markers.
    if best.0 > 0 {
        for divisor in [2usize, 3] {
            let faster = best.0 / divisor;
            if faster >= min_lag {
                let c = autocorrelation(flux, faster);
                if c >= best.1 * 0.85 {
                    best = (faster, c);
                    break;
                }
            }
        }
    }
    best
}

fn phase(flux: &[f64], period: usize) -> usize {
    if period == 0 || flux.is_empty() {
        return 0;
    }
    let mut best = (0usize, f64::NEG_INFINITY);
    for offset in 0..period {
        let mut sum = 0.0;
        let mut i = offset;
        while i < flux.len() {
            sum += flux[i];
            i += period;
        }
        if sum > best.1 {
            best = (offset, sum);
        }
    }
    best.0
}

fn snap_peak(flux: &[f64], at: usize, radius: usize, threshold: f64) -> usize {
    let lo = at.saturating_sub(radius);
    let hi = (at + radius + 1).min(flux.len());
    let mut best = (at, threshold);
    for i in lo..hi {
        if let Some(v) = flux.get(i).copied().filter(|&v| v > best.1) {
            best = (i, v);
        }
    }
    best.0
}

fn round(v: f64) -> f64 {
    (v * 1000.0).round() / 1000.0
}

/// Finds the tempo and the beat times in mono `samples` at `rate` Hz.
pub fn analyze(samples: &[f32], rate: u32, p: &BeatParams) -> Result<Analysis> {
    p.validate()?;
    if rate == 0 {
        return Err(FlowError::Audio("sample rate is zero".into()));
    }
    if samples.is_empty() {
        return Err(FlowError::Audio("no audio samples".into()));
    }
    let duration = samples.len() as f64 / f64::from(rate);
    if !duration.is_finite() || duration <= 0.0 {
        return Err(FlowError::Audio("the audio has no duration".into()));
    }
    let mut flux = envelope(samples);
    let max = normalise(&mut flux);
    if flux.len() < 8 || max <= 1.0e-9 {
        return Ok(Analysis { duration: round(duration), bpm: 0.0, confidence: 0.0, beat_interval: 0.0, beats: Vec::new() });
    }
    let (lag, confidence) = best_lag(&flux, rate, p);
    if lag == 0 || confidence < 0.02 {
        return Ok(Analysis { duration: round(duration), bpm: 0.0, confidence: round(confidence), beat_interval: 0.0, beats: Vec::new() });
    }
    let hop_s = HOP as f64 / f64::from(rate);
    let period_s = lag as f64 * hop_s;
    let bpm = 60.0 / period_s;
    let first = phase(&flux, lag) as f64 * hop_s;
    let radius = (lag / 6).max(1);
    let threshold = 0.10 + p.sensitivity * 0.60;
    let mut beats = Vec::new();
    let mut t = first;
    while t - period_s >= -period_s * 0.5 {
        t -= period_s;
    }
    // A beat may sit slightly before the first window; keep times non-negative.
    while t <= duration && beats.len() < 20_000 {
        let frame = (t / hop_s).round().max(0.0) as usize;
        let snapped = snap_peak(&flux, frame, radius, threshold);
        let snapped_t = snapped as f64 * hop_s;
        let stable = if (snapped_t - t).abs() <= period_s * 0.18 { snapped_t } else { t };
        if beats.last().is_none_or(|last| stable - last > period_s * 0.25) {
            beats.push(round(stable.max(0.0)));
        }
        t += period_s;
    }
    Ok(Analysis { duration: round(duration), bpm: round(bpm), confidence: round(confidence), beat_interval: round(period_s), beats })
}

#[cfg(test)]
mod tests {
    use super::*;

    const RATE: u32 = 16_000;

    fn clicks(bpm: f64, secs: f64) -> Vec<f32> {
        let mut s = vec![0.0f32; (f64::from(RATE) * secs) as usize];
        let period = 60.0 / bpm;
        let mut t = 0.0;
        while t < secs {
            let at = (t * f64::from(RATE)) as usize;
            // A short, bright hit with a fast decay.
            for i in 0..(RATE as usize / 25) {
                if let Some(v) = s.get_mut(at + i) {
                    let x = i as f32 / (RATE as f32 / 25.0);
                    *v += (1.0 - x) * (2.0 * std::f32::consts::PI * 900.0 * i as f32 / RATE as f32).sin() * 0.8;
                }
            }
            t += period;
        }
        s
    }

    #[test]
    fn finds_a_120_bpm_click_track() {
        let a = analyze(&clicks(120.0, 8.0), RATE, &BeatParams::default()).unwrap();
        assert!((a.bpm - 120.0).abs() < 3.0, "bpm {} conf {}", a.bpm, a.confidence);
        assert!(a.confidence > 0.3, "confidence {}", a.confidence);
        assert!(a.beats.len() >= 14 && a.beats.len() <= 17, "{:?}", a.beats);
        assert!(a.beats.windows(2).all(|w| w[1] > w[0]));
        assert!((a.beats[0] - 0.0).abs() < 0.08, "{:?}", a.beats);
    }

    #[test]
    fn finds_a_90_bpm_track_and_the_half_tempo_trap() {
        let a = analyze(&clicks(90.0, 10.0), RATE, &BeatParams::default()).unwrap();
        assert!((a.bpm - 90.0).abs() < 3.0, "bpm {} conf {}", a.bpm, a.confidence);
        assert!(a.beats.len() >= 13, "{:?}", a.beats);
    }

    #[test]
    fn silence_and_tiny_input_do_not_claim_a_tempo() {
        let a = analyze(&vec![0.0f32; RATE as usize * 2], RATE, &BeatParams::default()).unwrap();
        assert_eq!(a.bpm, 0.0);
        assert!(a.beats.is_empty());
        assert_eq!(analyze(&[], RATE, &BeatParams::default()).unwrap_err(), FlowError::Audio("no audio samples".into()));
    }

    #[test]
    fn hostile_parameters_and_samples_are_errors_or_safe() {
        assert!(analyze(&[0.1; 1000], RATE, &BeatParams { min_bpm: 200.0, max_bpm: 60.0, ..BeatParams::default() }).is_err());
        assert!(analyze(&[0.1; 1000], RATE, &BeatParams { sensitivity: 2.0, ..BeatParams::default() }).is_err());
        assert!(analyze(&[0.1; 1000], 0, &BeatParams::default()).is_err());
        let mut s = vec![f32::NAN; RATE as usize];
        s[100] = f32::INFINITY;
        assert!(analyze(&s, RATE, &BeatParams::default()).is_ok());
    }
}
