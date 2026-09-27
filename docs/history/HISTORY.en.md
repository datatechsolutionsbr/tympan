# The history of Tympan

Tympan is Datatech's design system: tokens, accessible React components with a
flow and provenance canvas, and print components for data books. The
repository has only a few hours of git history, because it was extracted on
26 September 2026. The lineage is much longer. It starts in January 2026,
inside an earlier Datatech product, and runs through several repositories,
package names and two languages. Tympan's code is new; what carried across
these eras were ideas, product decisions and a visual language.

This document tells that lineage. Dates come from the git history of the
earlier repositories (or of their backups), from this repository's records,
and from file dates where there is no git. When a date is approximate, the
text says so.

Versão em português: [HISTORY.pt-BR.md](HISTORY.pt-BR.md). Machine-readable
timeline: [timeline.json](timeline.json).

## The name

An astrolabe has four main parts. The **mater** is the body, the base that
holds everything. The **rete** is the open star map that turns on top. The
**alidade** is the sighting rule on the back. And the **tympan** is the
engraved plate that fits into the mater. Each plate is made for one latitude.
The instrument stays the same; to use it in another city, you swap the plate.

Datatech has been giving these names to the pieces of its suite. Astrlabe is
the workflow execution engine. The company's main private repository is
called mater. Alidade was the name chosen on 26 September for a language-model
library, dropped the same night. Tympan took the plate: the same components, a
theme for each product and each book. The rete has not named anything yet.
Windsock, the suite's identity service, does not come from the astrolabe and
is now kept unused.

## Era 1 · An iPhone look in an earlier product (January to February 2026)

Tympan's visual lineage starts in a Datatech app for analysing fuel prices.
That product's repository starts on 26 January 2026.

On 15 February the app got an "iOS design system" for its onboarding flows,
and its error messages became Dynamic Island-style notifications. Hundreds of
component tests arrived the same week.

On 28 February the reusable components left the app for a package,
`@datatechsolutions/ui`. The same day, the glass drawn by hand on each screen
became a single class (`liquid-surface`), the iOS hex colours hardcoded in
the screens became tokens, and the package got its own repository, at version 1.0.3.

## Era 2 · Liquid glass: `@datatechsolutions/ui` (March to July 2026)

In March the package grew fast. On 2 March version 2.6.0 shipped, with npm
publishing through OIDC from CI, a README with the component catalogue and
the first themes. The same day the platform monorepo (the mater) was created,
with the UI package as a submodule. The `@datatechsolutions` npm scope, which
publishes Tympan today, was already in use here.

On 3 and 4 March the workflow canvas arrived: first in a separate package,
then as a module of `@datatechsolutions/ui` itself. It is the most distant
ancestor of Tympan's flow canvas.

The visual language was what the team called *liquid glass*: translucent
blurred surfaces, a background of colour orbs (the `Ambient`), gradient
buttons, haptic feedback and touch-first components. The styling was Tailwind
v4 utility classes plus a `liquid-glass.css` stylesheet of its own.

On 29 March, in version 2.11.31, a `brand` module arrived with the logos and
an `APP_THEMES` map: one theme per Datatech product, kept in the package.
Tympan's idea of "one theme per product" was already there. The same day, an
earlier product that already used the name Fakhir started taking its themes
from that module.

On 10 May the monorepo stopped using submodules, and the UI package moved to
`packages/ui`. On 22 May it got Storybook, a lint gate against raw `<button>`
elements, and behaviour tests instead of tests that checked class strings
(from 74 to zero). The 3.16.0 changelog of 26 May records four consolidation
rounds: the chip family went from seven components to two, the picker family
from five to two, and raw buttons from 232 to 117. The README counted 162
components and regional themes for 30 countries.

On 11 July an accessibility gate in Storybook found and fixed 36 real
violations. The package reached version 4.0.0.

## Era 3 · Open Astrlabe and a UI in Rust (August to September 2026)

At the end of August the Astrlabe engine got a copy of its own. On 30 August
that engine's UI was split into a package, `@datatech/astrlabe-ui`, in
phases: primitives, avatars, the i18n system with 15 locales, and the canvas
hooks. This package is the direct link between liquid glass and Fakhir.

