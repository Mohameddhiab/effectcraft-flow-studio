//! WAV reading and writing, mono downmix and resampling.
//!
//! Reading accepts PCM 8/16/24/32-bit integer and IEEE float 32/64-bit, including
//! `WAVE_FORMAT_EXTENSIBLE`. Every size comes from the file and is bounds-checked.

use crate::{FlowError, Result};

/// Decoded audio: mono `f32` samples in -1..1 and the sample rate.
#[derive(Clone, Debug, PartialEq)]
pub struct Pcm {
    pub rate: u32,
    pub samples: Vec<f32>,
}

impl Pcm {
    /// Duration in seconds.
    pub fn duration(&self) -> f64 {
        if self.rate == 0 { 0.0 } else { self.samples.len() as f64 / f64::from(self.rate) }
    }
}

/// Largest data chunk accepted (about 4 GiB of samples would not fit in memory anyway).
const MAX_DATA_BYTES: usize = 1 << 31;

fn u16_at(b: &[u8], at: usize) -> Option<u16> {
    let s = b.get(at..at.checked_add(2)?)?;
    Some(u16::from_le_bytes([*s.first()?, *s.get(1)?]))
}

fn u32_at(b: &[u8], at: usize) -> Option<u32> {
    let s = b.get(at..at.checked_add(4)?)?;
    Some(u32::from_le_bytes([*s.first()?, *s.get(1)?, *s.get(2)?, *s.get(3)?]))
}

struct Fmt {
    tag: u16,
    channels: usize,
    rate: u32,
    bits: usize,
}

/// Reads a WAV file's bytes into mono samples (channels are averaged).
pub fn parse_wav(bytes: &[u8]) -> Result<Pcm> {
    let bad = |m: &str| FlowError::Audio(m.to_string());
    if bytes.get(0..4) != Some(b"RIFF".as_slice()) || bytes.get(8..12) != Some(b"WAVE".as_slice()) {
        return Err(bad("not a RIFF/WAVE file"));
    }
    let mut fmt: Option<Fmt> = None;
    let mut data: Option<&[u8]> = None;
    let mut at = 12usize;
    while let (Some(id), Some(size)) = (at.checked_add(4).and_then(|e| bytes.get(at..e)), at.checked_add(4).and_then(|p| u32_at(bytes, p))) {
        let body = at.saturating_add(8);
        let size = size as usize;
        let end = body.saturating_add(size).min(bytes.len());
        let chunk = bytes.get(body..end).unwrap_or(&[]);
        if id == b"fmt " {
            let mut tag = u16_at(chunk, 0).ok_or_else(|| bad("short fmt chunk"))?;
            let channels = usize::from(u16_at(chunk, 2).ok_or_else(|| bad("short fmt chunk"))?);
            let rate = u32_at(chunk, 4).ok_or_else(|| bad("short fmt chunk"))?;
            let bits = usize::from(u16_at(chunk, 14).ok_or_else(|| bad("short fmt chunk"))?);
            if tag == 0xFFFE {
                // WAVE_FORMAT_EXTENSIBLE: the real format tag starts the sub-format GUID.
                tag = u16_at(chunk, 24).ok_or_else(|| bad("short extensible fmt chunk"))?;
            }
            fmt = Some(Fmt { tag, channels, rate, bits });
        } else if id == b"data" {
            data = Some(chunk);
        }
        at = body.saturating_add(size).saturating_add(size & 1);
        if data.is_some() && fmt.is_some() {
            break;
        }
    }
    let fmt = fmt.ok_or_else(|| bad("missing fmt chunk"))?;
    let data = data.ok_or_else(|| bad("missing data chunk"))?;
    if fmt.channels == 0 || fmt.channels > 64 {
        return Err(bad("unsupported channel count"));
    }
    if fmt.rate == 0 || fmt.rate > 768_000 {
        return Err(bad("unsupported sample rate"));
    }
    if data.len() > MAX_DATA_BYTES {
        return Err(bad("audio too large"));
    }
    let samples = decode_samples(data, &fmt)?;
    Ok(Pcm { rate: fmt.rate, samples })
}

