# Flow Studio catalogue

`catalog/*.json` is the single source of the presets embedded in the panel. Every file has the same
envelope (`schema`, `kind`, `count`, `items`), every item is validated field by field, and the panel
never evaluates a preset as code.

| File | Kind | Count |
|---|---|---:|
| `titles.json` | `title` | 60 |
| `widgets.json` | `widget` | 25 |
| `text-animations.json` | `text` | 96 |
| `transitions.json` | `transition` | 55 |
| `effects.json` | `effect` | 70 |
| `gradients.json` | `gradient` | 50 |
| `palettes.json` | `palette` | 30 |
| `captions.json` | `caption` | 34 |
| `sfx.json` | `sfx` | 84 |
| `tools.json` | `tool` | 24 |
| **Total** | | **528** |

## Editing a preset

1. Edit the JSON file (or regenerate the sound entries with `python scripts/build_sfx_pack.py`).
2. Validate: `python scripts/catalog_schema.py`.
3. Embed: `python scripts/build_catalog.py --inject`.
4. Verify the embeds are current: `python scripts/build_catalog.py --check`.

`--inject` writes three blocks into `extensions/scriptui-panels/Flow Studio.jsx`: the data
(`// <flow-catalog>`), the engine (`// <flow-engine>`, from `flow-install/src/catalog-core.jsx`) and
the catalogue screens (`// <flow-catalog-ui>`, from `flow-install/src/catalog-ui.jsx`). Never edit
those blocks in the panel: the next injection overwrites them. `--inject` also rewrites
`catalog/index.json`, the generated summary used by the docs.

## UI widgets

A widget is data, not an imported template or a third-party `.aep`: a list of shape and text parts
positioned around an anchor and drawn with native shape and text layers. Parts are named
`Flow: <widget> - <part>` and tagged `flow:cat:<id>`, so **Remove** deletes the whole widget at once
and the apply is a single `Flow: …` undo step.

```json
{
  "type": "rect",
  "name": "Pill",
  "x": 0, "y": 0,
  "w": 190, "h": 52,
  "radius": 26,
  "fill": "#E5484D",
  "opacity": 92,
  "origin": "center",
  "entrance": "slide-down",
  "delay": 0,
  "animDur": 0.45
}
```

- **Part types**: `rect` (fill), `outline` (stroke) and `text` (`text`, `size`, `weight`, `fill`,
  `tracking`, `caps`).
- **Coordinates** are in 1080p pixels relative to the widget anchor; the engine scales them with the
  composition height. `origin` `left`/`right` anchors a shape on one edge, text is centred on `x`/`y`.
- **Entrances**: `none`, `fade`, `pop`, `slide-up`, `slide-down`, `slide-left`, `slide-right`,
  `grow-x`. They are layer keyframes with soft eases, so they need no plug-in and no native effect;
  a translucent part keeps its own opacity (the fade goes 0 → its base value, not 0 → 100).
- **Anchors**: `top-left`, `top-center`, `top-right`, `middle-left`, `middle-center`,
  `middle-right`, `bottom-left`, `bottom-center`, `bottom-right`; `margin` is a fraction of the
  frame (0–0.3).

All 25 widgets are original compositions drawn from the panel's design tokens; see the
`Presets, widgets and thumbnails` section of [`../ATTRIBUTION.md`](../ATTRIBUTION.md).
