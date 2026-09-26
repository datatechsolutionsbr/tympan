# Third-party notices

`@datatechsolutions/tympan-flow` is licensed under FSL-1.1-ALv2 (Copyright 2026 Natalia Mesquita).
It depends on, but does not copy, the packages below. Versions are those
resolved on 2026-09-26.

## Runtime dependencies

| Package | Version | Licence | Use |
|---|---|---|---|
| @dagrejs/dagre | 3.1.1 | MIT | ranked (Sugiyama-style) layout behind `autoLayout` |
| @dagrejs/graphlib (dependency of dagre) | 4.0.5 | MIT | graph structure used by dagre |
| react-aria-components (with react-aria, react-stately, @internationalized/*) | 1.21.1 | Apache-2.0 | accessible primitives (Button, ToggleButton, Toolbar, Tree, ListBox, GridList, Autocomplete, SearchField, ComboBox, Popover, Dialog, Tabs, Disclosure, RadioGroup, Slider, NumberField, DropZone, FileTrigger, I18nProvider/useLocale) |
| lucide-react | 1.48.0 | ISC | icons (design direction §4.4) |
| @datatechsolutions/tympan, @datatechsolutions/tympan-tokens | 0.1.0 | FSL-1.1-ALv2 | components and `--ty-*` tokens of the same project |
| react, react-dom (peer) | 19.x | MIT | rendering |

MIT licence (dagre, graphlib): Copyright (c) 2012-2014 Chris Pettitt and the
dagrejs contributors. The full text ships with each package in
`node_modules/@dagrejs/*/LICENSE`. Neither is bundled into `dist/` (both are
marked external).

Apache License 2.0 (React Aria): https://www.apache.org/licenses/LICENSE-2.0,
Copyright Adobe. This package declares it as a dependency and ships none of
its code in `dist/`.

ISC licence (lucide): Copyright (c) for portions of Lucide are held by Cole
Bemis 2013-2022 as part of Feather (MIT); all other copyright for Lucide is
held by Lucide Contributors 2022. Icons are imported as components and not
bundled into `dist/`.

## Considered and not used

- **elkjs.** Its licence is EPL-2.0 (or GPL-3.0), not MIT, and its layout runs
  asynchronously (worker); dagre is MIT, synchronous (so `autoLayout` stays a
  pure function) and deterministic.

## Build and test tools (not shipped)

| Package | Licence |
|---|---|
| tsdown, vite, @vitejs/plugin-react, vitest | MIT |
| typescript | Apache-2.0 |
| axe-core 4.13 | MPL-2.0 (used unmodified as a test dependency) |
| @testing-library/react, user-event, jest-dom, jsdom | MIT |

## Methods implemented from public descriptions

- Cubic Bézier midpoint and tangent (Bernstein polynomials) for connector
  paths and label placement.
- Ray and axis-aligned box intersection for border-attached connectors.
- Kahn topological ordering and longest-path layering for reading order.
- A subset of ICU MessageFormat (arguments, `number`, `plural` with `=n`
  and CLDR categories through `Intl.PluralRules`, `select`), written from the
  public ICU syntax description.
- WCAG 2.x relative luminance and contrast ratio (W3C), in a static test.
