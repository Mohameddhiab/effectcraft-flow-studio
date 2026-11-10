# Design extract

`tokens.json` is the machine-readable extract of the Flow Studio panel design: colours (dark and
light), radii, spacing, type sizes, the glass recipe and the layout steps. It records only values that
actually appear in the design; there is no invented scale.

The Figma Make export ("Redesign Flow Studio Interface") is the user's own work, licensed to this
project under MIT OR Apache-2.0. The export itself stays outside this repository: it is a mock
application with sample copy, reference material rather than shipped code. Only this extract is
published, so the panel's tokens can be documented and checked.

- Source design: Figma Make export by Mohamed Dhiab, `src/index.css` and `src/App.tsx`.
- Panel copy: `TOKENS`, `TOKEN_RADIUS` and `TOKEN_SPACING` in
  `extensions/scriptui-panels/Flow Studio.jsx`.
- Mapping, glass recipe and honest gaps: [`../docs/design-system.md`](../docs/design-system.md).

The panel must stay a single installable `.jsx`, so it cannot read this JSON at runtime: the values
are duplicated on purpose, and the smoke suite pins the accent, the light background, the success
parity, `pill = 20` and the spacing count, so a silent drift fails a test.
