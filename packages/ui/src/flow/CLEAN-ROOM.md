# Clean-room record

> **Licence note (2026-09-26).** This record was written when the packages
> were planned as MIT. They are published under FSL-1.1-ALv2 (see `LICENSE`
> at the repository root); the clean-room process below is unchanged.

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

Date: 2026-09-26. Author: Natalia Mesquita. Branch: `ds/wave-3` (from
`ds/clean-room`), worktree `~/datatech/fakhir-ds-canvas`, a sparse checkout
without the forked packages and the old platform app.

## Why

The previous workflow canvas package (part of the "fork") is partly derived
from commercial templates whose licence forbids publishing derivatives. This
package recreates its behaviour, and adds the provenance graph viewer the
research platform needs, as new MIT-licensed code without Tailwind, written
only from behaviour specifications and public documentation.

## Roles and who read what

| Role | Who | Read | Did not read |
|---|---|---|---|
| Spec writer | a separate agent session, before this work | the fork's sources, stories and tests | n/a (does not implement) |
| Implementer (coordinating) | Claude (agent session `01Ui9nSds3quCVK9RtvTPvgj`), acting for Natalia Mesquita | the allowed inputs below | the fork, its `dist` or stylesheet, any `ui-components` folder, `~/datatech/astrlabe*`, the old platform, the thesis repository's `platform/`, any commercial template material or archive |
| Implementer (sub-sessions G1–G6b) | eight forked sub-sessions of the same implementer, each writing one group of components in its own folders | the same allowed inputs, plus the code already written in this worktree | same exclusions |
| Coordinator | the session that assigned the work | both sides; runs the similarity audit from outside the clean room | n/a |

The implementer did not open, search, run or copy the fork, did not change the
sparse checkout, did not inspect other branches, other worktrees or the
excluded paths with git, and did not modify `packages/ui` or
`packages/tokens` (a separate session extends them). No spec question needed
to go back to the spec writer; ambiguities were resolved from the design
direction and recorded in `PROVENANCE.md`.

## Allowed inputs (the only sources used)

1. `docs/clean-room/specs/**`: `README.md`, `INVENTORY.md`, all
   `wave-3/*.md` (63 specs; `wave-3/data-source-node.md` only as history,
   superseded) and the canvas-related wave-4 specs: `run-view-modes.md`,
   `rule-action-catalog.md`, `data-source-node.md`, `node-state-styles.md`,
   `flow-palette-tokens.md` (and `floating-action-bar.md` for the dock item
   shape only).
2. `docs/infra/design-direction-fakhir.md` in the thesis repository (visual
   and interaction source of truth: `--fk-*` tokens, proof states and actor
   language §2.11, canvas and provenance screens §3.10 and §3.13).
3. React Aria Components documentation and its published type definitions in
   `node_modules/react-aria-components/dist/types` (Apache-2.0).
4. WAI-ARIA Authoring Practices Guide patterns (Toolbar, Tree View, Tabs,
   Listbox, Combobox, Menu, Menu Button, Disclosure, Dialog, Radio Group,
   Switch, Grid) and WCAG 2.2.
5. MDN (Pointer Events, ResizeObserver, CSS logical properties, `:dir()`,
   cascade layers, `forced-colors`, `prefers-*` media, `line-clamp`,
   `Intl.*`).
6. W3C PROV-O / PROV-DM (entity, activity, agent; `wasDerivedFrom`, `used`,
   `wasGeneratedBy`, `wasAttributedTo`) for the provenance model.
7. Public documentation and MIT source of `@xyflow/react` were allowed; the
   implementer did not need them (see `PROVENANCE.md`).
8. `@dagrejs/dagre` public API documentation (MIT) for `autoLayout`.
9. The public ICU MessageFormat syntax description, for the label templates.
10. The project's own canvas storyboards (rendered PNGs and their HTML
    sources: F2, Q2–Q6 for the flow editor; Proveniência, P2–P6 for
    provenance), authored for this project and supplied by the coordinator
    as the visual spec. Only measurements, colours and hierarchy were taken
    from them; no code was copied (they are static inline-styled mocks).

## Process

1. Foundations first, by the coordinating implementer: graph model and pure
   geometry, `autoLayout`, the node kind catalog with palette tokens and node
   state attributes, the per-editor state store and dialog stack, the canvas
   surface, `GraphNodeCard`, dock-ready canvas tools, locale-aware labels
   (en, pt-BR, es) with an ICU subset, and right-to-left support.
2. Eight sub-sessions implemented the component groups in parallel, each only
   inside its own folders, against written contracts: provenance viewer (G1),
   node kinds, ports and connectors (G2), editor and chrome (G3), run views
   and trace (G4), expressions and rule forms (G5a), node forms (G5b),
   dialogs and agent editors (G6a), assistant and report view (G6b).
3. The coordinating implementer integrated the groups, wrote the gallery,
   and ran build, typecheck, tests, guardrails and the gallery build.
4. Every acceptance test of every spec became an automated test (Testing
   Library + user-event) with an axe-core check; facts jsdom cannot compute
   (hit areas, reduced motion, forced colours) are asserted on stylesheets.
5. Guardrails `check:no-tailwind` and `check:provenance` scan this package.
   The similarity audit against the fork is run by the coordinator (see
   `tools/provenance/README.md`).

## Statement

To the best of the implementer's knowledge, no code, markup, class string,
style value, comment or documentation wording from the fork or from any
commercial template entered this package.
