# @datatechsolutions/tympan-tokens

Design tokens and theme generator of Tympan, published by Datatech. Licence:
FSL-1.1-ALv2 (Functional Source License, Version 1.1, Apache 2.0 Future
License); see `LICENSE`. Section references (§2.1 to §2.13) point to the
visual design direction the tokens implement.

```sh
npm run build -w @datatechsolutions/tympan-tokens      # dist/tokens.css, tokens.json, values.js, dtcg/, contrast-report.md, index.js
npm run typecheck -w @datatechsolutions/tympan-tokens  # tsc + source validation + WCAG gate
npm test -w @datatechsolutions/tympan-tokens           # vitest: colour math, ramps, AA in every preset/mode, DTCG, stylesheet
```

## What is in the box

| Output | Content |
|---|---|
| `@datatechsolutions/tympan-tokens/tokens.css` | every `--ty-*` custom property, in `@layer tympan.tokens` |
| `@datatechsolutions/tympan-tokens/tokens.json` | resolved values: base, density steps, each preset × mode (× high contrast) |
| `@datatechsolutions/tympan-tokens/dtcg/*.tokens.json` | W3C DTCG trees (2025.10 format) of every set, as fed to Style Dictionary (`dtcg/print/` for the print themes) |
| `@datatechsolutions/tympan-tokens/print-themes.css` | opt-in: every print book style as a UI theme (`data-ty-theme="print-<style>"`), light, dark and high contrast |
| `@datatechsolutions/tympan-tokens/print-themes/<theme>.css` | opt-in: one print theme per file (for example `print-themes/print-suico.css`) |
| `@datatechsolutions/tympan-tokens/print-themes.json` | name, label, font stylesheet URL and CSS file of each print theme |
| `@datatechsolutions/tympan-tokens/values` | the resolved values as a typed JS module (`values`, `cssVar()`) |
| `@datatechsolutions/tympan-tokens` | the generator: colour math, `resolveTheme`, presets, `generateThemeCss`, DTCG conversion |
| `dist/contrast-report.md` | WCAG ratio and APCA Lc of every declared pair, per preset and mode |

## Token model

**Static (authored as DTCG in `src/base/`)**: spacing on a 4 px base
(`--ty-space-1..9`, §2.1), layout sizes (`--ty-layout-*`, §2.8), the 44 px
touch target (`--ty-control-target`), type families, sizes with paired line
heights, weights and tracking (§2.2), prose measures, durations and easings
(`--ty-dur-*`, `--ty-ease`, `--ty-ease-out`, §2.7), stacking order (`--ty-z-*`).

**Generated per theme and mode (`src/theme.ts`)**:

- **Ramps**: 11 steps (`50 … 950`) per seed, computed in OKLCH:
  `--ty-brand-*`, `--ty-neutral-*`, `--ty-danger-*`, `--ty-warning-*`,
  `--ty-success-*`, `--ty-info-*`.
- **Paired roles** (X / on-X):
  `bg`/`on-bg`, `surface`/`on-surface`, `surface-raised`/`on-surface-raised`,
  `surface-sunken`/`on-surface-sunken`, `brand`/`on-brand`,
  `brand-soft`/`on-brand-soft`, `cta`/`on-cta`, `secondary`/`on-secondary`,
  and for each tone `danger|warning|success|info|neutral`: `X`, `on-X`,
  `X-soft`, `on-X-soft`. Also `ink`, `ink-2`, `ink-3` (three text levels),
  `line`, `line-soft`, `line-strong`, `input` (field border, 3:1),
  `focus-ring`, `focus-width`, `backdrop`, `ambient-1/2`.
- **Proof states and actors** (§2.11): `proof-{proved,pending,refuted,not-disclosed,none}`
  (+ `-soft`), `actor-{person,agent,system}` (+ `-soft`).
