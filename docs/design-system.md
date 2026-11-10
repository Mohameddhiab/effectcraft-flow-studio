# Flow Studio design system

The panel follows the interface designed in the user's Figma Make project ("Redesign Flow Studio
Interface"). This page records what the design contains, how it lands in ScriptUI, and where the
panel honestly differs.

- Source of truth: the design export's `src/index.css` and `src/App.tsx` (reference material, kept
  outside this repository).
- Machine-readable extract: [`design/tokens.json`](../design/tokens.json).
- Panel copy: `TOKENS`, `TOKEN_RADIUS` and `TOKEN_SPACING` at the top of
  `extensions/scriptui-panels/Flow Studio.jsx`.

The panel is a single installable `.jsx`, so it cannot read the JSON at runtime. The values are
duplicated on purpose: change the design, `design/tokens.json` and the panel together. The smoke
suite pins the accent, the light background, the success colour in both themes, `pill = 20` and the
spacing count, so a silent drift fails a test.

## Colour

| Token | Dark | Light | Used for |
| --- | --- | --- | --- |
| `bg` | `#090d18` | `#e8edf6` | screen background drawn by `onDraw` |
| `bg2` | `#101526` | `#f5f7fb` | panels that sit on the background |
| `surface` | `rgba(21,29,48,.78)` | `rgba(255,255,255,.78)` | glass cards, tiles |
| `surface2` / `surface3` | white 5.5 % / 8.5 % | white 58 % / 90 % | inner rows, hover |
| `border` | white 11 % | navy 10 % | glass outline, bottom shade |
| `border2` | white 17 % | navy 17 % | the 1 px light top edge |
| `text` / `text2` / `muted` | `#f5f7fb` / `#a8b0c2` / `#6f788c` | `#111829` / `#58647a` / `#7d8799` | titles, body, captions |
| `accent` / `accent2` | `#5ce1ff` / `#7b7dff` | `#087eac` / `#6267ed` | primary action, selected tile |
| `accentSoft` | `#4ed8ff` 13 % | `#0091c3` 10 % | selected tile fill |
| `danger` / `success` / `warning` | `#ff5f6d` / `#44d7a2` / `#ffbd59` | same | status banner, validation, waveform |

The tones are semantic, not decorative: the status banner tints itself green, amber or red, and the
**Retry** button only appears on red. `success` keeps the same value in both themes, as the design
does; the light theme relies on the banner's alpha and border for contrast rather than on a second
green.

## Glass

```
fill   surface (78 % alpha, dark)  ->  translucent card
edge   1 px border2 on top         ->  the light catching the top edge
shade  1 px border on the bottom   ->  separates two stacked cards
```

`drawGlass()` in the panel is the only implementation. There is **no blur**: ScriptUI cannot sample
what is behind the panel. The design's `backdrop-filter` therefore becomes a flat translucent fill,
and the panel stays readable on any host background. Every glass surface has a solid fallback (the
same token with alpha 1) if a host ignores brush alpha.

## Geometry and type

- Radius: `2 4 5 7 8 9 10 11 12 13 14 20` (px). ScriptUI controls have square corners; radius is
  applied only to what `onDraw` paints. `pill = 20` is used for the search field in the design and
  cannot be reproduced on a native `edittext`.
- Spacing: `1 2 3 4 5 6 7 8 9 10 11 12 14 16 18 20 25` (px), used as `spacing`, `margins` and inner
  offsets.
- Type: `Inter, "IBM Plex Sans Arabic", system-ui, sans-serif` for the design; ScriptUI keeps the
  host UI font. Sizes seen in the design: `7 7.5 8 8.5 9 9.5 10 10.5 11 12 13 17 18` px. The panel
  draws at 7–9 px for tile captions because ScriptUI's default font is wider than Inter at the same
  nominal size.
- Widths: `320 / 400 / 460` px, `460` being the design's `min(100vw, 460px)`.

