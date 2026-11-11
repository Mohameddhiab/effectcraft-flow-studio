# Prompt for Gemini — full UI/UX redesign of Flow Studio

Two versions: the short one to start fast, the long one for a complete, reviewable redesign.
Always attach the files listed in “What you receive”.

Attach to the Gemini conversation: `tokens.json`, `measurements.md`, `components.md`,
`screens.md`, `flows.md`, `strings.json`, `catalogue.json`, `catalogue-summary.md`,
`images/` (5 captures) and `thumbnails-contact-sheet.png`.

---

## Short version (paste this)

> You are a lead product designer. Completely redesign the UI/UX of **Flow Studio**, a dockable
> ScriptUI panel for the video editor EffectCraft: 525 presets, 14 screens, French/English/Arabic,
> dark and light, used docked at 298–600 px.
>
> Start from `tokens.json`, `screens.md`, `components.md`, `measurements.md`, `catalogue.json`,
> `strings.json`, the five captures and `thumbnails-contact-sheet.png`. The palette (deep navy +
> cyan) and the information architecture are your anchors; everything else — layout, hierarchy,
> density, iconography, component shapes, navigation — is yours to modernise.
>
> Deliver an image-first product: every one of the 525 presets must appear with its real
> thumbnail, and every motion preset (titles, text animations, transitions, effects, captions,
> widgets, tools) must also get a **3-frame storyboard** (start / peak / end). Sounds get a
> waveform, gradients and palettes get their actual colours.
>
> Output: a design direction, an extended token set, the 14 screens as self-contained HTML/CSS at
> 600 / 400 / 298 px, dark + light, FR/EN/AR with RTL content, a filterable gallery of all 525
> presets, component specs with 8 states, and `coverage.csv` proving 525/525 items have an image.
> For every modern effect, document the **ScriptUI fallback** (the shipping panel is a `.jsx` with
> no CSS, no real blur, no hover, no web fonts). One primary action per screen. Do not ask
> questions: choose, justify, and mark gaps.

---

## Long version (recommended)

You are a **lead product designer** with a front-end engineering background. Your job is to
redesign, from scratch, the entire interface of **Flow Studio** — a dockable ScriptUI panel that
ships with the video editor **EffectCraft** — into a modern, coherent, image-first product.

This is not a reskin. Keep the product's jobs, screens, catalogue and copy; rethink the layout,
hierarchy, navigation, density, components, iconography and visual language. The result must be
specific enough to implement, and honest enough to survive the ScriptUI constraints of the real
panel.

### 1. What you receive

| File | What it is |
| --- | --- |
| `tokens.json` | The current colours, radii, spacing, type sizes and glass recipe. Baseline, not a cage. |
| `measurements.md` | Breakpoints (298/320/360/400/460/600), header and tab heights, margins, grid, type scale. |
| `components.md` | The component inventory: anatomy, sizes, states. |
| `screens.md` | The 14 screens (Welcome + 13), section by section, with French copy. |
| `flows.md` | The four user journeys to support. |
| `strings.json` | 160 UI keys in French, English and Arabic. The only allowed copy. |
| `catalogue.json` | The 525 shipping presets: `id`, `kind`, `name`, `family`, `tags`, `thumb`. |
| `catalogue-summary.md` | Counts per kind, thumbnail composition, how the panel draws them. |
| `images/*.png` | Five real captures: welcome, library, captions, silence, preset pack. |
| `thumbnails-contact-sheet.png` | 60 representative thumbnails, 6 per kind. |

Read all of them before designing. If a file is not attached, ask for it once; do not invent its
content.

### 2. The product in one paragraph

Flow Studio removes silence, generates Whisper captions with karaoke, applies transitions,
effects, text animations, gradients, titles, sound effects and background generators. It also
offers a **525-preset catalogue** (60 titles, 25 UI widgets, 96 text animations, 55 transitions,
70 effects, 50 gradients/generators, 30 palettes, 34 caption styles, 84 sounds, 21 tools). A small
**local helper** powers audio analysis, Whisper and the sound pack; most screens work without it.
The panel is used docked, from 298 px (narrow sidebar) to 600 px (wide dock), in **dark and light**,
in **French, English and Arabic** (Arabic content is RTL, the shell stays LTR).

Navigation is five top tabs:

```
Library
Montage   → Silence · Captions · Sounds
Animer    → Ease · Expressions · Text
Look      → Background · Effects · Stroke
Réglages  → Models · Helper & setup · Preset pack
```

