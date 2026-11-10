# Smoke suite

`smoke-test.jsx` drives the real panel through EffectCraft's script engine. It needs:

- an EffectCraft CLI (`effectcraft-cli`, or set `EFFECTCRAFT_CLI`);
- the Flow Studio helper running on port 9890 (`effectcraft-flow-helper serve`, or set
  `EFFECTCRAFT_FLOW_HELPER`);
- a speech clip at `target/speech.wav` (or `/tmp/speech.wav`); any short WAV with speech works.

From the repository root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\run_smoke_test.ps1
```

The script builds `target/steps.json`, runs it with `effectcraft-cli run --empty --json`, and
prints `PASS=n FAIL=n`. The suite has 217 checks and passed 217/0 in the development fork.

The visual snapshot test (`flow_studio_panel_snapshot`) lives in the development fork, not in this
repository, because it needs the app's UI crate.
