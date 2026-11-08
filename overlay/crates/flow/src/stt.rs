//! Speech-to-text through `whisper.cpp` (MIT), run as a separate local program.
//!
//! EffectCraft does not link a speech engine: the helper starts the user's `whisper-cli` with a
//! model from the [catalog](crate::models) and reads its JSON output. This module only builds the
//! command line and turns that JSON into [`Word`]s, so it stays pure and testable.

use serde::Deserialize;
use serde_json::Value;

use crate::captions::Word;
use crate::{FlowError, Result};

/// Sample rate `whisper.cpp` expects.
pub const WHISPER_RATE: u32 = 16_000;

/// A transcription request.
#[derive(Clone, Debug, PartialEq)]
pub struct SttRequest {
    /// Path of the 16 kHz mono WAV file.
    pub wav: String,
    /// Path of the `ggml-*.bin` model.
    pub model: String,
    /// A two-letter language code, or `auto`.
    pub language: String,
    /// Output file stem; whisper writes `<stem>.json`.
    pub out_stem: String,
    pub threads: usize,
}

/// The language codes offered in the UI (whisper supports many more; any two- or three-letter
/// code is accepted).
pub const LANGUAGES: &[(&str, &str)] = &[
    ("auto", "Auto-detect"),
    ("fr", "Français"),
    ("ar", "العربية"),
    ("en", "English"),
    ("es", "Español"),
    ("de", "Deutsch"),
    ("it", "Italiano"),
    ("pt", "Português"),
    ("tr", "Türkçe"),
    ("ru", "Русский"),
    ("ja", "日本語"),
    ("zh", "中文"),
];

fn valid_language(l: &str) -> bool {
    l == "auto" || ((2..=3).contains(&l.len()) && l.chars().all(|c| c.is_ascii_lowercase()))
}

/// Arguments for `whisper-cli`: one word per segment (`--max-len 1 --split-on-word`) so every
/// word has its own start and end, JSON output, no console noise.
pub fn command_args(r: &SttRequest) -> Result<Vec<String>> {
    if !valid_language(&r.language) {
        return Err(FlowError::Stt(format!("bad language code {:?}", r.language)));
    }
    for (name, v) in [("wav", &r.wav), ("model", &r.model), ("out", &r.out_stem)] {
        if v.is_empty() || v.contains('\0') || v.starts_with('-') {
            return Err(FlowError::Stt(format!("bad {name} path")));
        }
    }
    let threads = r.threads.clamp(1, 64);
    Ok(vec![
        "-m".into(),
        r.model.clone(),
        "-f".into(),
        r.wav.clone(),
        "-l".into(),
        r.language.clone(),
        "-t".into(),
        threads.to_string(),
        "--max-len".into(),
        "1".into(),
        "--split-on-word".into(),
        "--output-json".into(),
        "--output-file".into(),
        r.out_stem.clone(),
        "--no-prints".into(),
    ])
}

#[derive(Deserialize)]
struct Offsets {
    from: f64,
    to: f64,
}

#[derive(Deserialize)]
struct Item {
    text: String,
    offsets: Offsets,
}

/// Reads whisper's JSON (`transcription[].{text, offsets.{from,to}}`, milliseconds) into words.
/// Special tokens such as `[_BEG_]` or `[BLANK_AUDIO]` are dropped, and pieces that carry no
/// leading space are glued to the previous word (whisper splits some words into sub-tokens).
pub fn parse_output(json: &str) -> Result<Vec<Word>> {
    let v: Value = serde_json::from_str(json).map_err(|e| FlowError::Stt(format!("unreadable whisper output: {e}")))?;
    let items = v.get("transcription").and_then(Value::as_array).ok_or_else(|| FlowError::Stt("no transcription in whisper output".into()))?;
    let mut words: Vec<Word> = Vec::new();
    for raw in items {
        let Ok(item) = serde_json::from_value::<Item>(raw.clone()) else { continue };
        let text = item.text.trim();
        if text.is_empty() || is_special(text) {
            continue;
        }
        let (start, end) = (item.offsets.from / 1000.0, item.offsets.to / 1000.0);
        if !start.is_finite() || !end.is_finite() || end < start {
            continue;
        }
        let glue = !item.text.starts_with(char::is_whitespace) && !words.is_empty() && is_trailing_piece(text);
        match (glue, words.last_mut()) {
            (true, Some(last)) => {
                last.text.push_str(text);
                last.end = end.max(last.end);
            }
            _ => words.push(Word { text: text.to_string(), start, end }),
        }
    }
    Ok(words)
}