fn decode_samples(data: &[u8], f: &Fmt) -> Result<Vec<f32>> {
    let bytes_per = f.bits / 8;
    let valid = matches!((f.tag, f.bits), (1, 8 | 16 | 24 | 32) | (3, 32 | 64));
    if !valid || bytes_per == 0 {
        return Err(FlowError::Audio(format!("unsupported WAV format (tag {}, {} bits)", f.tag, f.bits)));
    }
    let frame = bytes_per * f.channels;
    let frames = data.len() / frame;
    let mut out = Vec::with_capacity(frames);
    for chunk in data.chunks_exact(frame).take(frames) {
        let mut sum = 0.0f32;
        for ch in chunk.chunks_exact(bytes_per) {
            sum += sample_value(ch, f.tag, f.bits);
        }
        out.push(sum / f.channels as f32);
    }
    Ok(out)
}

fn sample_value(b: &[u8], tag: u16, bits: usize) -> f32 {
    let g = |i: usize| b.get(i).copied().unwrap_or(0);
    match (tag, bits) {
        (1, 8) => (f32::from(g(0)) - 128.0) / 128.0,
        (1, 16) => f32::from(i16::from_le_bytes([g(0), g(1)])) / 32768.0,
        (1, 24) => (i32::from_le_bytes([0, g(0), g(1), g(2)]) >> 8) as f32 / 8_388_608.0,
        (1, 32) => i32::from_le_bytes([g(0), g(1), g(2), g(3)]) as f32 / 2_147_483_648.0,
        (3, 32) => f32::from_le_bytes([g(0), g(1), g(2), g(3)]),
        (3, 64) => f64::from_le_bytes([g(0), g(1), g(2), g(3), g(4), g(5), g(6), g(7)]) as f32,
        _ => 0.0,
    }
}

/// Averages interleaved channels into mono.
pub fn downmix_interleaved(samples: &[f32], channels: usize) -> Vec<f32> {
    let channels = channels.max(1);
    samples.chunks_exact(channels).map(|c| c.iter().sum::<f32>() / channels as f32).collect()
}

/// Linear-interpolation resampling. Good enough for speech detection and speech-to-text input.
pub fn resample(samples: &[f32], from: u32, to: u32) -> Vec<f32> {
    if from == 0 || to == 0 || samples.is_empty() {
        return Vec::new();
    }
    if from == to {
        return samples.to_vec();
    }
    let ratio = f64::from(from) / f64::from(to);
    let n = ((samples.len() as f64) / ratio).floor() as usize;
    let mut out = Vec::with_capacity(n);
    for i in 0..n {
        let pos = i as f64 * ratio;
        let i0 = pos.floor() as usize;
        let frac = (pos - i0 as f64) as f32;
        let a = samples.get(i0).copied().unwrap_or(0.0);
        let b = samples.get(i0 + 1).copied().unwrap_or(a);
        out.push(a + (b - a) * frac);
    }
    out
}

/// Encodes mono samples as a 16-bit PCM WAV file (what `whisper.cpp` reads at 16 kHz).
pub fn encode_wav_pcm16(samples: &[f32], rate: u32) -> Vec<u8> {
    let data_len = samples.len().saturating_mul(2);
    let mut v = Vec::with_capacity(44 + data_len);
    v.extend_from_slice(b"RIFF");
    v.extend_from_slice(&(36u32.saturating_add(data_len as u32)).to_le_bytes());
    v.extend_from_slice(b"WAVEfmt ");
    v.extend_from_slice(&16u32.to_le_bytes());
    v.extend_from_slice(&1u16.to_le_bytes());
    v.extend_from_slice(&1u16.to_le_bytes());
    v.extend_from_slice(&rate.to_le_bytes());
    v.extend_from_slice(&rate.saturating_mul(2).to_le_bytes());
    v.extend_from_slice(&2u16.to_le_bytes());
    v.extend_from_slice(&16u16.to_le_bytes());
    v.extend_from_slice(b"data");
    v.extend_from_slice(&(data_len as u32).to_le_bytes());
    for s in samples {
        let c = if s.is_finite() { s.clamp(-1.0, 1.0) } else { 0.0 };
        v.extend_from_slice(&((c * 32767.0).round() as i16).to_le_bytes());
    }
    v
}

