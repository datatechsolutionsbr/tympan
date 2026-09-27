# Clean-room record

> **Licence note (2026-09-26).** This record was written when the packages
> were planned as MIT. They are published under FSL-1.1-ALv2 (see `LICENSE`
> at the repository root); the clean-room process below is unchanged.

> **Naming note.** In this record `packages/ui` / `@fakhir/ui` is the
> clean-room library (formerly `packages/design-system` /
> `@fakhir/design-system`) and `packages/flow` / `@fakhir/flow` is the canvas
> (formerly `packages/flow-canvas` / `@fakhir/flow-canvas`). Where this record
> names `packages/ui`, `@fakhir/ui`, `packages/workflow` or `@fakhir/workflow`
> as the fork, it means the deleted fork of the Fakhir monorepo, whose code is
> not in this repository or its history.

> **Rename note (2026-09-26).** The repository is now Tympan, an
> Astrlabe-family component published by Datatech. `packages/ui` is
> `@datatechsolutions/tympan` (called `@fakhir/ui` in this record, before
> that `@fakhir/design-system`), `packages/flow` is
> `@datatechsolutions/tympan-flow` (here `@fakhir/flow`, before that
> `@fakhir/flow-canvas`) and `packages/tokens` is
> `@datatechsolutions/tympan-tokens` (here `@fakhir/tokens`). The `fk-` class
> and `--fk-` custom-property prefix and the `data-fk-*` attributes named here
> are now `ty-`, `--ty-` and `data-ty-*`; `FakhirProvider` is `TympanProvider`;
> the Fakhir look is the `fakhir` theme preset. This record is otherwise kept
> as written.

> **Merge note (2026-09-26).** `packages/flow`
> (`@datatechsolutions/tympan-flow`) was later folded into `packages/ui`: its
> sources are in `packages/ui/src/flow` and it ships as the
> `@datatechsolutions/tympan/flow` subpath with the
> `@datatechsolutions/tympan/flow.css` stylesheet. Paths under
> `packages/flow` named here are now under `packages/ui/src/flow`.

Date: 2026-09-26. Branch: `ds/clean-room` (worktree `~/datatech/fakhir-ds`,
sparse checkout without `packages/ui`, `packages/workflow`, `apps/platform`).

## Why

The previous component packages (the "fork") are partly derived from
commercial templates whose licence forbids publishing derivatives. This
package and `@fakhir/tokens` recreate their behaviour as new, MIT-licensed,
Tailwind-free code, written only from behaviour specifications.

## Roles and who read what

| Role | Who | Read | Did not read |
|---|---|---|---|
| Spec writer | a separate agent session, before this work | the fork's sources, stories and tests | n/a (does not implement) |
| Implementer (coordinating) | Claude (agent session `01Ui9nSds3quCVK9RtvTPvgj`), acting for Natalia Mesquita (author of the Fakhir UI) | the allowed inputs below | the fork, its `dist` or stylesheet, any `ui-components` folder, `~/datatech/astrlabe*`, the old platform, any commercial template material or archive |
| Implementer (sub-sessions A–D) | four forked sub-sessions of the same implementer, each writing one group of components | the same allowed inputs, plus the code the implementer had already written in this worktree | same exclusions |
| Coordinator | the session that assigned the work | both sides; runs the similarity check from outside the clean room | n/a |

The implementer did not open, search, run or copy the fork, did not change the
sparse checkout, and did not inspect other branches or the excluded paths with
git. No spec question needed to go back to the spec writer; ambiguities were
resolved from the design direction and recorded in `PROVENANCE.md`.

## Allowed inputs (the only sources used)

1. `docs/clean-room/specs/**`: `README.md`, `INVENTORY.md`, `wave-1/*.md`
   (36 specs). Waves 2 and 3 were read only for names referenced by wave 1.
2. `docs/infra/design-direction-fakhir.md` in the thesis repository (visual
   source of truth: `--fk-*` tokens, 4 px scale, radii 10/16/24, glass levels,
   40 px controls / 44 px touch, proof-state and actor language, §2.1–§2.13).
3. React Aria Components documentation and its published type definitions in
   `node_modules/react-aria-components` (Apache-2.0).
4. WAI-ARIA Authoring Practices Guide patterns; WCAG 2.2.
5. W3C Design Tokens Community Group format (2025.10).
6. MDN (CSS nesting, cascade layers, `forced-colors`, `prefers-*` media, `:has()`, `line-clamp`).
7. Scope addition by the user, via the coordinator: the public theming
   documentation of shadcn/ui and the colour and theme documentation of
   Tailwind CSS (the open-source framework), for concepts only. URLs and the
   exact concepts taken are listed in `packages/tokens/PROVENANCE.md` (moved
   there from `packages/tokens/README.md`). No source
   file, class string, CSS file or palette value of either project was read or
   copied, and neither is a dependency.

## Process

1. Tokens first (`@fakhir/tokens`): DTCG sources and an OKLCH theme generator,
   built with Style Dictionary v5; presets pin the design-direction colours.
2. Shared infrastructure (messages, router adapter, theme provider, variant
   helper, test harness) and one reference component (Button).
3. Four sub-sessions implemented the remaining wave-1 components in parallel,
   each only inside its own component folders, following the reference
   component; the coordinating implementer wrote PageHeader and AppFrame and
   integrated everything.
4. Every acceptance test of every spec became an automated test
   (Testing Library + user-event) with an axe-core check; layout facts jsdom
   cannot compute (hit areas, reduced motion, forced colours) are asserted on
   the component stylesheets.
5. Guardrails `check:no-tailwind` and `check:provenance` run in `npm run check`.
   The similarity comparison against the fork is described in
   `tools/provenance/README.md` and is run by the coordinator.

## Waves 2 and 4 (branch `ds/wave-2`)

Same roles and exclusions. Allowed inputs added: `docs/clean-room/specs/wave-2/*.md`
and `wave-4/*.md`, public ISO 3166-2 / IBGE / ISO 4217 / CLDR facts for the
Brazil data module (cited in the module), MDN `Intl.*` documentation, and the
Fakhir OpenAPI contract of this repository (run event vocabulary). Nine
sub-sessions implemented one group each in their own folders; the coordinating
implementer wrote the research-shell group and its nine specs (from the
approved storyboards described in writing and the design direction; no fork
counterpart exists), and integrated. Eight wave-1 files were restructured after
the coordinator's outside similarity audit (target: winnowed containment
< 0.03 and structural 6-gram Jaccard < 0.20 per file), again without reading
the fork. `check:logical-css` joined the guardrails.

## Statement

To the best of the implementer's knowledge, no code, markup, class string,
style value, comment or documentation wording from the fork or from any
commercial template entered these packages.
