# Third-party notices

`@datatechsolutions/tympan-print` is licensed under FSL-1.1-ALv2 (Copyright 2026 Natalia Mesquita).
It depends on, but does not copy, the packages below. Versions are those
resolved on 2026-09-26.

## Runtime dependencies

| Package | Version | Licence | Use |
|---|---|---|---|
| roughjs | 4.6.6 | MIT | hand-drawn contours (`mao`, `gravura`, `aquarela`, `pontos` renderers, hand-drawn panel frames and proof marks), through its path generator only (no DOM), always with a fixed seed |
| @datatechsolutions/tympan-tokens | 0.1.0 | FSL-1.1-ALv2 | book-style presets and `--ty-print-*` tokens of the same project |
| react, react-dom (peer) | 18.3 or 19 | MIT | rendering |

MIT licence (rough.js): Copyright (c) 2019 Preet Shihn. The full text ships
with the package in `node_modules/roughjs/LICENSE`. It is not bundled into
`dist/` (marked external).

## Fonts

The presets name Google Fonts families (SIL Open Font License 1.1), loaded
from fonts.googleapis.com by `LivroPrint`; no font file ships with this
package.

## Brand marks

`src/marca/logo-dados.ts` (lakebrasil) and `src/marca/datatech-dados.ts`
(Datatech Solutions) hold the outlined production artwork of the two marks,
owned by their holders and used here as they are; the wordmarks were outlined
from Newsreader and Inter (both OFL). They are not covered by this package's
licence.

## Build and test tools (not shipped)

| Package | Licence |
|---|---|
| tsdown, vite, @vitejs/plugin-react, vitest | MIT |
| typescript | Apache-2.0 |
| puppeteer-core 25.12 (gallery screenshots with the system Chrome) | Apache-2.0 |
| axe-core 4.13 | MPL-2.0 (used unmodified as a test dependency) |
| @testing-library/react, jest-dom, jsdom | MIT |

## Methods implemented from public descriptions

- Linear scales and "nice" tick steps (1, 2, 2.5, 5 × 10ⁿ).
- CIEDE2000 colour difference (Sharma, Wu and Dalal, 2005), in the tokens package.
- SVG `feTurbulence`, `feDisplacementMap` and `feMorphology` filters for paper
  grain, woodcut, risograph grain and watercolour washes (SVG 1.1 filter
  effects specification).