On 12 September the first public release of the Astrlabe core came out. The
TypeScript component library measured that day had 102,672 lines, 13,928 of
them the catalogues of the 15 locales. The same day the migration of the UI
to Rust began: Dioxus 0.7 compiled to WebAssembly, with the canvas geometry in
a crate that needs no browser. On 13 September the TypeScript UI was deleted.
The Rust UI kept the glass and Tailwind v4, now scanning `.rs` files.

On 20 and 21 September a reproducible visual study, with a keyboard traversal
audit, measured that UI's defects. It fed the style choices of the following
days.

## Era 4 · Fakhir inherits the glass (25 September 2026)

Fakhir is Datatech's research platform. Its monorepo was created on 25
September, under a working name replaced by Fakhir the same day. On the first
day `@datatech/astrlabe-ui` came in whole as `packages/ui`, with its history,
at version 0.1.0. The canvas was split out of it as its own package
(`packages/workflow`), and animation moved from `framer-motion` to `motion`.

In the early hours of 26 September a design direction document compared the
new platform with an earlier Next.js version that loaded the same
`liquid-glass.css`. The finding: the lack of harmony did not come from the
tokens but from composition. The screens did not use the package's
components and redrew button, field and card by hand. The document set the
direction Tympan still follows: a calm, editorial workbench with evidence
first, serif headings, a teal accent, and 40 px controls (44 px on touch).

The same audit found a name clash between a radius token of the glass
stylesheet and a Tailwind class, which made every "xl" corner render at 20 px
instead of 12 px. The decision to leave utility classes came a few hours
later.

## Era 5 · Written from scratch (26 September, 01:00 to 11:00)

The decision was to rewrite the whole library, without Tailwind, with its own
vocabulary and structure. No file from the earlier eras entered Tympan. The
process had two separate roles:

- the spec writer reads the old library and describes behaviour only:
  purpose, parts, properties, states, keyboard, ARIA and acceptance tests in
  Given/When/Then. No code, classes or visual values;
- the implementer writes the new library only from those specs, the design
  direction document, and the public documentation of React Aria, the
  WAI-ARIA Authoring Practices and WCAG 2.2.

The specs came in four waves, 222 files in all. Wave 1 (36) covers the core
that depends only on the tokens. Wave 2 (89) covers the rest of the general
library. Wave 3 (63) covers the canvas, run inspection and the assistant.
Wave 4 (34) is the complete port: everything earlier marked "drop unless
needed", plus nine new specs for the research shell, drawn from the approved
storyboards.

The order of 26 September:

- **01:11**: specs for waves 1 to 3; at 01:30, wave 4.
- **01:39**: the tokens package in the W3C DTCG format, with an OKLCH theme
  generator and a Style Dictionary build. In the same minute the
  `check:no-tailwind` and `check:provenance` guards went in.
- **01:42 to 01:54**: the 36 wave-1 components, the gallery with a theme
  customizer, and the clean-room records. At the end of wave 1: 424 tests in
  the components and 24 in the tokens.
- **02:18**: the flow canvas starts, with locale-aware labels, an ICU subset
  and a right-to-left canvas by 02:30.
- **03:22**: waves 2 and 4 land in nine groups, with the research shell
  (side rail, floating dock, editorial header, evidence panel), the
  `check:logical-css` guard (no physical left/right in CSS) and per-script
  typography with Noto fonts.
- **03:25 to 03:38**: a language pass over every group: a Spanish catalogue,
  CLDR plurals, locale digits, mirrored glyphs, grapheme-safe initials and one
  right-to-left test per component. The gallery got a language and direction
  switch for eight locales (pt-BR, en, es, ar, he, ja, hi, ru) and
  pseudo-localization.
- **03:46**: bidirectional isolation of content text (`dir="auto"`).
- **03:50 to 04:25**: rework rounds asked for by the similarity audit.
- **04:56 to 05:50**: the DAG editor, the W3C PROV provenance viewer in
  bands, runs and the assistant, aligned with the storyboards. The canvas
  reaches the main line at 05:50.