- **Charts**: `chart-1..8` (aliases `categorical-1..8`), each ≥ 3:1 on the sheet.
- **Navigation**: `nav-bg`, `on-nav`, `nav-active`, `on-nav-active`, `nav-line`.
- **Radius**: one base `--ty-radius`; `radius-control` = base, `radius-card` =
  1.6 × base, `radius-sheet` = 2.4 × base, `radius-pill`, `radius-agent` = 0.6 × base
  (base 10 gives 10 / 16 / 24 / 6, §2.4).
- **Elevation and glass**: `shadow-{sheet,raised,floating,modal,sheet-inset}`
  tinted with the neutral hue (never black), `glass-blur-sheet`,
  `glass-blur-floating`, `glass-saturate` (§2.5).
- **Design-direction aliases**: `accent`, `accent-strong`, `accent-soft`,
  `accent-ink`, `on-accent`, `on-accent-soft` point at the brand roles.
- **Typography (optional)**: a theme with `fonts` sets `--ty-font-serif`
  (role `display`: headings h1 to h3 and KPI numbers), `--ty-font-sans`
  (role `body`) and `--ty-font-mono` (role `mono`) on its scope; the built-in
  presets leave them to the base tokens. `elevation` (`soft` | `flat` |
  `offset`) picks blurred shadows, none, or a hard ink shadow.

**Density** (`data-ty-density`): `compact | default | comfortable` sets
`--ty-control-height`, `--ty-control-height-touch`, `--ty-control-height-compact`
and `--ty-density`. The 44 px hit area never changes.

**Canvas component tokens (`src/flow.ts`, `--ty-flow-*`)**, used by the
flow canvas (`@datatechsolutions/tympan/flow`): kind tones `tone-{categorical-1..8,neutral}` with
`-ink`, `-soft` (a 14 % oklab mix) and `-text`, and the `[data-tone]` mapping
that sets `--ty-flow-tone`, `-ink`, `-soft`, `-text` on any element;
connectors (`connector`, `-active`, `-true`, `-false`, `-rule`, `-width`,
`-width-active`); node frame (`node-border`, `-border-hover`, `-surface`,
`-radius`) and state rings (`ring-{selected,running,succeeded,failed}`);
canvas plane (`plane`, `grid-dot`, `guide`, `marquee`); provenance bands
(`band` 96, `band-label` 130, `node-h` 72, `node-w` 236 px); research steps
(`step-w` 250, `step-h` 86, `col-gap` 56 px) and data shapes
(`shape-{records,table,number,chart,decision}`). Colours are DTCG aliases of
theme roles (`dist/dtcg/flow.tokens.json`) emitted as `var(--ty-role)`, and are
declared on every theme and mode scope so a nested theme re-resolves them.

## Theming attributes

```html
<html data-ty-theme="tympan" data-ty-mode="system" data-ty-density="default">
```

- `data-ty-theme`: `tympan` (default, also applied to `:root`), `fakhir`,
  `astrlabe`, `neutral`, `high-contrast`, an opt-in print theme (from
  `print-themes.css`), or the name of a generated theme.
- `data-ty-mode`: `light`, `dark`, or `system`/absent (follows `prefers-color-scheme`).
- `data-ty-density`: see above.

The attributes may be on the same element or nested (a light preview inside a
dark page works). User preferences are handled in the stylesheet:

| Preference | Effect |
|---|---|
| `prefers-color-scheme: dark` | dark values when the mode is `system` |
| `prefers-contrast: more` | the high-contrast variant of the current theme |
| `prefers-reduced-transparency: reduce` (and no `backdrop-filter` support) | opaque surfaces, no blur, no ambient |
| `prefers-reduced-motion: reduce` | every `--ty-dur-*` becomes `0ms` |
| `forced-colors: active` | roles map to system colours (`Canvas`, `CanvasText`, `Highlight`, …); shadows off |

In the design system, `<ThemeProvider>` / `useTheme()` set these attributes and
`themeInitScript()` applies the stored choice before first paint.

## Presets

