# Third-party notices

`@fakhir/design-system` and `@fakhir/tokens` are MIT-licensed (Copyright (c)
2026 Guilherme Baufaker Rêgo). They depend on, but do not copy, the packages
below. Versions are those resolved on 2026-09-26.

## Runtime dependencies

| Package | Version | Licence | Use |
|---|---|---|---|
| react-aria-components (and its react-aria / react-stately / @internationalized dependencies) | 1.21.1 | Apache-2.0 | accessible primitives (Button, Link, Menu, Popover, Dialog, Modal, Select, ListBox, Table, Tabs, TagGroup, TextField, SearchField, Checkbox, Switch, RadioGroup, ProgressBar, Disclosure, Tooltip, Breadcrumbs, RouterProvider, I18nProvider) |
| lucide-react | 1.48.0 | ISC | icons (design direction §4.4) |
| react, react-dom (peer) | 19.x | MIT | rendering |

Apache License 2.0: https://www.apache.org/licenses/LICENSE-2.0. Copyright
Adobe for React Aria. The Apache-2.0 NOTICE obligations apply to
redistribution of React Aria itself; this package declares it as a dependency
and ships none of its code in `dist/` (it is marked external).

ISC licence (lucide): Copyright (c) for portions of Lucide are held by Cole
Bemis 2013-2022 as part of Feather (MIT); all other copyright for Lucide is
held by Lucide Contributors 2022. Icons are imported as components and not
bundled into `dist/`.

## Build and test tools (not shipped)

| Package | Licence |
|---|---|
| style-dictionary 5.5.5 | Apache-2.0 |
| tsdown, vite, @vitejs/plugin-react, vitest | MIT |
| typescript | Apache-2.0 |
| axe-core 4.13 | MPL-2.0 (used unmodified as a test dependency) |
| @testing-library/react, user-event, jest-dom, jsdom | MIT |

## Methods implemented from public descriptions

- OKLab / OKLCH conversion: formulas and matrices published by Björn Ottosson
  (public domain / MIT description), implemented in `@fakhir/tokens/src/color.ts`.
- WCAG 2.x relative luminance and contrast ratio (W3C).
- APCA lightness contrast: implemented from the public description of the
  APCA-W3 0.0.98G constants, used only for an informational report, never as a
  conformance gate. APCA is a method by Myndex Research; no APCA code is included.