- **05:56**: canvas component tokens (`--fk-flow-*`) as DTCG aliases of the
  theme roles.
- **11:40**: with the platform running on the new packages, the old UI and
  workflow packages were deleted from Fakhir.

The similarity audit ran from outside the clean room. It compared every new
file by token fingerprints (winnowing, k = 12) and by syntax-tree shape. The
target was "no similarity": containment below 0.03 and structural Jaccard
below 0.20 per file. Where a file went over the line, it was restructured
again from its spec, without changing its API or tests. There were at least
three rounds; the record of the third is from 04:04. Every component has a
row in its package's `PROVENANCE.md`, with the spec, the sources and the
decisions taken.

At the end of waves 2 and 4 the components had 1,625 tests in 199 files, and
the canvas another 508 tests in 36 files. Every component goes through an
axe-core check. What jsdom cannot measure (hit areas, reduced motion, forced
colours) is checked on the stylesheets.

### The tokens

The generator starts from colour seeds (brand, neutral, danger, warning,
success, info) and computes in OKLCH 11-step ramps, paired roles (a
background and the text on it), proof states, actor colours (person, agent,
system) and eight chart colours. Every theme comes out in light, dark and
high contrast. The build writes a report with the WCAG ratio and APCA Lc of
every declared pair, and the tests fail if any text pair falls below 4.5:1 or
any interface pair below 3:1.

Component styling is plain CSS: custom properties, `@layer` cascade layers,
prefixed classes and logical properties only, so a right-to-left direction
mirrors the whole library. System preferences (colour scheme, contrast,
reduced transparency and motion, forced colours) are handled in the tokens and
in each component stylesheet.

## Era 6 · Tympan, by Datatech (26 September, 14:00 to 16:00)

At 14:59 the packages got their final names inside Fakhir: the design system
became `@fakhir/ui` and the canvas `@fakhir/flow`. They were then extracted
into a repository of their own, with the history of the new packages only.
That is why Tympan's git starts at the 01:11 specs.

- **15:00**: the root npm workspace.
- **15:01**: the FSL-1.1-ALv2 licence, decided that day for the whole suite:
  source-available code that becomes Apache 2.0 after two years.
- **15:02**: CI with install, guards, build, typecheck and tests on Node 24.
- **15:25**: the name Tympan, published by Datatech. The `fk-` prefix became
  `ty-`, the packages moved to the `@datatechsolutions` scope, and Fakhir's
  theme became one plate among others (the `fakhir` preset).
- **15:41**: Fakhir starts consuming Tympan as a submodule.

The same day all of the company's code was gathered in the
`datatechsolutionsbr` GitHub organization, where the `tympan` repository was
created. The library's old repositories (the `ui` of February and the
`astrlabe-ui` of August, among others) were deleted, with backups. The guard
against Tailwind was generalised into `check:no-utility-css`.

At 18:58 a branch was ready that publishes the packages as private packages
on npm, through trusted publishing with OIDC from tags. At 19:12 Fakhir, on a
branch, started installing Tympan from npm instead of the submodule. The first
publish of each package is manual and has not been confirmed yet.

## Era 7 · Print (26 September, 18:00 to 22:00)

The print package was born for the data books of a Datatech editorial
collection. The books are laid out with Tympan components in interchangeable
book styles and exported to PDF and EPUB from the same content. The starting
point was the collection's own visual studies, one spread per style.

- **18:11**: 18 book styles enter the tokens as print presets. Each one sets
  fonts (Google Fonts, OFL licence), paper, ink, data colours, proof-state
  colours, texture, stroke, chart renderer, proof-mark shape and page
  structure.
- **18:32**: data colours are kept at a CIEDE2000 distance of at least 10 from
  the colours of the marks, so a data colour never looks like a logo.
- **19:03**: the `@datatechsolutions/tympan-print` package: 170 × 240 mm
  spreads, lettered panels, the method chart with eight renderers (from clean
  to hand-drawn, watercolour, risograph and dots), proof-state marks in six
  shapes, the number trace and the source line. Everything renders on the
  server without `window`, and the output is deterministic: the same content
  gives the same PDF and EPUB bytes.