| Preset | Seeds | Radius | Contrast | Glass | CTA |
|---|---|---|---|---|---|
| `tympan` (default) | brand teal from the §2.3 accent, neutral with a slight teal tint, semantic hues | 10 | default | on | gradient |
| `fakhir` | the look of the Fakhir research platform; today the same values as `tympan` | 10 | default | on | gradient |
| `astrlabe` | the look of the Astrlabe workflow engine: indigo brand, slate neutral, state contract colours | 12 | default | on | gradient (indigo to purple) |
| `astrlabe-controle` | Astrlabe's dark operations room: deep blue-slate surfaces, square corners, saturated console state colours, monospace | 2 | default | off | solid |
| `neutral` | grey-blue brand, near-grey neutral | 8 | default | on | solid |
| `high-contrast` | tympan seeds | 10 | high | off | solid |

The `tympan` preset (and `fakhir`, which an app selects by name with
`data-ty-theme="fakhir"` or `ThemeProvider theme="fakhir"`) **pins** the exact
colours of design direction §2.3 (accent,
surfaces, ink, lines, semantic tones, the CTA gradient) on top of the generated
roles, so the product keeps the approved look; every other role is generated.
`astrlabe` pins the Astrlabe app's slate and indigo values in the same way
(indigo 600 / 400 as the text-safe brand in light / dark, indigo 500 as the
focus ring, slate 50 / 950 grounds, glass surfaces).
`neutral` and `high-contrast` are fully generated.

## Book-style print presets

`printPresets` holds the 39 book diagramming styles used by
`@datatechsolutions/tympan-print` (`PRINT_PRESET_NAMES` gives the order:
`dashboard` … `papel-salmao`, then `dados-br`, `fluxo-historico`,
`blocos-coloridos`, `construtivismo`, `bauhaus`, `brutalista`, `divulgacao`,
`proporcao-modular`, `sinalizacao`, `pictogramas`, `mapa-de-metro`,
`jornal-1959`, `azulejo-modernista`, `tropicalia`, `atlas-oficial`,
`grade-holandesa`, `papel-recortado`, `pop-art`, `cientifico`, `art-nouveau`,
`memphis`). Ids and labels are neutral, descriptive names; the tradition a
style draws on is named only in its description (`referencia`, "inspirado em
…").
Optional fields cover page ornaments (`estrutura.moldura`, `cor.ornamento`),
columns (`estrutura.barras`), running-head bands and title treatments. Each `PrintStyle` names its fonts (Google Fonts,
OFL), paper and ink, data and proof-state colours, paper texture, stroke,
chart renderer, proof-mark shape and page structure.

```ts
import { printPresets, printStyleToCss, googleFontsUrl } from '@datatechsolutions/tympan-tokens'

printStyleToCss(printPresets.jornal)                       // [data-ty-print-style="jornal"] { --ty-print-*: … }
printStyleToCss(printPresets.jornal, { pb: true })          // black and white: greys of equal luminance + the style's pb
printStyleToCss(printPresets.jornal, { overrides: { cor: { destaque: '#8a1c7c' } } })
```

### Renamed styles (deprecated ids)

Eighteen styles were renamed so that no id or label uses a trademark, an
institution or a person's name. The old ids still work: `PRINT_STYLE_ALIASES`
maps each one to its new id, and `resolvePrintStyleName`, `printPresetById`,
`resolvePrintStyle` (which also takes an id), `LivroPrint estilo` and the UI
theme lookup (`print-<old id>`, through `PRINT_THEME_ALIASES` and
`resolvePrintThemeName`, used by `ThemeProvider` and `themeInitScript`) accept
them, with a one-time console warning in development builds. The alias maps
and resolvers are also published alone, without the presets, as
`@datatechsolutions/tympan-tokens/print-aliases`.

| Old id | New id | Label |
| --- | --- | --- |
| `economist` | `semanario` | Semanário de economia |
| `ft` | `papel-salmao` | Papel salmão |
| `schiphol` | `sinalizacao` | Sinalização de aeroporto |
| `jornal-do-brasil` | `jornal-1959` | Jornal modernista (1959) |
| `atlas-ibge` | `atlas-oficial` | Atlas oficial (cartografia) |
| `deardata` | `cartao-postal` | Cartão-postal desenhado à mão |
| `tufte` | `minimo-de-tinta` | Mínimo de tinta |
| `holmes` | `infografico-ilustrado` | Infográfico ilustrado |
| `bayer` | `diagrama-modernista` | Diagrama modernista |
| `dubois` | `graficos-1900` | Gráficos de exposição (1900) |
| `minard` | `fluxo-historico` | Fluxo histórico (séc. XIX) |
| `mccandless` | `blocos-coloridos` | Blocos coloridos |
| `corbusier` | `proporcao-modular` | Proporção modular |
| `aicher` | `pictogramas` | Pictogramas esportivos |
| `vignelli` | `mapa-de-metro` | Mapa de metrô |
| `athos-bulcao` | `azulejo-modernista` | Azulejo modernista |
| `crouwel` | `grade-holandesa` | Grade holandesa |
| `saul-bass` | `papel-recortado` | Papel recortado |

The labels of `tropicalia`, `pop-art`, `art-nouveau` and `memphis` no longer
carry a person's name (the ids are unchanged), and the emblem `'modulor'` is
now `'figura-modular'` (the old value is still drawn).

**Removal:** the aliases, the `print-<old id>` theme names and the `'modulor'`
emblem will be removed in the next major version of
`@datatechsolutions/tympan-tokens` and `@datatechsolutions/tympan-print`.
Migrate stored data books to the new ids before then.

```ts
resolvePrintStyle('economist').name   // 'semanario' (warns once in development)
resolvePrintThemeName('print-tufte')  // 'print-minimo-de-tinta'
```

Tests hold every preset to WCAG AA for `tinta`, `tinta2` and the six proof
colours on the paper (in colour and in P&B) and keep every data colour
(`destaque`, `destaque2`, `contexto`, proof states) at CIEDE2000 ΔE ≥ 10 from
the colours of the lakebrasil logo. `deltaE2000` and `rgbToLab` are exported
from the colour module.

## Print styles as UI themes

`printStyleToTheme(style)` derives a `ThemeConfig` from any `PrintStyle`, and
`printThemePresets` holds one per book style, named `print-<style>` (for
example `print-suico`, `print-minimo-de-tinta`). The mapping is data-driven:

- **Palette**: in the style's own mode (light for paper styles, dark for
  dark-paper styles such as `prancheta`) the paper is `bg`, surfaces step
  lighter than it and the well darker, `tinta`/`tinta2`/`tinta3` are the three
  ink levels, the printed rule gives the lines, the highlighter tint is
  `brand-soft` and the selected nav item, and the proof-state colours are the
  danger, success and warning tones where they are chromatic. The brand is the
  style's accent (`printStyleAccent`), moved along OKLCH lightness only as far
  as it needs to read on the paper (`legibleOn`). Chart hues come from the
  accents, ornaments and proof colours.
