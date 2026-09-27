# Third-party notices

`@datatechsolutions/tympan` (including its flow canvas entry,
`@datatechsolutions/tympan/flow`, formerly `@datatechsolutions/tympan-flow`,
and its `/avatars` and `/flags` entries)
and `@datatechsolutions/tympan-tokens` are licensed under FSL-1.1-ALv2
(Copyright 2026 Natalia Mesquita). They depend on, but do not copy, the packages
below, except the flag artwork of flag-icons, which is bundled (see
"Bundled artwork"). Versions are those resolved on 2026-09-26.

## Runtime dependencies

| Package | Version | Licence | Use |
|---|---|---|---|
| react-aria-components (and its react-aria / react-stately / @internationalized dependencies) | 1.21.1 | Apache-2.0 | accessible primitives (Button, Link, Menu, Popover, Dialog, Modal, Select, ListBox, Table, Tabs, TagGroup, TextField, SearchField, Checkbox, Switch, RadioGroup, ProgressBar, Disclosure, Tooltip, Breadcrumbs, RouterProvider, I18nProvider; in the flow canvas also ToggleButton, Toolbar, Tree, GridList, Autocomplete, ComboBox, Slider, NumberField, DropZone, FileTrigger) |
| lucide-react | 1.48.0 | ISC | icons (design direction §4.4) |
| react-aria (hooks: useLink, useButton, useLongPress, mergeProps) | 3.52.1 | Apache-2.0 | roving-focus items of FloatingActionBar |
| @internationalized/date | 3.12 | Apache-2.0 | calendar dates in DateField (external) |
| d3-geo | 3.1.1 | ISC | projection and path generation in RegionMap (external, not bundled) |
| @dagrejs/dagre (optional peer, flow canvas only) | 3.1.1 | MIT | ranked (Sugiyama-style) layout behind `autoLayout` |
| @dagrejs/graphlib (dependency of dagre) | 4.0.5 | MIT | graph structure used by dagre |
| @dicebear/core (optional peer, `/avatars` only) | 9.4.3 | MIT | seeded avatar generation behind `avatarSvg` and `GeneratedAvatar` |
| @dicebear/* avatar styles (optional peers, `/avatars` only) | 9.4.3 | code MIT; artwork CC0 1.0 or MIT (table below) | avatar artwork |
| react, react-dom (peer) | 19.x | MIT | rendering |

Apache License 2.0: https://www.apache.org/licenses/LICENSE-2.0. Copyright
Adobe for React Aria. The Apache-2.0 NOTICE obligations apply to
redistribution of React Aria itself; this package declares it as a dependency
and ships none of its code in `dist/` (it is marked external).

ISC licence (lucide): Copyright (c) for portions of Lucide are held by Cole
Bemis 2013-2022 as part of Feather (MIT); all other copyright for Lucide is
held by Lucide Contributors 2022. Icons are imported as components and not
bundled into `dist/`.

MIT licence (dagre, graphlib): Copyright (c) 2012-2014 Chris Pettitt and the
dagrejs contributors. The full text ships with each package in
`node_modules/@dagrejs/*/LICENSE`. Neither is bundled into `dist/` (both are
marked external); hosts install dagre only when they use the flow entry.

ISC licence (d3-geo): Copyright 2010-2024 Mike Bostock. Declared as a
dependency and marked external; no d3 code is copied into `dist/`.

MIT licence (DiceBear): Copyright (c) 2024 Florian Körner. `@dicebear/core`
and the style packages are optional peers, marked external and not bundled
into `dist/`; hosts install core and the styles they use. Each generated SVG
carries DiceBear's Dublin Core metadata (title, creator, source, licence) of
its style.

### Avatar styles: artwork licences

Read from each package's `LICENSE` file and `meta` export on 2026-09-26
(version 9.4.3). The package code is MIT (Copyright (c) 2024 Florian Körner)
in every case; the artwork licence decides. Only CC0 1.0 and MIT artwork is
accepted (`src/avatars/styles.ts`, enforced at runtime, by a test against the
installed LICENSE files, and by `check:provenance` on imports).

Included:

| Package | Artwork | Designer | Artwork licence |
|---|---|---|---|
| @dicebear/glass | Glass | DiceBear | CC0 1.0 |
| @dicebear/icons | Bootstrap Icons | The Bootstrap Authors (Copyright (c) 2019-2024) | MIT |
| @dicebear/identicon | Identicon | DiceBear | CC0 1.0 |
| @dicebear/initials | Initials (text only) | DiceBear | CC0 1.0 per `meta`; package LICENSE MIT |
| @dicebear/lorelei | Lorelei | Lisa Wischofsky | CC0 1.0 |
| @dicebear/lorelei-neutral | Lorelei Neutral | Lisa Wischofsky | CC0 1.0 |
| @dicebear/notionists | Notionists | Zoish | CC0 1.0 |
| @dicebear/notionists-neutral | Notionists | Zoish | CC0 1.0 |
| @dicebear/open-peeps | Open Peeps | Pablo Stanley | CC0 1.0 |
| @dicebear/pixel-art | Pixel Art | DiceBear | CC0 1.0 |
| @dicebear/pixel-art-neutral | Pixel Art Neutral | DiceBear | CC0 1.0 |
| @dicebear/rings | Rings | DiceBear | CC0 1.0 |
| @dicebear/shapes | Shapes | DiceBear | CC0 1.0 |
| @dicebear/thumbs | Thumbs | DiceBear | CC0 1.0 |

MIT licence (Bootstrap Icons, through @dicebear/icons): Copyright (c) 2019-2024
The Bootstrap Authors; the full text ships in
`node_modules/@dicebear/icons/LICENSE`.

Excluded:

| Package | Designer | Artwork licence | Why |
|---|---|---|---|
| @dicebear/adventurer, adventurer-neutral | Lisa Wischofsky | CC BY 4.0 | attribution required wherever shown |
| @dicebear/big-ears, big-ears-neutral | The Visual Team | CC BY 4.0 | attribution required |
| @dicebear/big-smile | Ashley Seo | CC BY 4.0 | attribution required |
| @dicebear/croodles, croodles-neutral | vijay verma | CC BY 4.0 | attribution required |
| @dicebear/dylan | Natalia Spivak | CC BY 4.0 | attribution required |
| @dicebear/fun-emoji | Davis Uche | CC BY 4.0 | attribution required |
| @dicebear/micah | Micah Lanier | CC BY 4.0 | attribution required |
| @dicebear/miniavs | Webpixels | CC BY 4.0 | attribution required |
| @dicebear/personas | Draftbit | CC BY 4.0 | attribution required |
| @dicebear/toon-head | Johan Melin | CC BY 4.0 | attribution required |
| @dicebear/avataaars, avataaars-neutral | Pablo Stanley | "Free for personal and commercial use" | custom terms, not an open licence |
| @dicebear/bottts, bottts-neutral | Pablo Stanley | "Free for personal and commercial use" | custom terms, not an open licence |
| @dicebear/collection | (all) | mixed | re-exports every style, excluded ones included |

## Bundled artwork

| Package | Version | Licence | Use |
|---|---|---|---|
| flag-icons (dev dependency; artwork bundled into `dist/flags/`) | 7.5.0 | MIT | the 271 flags of `/flags`, 4:3 and 1:1 |

`scripts/build-flags.mjs` copies each flag SVG into its own module: it drops
whitespace between tags and the root id and prefixes internal ids; the
drawings are unchanged.

The MIT License (MIT)

Copyright (c) 2013 Panayiotis Lipiridis

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Considered and not used

- **country-flag-icons** (MIT, catamphetamine) for the flags. It ships per-flag
  ES modules, but in 3:2 and 1:1 rather than 4:3, without the UN, Galicia,
  Basque Country or Saint Helena subdivision flags; flag-icons covers those.
- **SVGRepo flag collections.** Licences vary per collection (several need
  attribution or forbid redistribution in packs); no SVGRepo artwork is used.
- **DiceBear 10** (`@dicebear/core` 10 with `@dicebear/styles`). Different
  packaging with no per-style packages; the 9.x core and per-style packages
  have matching majors and let hosts install only allowed styles.

- **elkjs** (for the flow canvas layout). Its licence is EPL-2.0 (or
  GPL-3.0), not MIT, and its layout runs asynchronously (worker); dagre is
  MIT, synchronous (so `autoLayout` stays a pure function) and deterministic.

## Build and test tools (not shipped)

| Package | Licence |
|---|---|
| style-dictionary 5.5.5 | Apache-2.0 |
| tsdown, vite, @vitejs/plugin-react, vitest | MIT |
| typescript | Apache-2.0 |
| axe-core 4.13 | MPL-2.0 (used unmodified as a test dependency) |
| @types/d3-geo | MIT |
| @testing-library/react, user-event, jest-dom, jsdom | MIT |

## Methods implemented from public descriptions

- OKLab / OKLCH conversion: formulas and matrices published by Björn Ottosson
  (public domain / MIT description), implemented in `@datatechsolutions/tympan-tokens/src/color.ts`.
- WCAG 2.x relative luminance and contrast ratio (W3C).
- APCA lightness contrast: implemented from the public description of the
  APCA-W3 0.0.98G constants, used only for an informational report, never as a
  conformance gate. APCA is a method by Myndex Research; no APCA code is included.
- Cubic Bézier midpoint and tangent (Bernstein polynomials) for connector
  paths and label placement (flow canvas).
- Ray and axis-aligned box intersection for border-attached connectors.
- Kahn topological ordering and longest-path layering for reading order.
- A subset of ICU MessageFormat (arguments, `number`, `plural` with `=n`
  and CLDR categories through `Intl.PluralRules`, `select`), written from the
  public ICU syntax description (flow canvas labels).