The 14 screens are: Welcome, Library, Silence, Captions, Sounds, Ease, Expressions, Text,
Background, Effects, Stroke, Models, Helper & setup, Preset pack.

### 3. Design brief

**Goal.** A professional tool that feels 2026: calmer, clearer, denser where it matters, and
visually driven by the presets themselves. A user should understand, in one glance, *what a preset
looks like*, *what is selected*, *what the next action is*, and *whether the helper is available*.

**Principles, in priority order.**

1. **Image-first.** The preset preview is the primary information, not a decoration next to a
   dropdown. Cards, lists and the selection sheet all lead with the real thumbnail.
2. **One decision per screen.** One primary accent action; everything else is secondary (ghost,
   icon or menu). Never two competing filled buttons.
3. **Progressive disclosure.** Common path visible; advanced settings behind a clearly labelled
   disclosure. No screen should require scrolling to find its primary action.
4. **State honesty.** Helper offline, missing plug-in, missing model, empty category, invalid
   JSON, disabled preset: each state is designed, not an afterthought.
5. **Density with rhythm.** 8 px spacing grid, 4 px half-steps for tight rows. Group by proximity
   and dividers, not by boxing everything.
6. **Modern, not trendy.** No glassmorphism everywhere, no neon glow, no floating cards on
   gradients, no oversized radii. Depth comes from layered surfaces and 1 px light edges.

**Visual direction.** Keep the brand anchor — deep navy background, cyan accent — and modernise
around it: colder surfaces, a clearer elevation ladder, a single secondary accent, restrained
semantic colours. You may propose a refined accent, but deliver both themes and a contrast table
proving body text ≥ 4.5:1 and large text ≥ 3:1. Typography: Inter for Latin, IBM Plex Sans Arabic
for Arabic; a 7-step scale (9/10/11/12/13/15/17–20) with one display size for screen titles.

**Layout.** Replace “controls stacked in a narrow column” with a responsive composition:

- **600 px**: two-zone layout where it helps (list + preview, or form + live preview), 3-column
  card grid, persistent selection sheet.
- **400 px**: one zone, 2-column grid, collapsible preview.
- **298 px**: single column, 2-column grid only if the card stays legible (≥ 128 px), icon-only
  tab bar with labels below 12 px or a scrollable tab strip, actions pinned to the bottom.

**Navigation.** Five tabs is a lot for 298 px. Propose a modern pattern (icon rail + labelled
section header, segmented control, or compact tabs with overflow) and show it at all three widths.
Sub-tabs must remain reachable in one click. Keep the information architecture: do not merge or
rename screens.

**Motion.** Define micro-interaction specs (120–180 ms, standard easing, 1 px lift, border
brightening, no scale on cards). Mark them **design target**: the real ScriptUI panel cannot
animate. Do not rely on motion to communicate state.

### 4. The image rule — one visual per preset

This is the core requirement. All **525** items already have a real 200 × 120 PNG
(`assets/thumbs/<thumb>`), and `catalogue.json` maps every item to it. Use them; never substitute
stock photography, emoji or coloured rectangles.

| Kind | Count | What the image must show | Extra proof required |
| --- | ---: | --- | --- |
| Titles | 60 | The lower-third / title layout with its real type blocks | 3-frame storyboard (in / peak / out) |
| UI widgets | 25 | The widget (badge, button, toast…) at real proportions | 3-frame storyboard for animated ones |
| Text animations | 96 | Text block mid-animation, motion direction readable | 3 frames: start state, peak, settled |
| Transitions | 55 | A/B seam, direction and style of the wipe/dissolve | 3 frames: A, mid-seam, B |
| Effects | 70 | Grade/geometry delta on the same dusk scene | Before / peak / after |
| Gradients & generators | 50 | The actual gradient colours and angle | Static + motion note (rotate/pulse/drift) |
| Palettes | 30 | The 5 real swatches, named | Static |
| Caption styles | 34 | Caption bar with the real type treatment | 3 frames for karaoke modes |
| Sounds | 84 | Waveform with peak and duration | Play state + insertion point |
| Tools | 21 | Before/after result diagram | 3 frames for multi-step tools |

Rules:

- **Card anatomy**: image 5:3 (`object-fit: cover`), name, family or kind badge, favourite star,
  selected state = 2 px accent border + check. No title over the image unless you add a scrim.
