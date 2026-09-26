# Clean-room specifications for the Fakhir component library

Date: 2026-09-26. Branch: `ds/clean-room` (waves 1 to 3); wave 4 on
`ds/specs-extra`.

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
  wave, whether apps use it today, and the spec file. Nothing is dropped:
  every fork export maps to a spec.
- `wave-1/`: the core that depends only on the tokens (36 specs).
- `wave-2/`: the rest of the general UI library.
- `wave-3/`: the workflow canvas, run inspection and assistant chat.
- `wave-4/`: the complete-port wave (25 specs). It covers every item earlier
  marked "drop unless needed" and resolves the four pending decisions:
  - public showcase pieces, written from the intent of the design direction
    (§2, §6) and not from the template they came from: ShowcaseHeading,
    RevealNumber, ShowcaseBackdrop and AccentBand, FeatureShowcaseCard,
    RuledGrid, HighlightStat, FeatureTile. They are for public pages (login,
    public project page); inside the app the wave-1/2 equivalents apply;
  - generalised cards: InsightCard (a proposal by an agent or rule with
    host actions) and TickerCard (named entries with value and change);
  - CascadeGrid (off by default; design direction §2.7 discourages it) and
    GlassCheckToggle (developer only);
  - token and utility APIs replacing style-string helpers: ToneTint,
    SkeletonFill, NodeStateStyles, FlowPaletteTokens;
  - LoaderPresets (generic; only the Fakhir preset ships);
  - data: RegionThemeRegistry, RegionThemeData and CountryProfileData
    (30 countries, every value regenerated from public, cited sources);
  - LegacyAliasMap (decision record: no aliases shipped, all mapped to
    tokens);
  - ThirdPartyMarkSlot and ProviderMark (marks only from an openly licensed
    set or host-licensed assets, never redrawn; the name is always text);
  - resolved decisions: RunViewModes (panel and drawer both kept),
    FloatingActionBar full feature with keyboard path, RuleActionCatalog
    (host catalog with a default generic set), DataSourceNode full feature
    (optional host logo slot, text fallback).
  Two earlier files are superseded and kept only for history:
  `wave-2/floating-action-bar.md` and `wave-3/data-source-node.md`. Build
  from their wave-4 versions.

Additional rules for wave 4:

- Showcase pieces never use the CTA gradient, never add hues beyond the
  accent and the two Ambient hues, and never animate on hover (§2.3, §2.5,
  §2.7).
- Third-party marks: the library ships no mark data. Hosts register marks
  from a CC0 or otherwise openly licensed set (for example Simple Icons) or
  from assets they hold a licence for, list them in their notices, and fall
  back to the neutral glyph when a brand is not available. Marks are shown
  only next to the product's name and are never modified.
- Data modules (regions, countries) cite a public source per field group and
  are regenerated, not transcribed from the fork.

## Spec template

Each spec has the same headings: Purpose; Anatomy; Properties and events;
States; Keyboard and ARIA; Responsive, touch, motion, forced colours;
Acceptance tests. Optional: Composition notes; Open questions.
