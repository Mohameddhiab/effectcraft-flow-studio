//! The whole Flow Studio preset pack: captions styles, text animations, gradient backgrounds and
//! panel settings in one JSON document. Import is hostile input: every array and string is bounded
//! here, and the panel re-cleans the text/background entries field by field.

use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

use crate::style::CaptionStyle;
use crate::{FlowError, Result};

pub const SCHEMA: u32 = 1;
const MAX_TEXT: usize = 4 * 1024 * 1024;
const MAX_ITEMS: usize = 500;
const MAX_ITEM_JSON: usize = 64 * 1024;

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Pack {
    pub schema: u32,
    pub app: String,
    /// Text-animation presets, kept as plain JSON until the panel's `cleanText` sees them.
    pub text: Vec<Value>,
    /// Gradient presets, kept as plain JSON until the panel's `cleanBg` sees them.
    pub backgrounds: Vec<Value>,
    pub caption_styles: Vec<CaptionStyle>,
    /// UI settings (last tab, language, thresholds...), bounded and opaque.
    pub settings: Value,
}

impl Default for Pack {
    fn default() -> Self {
        Self { schema: SCHEMA, app: "Flow Studio".into(), text: Vec::new(), backgrounds: Vec::new(), caption_styles: Vec::new(), settings: json!({}) }
    }
}

impl Pack {
    fn validate(&self) -> Result<()> {
        if self.schema == 0 || self.schema > SCHEMA {
            return Err(FlowError::Param(format!("unsupported preset pack schema {} (this build reads {SCHEMA})", self.schema)));
        }
        if self.app.chars().count() > 80 {
            return Err(FlowError::Param("the pack app name is too long".into()));
        }
        if self.text.len() > MAX_ITEMS || self.backgrounds.len() > MAX_ITEMS || self.caption_styles.len() > MAX_ITEMS {
            return Err(FlowError::Param(format!("a preset pack may hold at most {MAX_ITEMS} entries of each kind")));
        }
        for item in self.text.iter().chain(self.backgrounds.iter()) {
            if !item.is_object() {
                return Err(FlowError::Param("text and background presets must be JSON objects".into()));
            }
            let size = serde_json::to_vec(item).map_err(|e| FlowError::Param(e.to_string()))?.len();
            if size > MAX_ITEM_JSON {
                return Err(FlowError::Param("a preset in the pack is too large".into()));
            }
        }
        for s in &self.caption_styles {
            s.validate()?;
        }
        if !self.settings.is_object() {
            return Err(FlowError::Param("settings must be a JSON object".into()));
        }
        let size = serde_json::to_vec(&self.settings).map_err(|e| FlowError::Param(e.to_string()))?.len();
        if size > MAX_ITEM_JSON {
            return Err(FlowError::Param("the settings block is too large".into()));
        }
        Ok(())
    }

    pub fn to_json(&self) -> Result<String> {
        self.validate()?;
        serde_json::to_string_pretty(self).map_err(|e| FlowError::Param(e.to_string()))
    }
}

/// Reads and validates a pack. Missing fields take defaults; unknown fields are ignored.
pub fn parse(text: &str) -> Result<Pack> {
    if text.len() > MAX_TEXT {
        return Err(FlowError::Param("preset pack too large (maximum 4 MB)".into()));
    }
    let text = text.trim_start_matches('\u{feff}').trim();
    if !text.starts_with('{') {
        return Err(FlowError::Param("a preset pack must be a JSON object".into()));
    }
    let mut pack: Pack = serde_json::from_str(text).map_err(|e| FlowError::Param(format!("not a Flow Studio preset pack: {e}")))?;
    if pack.schema == 0 {
        pack.schema = SCHEMA;
    }
    if pack.app.trim().is_empty() {
        pack.app = "Flow Studio".into();
    }
    pack.validate()?;
    Ok(pack)
}

/// What the panel shows after a successful import.
#[derive(Clone, Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Summary {
    pub schema: u32,
    pub text: usize,
    pub backgrounds: usize,
    pub caption_styles: usize,
}

pub fn summary(pack: &Pack) -> Summary {
    Summary { schema: pack.schema, text: pack.text.len(), backgrounds: pack.backgrounds.len(), caption_styles: pack.caption_styles.len() }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trip_and_summary() {
        let mut p = Pack::default();
        p.text.push(json!({"name": "Mine", "unit": "chars"}));
        p.backgrounds.push(json!({"name": "Mine", "colors": ["#000000"]}));
        p.caption_styles.push(crate::style::presets()[0].clone());
        let text = p.to_json().unwrap();
        let back = parse(&text).unwrap();
        assert_eq!(summary(&back), Summary { schema: 1, text: 1, backgrounds: 1, caption_styles: 1 });
    }

    #[test]
    fn hostile_packs_are_rejected() {
        assert!(parse("not json").is_err());
        assert!(parse("[]").is_err());
        assert!(parse(r#"{"schema":99}"#).is_err());
        assert!(parse(r#"{"schema":1,"text":[1]}"#).is_err());
        assert!(parse(r#"{"schema":1,"text":[{"name":"x"}],"captionStyles":[{"fontSize":1e9}]}"#).is_err());
        assert!(parse(r#"{"schema":1,"settings":[]}"#).is_err());
        assert!(parse(&format!(r#"{{"schema":1,"text":[{{"x":"{}"}}]}}"#, "a".repeat(70_000))).is_err());
        let too_many = format!(r#"{{"schema":1,"text":[{}]}}"#, vec!["{}"; MAX_ITEMS + 1].join(","));
        assert!(parse(&too_many).is_err());
    }

    #[test]
    fn missing_fields_take_defaults() {
        let p = parse(r#"{"text":[{"name":"Mine"}]}"#).unwrap();
        assert_eq!(p.schema, 1);
        assert_eq!(p.app, "Flow Studio");
        assert!(p.backgrounds.is_empty() && p.caption_styles.is_empty());
        assert_eq!(p.settings, json!({}));
    }
}