- **Gallery**: a filterable page showing **all 525** items, grouped by kind, with search, count
  and lazy loading. This is the proof that every preset is illustrated.
- **Storyboards**: for each motion family, produce 3 frames at 200 × 120 using the same dusk scene
  language, with a one-line caption per frame and the timing (e.g. 0 / 120 / 240 ms). Ship them as
  a spec (`motion-storyboards.md` + `storyboards/<id>-{1,2,3}.png` or documented HTML frames).
- **Missing asset**: if a thumbnail is absent, list it in the gaps; never draw a fake one.

### 5. ScriptUI reality — design two layers

The shipping panel is **one `.jsx` file** rendered by ScriptUI inside EffectCraft. It supports:
solid fills, 1 px borders, rounded rectangles drawn with paths, PNG drawing in `onDraw`, native
dropdowns/checkboxes/text fields, host fonts, hit areas. It does **not** support: CSS, real
background blur, box shadows, gradients on native controls, web fonts, SVG, hover transitions,
CSS animations, flex/grid.

For **every** component or visual effect you introduce, provide:

1. the **design target** (what the modern UI should look like), and
2. the **ScriptUI fallback** (the closest primitive: solid fill, 1 px border, drawn rounded rect,
   PNG asset, native control, static state only).

If a modern idea has no acceptable fallback, drop it or replace it. A beautiful design that cannot
ship is a failed deliverable. Native controls the host owns (dropdowns, tab strip, checkboxes)
must be designed as “host-native” frames, clearly separated from the custom-drawn chrome.

### 6. Redesign each screen

Follow `screens.md` for content and `strings.json` for copy. Keep every existing function; you may
reorganise, group, collapse and reorder. For each screen deliver: purpose, layout at 600/400/298,
hierarchy, components used, states, and the one primary action.

- **Welcome** — make the helper check feel like onboarding, not an error dialog. Show what works
  without the helper, what needs it, and a single clear next step.
- **Library** — the hero. Search + category filters + sort, 3/2-column illustrated grid, pager,
  and a selection sheet that reads like a product page: big preview, name, family, what it does,
  duration/strength controls, one primary “Ajouter à la timeline”. Show 14 / 14 counts, empty
  search, disabled preset.
- **Silence** — waveform as the hero (silent vs speech, threshold line, draggable playhead), a
  compact profile/action row, advanced detector panel collapsed. Primary: analyser.
- **Captions** — language/model/karaoke as a compact setup block, a large live style preview, a
  4 × 2 style grid with real caption thumbnails, advanced style panel collapsed, import/export as
  secondary. Arabic RTL frame required.
- **Sounds** — searchable 84-item list with waveform per row, preview/play state, level, and
  insertion actions. Helper offline must degrade gracefully to built-ins.
- **Ease** — curve preview as the hero (120 × 80 minimum, larger if possible), 37 curves grouped
  by family, from/delay/duration compact.
- **Expressions** — searchable list, parameter sliders, code peek; apply is the single primary.
- **Text** — animation picker with real text-animation thumbnails, start-state controls, preset
  save/export.
- **Background** — gradient editor with live preview, 4 stops, angle, motion + speed.
- **Effects** — effect picker with before/after preview, strength, window, easing.
- **Stroke** — small, focused, with a real stroke preview; disabled state when the plug-in is
  missing, with the reason visible.
- **Models** — model manager as a table/cards: name, licence, size, checksum, install state,
  progress; connection status.
- **Helper & setup** — guided setup with numbered steps, copyable command, permission reminder,
  live status, test/retry.
- **Preset pack** — export/import with a readable JSON editor state, validation feedback, result
  path.

### 7. Components and states

Reuse `components.md` as the inventory; you may add, merge or rename components, but cover at
least: app header, helper status, language switcher, theme toggle, tab bar, sub-tab bar, section
header, search field, filter chip, card, list row, waveform, pager, selection sheet, preview tile,
dropdown, checkbox, toggle, slider, number field, colour field, text area, banner, progress,
empty state, tooltip, primary/secondary/ghost/icon button.

Every interactive component needs: default, hover, pressed, focus-visible, disabled, loading,
error, and where relevant empty and selected. Specify hit area (≥ 24 px), focus ring (2 px accent
offset 2 px), and the ScriptUI fallback. Build them as reusable HTML/CSS classes with data
attributes, so the prototypes are consistent.

### 8. Languages and themes

