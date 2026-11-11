# Prompt for Claude — build the Flow Studio Figma design

Copy everything below the line into Claude (or Figma Make) together with this folder.

---

You are a senior product designer. Build a **high-fidelity Figma file** for **Flow Studio**, a
dockable panel for the video editor EffectCraft. The file will be used to implement the real
ScriptUI panel, so it must be precise, token-driven and complete — not a moodboard.

## Inputs

Read these files from the handoff folder before you start:

- `tokens.json` — the only allowed colours, radii, spacing and type sizes.
- `components.md` — component inventory, anatomy, sizes, states.
- `screens.md` — the 14 screens and their content.
- `measurements.md` — breakpoints, heights, margins, grids.
- `flows.md` — the journeys to prototype.
- `figma-structure.md` — the page/frame/component naming to use.
- `strings.json` — French, English and Arabic copy.
- `catalogue.json` — 525 catalogue items with their real thumbnails.
- `images/` — five captures of the current panel for reference.

## Product in one paragraph

Flow Studio removes silence, generates Whisper captions with karaoke, applies transitions,
effects, text animations, gradients, titles and sound effects, and offers a 525-preset
catalogue. A small local helper powers audio analysis and Whisper; the panel works without it
for most screens. It ships in French, English and Arabic, dark and light, and is used docked at
298–600 px wide.

## Visual direction

- **Dark navy + cyan.** Background `#090d18`, header/cards `#101526`, glass cards
  `rgba(21,29,48,.78)`, accent `#5ce1ff`, secondary `#7b7dff`.
- **Typography.** Inter (and IBM Plex Sans Arabic for Arabic). Sizes 7–18 px; the shell uses
  9–13 px, screen titles 15–17 px bold, eyebrow labels 9 px uppercase with 0.08 em tracking.
- **Shape.** Radii 2–14 px, pills 20 px. Cards are 8–12 px. Buttons 8 px. Chips 10 px.
- **Glass.** Translucent fill + 1 px light top edge + 1 px bottom shade. No glow except the
  radial ambient behind the panel (Figma-only).
- **Density.** Compact, professional, editorial. Generous vertical rhythm, thin dividers, one
  accent per screen.

## What to build

1. **Header (54 px; 68 px when stacked below 400 px).** Gradient brand mark 30×30, "Flow Studio"
   13 px bold, "EFFECTCRAFT" 9 px muted; right side: Helper status pill (green dot + "Helper"),
   language pill ("FR"), theme circle (sun/moon). In the current panel these are dropdowns; the
   Figma target is the designed pill row.
2. **Tab bar.** Five tabs — Library, Montage, Animer, Look, Réglages — each with a 18–20 px icon
   and an 11 px label. Active tab: accent icon/label and a 2 px accent underline that spans the
   tab. Inactive: `text2`. Keep the strip on `bg2` with a 1 px bottom border.
3. **Library (the hero screen).** `COLLECTION` eyebrow, **Bibliothèque créative** 17 px bold,
   live count right. Search row: 16 px magnifier, rounded field "Rechercher un effet…", `⌘K`
   hint. Eight chips: Titres, Effets, Transitions (active), Dégradés, Sons, ★ Favoris, Scripts,
   Catalogue. Below: count + "Récents ›". A 3 × 2 grid of illustrated cards (image 5:3, title
   row, star top-right, selected 2 px accent border). Under the grid: the `SÉLECTION` preview
   sheet — eyebrow, name, kind/tags, thumbnail, duration/side/strength controls, and one primary
   **Ajouter à la timeline** button.
4. **The other 13 screens** exactly as listed in `screens.md`: Silence (waveform, profiles,
   ripple/markers, advanced panel), Captions (Whisper, style grid 4×2, karaoke, export SRT/ASS),
   Sounds (84-item list, waveform, playhead/layer insertion), Ease (curve preview + 37 easings),
   Expressions (search + parameter sliders + code), Text (10 animators, start state, presets),
   Background (gradient editor + motion), Effects (16 effects), Stroke, Models (Whisper manager),
   Helper & setup, Preset pack, plus the Welcome screen.
5. **States.** For every component: default, hover, pressed, focus, disabled, empty, loading,
   error. For the Library: empty search, disabled preset (missing native effect), no selection.
   For the helper: offline banner with **Réessayer**, success banner.
6. **Responsive.** Produce the Library at 600, 400 and 298 px; one dense screen (Captions or
   Silence) at 400 and 298 px. Show the header stacked and the short tab labels below 400 px.
7. **Arabic.** One Library frame and one Captions frame in Arabic, right-to-left for text and
   caption placement, left-to-right shell.

## Use the real catalogue

`catalogue.json` has 525 items across 10 kinds. Use the real thumbnails from
`assets/thumbs/<thumb>` (or the contact sheet) in the Library cards and the preview sheet.
Show 6 cards per page; the pager is `‹ Précédent · 1 / 88 · Suivant ›`.

## Deliverable

- Five pages exactly as in `figma-structure.md`.
- Components with variants, auto-layout, constraints and named properties.
- Colour and text styles bound to the tokens (no raw hex outside the styles).
- A short "Design notes" frame listing the deliberate differences from the shipping ScriptUI
  panel: real blur, rounded native inputs, Inter everywhere, hover transitions, icon tab bar.
- Do not invent new screens, colours or copy. If something is missing, use the closest entry in
  `strings.json` and list the gap in the design notes.

## Acceptance checklist

- [ ] Every colour used comes from `tokens.json` (or a documented alpha of it).
- [ ] Dark and light variants of the Library, Captions and Silence.
- [ ] 600 / 400 / 298 px Library frames, with the header and tabs reflowing correctly.
- [ ] Eight chips, 3 × 2 cards, preview sheet and one primary action.
- [ ] All 14 screens present, each with exactly one primary button.
- [ ] Empty, disabled, loading, error and helper-offline states.
- [ ] Arabic RTL frames for Library and Captions.
- [ ] Prototype links for the four flows in `flows.md`.
