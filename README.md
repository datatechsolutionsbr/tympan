# Tympan

Tympan is an Astrlabe-family component published by Datatech: design tokens,
accessible React components and a flow and provenance canvas.

| Package | Path | What it is |
|---|---|---|
| `@datatechsolutions/tympan-tokens` | `packages/tokens` | Design tokens in the W3C DTCG format (colour, space, radius, type, elevation and glass, motion, z) and an OKLCH theme generator, built to `--ty-*` CSS custom properties, JSON and a TypeScript export. Presets: `tympan` (default), `fakhir`, `neutral`, `high-contrast`. Formerly `@fakhir/tokens`. |
| `@datatechsolutions/tympan` | `packages/ui` | Accessible React components (React 18.3 or 19) on React Aria Components, styled with plain CSS in `@layer tympan`. Formerly `@fakhir/ui` (before that `@fakhir/design-system`). |
| `@datatechsolutions/tympan-flow` | `packages/flow` | The flow and provenance canvas: a W3C PROV provenance graph viewer, a DAG workflow editor, run inspection and the forms and dialogs around them, built on `@datatechsolutions/tympan`. Formerly `@fakhir/flow` (before that `@fakhir/flow-canvas`). |

Every class and custom property uses the `ty-` prefix (`--ty-*`), theming
attributes are `data-ty-theme`, `data-ty-mode` and `data-ty-density`, and
layout CSS uses logical properties so right-to-left scripts work.

Repository: `github.com/datatechsolutionsbr/tympan`; npm packages under the
`@datatechsolutions` scope.

## Build and test

Node 24 or later.

```sh
npm install
npm run build        # tokens, then ui, then flow
npm run typecheck
npm test             # vitest + Testing Library + axe-core
npm run lint         # the three guards below
npm run check        # guards, build, typecheck and tests
```

Guards (`tools/guardrails/`):

- `npm run check:no-utility-css`: no utility-CSS framework,
  class-variance-authority or shadcn dependency or file, no utility-framework
  CSS directives, and only `ty-` class names.
- `npm run check:logical-css`: no physical left/right properties in CSS.
- `npm run check:provenance`: hard-fail markers of the forked component
  library or commercial templates the packages were written to replace.

Galleries: `npm run gallery -w @datatechsolutions/tympan` and `npm run gallery -w @datatechsolutions/tympan-flow`.

## Provenance

The packages were written in a clean room from behaviour specifications
(`docs/clean-room/specs/`), without access to the code they replace. Each
package records its inputs in `CLEAN-ROOM.md` and `PROVENANCE.md`;
`tools/provenance/README.md` describes the similarity check run from outside
the clean room.

## Licence

FSL-1.1-ALv2 (Functional Source License, Version 1.1, Apache 2.0 Future
License), Copyright 2026 Natalia Mesquita. See `LICENSE`. Third-party
dependencies are listed in each package's `THIRD_PARTY_NOTICES.md`.
