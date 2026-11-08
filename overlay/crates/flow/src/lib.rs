//! # effectcraft-flow (L1)
//!
//! The pure, testable core of **Flow Studio**:
//!
//! - [`audio`]: WAV reading and writing, mono downmix and resampling, so analysis and
//!   speech-to-text get the format they need.
//! - [`silence`]: silence / speech detection (fixed or adaptive threshold, minimum durations,
//!   padding) producing the ranges to keep and the ranges to cut.
//! - [`captions`]: words with times, grouping into caption lines, SRT / WebVTT / ASS writing and
//!   reading.
//! - [`karaoke`]: per-word cue plans for karaoke, Hormozi and Word Pop captions.
//! - [`beats`]: tempo and beat detection for music, with a confidence.
//! - [`pack`]: one JSON preset pack for text styles, gradients, caption styles and settings.
//! - [`style`]: the caption style model (font, size, colours, stroke, shadow, box, position,
//!   animation) with JSON presets.
//! - [`stt`]: building a `whisper.cpp` command line and reading its JSON output into words.
//! - [`sfx`]: original, synthesised sound effects (nothing sampled, nothing to license).
//! - [`models`]: the catalog of free, open-source speech models, with SHA-256 verification.
//!
//! No file, network or process access lives here, so the crate builds for `wasm32` like every
//! other crate below L5. The helper binary (`apps/flow-helper`) does the I/O.
#![deny(clippy::unwrap_used, clippy::expect_used, clippy::panic, clippy::unimplemented, clippy::todo, clippy::unreachable)]
#![forbid(unsafe_code)]

pub mod audio;
pub mod beats;
pub mod captions;
pub mod karaoke;
pub mod models;
pub mod pack;
pub mod sfx;
pub mod silence;
pub mod stt;
pub mod style;

/// Errors of every Flow Studio operation: a message the user can act on, never a panic.
#[derive(Debug, thiserror::Error, PartialEq)]
pub enum FlowError {
    #[error("invalid audio: {0}")]
    Audio(String),
    #[error("invalid parameter: {0}")]
    Param(String),
    #[error("invalid captions: {0}")]
    Captions(String),
    #[error("invalid style: {0}")]
    Style(String),
    #[error("speech-to-text: {0}")]
    Stt(String),
    #[error("model: {0}")]
    Model(String),
}

pub type Result<T> = std::result::Result<T, FlowError>;
