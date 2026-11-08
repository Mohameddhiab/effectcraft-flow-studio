//! Karaoke plans: turn caption lines with per-word times into the cues the panel layers.
//!
//! whisper.cpp already gives one start and end per word. This module keeps that timing and adds
//! an estimated horizontal position (in em units) so the panel can assemble a line word by word
//! without asking the text engine to measure glyphs. The estimate is deliberately simple and is
//! documented as approximate: real kerning and Arabic shaping can shift a word by a few pixels.

use serde::{Deserialize, Serialize};

use crate::captions::{Line, Word};
use crate::{FlowError, Result};

/// How words are shown. `Normal` keeps whole lines; the other three are word-by-word looks.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum KaraokePreset {
    #[default]
    Normal,
    Karaoke,
    Hormozi,
    WordPop,
}

impl KaraokePreset {
    pub fn parse(s: &str) -> KaraokePreset {
        match s.trim().to_ascii_lowercase().as_str() {
            "karaoke" => KaraokePreset::Karaoke,
            "hormozi" => KaraokePreset::Hormozi,
            "wordpop" | "word-pop" | "word_pop" => KaraokePreset::WordPop,
            _ => KaraokePreset::Normal,
        }
    }

    /// True when a dimmed copy of the whole line stays on screen behind the words.
    pub fn keeps_line(self) -> bool {
        matches!(self, KaraokePreset::Karaoke)
    }

    /// True when the preset puts one word at a time in the centre.
    pub fn one_word_at_a_time(self) -> bool {
        matches!(self, KaraokePreset::Hormozi | KaraokePreset::WordPop)
    }
}

/// Options for [`plan`]. Sizes are for a 1080-pixel-high composition; the panel scales them.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct KaraokeOptions {
    pub preset: KaraokePreset,
    pub font_size: f64,
    pub uppercase: bool,
    pub rtl: bool,
    /// Extra time a word stays on screen after it was spoken (seconds).
    pub tail: f64,
}

impl Default for KaraokeOptions {
    fn default() -> Self {
        Self { preset: KaraokePreset::Normal, font_size: 54.0, uppercase: false, rtl: false, tail: 0.06 }
    }
}

impl KaraokeOptions {
    pub fn validate(&self) -> Result<()> {
        let ok = self.font_size.is_finite() && (8.0..=400.0).contains(&self.font_size);
        if !ok {
            return Err(FlowError::Param("karaoke font size must be between 8 and 400".into()));
        }
        if !self.tail.is_finite() || !(0.0..=1.0).contains(&self.tail) {
            return Err(FlowError::Param("karaoke tail must be between 0 and 1".into()));
        }
        Ok(())
    }
}

/// One word (or a whole line for `Normal`) to place on the timeline.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Cue {
    pub text: String,
    pub start: f64,
    pub end: f64,
    /// Left edge relative to the line centre, in em (multiply by the font size).
    pub x_em: f64,
    /// Estimated width in em.
    pub width_em: f64,
    /// Index of the word inside its line.
    pub word_index: usize,
}

/// One caption line, ready to be built.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LinePlan {
    pub text: String,
    pub start: f64,
    pub end: f64,
    pub words: Vec<Cue>,
}

/// The whole plan for a set of caption lines.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Plan {
    pub preset: KaraokePreset,
    /// Keep one dimmed line layer behind the karaoke words.
    pub show_line: bool,
    /// One word at a time, centred (Hormozi, Word Pop).
    pub one_word: bool,
    pub word_count: usize,
    pub lines: Vec<LinePlan>,
}

/// Width of one character in em. A rough average for proportional fonts; CJK and Arabic are
/// wider. It is only used to lay karaoke words out, never to measure text for layout.
fn char_em(c: char) -> f64 {
    match c {
        ' ' => 0.28,
        '\t' => 0.56,
        '.' | ',' | ';' | ':' | '!' | '?' | '\'' | '’' | '"' | '|' | 'i' | 'l' | 'I' => 0.30,
        'm' | 'w' | 'M' | 'W' | '@' => 0.85,
        c if c.is_ascii_uppercase() => 0.62,
        c if c.is_ascii_lowercase() => 0.52,
        c if c.is_numeric() => 0.55,
        // Arabic, Hebrew, CJK and most non-Latin scripts take about one em per glyph.
        c if !c.is_ascii() => 0.95,
        _ => 0.50,
    }
}

