# Third-party notices

`@datatechsolutions/tympan-print` is licensed under FSL-1.1-ALv2 (Copyright 2026 Natalia Mesquita).
It depends on, but does not copy, the packages below. Versions are those
resolved on 2026-09-26.

## Runtime dependencies

| Package | Version | Licence | Use |
|---|---|---|---|
| roughjs | 4.6.6 | MIT | hand-drawn contours (`mao`, `gravura`, `aquarela`, `pontos` renderers, hand-drawn panel frames and proof marks), through its path generator only (no DOM), always with a fixed seed |
| d3-geo | 3.1.1 | ISC | `Mapa`: the Albers equal-area conic projection and the path writer, used as pure functions (no DOM) |
| topojson-client | 3.1.0 | ISC | `Mapa`: decodes the bundled TopoJSON meshes and draws shared borders once (`mesh`) |
| @datatechsolutions/tympan-tokens | 0.1.0 | FSL-1.1-ALv2 | book-style presets and `--ty-print-*` tokens of the same project |
| react, react-dom (peer) | 18.3 or 19 | MIT | rendering |

MIT licence (rough.js): Copyright (c) 2019 Preet Shihn. The full text ships
with the package in `node_modules/roughjs/LICENSE`. It is not bundled into
`dist/` (marked external).

ISC licences (d3-geo: Copyright 2010-2024 Mike Bostock; topojson-client:
Copyright 2012-2019 Michael Bostock). Full texts ship with the packages in
`node_modules/<package>/LICENSE`; both are marked external, not bundled.

## Map data

`src/mapa/dados/municipios.topo.json` and `ufs.topo.json` are derived from the
**IBGE Malha Municipal 2022** (Instituto Brasileiro de Geografia e Estatística,
`BR_Municipios_2022.shp`, SIRGAS 2000), public data published by IBGE, whose
terms ask for attribution of the source: "Fonte: IBGE, Malha Municipal 2022".
They were simplified with `scripts/gerar-malhas.mjs` (topology-preserving,
2 km interval; the two lagoons IBGE codes as 4300001 and 4300002 removed, 5,570
municipalities kept) and the UF layer was dissolved from the same arcs. They are
a derived, simplified work: not for measurement, boundaries are approximate at
the 2 km scale. Natural Earth data is not used.

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
| mapshaper 0.7.68 (run through npx by `scripts/gerar-malhas.mjs`; nothing of it ships) | MPL-2.0 |
| @types/d3-geo, @types/topojson-client, @types/topojson-specification | MIT |
| axe-core 4.13 | MPL-2.0 (used unmodified as a test dependency) |
| @testing-library/react, jest-dom, jsdom | MIT |

## Methods implemented from public descriptions

- Linear scales and "nice" tick steps (1, 2, 2.5, 5 × 10ⁿ).
- Albers equal-area conic for Brazil with the IBGE parameters (standard
  parallels −2° and −22°, central meridian −54°, origin −12°); the tests check
  d3-geo against the formulas in Snyder, *Map Projections: A Working Manual*
  (USGS Professional Paper 1395, 1987), eq. 14-1 to 14-4.
- Quantile class breaks (type 7, linear interpolation between order statistics).
- CIEDE2000 colour difference (Sharma, Wu and Dalal, 2005), in the tokens package.
- SVG `feTurbulence`, `feDisplacementMap` and `feMorphology` filters for paper
  grain, woodcut, risograph grain and watercolour washes (SVG 1.1 filter
  effects specification).
