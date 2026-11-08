//! Words with times, grouping into caption lines, SRT and WebVTT.

use serde::{Deserialize, Serialize};

use crate::{FlowError, Result};

/// One spoken word. Times are seconds from the start of the audio.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Word {
    pub text: String,
    pub start: f64,
    pub end: f64,
}

/// One caption: the words shown together.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Line {
    pub words: Vec<Word>,
    pub start: f64,
    pub end: f64,
}

impl Line {
    pub fn text(&self) -> String {
        self.words.iter().map(|w| w.text.as_str()).collect::<Vec<_>>().join(" ")
    }

    /// A line from plain text, spreading `start..end` over the words by their length (so imported
    /// SRT lines still get word times for word-by-word animation).
    pub fn from_text(text: &str, start: f64, end: f64) -> Line {
        let parts: Vec<&str> = text.split_whitespace().collect();
        let total: usize = parts.iter().map(|w| w.chars().count().max(1)).sum();
        let span = (end - start).max(0.0);
        let mut at = start;
        let mut words = Vec::with_capacity(parts.len());
        for w in parts {
            let share = span * w.chars().count().max(1) as f64 / total.max(1) as f64;
            words.push(Word { text: w.to_string(), start: at, end: at + share });
            at += share;
        }
        Line { words, start, end }
    }
}

/// How words are gathered into lines.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct GroupParams {
    pub max_chars: usize,
    pub max_words: usize,
    pub max_duration: f64,
    /// A pause at least this long always starts a new line.
    pub max_gap: f64,
}

impl Default for GroupParams {
    fn default() -> Self {
        Self { max_chars: 32, max_words: 7, max_duration: 4.0, max_gap: 0.8 }
    }
}

/// Groups `words` (in time order) into lines no longer than the limits allow.
pub fn group_words(words: &[Word], p: &GroupParams) -> Vec<Line> {
    let max_words = p.max_words.max(1);
    let max_chars = p.max_chars.max(1);
    let mut lines: Vec<Line> = Vec::new();
    let mut cur: Vec<Word> = Vec::new();
    let mut chars = 0usize;
    let flush = |cur: &mut Vec<Word>, lines: &mut Vec<Line>| {
        if let (Some(first), Some(last)) = (cur.first(), cur.last()) {
            lines.push(Line { start: first.start, end: last.end, words: std::mem::take(cur) });
        }
    };
    for w in words {
        let wc = w.text.chars().count();
        let breaks = match (cur.first(), cur.last()) {
            (Some(first), Some(last)) => {
                cur.len() >= max_words || chars + 1 + wc > max_chars || w.end - first.start > p.max_duration || w.start - last.end >= p.max_gap
            }
            _ => false,
        };
        if breaks {
            flush(&mut cur, &mut lines);
            chars = 0;
        }
        chars += if cur.is_empty() { wc } else { 1 + wc };
        cur.push(w.clone());
    }
    flush(&mut cur, &mut lines);
    lines
}

fn stamp(t: f64, sep: char) -> String {
    let ms_total = if t.is_finite() && t > 0.0 { (t * 1000.0).round() as u64 } else { 0 };
    let (h, rem) = (ms_total / 3_600_000, ms_total % 3_600_000);
    let (m, rem) = (rem / 60_000, rem % 60_000);
    format!("{h:02}:{m:02}:{:02}{sep}{:03}", rem / 1000, rem % 1000)
}

/// SubRip text.
pub fn to_srt(lines: &[Line]) -> String {
    let mut out = String::new();
    for (i, l) in lines.iter().enumerate() {
        out.push_str(&format!("{}\n{} --> {}\n{}\n\n", i + 1, stamp(l.start, ','), stamp(l.end, ','), l.text()));
    }
    out
}

/// WebVTT text.
pub fn to_vtt(lines: &[Line]) -> String {
    let mut out = String::from("WEBVTT\n\n");
    for l in lines {
        out.push_str(&format!("{} --> {}\n{}\n\n", stamp(l.start, '.'), stamp(l.end, '.'), l.text()));
    }
    out
}

fn stamp_ass(t: f64) -> String {
    let cs_total = if t.is_finite() && t > 0.0 { (t * 100.0).round() as u64 } else { 0 };
    let (h, rem) = (cs_total / 360_000, cs_total % 360_000);
    let (m, rem) = (rem / 6000, rem % 6000);
    format!("{h}:{m:02}:{:02}.{:02}", rem / 100, rem % 100)
}

/// Text safe for an ASS dialogue line: no override blocks, no control characters.
fn ass_text(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '{' => out.push('('),
            '}' => out.push(')'),
            '\\' => out.push('\u{ff3c}'),
            '\r' | '\n' => out.push(' '),
            c if c.is_control() => {}
            c => out.push(c),
        }
    }
    out.trim().to_string()
}

