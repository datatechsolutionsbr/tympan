# Tympan

Tympan is an Astrlabe-family component published by Datatech: design tokens,
accessible React components with a flow and provenance canvas, and data-book
print components.

| Package | Path | What it is |
|---|---|---|
| `@datatechsolutions/tympan-tokens` | `packages/tokens` | Design tokens in the W3C DTCG format (colour, space, radius, type, elevation and glass, motion, z) and an OKLCH theme generator, built to `--ty-*` CSS custom properties, JSON and a TypeScript export. Presets: `tympan` (default), `fakhir`, `neutral`, `high-contrast`. Formerly `@fakhir/tokens`. |
| `@datatechsolutions/tympan` | `packages/ui` | Accessible React components (React 18.3 or 19) on React Aria Components, styled with plain CSS in `@layer tympan`, and, as the `@datatechsolutions/tympan/flow` subpath (`src/flow`), the flow and provenance canvas: a W3C PROV provenance graph viewer, a DAG workflow editor, run inspection and the forms and dialogs around them. Formerly `@fakhir/ui` (before that `@fakhir/design-system`). |
| `@datatechsolutions/tympan-print` | `packages/print` | Static, server-renderable React components for data books (spreads, lettered panels, method charts with eight renderers, proof-state marks, number trace, lakebrasil and Datatech marks) in the book-style presets of the tokens package, for PDF and EPUB. |

Every class and custom property uses the `ty-` prefix (`--ty-*`), theming
attributes are `data-ty-theme`, `data-ty-mode` and `data-ty-density`, and
layout CSS uses logical properties so right-to-left scripts work.

`@datatechsolutions/tympan-flow` (formerly `@fakhir/flow`) is now part of
`@datatechsolutions/tympan`: import from `@datatechsolutions/tympan/flow` and
`@datatechsolutions/tympan/flow.css`, and install the optional peer
`@dagrejs/dagre`. See the migration table in `packages/ui/README.md`.

Repository: `github.com/datatechsolutionsbr/tympan`; npm packages under the
`@datatechsolutions` scope.

## Build and test

Node 24 or later.

```sh
npm install
npm run build        # tokens, then ui (with flow), then print
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

Galleries: `npm run gallery -w @datatechsolutions/tympan` (components, theme customizer and the flow canvas at `#/flow/...`) and `npm run gallery -w @datatechsolutions/tympan-print`.

## Provenance

The packages were written in a clean room from behaviour specifications
(`docs/clean-room/specs/`), without access to the code they replace. Each
package records its inputs in `CLEAN-ROOM.md` and `PROVENANCE.md`;
`tools/provenance/README.md` describes the similarity check run from outside
the clean room.

## History

How Tympan got here, from the liquid-glass components of early 2026 to the
clean-room rewrite, the print package and the Rust side:
[História](docs/history/HISTORY.pt-BR.md) ·
[History](docs/history/HISTORY.en.md) ·
[timeline.json](docs/history/timeline.json).

## Licence

FSL-1.1-ALv2 (Functional Source License, Version 1.1, Apache 2.0 Future
License), Copyright 2026 Natalia Mesquita. See `LICENSE`. Third-party
dependencies are listed in each package's `THIRD_PARTY_NOTICES.md`.
