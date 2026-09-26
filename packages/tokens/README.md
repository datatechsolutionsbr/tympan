# @fakhir/tokens

Design tokens and theme generator of the Fakhir design system. MIT licence.
Visual source of truth: `docs/infra/design-direction-fakhir.md` (§2.1 to §2.13)
in the thesis repository.

```sh
npm run build -w @fakhir/tokens      # dist/tokens.css, tokens.json, values.js, dtcg/, contrast-report.md, index.js
npm run typecheck -w @fakhir/tokens  # tsc + source validation + WCAG gate
npm test -w @fakhir/tokens           # vitest: colour math, ramps, AA in every preset/mode, DTCG, stylesheet
```

## What is in the box

| Output | Content |
|---|---|
| `@fakhir/tokens/tokens.css` | every `--fk-*` custom property, in `@layer fakhir.tokens` |
| `@fakhir/tokens/tokens.json` | resolved values: base, density steps, each preset × mode (× high contrast) |
| `@fakhir/tokens/dtcg/*.tokens.json` | W3C DTCG trees (2025.10 format) of every set, as fed to Style Dictionary |
| `@fakhir/tokens/values` | the resolved values as a typed JS module (`values`, `cssVar()`) |
| `@fakhir/tokens` | the generator: colour math, `resolveTheme`, presets, `generateThemeCss`, DTCG conversion |
| `dist/contrast-report.md` | WCAG ratio and APCA Lc of every declared pair, per preset and mode |

## Token model

**Static (authored as DTCG in `src/base/`)**: spacing on a 4 px base
(`--fk-space-1..9`, §2.1), layout sizes (`--fk-layout-*`, §2.8), the 44 px
touch target (`--fk-control-target`), type families, sizes with paired line
heights, weights and tracking (§2.2), prose measures, durations and easings
(`--fk-dur-*`, `--fk-ease`, `--fk-ease-out`, §2.7), stacking order (`--fk-z-*`).

**Generated per theme and mode (`src/theme.ts`)**:

- **Ramps**: 11 steps (`50 … 950`) per seed, computed in OKLCH:
  `--fk-brand-*`, `--fk-neutral-*`, `--fk-danger-*`, `--fk-warning-*`,
  `--fk-success-*`, `--fk-info-*`.
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
- **Radius**: one base `--fk-radius`; `radius-control` = base, `radius-card` =
  1.6 × base, `radius-sheet` = 2.4 × base, `radius-pill`, `radius-agent` = 0.6 × base
  (base 10 gives 10 / 16 / 24 / 6, §2.4).
- **Elevation and glass**: `shadow-{sheet,raised,floating,modal,sheet-inset}`
  tinted with the neutral hue (never black), `glass-blur-sheet`,
  `glass-blur-floating`, `glass-saturate` (§2.5).
- **Design-direction aliases**: `accent`, `accent-strong`, `accent-soft`,
  `accent-ink`, `on-accent`, `on-accent-soft` point at the brand roles.

**Density** (`data-fk-density`): `compact | default | comfortable` sets
`--fk-control-height`, `--fk-control-height-touch`, `--fk-control-height-compact`
and `--fk-density`. The 44 px hit area never changes.

## Theming attributes

```html
<html data-fk-theme="fakhir" data-fk-mode="system" data-fk-density="default">
```

- `data-fk-theme`: `fakhir` (default, also applied to `:root`), `neutral`,
  `high-contrast`, or the name of a generated theme.
- `data-fk-mode`: `light`, `dark`, or `system`/absent (follows `prefers-color-scheme`).
- `data-fk-density`: see above.

The attributes may be on the same element or nested (a light preview inside a
dark page works). User preferences are handled in the stylesheet:

| Preference | Effect |
|---|---|
| `prefers-color-scheme: dark` | dark values when the mode is `system` |
| `prefers-contrast: more` | the high-contrast variant of the current theme |
| `prefers-reduced-transparency: reduce` (and no `backdrop-filter` support) | opaque surfaces, no blur, no ambient |
| `prefers-reduced-motion: reduce` | every `--fk-dur-*` becomes `0ms` |
| `forced-colors: active` | roles map to system colours (`Canvas`, `CanvasText`, `Highlight`, …); shadows off |

In the design system, `<ThemeProvider>` / `useTheme()` set these attributes and
`themeInitScript()` applies the stored choice before first paint.

## Presets

| Preset | Seeds | Radius | Contrast | Glass | CTA |
|---|---|---|---|---|---|
| `fakhir` | brand teal from the §2.3 accent, neutral with a slight teal tint, semantic hues | 10 | default | on | gradient |
| `neutral` | grey-blue brand, near-grey neutral | 8 | default | on | solid |
| `high-contrast` | fakhir seeds | 10 | high | off | solid |

The `fakhir` preset **pins** the exact colours of design direction §2.3 (accent,
surfaces, ink, lines, semantic tones, the CTA gradient) on top of the generated
roles, so the product keeps the approved look; every other role is generated.
`neutral` and `high-contrast` are fully generated.

## Generator API

```ts
import { resolveTheme, generateThemeCss, themeToDtcg, fakhirPreset, type ThemeConfig } from '@fakhir/tokens'

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
const css = generateThemeCss(config)           // [data-fk-theme="lab"] … blocks, all preference media
const dtcg = themeToDtcg(light)                // DTCG tree
```

Inputs: seed hue and chroma for six seeds, chart hues, radius base, contrast
(`default` | `high`), glass on/off, CTA style, optional pinned colours. It is
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

## Ideas taken from public documentation (concepts only)

The user asked for a theme system inspired by shadcn/ui and Tailwind CSS (the
open-source framework, MIT). Only concepts from their public documentation
pages were used; no source file, class string, CSS file or palette value was
read or copied, and neither project is a dependency.

| Concept | Where it came from | How it appears here |
|---|---|---|
| Semantic roles in background/foreground pairs (background, card, popover, primary, secondary, muted, accent, destructive, border, input, ring, chart, sidebar) | shadcn/ui theming docs | `X` / `on-X` roles under our own names (`surface`, `surface-raised`, `brand`, `secondary`, `surface-sunken`, `danger`, `line`, `input`, `focus-ring`, `chart-1..8`, `nav-*`) |
| One radius base deriving the radius scale | shadcn/ui theming docs | `--fk-radius` with our own multipliers giving the §2.4 steps |
| Themes and dark mode as a swap of custom properties under a selector | shadcn/ui theming docs | attribute selectors `data-fk-theme` / `data-fk-mode` |
| 11-step colour scales named 50…950, defined in OKLCH | Tailwind CSS colours docs | `generateRamp()` with our own lightness and chroma curves; no Tailwind values |
| Theme variable namespaces (spacing from one base unit, breakpoints, container widths, text sizes paired with line heights, shadows, easings) | Tailwind CSS theme docs | our DTCG groups (`space`, `layout`, `font.size` + `font.line-height`, `shadow`, `ease`) with values from the design direction |

URLs consulted on 2026-09-26:

- https://ui.shadcn.com/docs/theming
- https://tailwindcss.com/docs/colors
- https://tailwindcss.com/docs/theme

Other references: W3C Design Tokens Community Group format (2025.10); WCAG 2.2
(1.4.3, 1.4.11, 2.4.7, 2.4.13); Björn Ottosson, "A perceptual color space for
image processing" (OKLab definition and matrices); the public description of
the APCA-W3 0.0.98G constants (informational only).