- **19:36**: 21 more styles, 39 in all, with page ornaments, columns,
  running-head bands and title treatments.
- **around 20:00**: a style-by-style audit compared each study with what the
  package produced. Only 13 were faithful. What was missing was what makes each
  style itself: its own chart shape, the notes inside the chart, the panel
  backgrounds.
- **20:09 to 20:53**: a real choropleth map with an Albers conic projection,
  correlation charts, each style's chart shape and callouts, and finally
  moldes: explicit spread templates.

At 21:12 every book style also became a screen theme. The generator got font
roles (display, body, mono) and three kinds of elevation (soft, flat,
offset), and the `print-<style>` themes became opt-in in `ThemeProvider`,
which loads the font stylesheet with them. With that the contrast report came
to cover 156 print sets (39 styles in light, dark and the high-contrast
variant of each mode) on top of the 14 interface sets: more than 12,000 pairs,
all at AA.

At 21:34 the styles were renamed to neutral, descriptive ids and labels, so
that no id or label uses the name of a person, an institution or a brand.
Eighteen ids changed. The old ones are still accepted as aliases, with a
warning in development, and go away in the next major version. At 21:37 the
aliases were published in a lightweight tokens entry and `ThemeProvider`
started translating them.

## Era 8 · Fewer packages, more product (26 September, 21:00 onwards)

- **21:29**: the component gallery became a documentation site: a sidebar by
  category, one card per component with preview and code, light and dark,
  phone and tablet widths, "on this page" and previous/next links. At 22:17
  the toolbar fit on one row, with theme, mode, language and display
  popovers.
- **21:54**: the flow canvas moved into the components package as the
  `@datatechsolutions/tympan/flow` subpath, with `@dagrejs/dagre` as an
  optional peer. Three packages remained: tokens, components and print. A
  branch from 22:08 also moves the tokens into the components package, as
  `/tokens`, which would leave two: `@datatechsolutions/tympan` and
  `@datatechsolutions/tympan-print`.
- **22:33 to 22:44**: generated avatars (`/avatars`) and country and region
  flags (`/flags`), with licence records, and `Avatar` learned to draw artwork
  instead of initials.

### The Rust side

Astrlabe's UI stays in Rust and Dioxus, but it is moving from Tailwind to
Tympan. At 21:50 Tympan got an `astrlabe` preset and, at 21:56, a documented
HTML contract for hosts that render without React (Rust, server templates,
web components). In Astrlabe, a branch from 21:57 brings Tympan's CSS into
the web UI, and another from 22:05 stores each organization's default theme
in the database, like all of Astrlabe's configuration.

The next step is two crates in the Tympan repository: `tympan-tokens`, with
every theme as a typed enum, mode, density and the stylesheets compiled in,
and `tympan-dioxus`, with a `ThemeProvider` and Dioxus components that produce
exactly the same classes and ARIA attributes as the React components, so one
stylesheet serves both. The branch exists; the crates do not yet.

### The site

At 22:15 the Tympan site started. The home page draws an astrolabe tympan
computed for 23°32′ S, with horizon, almucantars and azimuth lines; the same
geometry draws the Tympan mark and the favicon. The site has sections for
components, themes on a real screen, book styles with the whole sample book,
an animated SVG data scene, and installation. The theme picker is a command
palette with live preview. On the site branch, the galleries and tests
replaced their sample data with a fictional air-quality study.

## Numbers (26 September 2026, evening)

| What | How many |
|---|---|
| Behaviour specs (waves 1 to 4) | 222 |
| Component folders in `packages/ui` | 142 |
| Interface themes | 4 (`tympan`, `fakhir`, `neutral`, `high-contrast`), plus `astrlabe` on a branch |
| Book styles, also screen themes | 39 |
| Sets in the contrast report | 170 (14 interface, 156 print), all at AA |
| Languages with their own copy | 3 (English, Brazilian Portuguese, Spanish); any other locale gets correct numbers, dates and plurals |
| Locales in the gallery | 8, including right-to-left Arabic and Hebrew |
| Passing tests | 483 in the tokens, 2,193 in the components (with the canvas), 343 in print |
| Interface messages exported to Fakhir's catalogue | 2,551 |