- **Other mode**: generated from the same hues (neutral from the paper tint,
  brand from the accent), with the paper colour as the ink and the printed
  accent kept as the brand where it reads.
- **Typography**: `fonts.display` and `fonts.body` are the style's title and
  body stacks; `fonts.mono` is the style's mono stack only when it is really
  monospace (otherwise the base mono stays). `fontsUrl` is the style's Google
  Fonts css2 URL (`googleFontsUrl`) limited to those families.
- **Surface**: radius from the print corner radius (mm at 96 dpi); glass,
  a gradient call to action and soft shadows only for the card and wash
  styles (`dashboard`, `aquarela`); flat shadows for the ruled print styles
  (`suico`, `minimo-de-tinta`, `bauhaus` …); a hard offset shadow for cut-paper and
  poster styles (`brutalista`, `memphis`, `pop-art`, `divulgacao`).
- **Contrast**: every exact print colour is a pin only while all WCAG 2.2 AA
  pairs hold in that mode; a pin that fails is dropped and the role is
  regenerated from the style's hue (`printThemeDroppedPins(style)` lists
  them). Tests run every pair of every print theme in light, dark and high
  contrast.
- **Overrides**: `printStyleToTheme(style, { brand, radius, glass, cta, elevation, pins })`,
  and `PRINT_THEME_OVERRIDES` for judgements the data cannot express.

