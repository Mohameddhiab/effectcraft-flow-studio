//! Original sound effects, synthesised from maths (oscillators, seeded noise, simple filters).
//!
//! Nothing here is sampled or copied from a recording, so there is nothing to license: the
//! sounds are generated on the user's machine, deterministically, as 16-bit mono WAV data.
//! Famous branded or meme sounds are other people's recordings and are deliberately not included;
//! the helper can instead list a folder of the user's own sounds.

use std::f32::consts::{PI, TAU};

/// Sample rate of every generated effect.
pub const RATE: u32 = 44_100;

/// One built-in effect.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Sfx {
    pub id: &'static str,
    pub name: &'static str,
    pub category: &'static str,
    pub seconds: f32,
}

macro_rules! sfx {
    ($id:expr, $name:expr, $cat:expr, $sec:expr) => {
        Sfx { id: $id, name: $name, category: $cat, seconds: $sec }
    };
}

pub const SFX: &[Sfx] = &[
    sfx!("whoosh", "Whoosh", "Transition", 0.9),
    sfx!("whoosh-fast", "Fast whoosh", "Transition", 0.4),
    sfx!("sweep-down", "Sweep down", "Transition", 0.8),
    sfx!("riser", "Riser", "Transition", 1.6),
    sfx!("impact", "Cinematic impact", "Impact", 1.5),
    sfx!("punch", "Punch hit", "Impact", 0.35),
    sfx!("bass-drop", "Bass drop", "Impact", 1.8),
    sfx!("heartbeat", "Heartbeat", "Impact", 1.2),
    sfx!("pop", "Pop", "UI", 0.15),
    sfx!("click", "Click", "UI", 0.05),
    sfx!("key", "Key press", "UI", 0.07),
    sfx!("shutter", "Camera shutter", "UI", 0.25),
    sfx!("ding", "Bell ding", "Notification", 1.4),
    sfx!("notify", "Notification", "Notification", 0.6),
    sfx!("success", "Success chime", "Notification", 0.9),
    sfx!("error", "Error buzz", "Notification", 0.45),
    sfx!("sparkle", "Sparkle", "Magic", 1.1),
    sfx!("zap", "Laser zap", "Magic", 0.4),
    sfx!("glitch", "Glitch", "Magic", 0.5),
    sfx!("tape-stop", "Tape stop", "Magic", 1.0),
];

struct Rng(u32);

impl Rng {
    fn new(seed: u32) -> Rng {
        Rng(seed | 1)
    }
    /// Noise in -1..1.
    fn noise(&mut self) -> f32 {
        self.0 ^= self.0 << 13;
        self.0 ^= self.0 >> 17;
        self.0 ^= self.0 << 5;
        (self.0 as f32 / u32::MAX as f32) * 2.0 - 1.0
    }
}

/// One-pole low-pass; `cut` in Hz.
struct Lp(f32);

impl Lp {
    fn run(&mut self, x: f32, cut: f32) -> f32 {
        let a = 1.0 - (-TAU * cut.clamp(20.0, 20_000.0) / RATE as f32).exp();
        self.0 += a * (x - self.0);
        self.0
    }
}

fn frames(seconds: f32) -> usize {
    (seconds * RATE as f32) as usize
}

/// Build `seconds` of audio from a function of (time, progress 0..1).
fn build(seconds: f32, mut f: impl FnMut(f32, f32) -> f32) -> Vec<f32> {
    let n = frames(seconds).max(1);
    (0..n)
        .map(|i| {
            let t = i as f32 / RATE as f32;
            f(t, i as f32 / n as f32)
        })
        .collect()
}

fn exp_sweep(from: f32, to: f32, p: f32) -> f32 {
    from * (to / from).powf(p)
}

/// Sine whose phase is accumulated from a changing frequency.
struct Osc(f32);

impl Osc {
    fn run(&mut self, hz: f32) -> f32 {
        self.0 = (self.0 + TAU * hz / RATE as f32) % TAU;
        self.0.sin()
    }
}