fn width_em(text: &str) -> f64 {
    text.chars().map(char_em).sum::<f64>().max(0.10)
}

fn clean_word(text: &str, uppercase: bool) -> Option<String> {
    let t = text.split_whitespace().collect::<Vec<_>>().join(" ");
    let t = t.trim_matches(|c: char| c.is_control());
    if t.is_empty() {
        return None;
    }
    let mut out: String = t.chars().take(200).collect();
    if uppercase {
        out = out.to_uppercase();
    }
    Some(out)
}

fn words_of(line: &Line) -> Vec<Word> {
    if line.words.is_empty() {
        return Line::from_text(&line.text(), line.start, line.end).words;
    }
    line.words.clone()
}

/// Builds the cues for `lines`. The result is deterministic and never panics: bad times are
/// clamped, empty words are skipped, and hostile strings are trimmed and bounded.
pub fn plan(lines: &[Line], opts: &KaraokeOptions) -> Result<Plan> {
    opts.validate()?;
    if lines.len() > 5000 {
        return Err(FlowError::Param("too many caption lines (maximum 5000)".into()));
    }
    let mut out = Vec::new();
    let mut word_count = 0usize;
    for line in lines {
        let start = if line.start.is_finite() { line.start.max(0.0) } else { 0.0 };
        let end = if line.end.is_finite() { line.end.max(start) } else { start };
        if end <= start {
            continue;
        }
        let words = words_of(line);
        let cleaned: Vec<(String, f64, f64)> = words
            .iter()
            .filter_map(|w| {
                let text = clean_word(&w.text, opts.uppercase)?;
                let a = if w.start.is_finite() { w.start.clamp(start, end) } else { start };
                let b = if w.end.is_finite() { w.end.clamp(a, end) } else { a };
                Some((text, a, b.max(a)))
            })
            .collect();
        if cleaned.is_empty() {
            continue;
        }
        let line_text = cleaned.iter().map(|(t, _, _)| t.as_str()).collect::<Vec<_>>().join(" ");

        if opts.preset == KaraokePreset::Normal {
            let width = width_em(&line_text);
            out.push(LinePlan {
                text: line_text,
                start,
                end,
                words: vec![Cue {
                    text: cleaned.iter().map(|(t, _, _)| t.as_str()).collect::<Vec<_>>().join(" "),
                    start,
                    end,
                    x_em: -width / 2.0,
                    width_em: width,
                    word_index: 0,
                }],
            });
            continue;
        }

        let widths: Vec<f64> = cleaned.iter().map(|(t, _, _)| width_em(t)).collect();
        let space = 0.28;
        let total: f64 = widths.iter().sum::<f64>() + space * (cleaned.len().saturating_sub(1)) as f64;
        let mut cursor = if opts.rtl { total / 2.0 } else { -total / 2.0 };
        let mut cues = Vec::with_capacity(cleaned.len());
        for (i, (text, a, b)) in cleaned.iter().enumerate() {
            let x = if opts.preset.one_word_at_a_time() {
                0.0
            } else if opts.rtl {
                cursor - widths[i]
            } else {
                cursor
            };
            let cue_end = if opts.preset == KaraokePreset::Karaoke { (b + opts.tail).min(end).max(*a) } else { (*b).max(*a) };
            cues.push(Cue { text: text.clone(), start: *a, end: cue_end, x_em: x, width_em: widths[i], word_index: i });
            if opts.rtl {
                cursor -= widths[i] + space;
            } else {
                cursor += widths[i] + space;
            }
        }
        word_count += cues.len();
        out.push(LinePlan { text: line_text, start, end, words: cues });
    }
    Ok(Plan { preset: opts.preset, show_line: opts.preset.keeps_line(), one_word: opts.preset.one_word_at_a_time(), word_count, lines: out })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn line(text: &str, start: f64, end: f64) -> Line {
        Line::from_text(text, start, end)
    }

    #[test]
    fn normal_keeps_one_cue_per_line() {
        let p = plan(&[line("Hello brave world", 1.0, 2.0)], &KaraokeOptions::default()).unwrap();
        assert_eq!(p.lines.len(), 1);
        assert_eq!(p.lines[0].words.len(), 1);
        assert_eq!(p.lines[0].words[0].text, "Hello brave world");
        assert!(!p.show_line && !p.one_word);
        assert!(p.lines[0].words[0].x_em < 0.0);
    }

    #[test]
    fn karaoke_keeps_word_times_and_lays_them_left_to_right() {
        let mut l = line("Bonjour tout le monde", 0.0, 2.0);
        l.words = vec![
            Word { text: "Bonjour".into(), start: 0.0, end: 0.5 },
            Word { text: "tout".into(), start: 0.5, end: 0.8 },
            Word { text: "le".into(), start: 0.8, end: 0.9 },
            Word { text: "monde".into(), start: 1.2, end: 2.0 },
        ];
        let p = plan(&[l], &KaraokeOptions { preset: KaraokePreset::Karaoke, tail: 0.0, ..KaraokeOptions::default() }).unwrap();
        let cues = &p.lines[0].words;
        assert_eq!(cues.len(), 4);
        assert!(p.show_line && !p.one_word);
        assert_eq!(cues[0].start, 0.0);
        assert!((cues[1].start - 0.5).abs() < 1e-9);
        assert!(cues.windows(2).all(|w| w[0].x_em < w[1].x_em));
        assert!(cues.iter().all(|c| c.width_em > 0.0));
    }

    #[test]
    fn rtl_words_start_on_the_right() {
        let l = line("مرحبا بكم", 0.0, 1.0);
        let p = plan(&[l], &KaraokeOptions { preset: KaraokePreset::Karaoke, rtl: true, ..KaraokeOptions::default() }).unwrap();
        let cues = &p.lines[0].words;
        assert_eq!(cues.len(), 2);
        assert!(cues[0].x_em > cues[1].x_em, "{:?}", cues);
        assert!(cues[0].x_em + cues[0].width_em > 0.0);
    }

    #[test]
    fn one_word_presets_centre_each_word() {
        for preset in [KaraokePreset::Hormozi, KaraokePreset::WordPop] {
            let p = plan(&[line("one two three", 0.0, 1.0)], &KaraokeOptions { preset, ..KaraokeOptions::default() }).unwrap();
            assert!(p.one_word && !p.show_line);
            assert!(p.lines[0].words.iter().all(|c| c.x_em == 0.0));
        }
    }

    #[test]
    fn hostile_input_is_clamped_not_a_panic() {
        let mut l = line("a b", 2.0, 3.0);
        l.words = vec![Word { text: "  a  ".into(), start: f64::NAN, end: f64::INFINITY }, Word { text: "   ".into(), start: 0.0, end: 1.0 }];
        let p = plan(&[l], &KaraokeOptions { preset: KaraokePreset::Karaoke, ..KaraokeOptions::default() }).unwrap();
        assert_eq!(p.lines[0].words.len(), 1);
        assert!(p.lines[0].words[0].start >= 2.0 && p.lines[0].words[0].end <= 3.0);
        assert!(plan(&[], &KaraokeOptions::default()).unwrap().lines.is_empty());
        assert!(plan(&[line("x", 0.0, 1.0)], &KaraokeOptions { font_size: f64::NAN, ..KaraokeOptions::default() }).is_err());
    }

    #[test]
    fn preset_names_are_tolerant() {
        assert_eq!(KaraokePreset::parse("Karaoke"), KaraokePreset::Karaoke);
        assert_eq!(KaraokePreset::parse("word-pop"), KaraokePreset::WordPop);
        assert_eq!(KaraokePreset::parse("???"), KaraokePreset::Normal);
    }
}
