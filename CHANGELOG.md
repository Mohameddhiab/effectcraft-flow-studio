# Changelog

## Unreleased

- Catalogue: 528 validated presets (60 titles, 25 UI widgets, 96 text animations, 55 transitions, 70 effects,
  50 gradients, 30 palettes, 34 captions, 84 sounds, 24 tools) with kind/family filters, search, recents and
  favourites, one-step removal and drawn thumbnails; the kind labels and thumbnails now resolve both singular
  and plural kinds, so each card is tinted and drawn for its own type.
- UI widgets: 25 original data-driven badges, buttons, progress, notifications, stats and overlays built from
  shape and text parts with keyframed entrances; no plug-in or native effect required.
- Sounds: 84 CC0 sound effects served by `sfx.pack.list`, with a drawn waveform and the built-in effects as
  fallback.
- Silence: named profiles (Standard, Podcast, Interview, Musique) replacing the sensitivity menu.
- Captions: Whisper readiness check and model install inside the Captions tab.
- Design: `design/tokens.json` and `docs/design-system.md` publish the colours, radii, spacing, type sizes
  and glass recipe the panel mirrors; the smoke suite pins them so a silent drift fails. The light theme's
  success colour now matches the design (`#44d7a2`).
- Smoke suite: 227 checks (widgets, sounds, silence profiles, Whisper, catalogue, design tokens,
  narrow-dock layout at 298 / 320 / 400 / 460 pt).

## 3.0.0 — 2026-11-08

- Five top tabs (Library, Montage, Animer, Look, Réglages) and thirteen leaf screens.
- Two-column Library with titles, effects, transitions, generators, audio, favorites and AE scripts.
- Silence detection with waveform, threshold, ripple/marker modes, tempo detection and beat cuts.
- Whisper captions, eight caption styles, karaoke plans, SRT/VTT import, SRT and ASS export, Arabic RTL.
- Twenty synthesised sound effects and custom folder scanning.
- 37 easing curves, expression library, ten text animators and JSON presets.
- Ten animated backgrounds, sixteen expression-driven effects and Stroke plug-in integration.
- Whisper model manager, helper diagnostic and full preset-pack export/import.
- French, English and Arabic interface; automatic, dark and light themes.
- Panel-only installer for Windows, macOS and Linux; `.bak` backup of the previous panel.
- Resize-compatibility shim for hosts that do not share a column's spare height.
- 194-check smoke suite, Rust core tests and live verification on EffectCraft 0.22.0.
