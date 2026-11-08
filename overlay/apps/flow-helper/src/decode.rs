//! Audio of any media EffectCraft can import, as mono samples at the rate asked for.
//!
//! WAV files are read directly. Everything else goes through EffectCraft's own pure-Rust media
//! pool (no ffmpeg), in bounded chunks so a long recording never needs its stereo float copy in
//! memory at once.

use std::path::Path;

use effectcraft_flow::audio;
use effectcraft_media::MediaPool;
use effectcraft_time::Tick;

/// Longest recording accepted (the samples are kept in memory): 6 hours.
const MAX_SECONDS: f64 = 6.0 * 3600.0;
const CHUNK_FRAMES: usize = 1 << 16;

pub fn decode_mono(path: &Path, rate: u32) -> Result<Vec<f32>, String> {
    if rate == 0 {
        return Err("sample rate is zero".into());
    }
    let is_wav = path.extension().is_some_and(|e| e.eq_ignore_ascii_case("wav"));
    if is_wav {
        let bytes = std::fs::read(path).map_err(|e| format!("{}: {e}", path.display()))?;
        if let Ok(pcm) = audio::parse_wav(&bytes) {
            return Ok(audio::resample(&pcm.samples, pcm.rate, rate));
        }
    }
    let footage = effectcraft_media::probe(path).map_err(|e| format!("{}: {e}", path.display()))?;
    if footage.missing || !footage.has_audio {
        return Err(format!("{} has no audio track", path.display()));
    }
    let seconds = footage.duration.seconds();
    if !seconds.is_finite() || seconds <= 0.0 {
        return Err("the media has no duration".into());
    }
    if seconds > MAX_SECONDS {
        return Err(format!("recording too long ({:.0} min); the limit is {:.0} min", seconds / 60.0, MAX_SECONDS / 60.0));
    }
    let total = (seconds * f64::from(rate)).ceil() as usize;
    let pool = MediaPool::new();
    let mut out = Vec::with_capacity(total);
    let mut at = 0usize;
    while at < total {
        let n = (total - at).min(CHUNK_FRAMES);
        let start = Tick::from_seconds_f64(at as f64 / f64::from(rate));
        let stereo = pool.audio_samples(&footage, start, n, rate);
        out.extend(audio::downmix_interleaved(&stereo, 2));
        at += n;
    }
    Ok(out)
}
