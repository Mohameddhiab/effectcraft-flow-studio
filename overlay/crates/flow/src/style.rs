//! The caption style model: everything the user can change about how captions look, as plain
//! serde data (saved as JSON presets, applied by the Flow Studio panel to text layers).

use serde::{Deserialize, Serialize};

use crate::captions::GroupParams;
use crate::{FlowError, Result};

/// An RGBA colour, written in JSON as `"#RRGGBB"` or `"#RRGGBBAA"`.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(try_from = "String", into = "String")]
pub struct Color {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub a: u8,
}

impl Color {
    pub const WHITE: Color = Color { r: 255, g: 255, b: 255, a: 255 };
    pub const BLACK: Color = Color { r: 0, g: 0, b: 0, a: 255 };

    pub const fn rgb(r: u8, g: u8, b: u8) -> Color {
        Color { r, g, b, a: 255 }
    }

    /// Parses `#RGB`, `#RRGGBB` or `#RRGGBBAA` (the `#` is optional).
    pub fn parse(s: &str) -> Result<Color> {
        let h = s.trim().trim_start_matches('#');
        let bad = || FlowError::Style(format!("bad colour {s:?}: use #RRGGBB or #RRGGBBAA"));
        let pair = |i: usize| h.get(i..i + 2).and_then(|p| u8::from_str_radix(p, 16).ok());
        if !h.is_ascii() {
            return Err(bad());
        }
        match h.len() {
            3 => {
                let nib = |i: usize| h.get(i..i + 1).and_then(|p| u8::from_str_radix(p, 16).ok()).map(|v| v * 17);
                Ok(Color::rgb(nib(0).ok_or_else(bad)?, nib(1).ok_or_else(bad)?, nib(2).ok_or_else(bad)?))
            }
            6 => Ok(Color::rgb(pair(0).ok_or_else(bad)?, pair(2).ok_or_else(bad)?, pair(4).ok_or_else(bad)?)),
            8 => Ok(Color { r: pair(0).ok_or_else(bad)?, g: pair(2).ok_or_else(bad)?, b: pair(4).ok_or_else(bad)?, a: pair(6).ok_or_else(bad)? }),
            _ => Err(bad()),
        }
    }

    /// Red, green, blue, alpha as 0–1 floats (what the scripting API takes).
    pub fn to_unit(self) -> [f64; 4] {
        [f64::from(self.r) / 255.0, f64::from(self.g) / 255.0, f64::from(self.b) / 255.0, f64::from(self.a) / 255.0]
    }
}

impl TryFrom<String> for Color {
    type Error = FlowError;
    fn try_from(s: String) -> Result<Color> {
        Color::parse(&s)
    }
}