fn is_special(t: &str) -> bool {
    (t.starts_with('[') && t.ends_with(']'))
        || (t.starts_with("<|") && t.ends_with("|>"))
        || (t.starts_with('(') && t.ends_with(')') && t.len() > 2 && t.chars().skip(1).any(char::is_alphabetic) && t.to_ascii_lowercase().contains("music"))
}

fn is_trailing_piece(t: &str) -> bool {
    t.chars().all(|c| !c.is_alphanumeric()) || t.chars().next().is_some_and(|c| matches!(c, '\'' | '’' | '-'))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn req() -> SttRequest {
        SttRequest { wav: "/tmp/a.wav".into(), model: "/m/ggml-small.bin".into(), language: "fr".into(), out_stem: "/tmp/out".into(), threads: 4 }
    }

    #[test]
    fn builds_a_safe_command_line() {
        let a = command_args(&req()).unwrap();
        assert!(a.windows(2).any(|w| w == ["-l", "fr"]));
        assert!(a.windows(2).any(|w| w == ["--max-len", "1"]));
        assert!(a.contains(&"--split-on-word".to_string()) && a.contains(&"--output-json".to_string()));
        assert!(command_args(&SttRequest { language: "fr; rm -rf /".into(), ..req() }).is_err());
        assert!(command_args(&SttRequest { wav: "--evil".into(), ..req() }).is_err());
        assert!(command_args(&SttRequest { model: String::new(), ..req() }).is_err());
        let a = command_args(&SttRequest { threads: 0, language: "auto".into(), ..req() }).unwrap();
        assert!(a.windows(2).any(|w| w == ["-t", "1"]));
    }

    #[test]
    fn parses_words_and_skips_specials() {
        let json = r#"{"transcription":[
            {"text":" [_BEG_]","offsets":{"from":0,"to":0}},
            {"text":" Bonjour","offsets":{"from":320,"to":900}},
            {"text":" tout","offsets":{"from":900,"to":1200}},
            {"text":" le","offsets":{"from":1200,"to":1300}},
            {"text":" monde","offsets":{"from":1300,"to":1800}},
            {"text":".","offsets":{"from":1800,"to":1850}},
            {"text":" [BLANK_AUDIO]","offsets":{"from":2000,"to":3000}},
            {"text":" bad","offsets":{"from":5000,"to":4000}}
        ]}"#;
        let w = parse_output(json).unwrap();
        assert_eq!(w.iter().map(|w| w.text.as_str()).collect::<Vec<_>>(), vec!["Bonjour", "tout", "le", "monde."]);
        assert!((w[0].start - 0.32).abs() < 1e-9 && (w[0].end - 0.9).abs() < 1e-9);
        assert!((w[3].end - 1.85).abs() < 1e-9);
    }

    #[test]
    fn rtl_text_survives() {
        let json = r#"{"transcription":[{"text":" مرحبا","offsets":{"from":0,"to":500}},{"text":" بكم","offsets":{"from":500,"to":900}}]}"#;
        let w = parse_output(json).unwrap();
        assert_eq!(w.len(), 2);
        assert_eq!(w[0].text, "مرحبا");
    }

    #[test]
    fn bad_json_is_an_error() {
        assert!(parse_output("").is_err());
        assert!(parse_output("{}").is_err());
        assert!(parse_output(r#"{"transcription":[{"nope":1}]}"#).unwrap().is_empty());
    }
}