const ASS_HEADER: &str = "[Script Info]\nTitle: Flow Studio captions\nScriptType: v4.00+\nWrapStyle: 0\nPlayResX: 1920\nPlayResY: 1080\nScaledBorderAndShadow: yes\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Inter,54,&H00FFFFFF,&H000000FF,&H00000000,&H64000000,0,0,0,0,100,100,0,0,1,2,0,2,60,60,60,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n";

/// Advanced SubStation Alpha text, one dialogue per caption. Works in most NLEs and players.
pub fn to_ass(lines: &[Line]) -> String {
    let mut out = String::from(ASS_HEADER);
    for l in lines {
        out.push_str(&format!("Dialogue: 0,{},{},Default,,0,0,0,,{}\n", stamp_ass(l.start), stamp_ass(l.end), ass_text(&l.text())));
    }
    out
}

/// ASS with one `\k` karaoke tag per word, using the per-word times whisper.cpp provides.
pub fn to_ass_karaoke(lines: &[Line]) -> String {
    let mut out = String::from(ASS_HEADER);
    for l in lines {
        let mut body = String::new();
        for (i, w) in l.words.iter().enumerate() {
            if i > 0 {
                body.push(' ');
            }
            let dur = (w.end - w.start).max(0.0);
            let cs = (dur * 100.0).round().clamp(0.0, 100_000.0) as u64;
            body.push_str(&format!("{{\\k{cs}}}{}", ass_text(&w.text)));
        }
        if body.is_empty() {
            body = ass_text(&l.text());
        }
        out.push_str(&format!("Dialogue: 0,{},{},Default,,0,0,0,,{}\n", stamp_ass(l.start), stamp_ass(l.end), body));
    }
    out
}

fn parse_stamp(s: &str) -> Option<f64> {
    let s = s.trim().replace(',', ".");
    let parts: Vec<&str> = s.split(':').collect();
    let (h, m, sec) = match parts.as_slice() {
        [h, m, sec] => (h.parse::<f64>().ok()?, m.parse::<f64>().ok()?, sec.parse::<f64>().ok()?),
        [m, sec] => (0.0, m.parse::<f64>().ok()?, sec.parse::<f64>().ok()?),
        _ => return None,
    };
    let t = h * 3600.0 + m * 60.0 + sec;
    (t.is_finite() && t >= 0.0).then_some(t)
}

/// Reads SubRip or WebVTT text. Cue numbers, cue settings, tags, BOMs and CRLF are tolerated.
pub fn parse_captions(text: &str) -> Result<Vec<Line>> {
    let text = text.trim_start_matches('\u{feff}').replace("\r\n", "\n").replace('\r', "\n");
    let mut lines = Vec::new();
    for block in text.split("\n\n") {
        let rows: Vec<&str> = block.lines().map(str::trim).filter(|l| !l.is_empty()).collect();
        let Some(idx) = rows.iter().position(|r| r.contains("-->")) else { continue };
        let Some((a, b)) = rows.get(idx).and_then(|r| r.split_once("-->")) else { continue };
        let b = b.split_whitespace().next().unwrap_or("");
        let (Some(start), Some(end)) = (parse_stamp(a), parse_stamp(b)) else {
            return Err(FlowError::Captions(format!("bad time line: {}", rows.get(idx).copied().unwrap_or(""))));
        };
        if end < start {
            return Err(FlowError::Captions(format!("cue ends before it starts: {}", rows.get(idx).copied().unwrap_or(""))));
        }
        let body = rows.get(idx + 1..).unwrap_or(&[]).join(" ");
        let body = strip_tags(&body);
        if !body.trim().is_empty() {
            lines.push(Line::from_text(&body, start, end));
        }
    }
    if lines.is_empty() {
        return Err(FlowError::Captions("no captions found".into()));
    }
    Ok(lines)
}

fn strip_tags(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut in_tag = false;
    for c in s.chars() {
        match c {
            '<' => in_tag = true,
            '>' if in_tag => in_tag = false,
            _ if !in_tag => out.push(c),
            _ => {}
        }
    }
    out
}

