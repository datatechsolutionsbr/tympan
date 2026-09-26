# Fakhir UI

The user-interface packages of Fakhir, the research platform:

| Package | Path | What it is |
|---|---|---|
| `@fakhir/tokens` | `packages/tokens` | Design tokens in the W3C DTCG format (colour, space, radius, type, elevation and glass, motion, z) and an OKLCH theme generator, built to `--fk-*` CSS custom properties, JSON and a TypeScript export. |
| `@fakhir/ui` | `packages/ui` | Accessible React components (React 18.3 or 19) on React Aria Components, styled with plain CSS in `@layer fakhir`. Formerly `@fakhir/design-system`. |
| `@fakhir/flow` | `packages/flow` | The flow and provenance canvas: a W3C PROV provenance graph viewer, a DAG workflow editor, run inspection and the forms and dialogs around them, built on `@fakhir/ui`. Formerly `@fakhir/flow-canvas`. |

No Tailwind: every class and custom property uses the `fk-` prefix, and layout
CSS uses logical properties so right-to-left scripts work.

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

- `npm run check:no-tailwind`: no Tailwind, class-variance-authority or shadcn
  dependency or file, no Tailwind CSS directives, and only `fk-` class names.
- `npm run check:logical-css`: no physical left/right properties in CSS.
- `npm run check:provenance`: hard-fail markers of the forked component
  library or commercial templates the packages were written to replace.

Galleries: `npm run gallery -w @fakhir/ui` and `npm run gallery -w @fakhir/flow`.

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
