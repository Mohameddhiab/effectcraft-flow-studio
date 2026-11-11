# Figma file structure

Use these exact names so the design maps 1:1 to the panel code and to the tests.

## Page 1 — `01 · Foundations`

Frames:

- `Foundations / Colour` — dark and light swatches, each with token name and hex/alpha.
- `Foundations / Type` — Inter and IBM Plex Sans Arabic specimens at 7, 7.5, 8, 8.5, 9, 9.5,
  10, 10.5, 11, 12, 13, 17, 18 px, with weights 400/500/600/700.
- `Foundations / Spacing` — the 1–25 px scale as vertical bars.
- `Foundations / Radius` — 2–14 and 20 px chips.
- `Foundations / Glass` — the fill + top edge + bottom shade recipe, with a callout "no blur in
  the shipping panel".
- `Foundations / Icons` — 18–20 px line icons: library/grid, scissors, waveform/motion, eye,
  sliders, search, star, plus, play, sun/moon, helper dot.

Styles to create:

- Colour styles: `bg`, `bg2`, `surface`, `surface2`, `surface3`, `border`, `border2`, `text`,
  `text2`, `muted`, `accent`, `accent2`, `accentSoft`, `danger`, `success`, `warning` — each in
  `Dark/` and `Light/`.
- Text styles: `Eyebrow/9`, `Caption/9`, `Body/10`, `Body/11`, `Label/9`, `Title/13`,
  `Screen/15`, `Screen/17`, `Brand/13`.
- Effect styles: `Glass/Card`, `Glass/Sheet`, `Shadow/Soft`, `Glow/Ambient` (Figma-only).

## Page 2 — `02 · Components`

Each component is a set with variants `Theme=Dark|Light`, `State=Default|Hover|Active|Focus|
Disabled`, and where relevant `Size=Regular|Compact`.

```
Header                 (54 / 68 compact)
  BrandMark            30×30, gradient
  BrandText            "Flow Studio" + "EFFECTCRAFT"
  HelperPill           dot + label, online/offline
  LanguagePill         "FR" / "EN" / "ع"
  ThemeButton          30×30 circle, sun/moon

TabBar
  TabItem              icon + label, active underline

Chip                   64×22, radius 10
SearchField            24 high, magnifier + placeholder + ⌘K
SectionHeader          eyebrow + title + count + filter button

CatalogueCard          2 columns; image 5:3 + title row 24
  CardImage            140×84 (600 px frame), radius 8
  CardTitleRow         name + kind + star
  CardSelected         accent 2 px border
  CardDisabled         45 % black overlay + reason

PreviewSheet           92 high
  PreviewThumb         42×42
  PreviewMeta          eyebrow, name, kind, tags
  SegmentedControl     Début | Fin | Les deux
  DurationField
  StrengthSlider
  PrimaryButton        "Ajouter à la timeline"

ButtonPrimary          28 high, accent fill, radius 8
ButtonGhost            28 high, 1 px border
ButtonIcon             28×28
Field                  22 high, label 9 muted
Slider                 track 4, knob 10
Dropdown               24 high
Checkbox               14
StatusBanner           32 high, success/warning/danger
StatusLine             16 high, dot + text
Waveform               72 high (silent red, speech green, threshold)
EasingCurve            120×80
StyleTile              80×48 (grid 4×2)
Pager                  ‹ Précédent · 1 / 88 · Suivant ›
ProgressBar            4 high
```

## Page 3 — `03 · Screens`

Frames (600 × 860 as the reference dock; duplicate at 400 and 298 where listed):

```
Screens / 01 Welcome              600
Screens / 02 Library              600, 400, 298
Screens / 03 Silence              600, 400, 298
Screens / 04 Captions             600, 400, 298
Screens / 05 Sounds               600
Screens / 06 Ease                 600
Screens / 07 Expressions          600
Screens / 08 Text                 600
Screens / 09 Background           600
Screens / 10 Effects              600
Screens / 11 Stroke               600
Screens / 12 Models               600
Screens / 13 Helper & setup       600
Screens / 14 Preset pack          600
```

Each screen frame: `Header` + `TabBar` + content, 8 px outer margin, 54 px header (68 compact),
26 px tab strip offset.

## Page 4 — `04 · States & content`

```
States / Library empty
States / Library no selection
States / Library disabled preset
States / Search no result
States / Helper offline
States / Helper success
States / Loading (progress bar)
States / Error (red banner)
States / Arabic Library (RTL)
States / Arabic Captions (RTL)
```

## Page 5 — `05 · Flows`

Prototype frames, one per flow in `flows.md`:

```
Flows / First launch → Library
Flows / Apply a catalog item
Flows / Silence cleanup
Flows / Captions + karaoke + export
```

## Naming rules

- Components: `Category / Name / Variant=Value` (e.g. `CatalogueCard / CardImage /
  Theme=Dark`).
- Screens: `Screens / NN Name / Width` (e.g. `Screens / 02 Library / 600`).
- States: `States / Name`.
- No anonymous frames, no raw hex fills outside the styles, no detached instances.