fn bell(t: f32, hz: f32, decay: f32) -> f32 {
    let partials = [(1.0, 1.0), (2.76, 0.5), (5.4, 0.25), (8.93, 0.12)];
    partials.iter().map(|(m, a)| a * (TAU * hz * m * t).sin() * (-t * decay * (1.0 + m * 0.3)).exp()).sum::<f32>() / 1.9
}

fn smooth_edges(p: f32, attack: f32, release: f32) -> f32 {
    let a = (p / attack).clamp(0.0, 1.0);
    let r = ((1.0 - p) / release).clamp(0.0, 1.0);
    a * r
}

/// The effect with this id as mono samples at [`RATE`], peak-normalised to 0.9.
pub fn render(id: &str) -> Option<Vec<f32>> {
    let mut rng = Rng::new(0x9E37_79B9);
    let mut lp = Lp(0.0);
    let mut lp2 = Lp(0.0);
    let mut osc = Osc(0.0);
    let secs = SFX.iter().find(|s| s.id == id)?.seconds;
    let mut out = match id {
        "whoosh" | "whoosh-fast" => build(secs, |_, p| {
            let cut = 250.0 + 5000.0 * (PI * p).sin().powi(2);
            let n = lp.run(rng.noise(), cut);
            lp2.run(n, cut) * smooth_edges(p, 0.45, 0.55) * 3.0
        }),
        "sweep-down" => build(secs, |_, p| {
            let cut = exp_sweep(6000.0, 200.0, p);
            lp.run(rng.noise(), cut) * (1.0 - p).powf(1.5) * 3.0
        }),
        "riser" => build(secs, |_, p| {
            let tone = osc.run(exp_sweep(180.0, 1600.0, p)) * 0.35;
            let noise = lp.run(rng.noise(), exp_sweep(300.0, 9000.0, p)) * 0.8;
            (tone + noise) * p.powf(1.6) * smooth_edges(p, 0.02, 0.03)
        }),
        "impact" => build(secs, |t, p| {
            let body = osc.run(exp_sweep(110.0, 32.0, p.min(0.5) * 2.0)) * (-t * 3.2).exp();
            let crack = lp.run(rng.noise(), 2500.0) * (-t * 22.0).exp();
            let tail = lp2.run(rng.noise(), 180.0) * (-t * 2.4).exp() * 0.5;
            body + crack * 0.7 + tail
        }),
        "punch" => {
            build(secs, |t, p| osc.run(exp_sweep(170.0, 48.0, p.min(0.3) / 0.3)) * (-t * 14.0).exp() + lp.run(rng.noise(), 3000.0) * (-t * 60.0).exp() * 0.6)
        }
        "bass-drop" => build(secs, |t, p| {
            let hz = exp_sweep(140.0, 28.0, p.powf(0.4));
            osc.run(hz) * (-t * 1.4).exp() * smooth_edges(p, 0.01, 0.25)
        }),
        "heartbeat" => build(secs, |t, _| {
            let thump = |at: f32, g: f32| {
                let x = t - at;
                if x < 0.0 { 0.0 } else { (TAU * 62.0 * x).sin() * (-x * 22.0).exp() * g }
            };
            thump(0.0, 1.0) + thump(0.22, 0.7) + thump(0.62, 1.0) + thump(0.84, 0.7)
        }),
        "pop" => build(secs, |t, p| osc.run(exp_sweep(900.0, 180.0, p.min(0.4) / 0.4)) * (-t * 30.0).exp()),
        "click" => build(secs, |t, _| (rng.noise() - lp.run(rng.noise(), 1500.0)) * (-t * 160.0).exp()),
        "key" => build(secs, |t, _| lp.run(rng.noise(), 1800.0) * (-t * 90.0).exp() + osc.run(210.0) * (-t * 70.0).exp() * 0.4),
        "shutter" => build(secs, |t, _| {
            let click = |at: f32| {
                let x = t - at;
                if x < 0.0 { 0.0 } else { (-x * 120.0).exp() }
            };
            let n = rng.noise();
            (n - lp.run(n, 2000.0)) * (click(0.0) + click(0.09) * 0.8)
        }),
        "ding" => build(secs, |t, _| bell(t, 880.0, 3.0)),
        "notify" => build(secs, |t, _| bell(t, 659.3, 7.0) * if t < 0.2 { 1.0 } else { 0.0 } + if t >= 0.2 { bell(t - 0.2, 880.0, 6.0) } else { 0.0 }),
        "success" => build(secs, |t, _| {
            let notes = [(0.0, 523.25), (0.12, 659.25), (0.24, 783.99), (0.36, 1046.5)];
            notes.iter().map(|(at, hz)| if t >= *at { bell(t - at, *hz, 5.0) } else { 0.0 }).sum::<f32>()
        }),
        "error" => build(secs, |t, p| {
            let sq = if osc.run(130.0) >= 0.0 { 1.0 } else { -1.0 };
            lp.run(sq, 1200.0) * (0.6 + 0.4 * (TAU * 22.0 * t).sin()) * smooth_edges(p, 0.03, 0.25)
        }),
        "sparkle" => {
            let mut hits = Vec::new();
            for _ in 0..14 {
                let at = (rng.noise() * 0.5 + 0.5) * (secs - 0.3);
                let hz = 2200.0 + (rng.noise() * 0.5 + 0.5) * 4500.0;
                hits.push((at, hz));
            }
            build(secs, |t, _| hits.iter().map(|(at, hz)| if t >= *at { (TAU * hz * (t - at)).sin() * (-(t - at) * 18.0).exp() * 0.3 } else { 0.0 }).sum())
        }
        "zap" => build(secs, |t, p| osc.run(exp_sweep(2400.0, 140.0, p)) * (-t * 7.0).exp()),
        "glitch" => {
            let mut hold = 0.0f32;
            build(secs, |t, p| {
                let slot = (t * 28.0) as u32;
                if (t * 28.0).fract() < 0.05 {
                    hold = rng.noise();
                }
                let crushed = (hold * 6.0).round() / 6.0;
                let gate = if slot % 3 == 1 { 0.0 } else { 1.0 };
                (crushed * 0.6 + osc.run(300.0 + 700.0 * ((slot * 37 % 11) as f32 / 11.0)) * 0.4) * gate * (1.0 - p)
            })
        }
        "tape-stop" => build(secs, |_, p| osc.run(exp_sweep(440.0, 30.0, p.powf(0.6))) * (1.0 - p).powf(0.7) * 0.9),
        _ => return None,
    };
    let peak = out.iter().fold(0.0f32, |m, v| m.max(v.abs()));
    if peak > 1e-6 {
        let k = 0.9 / peak;
        for v in &mut out {
            *v *= k;
        }
    }
    // Fade the last 5 ms so no effect ends on a click.
    let tail = frames(0.005).min(out.len());
    let len = out.len();
    for (i, v) in out.iter_mut().skip(len - tail).enumerate() {
        *v *= 1.0 - (i as f32 + 1.0) / tail.max(1) as f32;
    }
    Some(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_effect_renders_sane_audio() {
        for s in SFX {
            let a = render(s.id).unwrap_or_default();
            assert!(!a.is_empty(), "{} is empty", s.id);
            let secs = a.len() as f32 / RATE as f32;
            assert!((secs - s.seconds).abs() < 0.01, "{} is {secs}s, catalog says {}", s.id, s.seconds);
            assert!(a.iter().all(|v| v.is_finite() && v.abs() <= 1.0), "{} has bad samples", s.id);
            let peak = a.iter().fold(0.0f32, |m, v| m.max(v.abs()));
            assert!(peak > 0.85 && peak <= 0.91, "{} peak {peak}", s.id);
            let rms = (a.iter().map(|v| v * v).sum::<f32>() / a.len() as f32).sqrt();
            assert!(rms > 0.01, "{} is nearly silent", s.id);
        }
    }

    #[test]
    fn deterministic_and_unknown_ids() {
        assert_eq!(render("glitch"), render("glitch"));
        assert!(render("nope").is_none());
    }

    #[test]
    fn ids_are_unique_and_safe() {
        for (i, s) in SFX.iter().enumerate() {
            assert!(s.id.chars().all(|c| c.is_ascii_lowercase() || c == '-'));
            assert!(SFX.iter().skip(i + 1).all(|o| o.id != s.id));
        }
    }
}