## Responsive layout

ScriptUI has no media queries, so `applyResponsive(width)` in the panel does the reflow and the
host's `onResize` calls it with the pane width. The smoke suite drives the same function directly.

| Width | What changes |
| --- | --- |
| `< 360 pt` | welcome actions stack in one column |
| `< 400 pt` | header stacks the language/theme row under the brand; tabs use short labels |
| `>= 400 pt` | one-row header, full tab labels |

- **298 pt works too.** That is the width EffectCraft actually gives a docked panel at its default
  split, which is below the 320 pt design minimum. At 298 pt the header is two rows, the welcome
  buttons are stacked and the tab strip (`Bib / Montage / Animer / Look / R\u00e9gl.` in French,
  `Lib / Montage / Anim / Look / Prefs` in English, short Arabic forms) must fit in `width - 16`.
- **Tab labels are data, not literals.** Short forms live in `STRINGS` as `tab.*Short` for every
  language, so switching language while narrow keeps the short labels and switching back restores
  the full ones.
- **Static text does not wrap** in EffectCraft's ScriptUI. The welcome copy and helper errors are
  broken at word boundaries by `wrapLines(text, width)`; a single long token (a path, a URL) is cut
  instead of running under the panel edge. Re-wrapping happens when the width moves by 8 pt or more.
- **The height budget moves with the header.** `CHROME_WIDE` (98) counts the 54 pt one-row header;
  `CHROME_COMPACT` (112) counts the 68 pt stacked one, so the tabbed panel keeps the rest of the
  pane in both modes.

## Layout and screens

- Five top tabs (Library, Montage, Animer, Look, Réglages) and, inside Montage, a segmented
  sub-navigation. ScriptUI's `tabbedpanel` is the native equivalent of the design's segmented
  control; it is not restyled, because the host paints tabs itself.
- Thirteen leaf screens, each with exactly one primary action; the welcome screen has one primary
  action and one secondary escape.
- The catalogue lives inside **Library ▸ Catalogue**, so the panel keeps its five tabs: kind and
  family dropdowns, search, a 2 × 3 drawn-thumbnail grid, recents and favourites.
- A preview panel under the grid (not a Figma-style drawer): the selected item's name, subtitle, tags,
  drawn miniature and, when the item is unavailable, the reason it is greyed out.

## What the panel builds from these tokens

- Glass cards for tiles, the status banner and the preview panel, painted with `drawGlass()`.
- Drawn miniatures instead of PNG thumbnails: a type sample for titles, an A/B cut for transitions,
  a widget frame with its accent colour for UI widgets, a waveform for sound, a ramp for gradients,
  strength bars for effects. No bitmap asset, no cache, no missing-file path, and nothing that can
  drift from the item it describes.
- Status tones from `success` / `warning` / `danger`, with the helper retry on failure.
- Light and dark palettes from the same table, plus **Auto**, which follows the host appearance.

## Honest gaps against the design

| Design | Panel |
| --- | --- |
| blurred backdrop behind cards | flat 78 % fill |
| rounded native inputs, 20 px pills | native host controls, square |
| Inter / IBM Plex Sans Arabic everywhere | host UI font |
| hover states, 150 ms transitions | no hover on native buttons; `onDraw` states only |
| PNG thumbnails at `@2x` | generated `onDraw` miniatures |
| 460 px fixed layout | 320 / 400 / 460 px design widths, plus the 298 pt dock, reflowing |
| radial ambient glow behind the panel | flat screen background |
| Figma Make mock application | reference only; not shipped, not executed |

Screenshots in `docs/images/` are offscreen control-channel renders generated by
`scripts/panel_snapshot.js` (UI Scale 1:1, cropped to the panel tab bar). The harnais
was added to this repository to reproduce the former development-fork kittest without needing
a GUI session. Each PNG is 1270×824 pixels and the set covers welcome, library, captions,
silence and pack.