impl From<Color> for String {
    fn from(c: Color) -> String {
        if c.a == 255 { format!("#{:02X}{:02X}{:02X}", c.r, c.g, c.b) } else { format!("#{:02X}{:02X}{:02X}{:02X}", c.r, c.g, c.b, c.a) }
    }
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Anchor {
    Top,
    Middle,
    #[default]
    Bottom,
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Align {
    Left,
    #[default]
    Center,
    Right,
}

/// Where the captions sit in the composition.
#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Position {
    pub anchor: Anchor,
    /// Distance from the top/bottom edge as a fraction of the comp height (ignored for `middle`).
    pub margin: f64,
    /// Horizontal shift as a fraction of the comp width.
    pub offset_x: f64,
}

impl Default for Position {
    fn default() -> Self {
        Self { anchor: Anchor::Bottom, margin: 0.12, offset_x: 0.0 }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Shadow {
    pub color: Color,
    /// 0–100 percent.
    pub opacity: f64,
    /// Degrees, 0 = to the right.
    pub angle: f64,
    /// Pixels at 1080p.
    pub distance: f64,
    pub softness: f64,
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum AnimationKind {
    None,
    #[default]
    Fade,
    Pop,
    SlideUp,
}

/// How each caption comes in (and fades out).
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Animation {
    pub kind: AnimationKind,
    /// Seconds the entrance takes.
    pub duration: f64,
    /// An easing id from the Flow Studio easing library (for example `outBack`).
    pub easing: String,
}

impl Default for Animation {
    fn default() -> Self {
        Self { kind: AnimationKind::Fade, duration: 0.15, easing: "outCubic".into() }
    }
}

/// The look of captions. Sizes are in pixels for a 1080-pixel-high comp; the panel scales them
/// to the real comp height.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct CaptionStyle {
    pub name: String,
    pub font_family: String,
    pub font_style: String,
    pub font_size: f64,
    pub uppercase: bool,
    pub tracking: f64,
    /// Line spacing as a multiple of the font size.
    pub line_spacing: f64,
    pub fill: Color,
    pub stroke: Color,
    pub stroke_width: f64,
    pub shadow: Option<Shadow>,
    pub position: Position,
    pub align: Align,
    pub group: GroupParams,
    pub animation: Animation,
}

impl Default for CaptionStyle {
    fn default() -> Self {
        Self {
            name: "Clean".into(),
            font_family: "Inter".into(),
            font_style: "Medium".into(),
            font_size: 54.0,
            uppercase: false,
            tracking: 0.0,
            line_spacing: 1.2,
            fill: Color::WHITE,
            stroke: Color::BLACK,
            stroke_width: 0.0,
            shadow: Some(Shadow { color: Color::BLACK, opacity: 60.0, angle: 135.0, distance: 4.0, softness: 8.0 }),
            position: Position::default(),
            align: Align::Center,
            group: GroupParams::default(),
            animation: Animation::default(),
        }
    }
}

impl CaptionStyle {
    /// Rejects values outside what text layers can show sensibly.
    pub fn validate(&self) -> Result<()> {
        let range = |name: &str, v: f64, lo: f64, hi: f64| {
            if v.is_finite() && (lo..=hi).contains(&v) { Ok(()) } else { Err(FlowError::Style(format!("{name} must be between {lo} and {hi}"))) }
        };
        if self.name.trim().is_empty() || self.name.chars().count() > 60 {
            return Err(FlowError::Style("name must be 1 to 60 characters".into()));
        }
        if self.font_family.trim().is_empty() || self.font_family.chars().count() > 80 {
            return Err(FlowError::Style("font family must be 1 to 80 characters".into()));
        }
        range("fontSize", self.font_size, 8.0, 400.0)?;
        range("tracking", self.tracking, -100.0, 500.0)?;
        range("lineSpacing", self.line_spacing, 0.5, 4.0)?;
        range("strokeWidth", self.stroke_width, 0.0, 60.0)?;
        range("position.margin", self.position.margin, 0.0, 0.5)?;
        range("position.offsetX", self.position.offset_x, -0.5, 0.5)?;
        range("animation.duration", self.animation.duration, 0.0, 3.0)?;
        if self.animation.easing.is_empty() || self.animation.easing.len() > 24 || !self.animation.easing.chars().all(|c| c.is_ascii_alphanumeric()) {
            return Err(FlowError::Style("animation.easing must be a short alphanumeric id".into()));
        }
        if let Some(s) = &self.shadow {
            range("shadow.opacity", s.opacity, 0.0, 100.0)?;
            range("shadow.angle", s.angle, -360.0, 360.0)?;
            range("shadow.distance", s.distance, 0.0, 200.0)?;
            range("shadow.softness", s.softness, 0.0, 200.0)?;
        }
        if self.group.max_chars == 0 || self.group.max_chars > 200 || self.group.max_words == 0 || self.group.max_words > 50 {
            return Err(FlowError::Style("group limits out of range".into()));
        }
        range("group.maxDuration", self.group.max_duration, 0.2, 30.0)?;
        range("group.maxGap", self.group.max_gap, 0.0, 10.0)
    }

    /// Parses and validates a style from JSON; missing fields take the defaults.
    pub fn from_json(text: &str) -> Result<CaptionStyle> {
        let s: CaptionStyle = serde_json::from_str(text).map_err(|e| FlowError::Style(e.to_string()))?;
        s.validate()?;
        Ok(s)
    }

    pub fn to_json(&self) -> Result<String> {
        serde_json::to_string_pretty(self).map_err(|e| FlowError::Style(e.to_string()))
    }
}

/// The built-in presets, all original: nothing here copies another product's templates.
pub fn presets() -> Vec<CaptionStyle> {
    let base = CaptionStyle::default();
    let named = |name: &str| CaptionStyle { name: name.into(), ..CaptionStyle::default() };
    vec![
        base.clone(),
        CaptionStyle {
            font_style: "Bold".into(),
            font_size: 76.0,
            uppercase: true,
            fill: Color::rgb(0xFF, 0xE6, 0x00),
            stroke_width: 9.0,
            shadow: None,
            group: GroupParams { max_words: 3, max_chars: 20, ..GroupParams::default() },
            animation: Animation { kind: AnimationKind::Pop, duration: 0.18, easing: "outBack".into() },
            ..named("Bold Yellow")
        },
        CaptionStyle {
            font_style: "Bold".into(),
            font_size: 110.0,
            uppercase: true,
            stroke_width: 10.0,
            shadow: None,
            position: Position { anchor: Anchor::Middle, ..Position::default() },
            group: GroupParams { max_words: 1, max_chars: 20, max_gap: 0.4, ..GroupParams::default() },
            animation: Animation { kind: AnimationKind::Pop, duration: 0.14, easing: "outBack".into() },
            ..named("Word Pop")
        },
        CaptionStyle {
            font_style: "Regular".into(),
            font_size: 40.0,
            shadow: None,
            position: Position { margin: 0.08, ..Position::default() },
            group: GroupParams { max_words: 9, max_chars: 44, ..GroupParams::default() },
            animation: Animation { kind: AnimationKind::None, ..Animation::default() },
            ..named("Minimal")
        },
        CaptionStyle {
            font_style: "SemiBold".into(),
            font_size: 58.0,
            stroke_width: 6.0,
            shadow: None,
            animation: Animation { kind: AnimationKind::SlideUp, duration: 0.2, easing: "outCubic".into() },
            ..named("Subtitle Outline")
        },
        CaptionStyle {
            font_family: "Noto Sans Arabic".into(),
            font_style: "Regular".into(),
            font_size: 56.0,
            tracking: 0.0,
            stroke_width: 5.0,
            shadow: None,
            ..named("Arabic Clean")
        },
        CaptionStyle {
            font_style: "Bold".into(),
            font_size: 120.0,
            uppercase: true,
            stroke_width: 14.0,
            shadow: None,
            fill: Color::rgb(0xFF, 0xE6, 0x00),
            position: Position { anchor: Anchor::Middle, ..Position::default() },
            group: GroupParams { max_words: 1, max_chars: 20, max_gap: 0.4, ..GroupParams::default() },
            animation: Animation { kind: AnimationKind::Pop, duration: 0.12, easing: "outBack".into() },
            ..named("Hormozi")
        },
        CaptionStyle {
            font_style: "SemiBold".into(),
            font_size: 64.0,
            stroke_width: 7.0,
            shadow: None,
            position: Position { margin: 0.1, ..Position::default() },
            group: GroupParams { max_words: 5, max_chars: 30, ..GroupParams::default() },
            animation: Animation { kind: AnimationKind::None, ..Animation::default() },
            ..named("Karaoke")
        },
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn colours_parse_and_print() {
        assert_eq!(Color::parse("#FFE600").unwrap(), Color::rgb(255, 230, 0));
        assert_eq!(Color::parse("fff").unwrap(), Color::WHITE);
        assert_eq!(Color::parse("#00000080").unwrap().a, 128);
        assert_eq!(String::from(Color::rgb(1, 2, 3)), "#010203");
        assert_eq!(String::from(Color { r: 1, g: 2, b: 3, a: 4 }), "#01020304");
        for bad in ["", "#12", "#GGGGGG", "#12345", "é", "#1234567890"] {
            assert!(Color::parse(bad).is_err(), "{bad}");
        }
        let u = Color::rgb(255, 0, 0).to_unit();
        assert_eq!(u, [1.0, 0.0, 0.0, 1.0]);
    }

    #[test]
    fn presets_are_valid_unique_and_round_trip() {
        let all = presets();
        assert_eq!(all.len(), 8);
        let mut names: Vec<&str> = all.iter().map(|p| p.name.as_str()).collect();
        names.sort_unstable();
        names.dedup();
        assert_eq!(names.len(), 8);
        for p in &all {
            p.validate().unwrap_or_else(|e| panic!("{}: {e}", p.name));
            let back = CaptionStyle::from_json(&p.to_json().unwrap()).unwrap();
            assert_eq!(&back, p);
        }
    }

    #[test]
    fn partial_json_takes_defaults_and_bad_values_are_rejected() {
        let s = CaptionStyle::from_json(r##"{"name":"Mine","fontSize":90,"fill":"#FF0000"}"##).unwrap();
        assert_eq!(s.font_size, 90.0);
        assert_eq!(s.fill, Color::rgb(255, 0, 0));
        assert_eq!(s.font_family, "Inter");
        assert!(CaptionStyle::from_json(r#"{"fontSize":5}"#).is_err());
        assert!(CaptionStyle::from_json(r#"{"fontSize":1e9}"#).is_err());
        assert!(CaptionStyle::from_json(r#"{"fill":"red"}"#).is_err());
        assert!(CaptionStyle::from_json(r#"{"animation":{"easing":"a b"}}"#).is_err());
        assert!(CaptionStyle::from_json(r#"{"name":""}"#).is_err());
        assert!(CaptionStyle::from_json("not json").is_err());
    }
}
