# Flow Studio Rust overlay

This folder contains the Rust half of Flow Studio. It is **not** a standalone Cargo workspace: it is
an overlay for an EffectCraft source tree.

## What is here

```
overlay/
  crates/flow/          effectcraft-flow: silence, captions, styles, karaoke, beats,
                        packs, models and synthesised sound effects
  apps/flow-helper/     effectcraft-flow-helper: JSON-lines helper on 127.0.0.1:9890
```

The panel (`extensions/scriptui-panels/Flow Studio.jsx`) works without the helper for Ease,
Expressions, Text, Background, Effects, Stroke and the Library. Silence, Captions, Sounds and Models
need the helper.

## Build it

These files are the overlay used by the Flow Studio development fork. Copy them into that EffectCraft
tree (or a compatible one) so the workspace contains:

```
crates/flow/Cargo.toml
apps/flow-helper/Cargo.toml
```

The fork's workspace already has the members and dependencies. On a tree that does not, add this to
the root `Cargo.toml`:

```toml
[workspace.dependencies]
effectcraft-flow = { path = "crates/flow" }
```

Then build and run:

```sh
cargo build --release -p effectcraft-flow-helper
target/release/effectcraft-flow-helper serve
```

The default port is 9890. Use `--port N` to change it, and set the same port in **Réglages ▸ Helper
& Aide**.

## Tests

```sh
cargo test -p effectcraft-flow
cargo test -p effectcraft-flow-helper
```

The helper writes only under `<EffectCraft settings>/FlowStudio` and listens on loopback only.
Models are never bundled; the Models screen downloads them only when the user asks.

## Compatibility

The overlay uses the EffectCraft crates `effectcraft-media` and `effectcraft-time` from the
development fork. It is not guaranteed to compile against a different EffectCraft version without
adjustments. The panel itself is independent and runs on EffectCraft 0.22.0.
