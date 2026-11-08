//! Where Flow Studio keeps its files: `<settings folder>/FlowStudio/…`, next to (never inside)
//! the files an EffectCraft update replaces, so updating EffectCraft never touches them.

use std::path::{Path, PathBuf};

/// The settings folder EffectCraft itself uses (docs/plugins.md), or `EFFECTCRAFT_FLOW_DIR`
/// (the Flow folder itself) when set.
pub fn flow_dir() -> PathBuf {
    #[cfg(test)]
    if let Some(d) = TEST_DIR.lock().unwrap_or_else(std::sync::PoisonError::into_inner).clone() {
        return d;
    }
    if let Some(d) = std::env::var_os("EFFECTCRAFT_FLOW_DIR").filter(|d| !d.is_empty()) {
        return PathBuf::from(d);
    }
    settings_dir().join("FlowStudio")
}

#[cfg(test)]
static TEST_DIR: std::sync::Mutex<Option<PathBuf>> = std::sync::Mutex::new(None);

/// Tests point the Flow folder at their own temp folder.
#[cfg(test)]
pub fn set_test_dir(dir: &Path) {
    *TEST_DIR.lock().unwrap_or_else(std::sync::PoisonError::into_inner) = Some(dir.to_path_buf());
}

fn settings_dir() -> PathBuf {
    let home = || std::env::var_os("HOME").map(PathBuf::from).unwrap_or_else(|| PathBuf::from("."));
    if cfg!(windows) {
        return std::env::var_os("APPDATA").map(|a| PathBuf::from(a).join("EffectCraft")).unwrap_or_else(|| home().join("EffectCraft"));
    }
    if cfg!(target_os = "macos") {
        return home().join("Library/Application Support/EffectCraft");
    }
    std::env::var_os("XDG_CONFIG_HOME")
        .filter(|d| !d.is_empty())
        .map(|d| PathBuf::from(d).join("effectcraft"))
        .unwrap_or_else(|| home().join(".config/effectcraft"))
}

pub fn models_dir() -> PathBuf {
    flow_dir().join("models")
}

pub fn work_dir() -> PathBuf {
    flow_dir().join("work")
}

pub fn exports_dir() -> PathBuf {
    flow_dir().join("exports")
}

pub fn styles_dir() -> PathBuf {
    flow_dir().join("styles")
}

pub fn sfx_dir() -> PathBuf {
    flow_dir().join("sfx")
}

pub fn pins_file() -> PathBuf {
    flow_dir().join("model-pins.json")
}

pub fn config_file() -> PathBuf {
    flow_dir().join("config.json")
}

/// A file name that is safe to create inside one of our folders: no separators, no `..`,
/// not hidden, bounded length, only plain characters.
pub fn safe_name(name: &str) -> Option<String> {
    let ok = !name.is_empty()
        && name.chars().count() <= 80
        && !name.starts_with('.')
        && name.chars().all(|c| c.is_alphanumeric() || matches!(c, ' ' | '-' | '_' | '.' | '(' | ')'));
    ok.then(|| name.to_string())
}

pub fn ensure(dir: &Path) -> Result<(), String> {
    std::fs::create_dir_all(dir).map_err(|e| format!("can't create {}: {e}", dir.display()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn safe_names() {
        assert_eq!(safe_name("Bold Yellow").as_deref(), Some("Bold Yellow"));
        assert_eq!(safe_name("عربي-1").as_deref(), Some("عربي-1"));
        for bad in ["", "../x", "a/b", "a\\b", ".hidden", "a\0b", &"x".repeat(81)] {
            assert!(safe_name(bad).is_none(), "{bad:?}");
        }
    }
}