## What comes next

- merge the open branches: tokens inside the components package, the
  `astrlabe` preset, npm publishing, the site;
- publish the private packages on npm under `@datatechsolutions`;
- the `tympan-tokens` and `tympan-dioxus` crates, and all of Astrlabe on
  Tympan;
- the site as a showcase, with the command-palette theme picker, avatars,
  flags and the Datatech family marks;
- the fifth wave of specs, already written: more general components,
  including chat, and a commerce family.

## Timeline

| Date | Era | What happened |
|---|---|---|
| 2026-01-26 | 1 | The repository of the fuel-price app where the UI is born starts |
| 2026-02-15 | 1 | "iOS design system" and Dynamic Island-style notifications |
| 2026-02-28 | 1 | Components extracted into `@datatechsolutions/ui`; glass becomes the `liquid-surface` class; own repository (1.0.3) |
| 2026-03-02 | 2 | Version 2.6.0, npm publishing through OIDC; the mater monorepo starts with the UI as a submodule |
| 2026-03-03 | 2 | Workflow canvas, first in its own package and the next day inside the UI |
| 2026-03-29 | 2 | `brand` module with `APP_THEMES`: one theme per product (2.11.31) |
| 2026-05-10 | 2 | The UI moves to `packages/ui` in the monorepo |
| 2026-05-22 | 2 | Storybook, raw-button gate, behaviour tests |
| 2026-05-26 | 2 | 3.16.0: four consolidation rounds, 162 components, themes for 30 countries |
| 2026-07-11 | 2 | Accessibility gate fixes 36 violations |
| 2026-08-30 | 3 | `@datatech/astrlabe-ui` split from Astrlabe's UI, with 15 locales |
| 2026-09-12 | 3 | Public Astrlabe core; 102,672-line TS library; the Rust UI starts |
| 2026-09-13 | 3 | TypeScript UI deleted; Dioxus with glass and Tailwind v4 |
| 2026-09-21 | 3 | Reproducible visual study and keyboard audit of the Rust UI |
| 2026-09-25 | 4 | Fakhir is born and inherits `astrlabe-ui` with its history |
| 2026-09-26 00:40 | 4 | Design direction: editorial workbench, evidence first |
| 2026-09-26 01:11 | 5 | Clean-room specs, waves 1 to 4 (222) |
| 2026-09-26 01:39 | 5 | DTCG tokens with the OKLCH generator; Tailwind and provenance guards |
| 2026-09-26 01:42 | 5 | Wave 1: 36 components, gallery with customizer |
| 2026-09-26 03:22 | 5 | Waves 2 and 4, research shell, logical-only CSS |
| 2026-09-26 03:25 | 5 | Languages and right-to-left in every group; eight locales in the gallery |
| 2026-09-26 04:04 | 5 | Third round of the similarity audit |
| 2026-09-26 05:50 | 5 | Flow canvas: DAG, provenance, runs, assistant |
| 2026-09-26 11:40 | 5 | Old UI packages deleted from Fakhir |
| 2026-09-26 15:01 | 6 | FSL-1.1-ALv2 licence |
| 2026-09-26 15:25 | 6 | The name Tympan, published by Datatech, `ty-` prefix |
| 2026-09-26 18:11 | 7 | 18 book styles in the tokens |
| 2026-09-26 19:03 | 7 | The `tympan-print` package |
| 2026-09-26 19:36 | 7 | 39 book styles |
| 2026-09-26 20:53 | 7 | Spread templates (moldes) |
| 2026-09-26 21:12 | 7 | Book styles become screen themes; 156 sets at AA |
| 2026-09-26 21:29 | 8 | Gallery as a documentation site |
| 2026-09-26 21:34 | 7 | Styles renamed to neutral ids, with aliases |
| 2026-09-26 21:54 | 8 | The canvas becomes the `/flow` subpath of the components package |
| 2026-09-26 21:57 | 8 | Astrlabe starts using Tympan's CSS; `astrlabe` preset |
| 2026-09-26 22:15 | 8 | The Tympan site starts |
| 2026-09-26 22:41 | 8 | Avatars and flags |
