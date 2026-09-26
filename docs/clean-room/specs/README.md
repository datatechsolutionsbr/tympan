# Clean-room specifications for the Fakhir component library

Date: 2026-09-26. Branch: `ds/clean-room`.

## Why these files exist

The current `@fakhir/ui` and `@fakhir/workflow` packages (the "fork") are partly
derived from commercial templates whose licence forbids publishing derivatives.
The goal is a new library, MIT-licensed and free of Tailwind, that recreates
every component the fork already offers. To keep the new code independent, the
work is split in two roles:

- **Spec writer**: has read the fork (`packages/ui/src/**`,
  `packages/workflow/src/**`, their tests and stories) and wrote the files in
  this folder. The spec writer does not write the new implementation.
- **Implementer**: builds the new library from these specs only. **The
  implementer must not open, search, copy from or run the fork's source,
  stories, tests, built `dist` files or its stylesheet.** If a spec is unclear,
  ask the spec writer a question in writing; do not look at the fork.

## Rules the specs follow

1. Behaviour only: purpose, anatomy as named parts, properties and events as
   concepts, states, keyboard and ARIA, responsive and motion requirements,
   acceptance tests.
2. No code, no markup, no style rules, no class strings, no utility names, no
   numeric visual values taken from the fork (sizes, colours, shadows, radii,
   timings), no vector paths, no copied comments or doc wording.
3. New, generic names. The inventory maps each fork export to its new name;
   the specs themselves use only the new names. API values were renamed to
   neutral concepts (`tone`, `variant`, `emphasis`, `size`, `shape`).
4. Visual values come from `design-direction-fakhir.md` (tokens `--fk-*`,
   §2.1 to §2.13), never from the fork. Specs cite that document by section.
5. Accessibility baseline for every interactive component:
   - backed by a React Aria Components (RAC) primitive where one exists, and
     following the named WAI-ARIA Authoring Practices (APG) pattern;
   - focus always visible (design direction §2.6);
   - target size of at least 44 × 44 CSS px on touch, by padding or an
     invisible hit area, even when the visible control is smaller;
   - colour never the only carrier of meaning (icon and word as well);
   - `prefers-reduced-motion`: no movement beyond opacity; animations of
     durations set to zero where the design direction says so;
   - `prefers-reduced-transparency`: glass surfaces become opaque;
   - `forced-colors: active`: boundaries and state stay visible using system
     colours; nothing relies on gradients or shadows alone.
6. Every string shown to people is a property or comes from the host's i18n
   adapter; components hold no hard-coded copy.
7. Acceptance tests are written as Given / When / Then and are meant to become
   automated tests (testing-library + axe) in the new library.

## Layout of this folder

- `INVENTORY.md`: every export of both packages, its new name, category,
  wave, whether apps use it today, and the spec file (or why it is dropped).
- `wave-1/`: the core that depends only on the tokens (36 specs).
- `wave-2/`: the rest of the general UI library.
- `wave-3/`: the workflow canvas, run inspection and assistant chat.

Items marked "drop unless needed" (marketing blocks, product demos,
developer toggles, third-party brand glyphs, per-country palette data) have no
detailed spec. If one is needed later, it gets a fresh spec written from the
design direction, not from the fork.

## Spec template

Each spec has the same headings: Purpose; Anatomy; Properties and events;
States; Keyboard and ARIA; Responsive, touch, motion, forced colours;
Acceptance tests. Optional: Composition notes; Open questions.
