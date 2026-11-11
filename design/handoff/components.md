# Components

Every component below exists in the panel. Sizes are for the 600 px reference dock; the compact
column gives the 298–400 px behaviour.

## AppHeader

- **Size** 600 × 54 (68 stacked below 400).
- **Anatomy** gradient brand mark 30×30 (accent square + accent2 corner + "F"); "Flow Studio"
  13/700 `text`; "EFFECTCRAFT" 9/400 `muted`; spacer; Helper pill (6 px dot + 9 px label,
  success when online, muted when offline); language pill "FR" (9 px, 1 px border); theme circle
  30×30 with sun/moon.
- **Background** `bg2`, 1 px bottom border.
- **States** helper online/offline/checking; language FR/EN/ع; theme auto/dark/light.
- **Compact** brand row on top, pills row underneath; same heights.

## TabBar

- **Size** 5 equal tabs × 34, 18–20 px icon above an 11 px label.
- **Active** accent icon + accent label + 2 px accent underline across the tab width.
- **Inactive** `text2` icon/label.
- **Hover** (Figma target) `surface2` fill, 150 ms.
- **Compact** short labels: Bib / Montage / Animer / Look / Régl. (FR), Lib / Montage / Anim /
  Look / Prefs (EN), Arabic short forms.

## SectionHeader

- Eyebrow 9/600 accent, uppercase, +0.08 em.
- Title 17/700 `text`.
- Count `14 / 14` 9/400 `muted` right-aligned.
- Optional 26×26 filter button (sliders icon) on the right.

## Chip

- 22 high, 10 radius, 8 px horizontal padding, 9/500 label.
- **Inactive** `surface2` fill, `text` label, 1 px `border`.
- **Active** `accentSoft` fill, `accent` label, 2 px accent bottom bar.
- **Hover** `surface3`.
- **Disabled** 40 % opacity.
- **Labels** Titres, Effets, Transitions, Dégradés, Sons, ★ Favoris, Scripts, Catalogue.

## SearchField

- 24 high, 8 radius, `surface2` fill, 1 px `border`.
- 16 px magnifier left, placeholder "Rechercher un effet…" 10/400 `muted`, `⌘K` 9/400 muted
  right.
- **Focus** 2 px accent ring (Figma target).
- **States** empty, filled (clear ×), no result.

## CatalogueCard

- 2 columns, gap 6. At 600 px each card ≈ 260 × 118; at 400 ≈ 175 × 110; at 298 ≈ 130 × 100.
- **Image** 5:3, radius 8, generated dusk scene (sky gradient, sun, skyline, water) with a
  per-kind overlay. In Figma use `assets/thumbs/<thumb>` from `catalogue.json` (200×120).
- **Title row** 24 high: name 10/500 `text`, kind 9/400 `muted`, star 11 px top-right (gold
  `#ffcc33` when favourite).
- **Selected** 2 px `accent` border, `cellHi` title row.
- **Disabled** 45 % black overlay on the image, `muted` text, reason on the preview sheet.
- **States** default, hover (lift 1 px, border2), pressed, selected, disabled, empty slot.

## PreviewSheet

- 92 high, 12 radius glass, 12 px padding.
- Eyebrow `SÉLECTION` 9/600 accent; name 13/600 `text`; kind 10/400 `text2`; tags 9/400 muted.
- 42×42 thumbnail right.
- Below: segmented **Début | Fin | Les deux** (active = `surface3` + accent text), Duration
  field 0.5 s, Strength slider 60, and the primary **Ajouter à la timeline** button.
- **Empty** "Sélectionnez un élément pour voir l'aperçu" 10/400 muted.

## PrimaryButton

- 28 high, 8 radius, `accent` → `accent2` gradient (Figma target) or solid accent, label 10/600
  in `bg`; optional 11 px icon.
- **States** default, hover (brightness +8 %), pressed (−4 %), focus ring, disabled 40 %.

## GhostButton

- 28 high, 8 radius, transparent, 1 px `border`, label 10/500 `text2`.
- **States** default, hover `surface2`, pressed `surface3`, disabled 40 %.

## Field

- Label 9/400 `muted` above; input 22 high, 5 radius, `surface2` fill, 1 px border, 10/400 text.
- **States** default, focus (accent ring), filled, error (danger border + 9 px message), disabled.

## Slider

- Label 9 `muted` + value 9 `text2`; track 4 high `surface3` with accent fill; knob 10 accent
  with 2 px `bg` ring.
- **States** default, hover (knob 12), dragging, disabled.

## Dropdown

- 24 high, 5 radius, `surface2`, 1 px border, 10/400 text, 10 px chevron.
- Native in the shipping panel; the Figma target is the rounded version.

## Checkbox

- 14×14, 4 radius, 1 px `border`; checked = accent fill + white check.
- Label 10/400 `text`.

## StatusLine

- 16 high, 6 px dot + 10/400 label. `success` for ready, `warning` for warnings, `danger` for
  failures. Progress bar 4 high right when a helper job runs.

## StatusBanner

- 32 high, 8 radius, tinted fill (danger/warning/success at 12 %) + 1 px border + 10/500 label.
- **Retry** ghost button only on danger.

## Waveform

- 72 high, `surface2` background, `muted` midline.
- Speech `success` 90 %, silence `danger` 40 %, threshold `warning` 1 px dashed.
- Playhead `text` 1 px.

## EasingCurve

- 120×80, `surface2`, 4 × 4 grid at `border`, curve 2 px accent, 3 px dots at 0/0.5/1.

## StyleTile

- Grid 4 × 2, 80×48, 6 radius; sample caption "Aa" in the style's own font/fill; name 8 px.
- **Selected** 2 px accent border.

## Pager

- 24 high: `‹ Précédent` ghost, `1 / 88` 9 `muted`, `Suivant ›` ghost.

## Toast

- 32 high, 8 radius glass, icon + message 9/500, auto-dismiss 3 s; success/warning/danger.
