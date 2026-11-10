# Flow Studio Original SFX Pack (84 sounds, CC0)

84 original sound effects in 12 categories, 44.1 kHz, mono, 16-bit WAV,
about 104 s in total.  Every sound is synthesised from oscillators and seeded noise by
`generate_sfx.py`: nothing is sampled, recorded or copied, so nothing here belongs to anybody else.
Released under **CC0-1.0**.

Categories: Whoosh & Transition, Impact & Hit, Riser & Build, Drop & Bass, UI & Click, Notification & Chime, Magic & Sparkle, Glitch & Digital, Camera & Foley, Ambience, Cartoon & Pop, Sci-Fi & Laser.

Files: `wav/<category>/<id>.wav`, `catalog.json` (id, name, category, tags, duration, level, SHA-256,
64 waveform peaks and the relative path), one `.attribution` sidecar per WAV, `LICENSE-CC0.txt` and
this README.

Regenerate the catalogue, the sidecars and the `ATTRIBUTION.md` block after changing a WAV:

```sh
python scripts/build_sfx_pack.py --write
python scripts/build_sfx_pack.py --check
```

The panel reads the pack through the Flow helper (`sfx.pack.list`), which validates every id, path,
duration and peak before returning it.  The installer copies the folder to
`<settings folder>/FlowStudio/assets/sfx-pack`; the helper also finds a checkout's `assets/sfx-pack`
while developing.  Copy the WAV files once into a project through the Sounds screen; the panel reuses
the imported footage item instead of importing it again.