- **FR** is the reference language; **EN** and **AR** come from `strings.json`. Use the exact keys.
  If a string is missing, propose it and mark it `TODO(new)` — never silently translate.
- **Arabic**: content RTL, numerals Latin, caption placement mirrored (right-anchored), shell LTR.
  One Library frame and one Captions frame in Arabic.
- **Dark and light**: same structure, two value sets from `tokens.json`; check contrast per theme.
  Deliver a side-by-side of Library and Captions.

### 9. Deliverables

Produce a folder `redesign/` with:

1. `00-direction.md` — one page: concept, 3 principles, what changes vs today, risks, what you
   deliberately kept.
2. `tokens.json` — extended from the provided file. Keep existing names; add only what you use;
   justify each addition in one line. Include dark + light, radii, spacing, type, elevation,
   semantic colours, motion.
3. `components.md` — final inventory with anatomy, sizes, all states, ScriptUI fallback.
4. `screens.md` — the 14 screens, updated to the new layout, section by section.
5. `prototype.html` — one self-contained file (inline CSS/JS, no build step) with a screen
   switcher, width switcher (600/400/298), theme switch and language switch. It must render
   without a server and use local `../assets/thumbs/` images.
6. `screens/*.html` — if the single file gets too large, one file per screen, same shell.
7. `gallery.html` — all 525 presets, filter by kind, search, favourites, count; real thumbnails.
8. `motion-storyboards.md` + storyboard frames — 3 frames per motion family, timing and captions.
9. `coverage.csv` — 525 rows: `id,kind,name,thumb,screen,shown` with `shown=yes` only when the
   item is visible somewhere in the deliverable.
10. `icons/` — the icon set on a 24 px grid, 1.5 px stroke, monochrome; SVG for the prototype and
    a note on the ScriptUI drawing path.
11. `README.md` — how to open the prototype, what is where, known gaps, and the list of design
    targets that ScriptUI cannot reproduce.

### 10. Output discipline

- Work in **phases** so each answer is complete and reviewable:
  1. direction + tokens + components,
  2. shell + Welcome + Library (3 widths, 2 themes),
  3. Montage screens (Silence, Captions, Sounds) + Arabic Captions,
  4. Animer + Look,
  5. Réglages + gallery + storyboards + coverage + README.
  At the start of each phase, restate the phase and the files you will produce.
- **No placeholders** (`Lorem`, `TODO`, grey boxes) except explicitly marked gaps.
- **Exactly one primary action per screen.**
- **All copy** comes from `strings.json`; report missing keys at the end.
- **All colours** come from `tokens.json`; no raw hex in components.
- **Do not invent screens, presets or features.** The catalogue is 525 items, no more.
- Do not ask clarifying questions. Choose, document the choice in `00-direction.md`, continue.

### 11. Acceptance checklist

- [ ] 14 screens delivered, each with one primary action and a 298/400/600 layout.
- [ ] Library at 600/400/298, dark and light, with 8 chips, 3 × 2 cards, pager and selection sheet.
- [ ] 525/525 items in `coverage.csv` with `shown=yes` and a real thumbnail; 0 missing.
- [ ] `gallery.html` displays and filters all 525 items.
- [ ] A 3-frame storyboard for every motion family (titles, text, transitions, effects, captions,
      widgets, tools) with timing.
- [ ] Component inventory with 8 states and a ScriptUI fallback for each.
- [ ] FR/EN/AR prototypes; Arabic content RTL, shell LTR.
- [ ] Contrast table: body ≥ 4.5:1, large ≥ 3:1, in both themes.
- [ ] No raw hex, no invented copy, no stock images, no extra presets.
- [ ] `README.md` lists every design target that the shipping ScriptUI panel cannot reproduce.

### 12. What not to do

- Do not copy the five captures; they are the *current* state, not the target.
- Do not turn the panel into a web dashboard: it is a compact, docked, mouse-driven tool.
- Do not use the 525 thumbnails as decorative backgrounds; they are per-preset previews.
- Do not hide the primary action behind an icon without a label.
- Do not add a screen, tab, setting or preset that does not exist in `screens.md` or
  `catalogue.json`.
- Do not claim a modern effect is implementable without its ScriptUI fallback.

Start now with **Phase 1**: a 10-line summary of your direction, then `00-direction.md`,
`tokens.json` and `components.md`. After that, continue with Phase 2 without waiting for approval.
