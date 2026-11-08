//! The catalog of free, open-source speech models Flow Studio can use, and SHA-256 verification.
//!
//! Weights are never bundled or committed. The helper downloads one on demand into the user's
//! data folder (`<settings>/FlowStudio/models`) and checks it against the digest below. A digest
//! left empty is **not** trusted: such a model is shown as "unverified" and the Model Manager
//! asks the user to confirm the hash it computed (see `docs/flow-studio.md`).

use serde::Serialize;
use sha2::{Digest, Sha256};

use crate::{FlowError, Result};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Kind {
    /// Speech-to-text for captions (whisper.cpp ggml format).
    Whisper,
    /// The `whisper.cpp` program itself is not a model; it is installed separately.
    Other,
}

/// One downloadable model.
#[derive(Clone, Copy, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelInfo {
    pub id: &'static str,
    pub name: &'static str,
    pub kind: Kind,
    pub file: &'static str,
    pub url: &'static str,
    /// Approximate size in megabytes (for the UI and the free-space check).
    pub size_mb: u32,
    /// Lowercase hex SHA-256, or empty when not yet pinned.
    pub sha256: &'static str,
    pub license: &'static str,
    pub author: &'static str,
    pub source: &'static str,
    pub note: &'static str,
}

const WHISPER_BASE_URL: &str = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main";

/// The catalog. Whisper models are MIT-licensed (OpenAI), converted to ggml by the whisper.cpp
/// project (MIT).
pub const MODELS: &[ModelInfo] = &[
    ModelInfo {
        id: "whisper-tiny",
        name: "Whisper Tiny (multilingual)",
        kind: Kind::Whisper,
        file: "ggml-tiny.bin",
        url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin",
        size_mb: 75,
        sha256: "",
        license: "MIT",
        author: "OpenAI; ggml conversion by the whisper.cpp project",
        source: "https://github.com/ggml-org/whisper.cpp",
        note: "Fastest, least accurate. Good for a quick draft on a weak PC.",
    },
    ModelInfo {
        id: "whisper-base",
        name: "Whisper Base (multilingual)",
        kind: Kind::Whisper,
        file: "ggml-base.bin",
        url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin",
        size_mb: 142,
        sha256: "",
        license: "MIT",
        author: "OpenAI; ggml conversion by the whisper.cpp project",
        source: "https://github.com/ggml-org/whisper.cpp",
        note: "Light and fast; fine for clear speech.",
    },
    ModelInfo {
        id: "whisper-small",
        name: "Whisper Small (multilingual)",
        kind: Kind::Whisper,
        file: "ggml-small.bin",
        url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin",
        size_mb: 466,
        sha256: "",
        license: "MIT",
        author: "OpenAI; ggml conversion by the whisper.cpp project",
        source: "https://github.com/ggml-org/whisper.cpp",
        note: "Recommended default: good French, Arabic and English for its size.",
    },
    ModelInfo {
        id: "whisper-large-v3-turbo",
        name: "Whisper Large v3 Turbo (multilingual)",
        kind: Kind::Whisper,
        file: "ggml-large-v3-turbo.bin",
        url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin",
        size_mb: 1624,
        sha256: "",
        license: "MIT",
        author: "OpenAI; ggml conversion by the whisper.cpp project",
        source: "https://github.com/ggml-org/whisper.cpp",
        note: "Best quality, needs about 3 GB of memory.",
    },
];

/// The model offered first.
pub const DEFAULT_MODEL: &str = "whisper-small";

pub fn find(id: &str) -> Option<&'static ModelInfo> {
    MODELS.iter().find(|m| m.id == id)
}

/// Lowercase hex SHA-256 of `bytes`.
pub fn sha256_hex(bytes: &[u8]) -> String {
    hex(&Sha256::digest(bytes))
}

fn hex(b: &[u8]) -> String {
    b.iter().map(|x| format!("{x:02x}")).collect()
}

/// A streaming SHA-256 for files too big to read at once.
#[derive(Default)]
pub struct Hasher(Sha256);

impl Hasher {
    pub fn new() -> Hasher {
        Hasher(Sha256::new())
    }

    pub fn update(&mut self, chunk: &[u8]) {
        self.0.update(chunk);
    }

    pub fn finish_hex(self) -> String {
        hex(&self.0.finalize())
    }
}

/// How a downloaded file compares with the catalog.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase", tag = "state", content = "hash")]
pub enum Verification {
    /// Matches the pinned digest.
    Verified,
    /// The catalog has no pinned digest yet; this is the one computed from the file.
    Unpinned(String),
}

/// Checks a computed digest against the catalog entry.
pub fn verify(info: &ModelInfo, computed_hex: &str) -> Result<Verification> {
    if info.sha256.is_empty() {
        return Ok(Verification::Unpinned(computed_hex.to_string()));
    }
    if info.sha256.eq_ignore_ascii_case(computed_hex) {
        Ok(Verification::Verified)
    } else {
        Err(FlowError::Model(format!("{} failed its SHA-256 check (expected {}, got {computed_hex}); the file was removed", info.name, info.sha256)))
    }
}

/// True when `url` points at the host the catalog uses (the helper refuses other hosts, so a
/// tampered catalog entry cannot send the download elsewhere).
pub fn url_allowed(url: &str) -> bool {
    url.starts_with(WHISPER_BASE_URL) || url.starts_with("https://huggingface.co/")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sha256_known_vector() {
        assert_eq!(sha256_hex(b"abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
        let mut h = Hasher::new();
        h.update(b"a");
        h.update(b"bc");
        assert_eq!(h.finish_hex(), sha256_hex(b"abc"));
    }

    #[test]
    fn catalog_is_consistent() {
        let mut ids: Vec<&str> = MODELS.iter().map(|m| m.id).collect();
        ids.sort_unstable();
        ids.dedup();
        assert_eq!(ids.len(), MODELS.len());
        for m in MODELS {
            assert!(m.url.starts_with("https://") && url_allowed(m.url), "{}", m.id);
            assert!(m.url.ends_with(m.file), "{}", m.id);
            assert!(m.file.ends_with(".bin") && !m.file.contains('/') && !m.file.contains(".."), "{}", m.id);
            assert_eq!(m.license, "MIT", "{}", m.id);
            assert!(m.sha256.is_empty() || (m.sha256.len() == 64 && m.sha256.chars().all(|c| c.is_ascii_hexdigit())), "{}", m.id);
        }
        assert!(find(DEFAULT_MODEL).is_some());
        assert!(find("nope").is_none());
    }

    #[test]
    fn verification_rules() {
        let pinned = ModelInfo { sha256: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", ..MODELS[0] };
        assert_eq!(verify(&pinned, &sha256_hex(b"abc")).unwrap(), Verification::Verified);
        assert!(verify(&pinned, &sha256_hex(b"abd")).is_err());
        let unpinned = ModelInfo { sha256: "", ..MODELS[0] };
        assert!(matches!(verify(&unpinned, "00"), Ok(Verification::Unpinned(_))));
        assert!(!url_allowed("https://evil.example/ggml-small.bin"));
    }
}
