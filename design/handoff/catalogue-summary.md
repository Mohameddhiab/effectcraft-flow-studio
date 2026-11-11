# Catalogue and thumbnails

`catalogue.json` is the exact list the panel ships: **525 presets** across **10 kinds**.

| Kind | Count | Examples |
| --- | ---: | --- |
| Titles | 60 | Minimal Line, Glass Card, Split Reveal |
| UI widgets | 25 | Live badge, Primary button, Toast success |
| Text animations | 96 | Fade Up, Word Pop, Typewriter |
| Transitions | 55 | Cross Dissolve, Glitch, Whip Left |
| Effects | 70 | Shake Light, Teal & Orange, VHS |
| Gradients & generators | 50 | Sunset, Aurora, Color Bars |
| Palettes | 30 | Trust Blue, Neon Cyber, Pastel Mint |
| Captions | 34 | Clean, Hormozi, Karaoke |
| Sounds | 84 | Whoosh, Riser, Impact |
| Tools | 21 | Auto Nulls, Chapter Markers, 9:16 |

Each item in `catalogue.json`:

```json
{
  "id": "trans.cross-dissolve",
  "kind": "transition",
  "name": "Cross Dissolve",
  "family": "Fades",
  "tags": ["fade", "dissolve"],
  "thumb": "trans-cross-dissolve@2x.png"
}
```

## Thumbnails

- 525 PNGs in `assets/thumbs/`, named `<slug>@2x.png`, where `<slug>` is the id with every run of
  non-alphanumerics replaced by `-` and lowercased (`fx.motion.shake-light` →
  `fx-motion-shake-light@2x.png`).
- **200 × 120 px**, indexed PNG (216-colour palette), about **1.6 KB** each; ~0.84 MB total.
- Composition: dusk sky gradient, sun disc, skyline silhouette, water reflection, then a
  per-kind overlay:
  - transition: A/B seam with an accent line;
  - effect: horizontal grade bars + a soft accent disc;
  - title / text: three white type blocks;
  - caption: dark caption bar with two white lines;
  - gradient: colour bands from the preset;
  - palette: five swatches from the preset;
  - sound: centred waveform bars;
  - widget: rounded frame + title line + accent dot;
  - tool: accent ring with dots.
- Deterministic: the same id always produces the same scene, so a card is stable across
  reloads.
- The panel also draws the same scene in `onDraw` (ScriptUI cannot always resolve file paths),
  so the Figma file can use either the PNGs or a vector recreation.

## Using them in Figma

1. Place each image as a **fill** on the card's image layer, 5:3, `fit: cover`.
2. Add a bottom scrim `linear-gradient(transparent, rgba(9,13,24,.85))` if you draw the title
   over the image; the panel draws it below instead.
3. Keep the star in the top-right corner, 18×18, `#ffcc33` when favourite.
4. Show 6 cards per page (`3 × 2`); the pager is `‹ Précédent · 1 / 88 · Suivant ›`.
5. The preview sheet reuses the same image at 42×42.

## Contact sheet

`thumbnails-contact-sheet.png` shows 6 representative items per kind, with the kind name — a
quick way to pick images without opening 525 files.
