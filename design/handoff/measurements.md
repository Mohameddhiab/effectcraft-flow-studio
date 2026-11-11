# Measurements

All values are CSS/ScriptUI pixels (1 pt = 1 px at UI Scale 1:1).

## Breakpoints

| Width | Used for | Layout |
| ---: | --- | --- |
| 298 | EffectCraft's default dock | header stacked (68), short tab labels, 2 cards ~130 px |
| 320 | design minimum | same as 298, slightly wider cards |
| 360 | header breakpoint | below 360 the welcome actions stack in one column |
| 400 | compact breakpoint | below 400 the header stacks and tabs use short labels; at 400+ one-row header |
| 460 | design maximum | one-row header, full tab labels |
| 600 | Figma reference dock | roomy library, 2 cards ~260 px |

## Vertical budget

| Element | Height |
| --- | ---: |
| Outer margins (top + bottom) | 8 + 8 |
| Header (wide) | 54 |
| Header (compact, < 400) | 68 |
| Gap after header | 6 |
| Status row | 16 |
| Gap before status | 6 |
| **Chrome (wide)** | **98** |
| **Chrome (compact)** | **112** |
| Tab strip offset (content top margin) | 26 |
| Library preview sheet | 92 |
| Library card grid | 268 |
| Library grid gap | 6 |
| Status line | 16 |

The tabbed area is pinned to `pane height − chrome` on resize.

## Horizontal

| Element | Value |
| --- | ---: |
| Outer margin | 8 |
| Header horizontal padding | 10 |
| Content horizontal padding | 6 |
| Tab content top margin | 26 |
| Card gap | 6 |
| Chip gap | 4 |
| Chip height | 22 |
| Chip width (min) | 46–64 |
| Search height | 24 |
| Search icon | 16 |
| Preview thumb | 42×42 |
| Card image ratio | 5:3 (140×84 at 400 px) |
| Button height | 28 |
| Field height | 22 |
| Slider track | 4 |
| Slider knob | 10 |

## Radius scale

`2, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 20` px.

Usage: chips 10, cards 8–12, buttons 8, fields 5, pills 20, brand mark 8, preview sheet 12.

## Spacing scale

`1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 25` px.

Usage: 4 between chips, 6 between cards, 8 outer margin, 10 header padding, 12 sheet padding,
16/20 section spacing.

## Type

| Role | Size | Weight |
| --- | ---: | --- |
| Eyebrow / section label (uppercase) | 9 | 600 |
| Caption / tag / hint | 9 | 400 |
| Body small | 10 | 400 |
| Body | 11 | 400 |
| Button / field label | 9–10 | 500 |
| Card title | 10–11 | 500 |
| Tab label | 11 | 500 |
| Title | 13 | 600 |
| Screen title | 15–17 | 700 |
| Brand | 13 | 700 |

Line height: 1.25–1.35. Letter spacing: +0.08 em on uppercase eyebrows.

## Shadows and glass

```
Glass card:  fill rgba(21,29,48,.78)   (dark)  / rgba(255,255,255,.78) (light)
             top edge 1 px rgba(255,255,255,.17)
             bottom shade 1 px rgba(255,255,255,.11)
Elevation:   0 8 24 rgba(0,0,0,.35)  (soft, cards only)
Ambient:     radial glow #1d1740 → #07353b behind the panel (Figma-only)
```

## Focus and hit areas

- Minimum hit target: 22 × 22 px; primary buttons 28 px high.
- Focus ring: 2 px accent, 2 px offset (Figma target). The shipping panel uses native focus.
- Disabled: 40 % opacity, no accent, cursor default.
