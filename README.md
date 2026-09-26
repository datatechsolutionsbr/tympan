# Tympan

Tympan is a design system published by Datatech: design tokens, accessible
React components and a flow and provenance canvas.

| Package | Path | What it is |
|---|---|---|
| `@datatechsolutions/tympan-tokens` | `packages/tokens` | Design tokens in the W3C DTCG format (colour, space, radius, type, elevation and glass, motion, z) and an OKLCH theme generator, built to `--ty-*` CSS custom properties, JSON and a TypeScript export. Presets: `tympan` (default), `fakhir`, `neutral`, `high-contrast`. |
| `@datatechsolutions/tympan` | `packages/ui` | Accessible React components (React 18.3 or 19) on React Aria Components, styled with plain CSS in `@layer tympan`. |
| `@datatechsolutions/tympan-flow` | `packages/flow` | The flow and provenance canvas: a W3C PROV provenance graph viewer, a DAG workflow editor, run inspection and the forms and dialogs around them, built on `@datatechsolutions/tympan`. |

Every class and custom property uses the `ty-` prefix (`--ty-*`), theming
attributes are `data-ty-theme`, `data-ty-mode` and `data-ty-density`, and
layout CSS uses logical properties so right-to-left scripts work.

Repository: `github.com/datatechsolutionsbr/tympan`; npm packages under the
`@datatechsolutions` scope.

## Install

The packages are private (restricted) packages on npmjs.com. Installing them
needs an npm access token of an account with read access to the
`@datatechsolutions` scope (a read-only granular access token is enough).
Put this `.npmrc` next to your project's `package.json` and export the token
as `NPM_TOKEN` in your shell or CI; never commit the token itself:

```ini
@datatechsolutions:registry=https://registry.npmjs.org/
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

```sh
export NPM_TOKEN=...   # from your password manager or CI secret store
npm install @datatechsolutions/tympan @datatechsolutions/tympan-tokens @datatechsolutions/tympan-flow react react-dom
```

In CI, pass the secret as an environment variable of the install step, for
example in GitHub Actions:

```yaml
- run: npm ci
  env:
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Then import the stylesheets once and the components where you need them:

```tsx
import '@datatechsolutions/tympan/styles.css'        // components + tokens
import '@datatechsolutions/tympan-flow/styles.css'   // only if you use the canvas
import { TympanProvider, Button } from '@datatechsolutions/tympan'
import { ProvenanceGraph } from '@datatechsolutions/tympan-flow'
import { presets, resolveTheme } from '@datatechsolutions/tympan-tokens'
```

The published packages contain compiled ES modules (`dist/*.js`), type
declarations (`dist/*.d.ts`), source maps and the CSS; no bundler condition or
TypeScript path mapping is needed. The `tympan-source` export condition that
points at `src/` is for development inside this repository only (`src/` is not
published).

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

## Releasing

Versions are kept in lockstep: the three packages always carry the same
version, and the internal dependencies use a caret range on it
(`"@datatechsolutions/tympan-tokens": "^0.2.0"`).

1. Bump the three versions and the internal ranges in one step, then refresh
   the lockfile and check everything:

   ```sh
   node tools/release/set-version.mjs 0.2.0
   npm install
   npm run check
   ```

2. Commit, tag and push the tag:

   ```sh
   git commit -am "Release 0.2.0"
   git tag v0.2.0
   git push origin main v0.2.0
   ```

3. The `Release` workflow (`.github/workflows/release.yml`) runs on the `v*`
   tag: it checks that the tag matches the package versions, runs the guards,
   build, typecheck and tests, and publishes tokens, then the components, then
   the canvas with `npm publish` (each package builds itself in `prepack`).

The workflow authenticates with npm **trusted publishing** (OpenID Connect):
no npm token is stored in the repository. Each package on npmjs.com must list
this repository as its trusted publisher (package page → Settings → Trusted
Publisher → GitHub Actions; organization `datatechsolutionsbr`, repository
`tympan`, workflow `release.yml`). A trusted publisher can only be added to a
package that already exists, so the **first publish of each package is
manual**, by a maintainer with publish rights on the scope:

```sh
npm login
npm run check
npm publish -w @datatechsolutions/tympan-tokens --access restricted
npm publish -w @datatechsolutions/tympan --access restricted
npm publish -w @datatechsolutions/tympan-flow --access restricted
```

Publishing with provenance attestations (`--provenance`) is not used: npm
supports it only for public packages built from public repositories. Check a
package before publishing with `npm pack --dry-run -w <package>`.

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