/// Computes normalized peak values for a waveform mini-drawing from audio bytes.
pub fn compute_peaks(bytes: &[u8], bins: u32) -> Vec<f32> {
    let bins = bins.min(4096) as usize;
    let wav = match parse_wav(bytes) {
        Ok(w) => w,
        Err(_) => return vec![0.0f32; bins],
    };
    let samples = wav.samples;
    if samples.is_empty() || bins == 0 {
        return vec![0.0f32; bins];
    }
    let bin_count = bins.min(samples.len());
    let mut peaks = Vec::with_capacity(bin_count);
    let step = samples.len() as f32 / bin_count as f32;
    for i in 0..bin_count {
        let start = (i as f32 * step).floor() as usize;
        let end = ((i + 1) as f32 * step).floor() as usize;
        let end = end.min(samples.len()).max(start.saturating_add(1)).min(samples.len());
        let peak = samples.get(start..end).unwrap_or_default().iter().fold(0.0f32, |m, v| m.max(v.abs()));
        peaks.push(peak.clamp(0.0, 1.0));
    }
    peaks
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sine(rate: u32, secs: f32, freq: f32, amp: f32) -> Vec<f32> {
        (0..(rate as f32 * secs) as usize).map(|i| amp * (2.0 * std::f32::consts::PI * freq * i as f32 / rate as f32).sin()).collect()
    }

    #[test]
    fn wav_round_trip() {
        let s = sine(16_000, 0.25, 440.0, 0.5);
        let back = parse_wav(&encode_wav_pcm16(&s, 16_000)).unwrap();
        assert_eq!(back.rate, 16_000);
        assert_eq!(back.samples.len(), s.len());
        let worst = s.iter().zip(&back.samples).map(|(a, b)| (a - b).abs()).fold(0.0, f32::max);
        assert!(worst < 1e-3, "{worst}");
    }

    #[test]
    fn stereo_float_is_averaged() {
        // Two frames: (1.0, 0.0) and (0.5, 0.5) as 32-bit float stereo.
        let mut data = Vec::new();
        for v in [1.0f32, 0.0, 0.5, 0.5] {
            data.extend_from_slice(&v.to_le_bytes());
        }
        let mut w = Vec::new();
        w.extend_from_slice(b"RIFF");
        w.extend_from_slice(&((36 + data.len()) as u32).to_le_bytes());
        w.extend_from_slice(b"WAVEfmt ");
        w.extend_from_slice(&16u32.to_le_bytes());
        for v in [3u16, 2] {
            w.extend_from_slice(&v.to_le_bytes());
        }
        w.extend_from_slice(&48_000u32.to_le_bytes());
        w.extend_from_slice(&(48_000u32 * 8).to_le_bytes());
        w.extend_from_slice(&8u16.to_le_bytes());
        w.extend_from_slice(&32u16.to_le_bytes());
        w.extend_from_slice(b"data");
        w.extend_from_slice(&(data.len() as u32).to_le_bytes());
        w.extend_from_slice(&data);
        let p = parse_wav(&w).unwrap();
        assert_eq!(p.samples, vec![0.5, 0.5]);
    }

    #[test]
    fn hostile_files_are_errors() {
        assert!(parse_wav(b"").is_err());
        assert!(parse_wav(b"RIFFxxxxWAVE").is_err());
        let mut w = encode_wav_pcm16(&[0.0; 8], 8000);
        w.truncate(30);
        assert!(parse_wav(&w).is_err());
        // A data chunk that claims more bytes than the file holds is clamped, not trusted.
        let mut w = encode_wav_pcm16(&[0.25; 8], 8000);
        w[40..44].copy_from_slice(&u32::MAX.to_le_bytes());
        assert_eq!(parse_wav(&w).unwrap().samples.len(), 8);
        // Zero channels / unsupported bit depth.
        let mut w = encode_wav_pcm16(&[0.0; 8], 8000);
        w[22] = 0;
        assert!(parse_wav(&w).is_err());
        let mut w = encode_wav_pcm16(&[0.0; 8], 8000);
        w[34] = 12;
        assert!(parse_wav(&w).is_err());
    }

    #[test]
    fn resample_changes_length_and_keeps_pitch_shape() {
        let s = sine(48_000, 0.5, 200.0, 0.8);
        let r = resample(&s, 48_000, 16_000);
        assert!((r.len() as i64 - 8000).abs() <= 1);
        let peak = r.iter().fold(0.0f32, |m, v| m.max(v.abs()));
        assert!((peak - 0.8).abs() < 0.05, "{peak}");
        assert!(resample(&s, 0, 16_000).is_empty());
        assert!(resample(&[], 8000, 16_000).is_empty());
    }

    #[test]
    fn downmix_averages_channels() {
        assert_eq!(downmix_interleaved(&[1.0, 0.0, 0.0, 1.0], 2), vec![0.5, 0.5]);
        assert_eq!(downmix_interleaved(&[1.0, 0.5], 0), vec![1.0, 0.5]);
    }
}