/// Shifts every time by `offset` seconds (negative moves earlier), dropping what falls before 0.
pub fn shift(lines: &[Line], offset: f64) -> Vec<Line> {
    let f = |t: f64| t + offset;
    lines
        .iter()
        .filter(|l| f(l.end) > 0.0)
        .map(|l| Line {
            start: f(l.start).max(0.0),
            end: f(l.end),
            words: l.words.iter().map(|w| Word { text: w.text.clone(), start: f(w.start).max(0.0), end: f(w.end).max(0.0) }).collect(),
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn w(t: &str, a: f64, b: f64) -> Word {
        Word { text: t.into(), start: a, end: b }
    }

    #[test]
    fn groups_by_words_chars_gap_and_duration() {
        let words: Vec<Word> = (0..10).map(|i| w("word", i as f64 * 0.3, i as f64 * 0.3 + 0.25)).collect();
        let by_words = group_words(&words, &GroupParams { max_words: 3, max_chars: 100, ..GroupParams::default() });
        assert_eq!(by_words.iter().map(|l| l.words.len()).collect::<Vec<_>>(), vec![3, 3, 3, 1]);
        let by_chars = group_words(&words, &GroupParams { max_words: 100, max_chars: 10, ..GroupParams::default() });
        assert!(by_chars.iter().all(|l| l.text().chars().count() <= 10));
        let gap = group_words(&[w("a", 0.0, 0.2), w("b", 0.3, 0.5), w("c", 3.0, 3.2)], &GroupParams::default());
        assert_eq!(gap.len(), 2);
        let long = group_words(&words, &GroupParams { max_duration: 1.0, max_words: 100, max_chars: 100, ..GroupParams::default() });
        assert!(long.iter().all(|l| l.end - l.start <= 1.0 + 1e-9));
        assert!(group_words(&[], &GroupParams::default()).is_empty());
        // Degenerate limits still make progress (one word per line).
        let one = group_words(&words, &GroupParams { max_words: 0, max_chars: 0, ..GroupParams::default() });
        assert_eq!(one.len(), 10);
    }

    #[test]
    fn srt_round_trip() {
        let lines = vec![Line::from_text("Hello brave world", 1.0, 2.5), Line::from_text("Second line", 3.0, 3.999_6)];
        let srt = to_srt(&lines);
        assert!(srt.starts_with("1\n00:00:01,000 --> 00:00:02,500\nHello brave world\n"));
        assert!(srt.contains("00:00:04,000"), "rounding must carry: {srt}");
        let back = parse_captions(&srt).unwrap();
        assert_eq!(back.len(), 2);
        assert_eq!(back[0].text(), "Hello brave world");
        assert!((back[0].start - 1.0).abs() < 1e-9 && (back[0].end - 2.5).abs() < 1e-9);
    }

    #[test]
    fn vtt_and_messy_input() {
        let vtt = "\u{feff}WEBVTT\r\n\r\nNOTE hi\r\n\r\n00:01.000 --> 00:02.000 align:start\r\n<v Bob>Hi <b>there</b>\r\n\r\n";
        let l = parse_captions(vtt).unwrap();
        assert_eq!(l.len(), 1);
        assert_eq!(l[0].text(), "Hi there");
        assert_eq!(to_vtt(&l).lines().next(), Some("WEBVTT"));
    }

    #[test]
    fn bad_input_is_an_error() {
        assert!(parse_captions("").is_err());
        assert!(parse_captions("1\n00:00:05,000 --> 00:00:01,000\nbackwards\n").is_err());
        assert!(parse_captions("1\nnot a time --> nope\nx\n").is_err());
        assert_eq!(stamp(f64::NAN, ','), "00:00:00,000");
        assert_eq!(stamp(-5.0, ','), "00:00:00,000");
    }

    #[test]
    fn from_text_spreads_time_over_words() {
        let l = Line::from_text("aa bbbb", 0.0, 3.0);
        assert_eq!(l.words.len(), 2);
        assert!((l.words[0].end - 1.0).abs() < 1e-9);
        assert!((l.words[1].end - 3.0).abs() < 1e-9);
        assert!(Line::from_text("", 0.0, 1.0).words.is_empty());
    }

    #[test]
    fn shift_moves_and_drops() {
        let lines = vec![Line::from_text("early", 0.0, 1.0), Line::from_text("late", 5.0, 6.0)];
        let s = shift(&lines, -2.0);
        assert_eq!(s.len(), 1);
        assert!((s[0].start - 3.0).abs() < 1e-9);
    }

    #[test]
    fn ass_has_a_valid_header_and_escapes_hostile_text() {
        let l = Line::from_text("Hello {\\pos(0,0)} world", 1.0, 2.5);
        let a = to_ass(&[l]);
        assert!(a.starts_with("[Script Info]"));
        assert!(a.contains("Style: Default,Inter,54"));
        assert!(a.contains("Dialogue: 0,0:00:01.00,0:00:02.50"));
        assert!(!a.contains("{\\pos"), "{a}");
        assert!(a.contains("(\u{ff3c}") || a.contains("(\\") || a.contains("(／"), "{a}");
    }

    #[test]
    fn ass_karaoke_has_one_tag_per_word() {
        let mut l = Line::from_text("Bonjour tout le monde", 0.0, 2.0);
        l.words = vec![
            Word { text: "Bonjour".into(), start: 0.0, end: 0.5 },
            Word { text: "tout".into(), start: 0.5, end: 0.8 },
            Word { text: "le".into(), start: 0.8, end: 1.0 },
            Word { text: "monde".into(), start: 1.0, end: 2.0 },
        ];
        let a = to_ass_karaoke(&[l]);
        assert_eq!(a.matches("{\\k").count(), 4, "{a}");
        assert!(a.contains("{\\k50}Bonjour"), "{a}");
        assert!(a.contains("{\\k100}monde"), "{a}");
        assert!(a.contains("0:00:02.00"), "{a}");
    }
}
