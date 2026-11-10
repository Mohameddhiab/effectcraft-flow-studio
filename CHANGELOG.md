# Changelog## Unreleased

- Catalogue: 525 validated presets (60 titles, 25 UI widgets, 96 text animations, 55 transitions,
  70 effects,
  50 gradients, 30 palettes, 34 captions, 84 sounds, 21 tools) with kind/family filters, search, recents and
  favourites, one-step removal and drawn thumbnails; the kind labels and thumbnails now resolve both singular
  and plural kinds, so each card is tinted and drawn for its own type.
- Design tokens: verified 100 % mappage between `design/tokens.json` and `Flow Studio.jsx` TOKENS object (colours, rayons, espacements, typographie, recette glass). Voir `docs/design-system.md`.
- Panel captures: offscreen harness `scripts/panel_snapshot.js` capture chaque écran à 298 / 320 / 400 / 460 pt, thèmes sombre et clair, via `--control` canal JSON-lignes. Voir `scripts/panel_snapshot.js`.
- Miniatures catalogue: 59 PNGs générés en `assets/thumbs/<kind>-<id>@2x.png` (< 3 Mo total) pour transitions, effets, générateurs, sons et titres, avec chargement à la demande et cache.
- Smoke suite: 227 checks (widgets, sons, profils de silence, Whisper, catalogue, tokens de design, layout étroit à 298 / 320 / 400 / 460 pt).
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
- Catalogue verification: `scripts/catalog_coverage.jsx` applies and removes every one of the 525 presets
  through the panel API (525 PASS; the three remaining tools are listed in `docs/flow-studio.md`).
- Render verification: 55 transition comps and 70 effect comps are rendered by the CLI (236 PNGs) and
  checked by a dependency-free pixel reader; 55/55 transitions and 65/70 effects pass, the rest are
  documented as visual gaps on a still test plate.
- Removed the three tools that were not implemented (Beat Markers, Repeat on Selection, Clear Flow
  History); the catalogue is now 525 presets.
- Fixed Roll (an extra offset moved the incoming clip off screen) and Duotone/Sepia (Blend With
  Original at 100 % cancelled the effect).
- Duplicate catalogue names fixed: the two exit animations named *Fade Out* are now *Fade Up Out* and
  *Fade Down Out*; the two *Slide Out* are *Slide Up Out* and *Slide Down Out*.

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