The print themes are **not** in `tokens.css`. To enable them in an app:

```ts
import '@datatechsolutions/tympan/styles.css'                      // or tokens.css
import '@datatechsolutions/tympan-tokens/print-themes.css'         // all print themes (about 2 MB, 160 kB gzip)
// or only the ones you offer:
import '@datatechsolutions/tympan-tokens/print-themes/print-suico.css'

import { printThemeFontUrls } from '@datatechsolutions/tympan-tokens'
<ThemeProvider theme="print-suico" fonts={printThemeFontUrls}>…</ThemeProvider>
```

`ThemeProvider`'s `fonts` map (theme name to stylesheet URL) adds the font
link of the current theme; `themeInitScript(key, defaults, { fonts })` does the
same before first paint. Without it the stacks fall back to the style's
system families. `generatePrintThemesCss(list)` builds the same sheet at
runtime. A default theme nested inside a print theme inherits the print
fonts, because the built-in presets do not redeclare the font tokens.

## Generator API

```ts
import { resolveTheme, generateThemeCss, themeToDtcg, tympanPreset, type ThemeConfig } from '@datatechsolutions/tympan-tokens'

const config: ThemeConfig = {
  name: 'lab',
  seeds: {
    brand: { hue: 200, chroma: 0.14 }, neutral: { hue: 200, chroma: 0.012 },
    danger: { hue: 15, chroma: 0.2 }, warning: { hue: 70, chroma: 0.15 },
    success: { hue: 150, chroma: 0.16 }, info: { hue: 250, chroma: 0.07 },
  },
  radius: 12, contrast: 'default', glass: true, cta: 'gradient',
}
const light = resolveTheme(config, 'light')   // roles, ramps, shadows, radii, contrast report
const css = generateThemeCss(config)           // [data-ty-theme="lab"] … blocks, all preference media
const dtcg = themeToDtcg(light)                // DTCG tree
```

Inputs: seed hue and chroma for six seeds, chart hues, radius base, contrast
(`default` | `high`), glass on/off, CTA style, optional pinned colours, and
optionally font families per role (`fonts`, `fontsUrl`) and `elevation`. It is
pure and deterministic (same input, same output).

**Contrast is enforced, then tested.** Each theme declares 70+ pairs
(`contrastPairs()`): text roles at 4.5:1 and UI roles (field border, focus ring
on every surface, brand on sunken tracks, chart colours) at 3:1, with
translucent layers composited over what sits beneath. The generator nudges any
non-pinned foreground along its OKLCH lightness axis until the pair passes;
pinned colours are never changed, and a failing pin fails the build. The tests
check every pair in every preset × mode × contrast level and a hue sweep of
custom themes (what the customizer can produce). APCA Lc is computed for every
pair and reported, not enforced.

## Pipeline choice: Style Dictionary v5

Checked on 2026-09-26: `style-dictionary@5.5.5` and `@terrazzo/cli@2.7.1`.
Style Dictionary was chosen because:

- its programmatic API (`formatPlatform`) returns output in memory, which lets
  the build compare its result with the generator's own serialisation (the
  one the live customizer uses) and fail on any difference;
- it reads DTCG natively (`usesDtcg`), including 2025.10 colour and dimension
  objects, and hooks make every value transform ours (colour, shadow,
  gradient, dimension, duration), so the CSS text is identical from both paths;
- it is widely used and stable across majors; Terrazzo's native modes are
  attractive, but the selector strategy here (theme × mode × density ×
  preference media) is assembled by `src/stylesheet.ts` anyway, which removes
  that advantage.

## Sources

The concepts taken from public documentation, with the URLs consulted, are
recorded in `PROVENANCE.md`.

Other references: W3C Design Tokens Community Group format (2025.10); WCAG 2.2
(1.4.3, 1.4.11, 2.4.7, 2.4.13); Björn Ottosson, "A perceptual color space for
image processing" (OKLab definition and matrices); the public description of
the APCA-W3 0.0.98G constants (informational only).
