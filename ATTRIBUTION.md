# Attribution

Flow Studio is an independent open-source panel for EffectCraft. The code is original work by the
Flow Studio contributors and is licensed under **MIT OR Apache-2.0**. It is based on EffectCraft by
the ArtCraft team and the EffectCraft contributors; no ArtCraft logo or brand asset is included.

## Images

| Asset | Title | Author | Source | License |
|---|---|---|---|---|
| `docs/images/flow-studio-before-library.png` | Flow Studio v1 panel, Library tab | Flow Studio contributors | Original offscreen render | MIT OR Apache-2.0 |
| `docs/images/flow-studio-before-captions.png` | Flow Studio v1 panel, Captions tab | Flow Studio contributors | Original offscreen render | MIT OR Apache-2.0 |
| `docs/images/flow-studio-after-library.png` | Flow Studio v3 panel, Library tab (dark) | Flow Studio contributors | Original offscreen render | MIT OR Apache-2.0 |
| `docs/images/flow-studio-after-captions.png` | Flow Studio v3 panel, Captions tab | Flow Studio contributors | Original offscreen render | MIT OR Apache-2.0 |
| `docs/images/flow-studio-after-welcome.png` | Flow Studio v3 welcome screen | Flow Studio contributors | Original offscreen render | MIT OR Apache-2.0 |
| `docs/images/flow-studio-after-silence.png` | Flow Studio v3 panel, Silence screen | Flow Studio contributors | Original offscreen render | MIT OR Apache-2.0 |
| `docs/images/flow-studio-after-pack.png` | Flow Studio v3 panel, preset pack screen | Flow Studio contributors | Original offscreen render | MIT OR Apache-2.0 |

Each image has a sidecar (`.attribution`) with the same information. The screenshots were cropped to
the Flow Studio panel; they show only EffectCraft/Flow Studio UI, an empty generated project and no
third-party media, fonts or logos.

## Code

- `extensions/scriptui-panels/Flow Studio.jsx`: original Flow Studio panel code.
- `overlay/crates/flow`: original Flow Studio Rust core.
- `overlay/apps/flow-helper`: original Flow Studio helper.
- `flow-install/`, `scripts/` and `docs/`: original Flow Studio installers, tests and documentation.

EffectCraft itself is not vendored in this repository. The helper overlay is designed to be copied
into an EffectCraft source checkout; EffectCraft remains under its own MIT OR Apache-2.0 licence and
its NOTICE file.

## Sound effects

The 20 sound effects are synthesised at runtime by `overlay/crates/flow/src/sfx.rs`. No samples,
recordings or third-party sound libraries are bundled.
