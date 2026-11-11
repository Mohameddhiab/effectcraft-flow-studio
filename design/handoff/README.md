# Flow Studio — UI/UX handoff pack

This folder is a self-contained brief for a designer or an AI design agent (Claude, Figma Make,
v0, …) that has to rebuild the **Flow Studio** panel as a Figma file. It describes the real,
shipping panel — not an invented concept — so the design and the product stay aligned.

Everything here is MIT OR Apache-2.0, like the rest of the repository.

## Read in this order

| File | What it gives you |
| --- | --- |
| [`figma-prompt.md`](figma-prompt.md) | The ready-to-paste prompt. Start here if you just want to hand the job to Claude. |
| [`tokens.json`](tokens.json) | Colours, radii, spacing, type sizes and the glass recipe. The single source of truth. |
| [`measurements.md`](measurements.md) | Breakpoints, heights, margins, grid and type scale. |
| [`components.md`](components.md) | Every component, its anatomy, sizes and states. |
| [`screens.md`](screens.md) | The 14 screens (welcome + 13 leaf screens), section by section, with copy. |
| [`flows.md`](flows.md) | The user journeys to prototype. |
| [`figma-structure.md`](figma-structure.md) | How to organise the Figma file: pages, frames, components, variants. |
| [`strings.json`](strings.json) | Every UI string in French, English and Arabic. |
| [`catalogue.json`](catalogue.json) | The 525 real catalogue items (id, kind, name, family, tags, thumbnail file). |
| [`catalogue-summary.md`](catalogue-summary.md) | Counts, thumbnail spec and how to use the 525 images in Figma. |
| [`images/`](images) | Five reference captures of the current panel (welcome, library, captions, silence, pack). |
| [`thumbnails-contact-sheet.png`](thumbnails-contact-sheet.png) | A contact sheet of representative catalogue thumbnails. |

## What the product is

Flow Studio is a **dockable ScriptUI panel** for EffectCraft (an After Effects-like editor). It
does the tedious montage work: silence removal, Whisper captions with karaoke, transitions,
effects, text animations, gradients, titles, sound effects and a 525-item preset catalogue.
It has a small **local helper** for the features a script cannot do alone (audio analysis,
Whisper, sound pack). The panel works without the helper for most screens.

The interface ships in **French, English and Arabic**, in **dark and light** themes. Arabic is
right-to-left for caption text and placement; the shell itself stays left-to-right.

## Design rules that must survive

1. **Tokens only.** Do not invent colours. Use `tokens.json`. Dark is the default; light is the
   same structure with the light values.
2. **Glass, not blur.** The panel cannot blur what is behind it. A "glass" card is a translucent
   fill (`surface`, 78 %), a 1 px light top edge (`border2`) and a 1 px bottom shade (`border`).
   In Figma you may add a real background blur for the mock, but document it as a Figma-only
   enhancement.
3. **One primary action per screen.** Exactly one accent button; secondary actions are ghost
   buttons.
4. **Responsive widths.** The panel is used at 298, 320, 360, 400, 460 and up to 600 px. Below
   400 px the header stacks and tab labels shorten; below 360 px the welcome actions stack.
5. **Dark navy + cyan.** Background `#090d18`, panels `#101526`, accent `#5ce1ff`, secondary
   accent `#7b7dff`. Status colours are semantic: success `#44d7a2`, warning `#ffbd59`, danger
   `#ff5f6d`.
6. **Honest gaps.** The real panel uses native ScriptUI controls (square corners, host font,
   native tab strip). The Figma file should show the **intended** design: rounded pills, icon tab
   bar with an accent underline, Inter / IBM Plex Sans Arabic. Mark these as "design target".

## What to deliver in Figma

- **Page 1 — Foundations**: colour styles, text styles, spacing, radii, glass recipe, elevation.
- **Page 2 — Components**: every component from `components.md`, with variants for
  default / hover / active / focus / disabled / empty / loading / error, dark and light.
- **Page 3 — Screens**: the 14 screens at 600 px wide (desktop dock), plus 400 px and 298 px
  variants for the Library and one dense screen.
- **Page 4 — States & content**: empty library, no selection, disabled preset, helper offline,
  success/warning/danger banners, Arabic RTL caption screen.
- **Page 5 — Flows**: the four prototypes from `flows.md`.

`figma-structure.md` gives the exact page/frame/component names to use.

## What not to do

- Do not copy the Figma Make export wholesale; it is reference material kept outside this
  repository. This pack is the contract.
- Do not add screens that do not exist in `screens.md`.
- Do not use the 525 thumbnails as decorative stock photos: they are per-preset previews, shown
  in the library grid and the preview sheet. Use `catalogue.json` to place the real ones.
- Do not put the AEP / widget-pack assets in the deliverable; they are not part of Flow Studio.
