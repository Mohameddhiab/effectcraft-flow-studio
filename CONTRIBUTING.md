# Contributing

Thanks for taking a look at Flow Studio.

## Issues

Open an issue with:

- the EffectCraft version and operating system;
- what you did, what happened and what you expected;
- the panel's status line text and the EffectCraft log if the panel or helper failed.

## Pull requests

1. Keep the panel in `extensions/scriptui-panels/Flow Studio.jsx` and the Rust core in `overlay/`.
2. Follow the host's never-crash rules: no `unwrap()`, `expect()`, `panic!`, `unreachable!`,
   `todo!` or `unsafe` in non-test code; validate imported files and cap sizes.
3. Do not add Adobe artwork, fonts, LUTs or sample projects. Every new asset needs a sidecar and an
   `ATTRIBUTION.md` row.
4. Run the smoke suite (`flow-install/tests/smoke-test.jsx`) and the Rust tests for the crates you
   touched. The suite needs a running EffectCraft CLI and the helper on port 9890; see
   `docs/flow-studio.md`.
5. Keep commits focused and describe the user-visible change.

## Licence

By contributing you agree to licence your work under **MIT OR Apache-2.0**, the licence of this
repository.
