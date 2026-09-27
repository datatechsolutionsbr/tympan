# @datatechsolutions/tympan

Tympan: accessible React components (React 18.3 or 19), built on
[React Aria Components](https://react-spectrum.adobe.com/react-aria/) and
styled with plain CSS custom properties (`--ty-*`) in `@layer tympan`.
Tympan is an Astrlabe-family component published by Datatech. Licence: FSL-1.1-ALv2 (Functional Source License, Version 1.1,
Apache 2.0 Future License); see `LICENSE`.

```sh
npm run build -w @datatechsolutions/tympan          # dist/index.js, flow.js, avatars.js, flags.js (+ dist/flags/*), styles.css, flow.css and types (builds @datatechsolutions/tympan-tokens and the flag modules first)
npm run typecheck -w @datatechsolutions/tympan
npm test -w @datatechsolutions/tympan               # vitest + Testing Library + axe-core
npm run gallery -w @datatechsolutions/tympan        # http://localhost:3310 (components, theme customizer, flow canvas at #/flow/...)
npm run gallery:build -w @datatechsolutions/tympan  # static gallery in dist-gallery/
```

## Ready-made components and a ready theme system

Install (workspace or package registry), then import one stylesheet. It
already contains the `@datatechsolutions/tympan-tokens` stylesheet (every `--ty-*` custom
property for the `tympan`, `fakhir`, `neutral` and `high-contrast` presets, light and
dark), so no other CSS is needed:

```sh
npm install @datatechsolutions/tympan @datatechsolutions/tympan-tokens react react-dom
```

```tsx
import '@datatechsolutions/tympan/styles.css' // components + tokens, in @layer tympan.*
```

For a tailored theme, generate its CSS with `@datatechsolutions/tympan-tokens`
(`generateThemeCss(resolveTheme(config))`, see its README or the gallery's
theme customizer, which exports DTCG and CSS) and load it after the
stylesheet; then select it with `ThemeProvider theme="<name>"`. Hosts that use
the tokens without components can import `@datatechsolutions/tympan-tokens/tokens.css` alone.

**Print styles as themes (opt-in).** Every book style of
`@datatechsolutions/tympan-print` is also a UI theme named `print-<style>`
(palette, typography, radius and surface treatment of the style, light and
dark, WCAG AA). They are not in `styles.css`; load them after it and pass the
font map so the style's families load with the theme:

```tsx
import '@datatechsolutions/tympan/styles.css'
import '@datatechsolutions/tympan-tokens/print-themes.css'   // or print-themes/print-<style>.css for one
import { printThemeFontUrls } from '@datatechsolutions/tympan-tokens'

<ThemeProvider theme="print-minimo-de-tinta" fonts={printThemeFontUrls}>…</ThemeProvider>
```

Print styles renamed to neutral ids keep their old theme names as deprecated
aliases: `ThemeProvider` and `themeInitScript` read a stored or passed
`print-<old id>` (for example `print-tufte`) as the renamed theme
(`print-minimo-de-tinta`), store the new name and warn once in development.
See `PRINT_THEME_ALIASES` in the tokens README; the aliases go away in the
next major version.

### The research shell (no top bar)

```tsx
import '@datatechsolutions/tympan/styles.css'
import {
  AppFrame, TympanProvider, FloatingActionBar, PageHeader, RailContextButton,
  RailNavItem, RailNavSection, StatStrip, ThemeProvider, ToastProvider, messagesPtBR,
} from '@datatechsolutions/tympan'
import { CheckSquare, FileStack, Home } from 'lucide-react'

export function App() {
  const [navOpen, setNavOpen] = useState(false)
  return (
    <TympanProvider baseMessages={messagesPtBR} locale="pt-BR" navigate={router.navigate} useHref={useHref}>
      <ThemeProvider storageKey="ty-theme">
        <ToastProvider>
          <AppFrame
            layout="rail"
            ambient
            navOpen={navOpen}
            onNavOpenChange={setNavOpen}
            brand="Laboratório Exemplo"
            context={<RailContextButton scope="Laboratório Exemplo" name="Ar de Vila Aurora" />}
            navigation={
              <>
                <RailNavSection>
                  <RailNavItem label="Visão geral" icon={Home} href="/overview" current />
                </RailNavSection>
                <RailNavSection label="Coletar">
                  <RailNavItem label="Verificação" icon={CheckSquare} href="/verify" count={12} />
                </RailNavSection>
              </>
            }
            account={<AccountMenu />}
            dock={
              <FloatingActionBar
                anchor="container"
                edge="bottom"
                narrowVariant="tabbar"
                destinations={[
                  { id: 'overview', label: 'Visão geral', icon: Home, href: '/overview', active: true },
                  { id: 'base', label: 'Base', icon: FileStack, href: '/base' },
                ]}
              />
            }
          >
            <PageHeader variant="editorial" title="Visão geral" trail={[{ label: 'Laboratório Exemplo', href: '/org' }, { label: 'Visão geral' }]} lead="…" />
            <StatStrip label="Estado da pesquisa" items={[{ id: 'r', value: 1460, label: 'leituras', href: '/base' }]} />
          </AppFrame>
        </ToastProvider>
      </ThemeProvider>
    </TympanProvider>
  )
}
```

- **`AppFrame layout="rail"`** (the default when no `topBar` is given): a
  248 px rail (brand, context switcher, grouped sections, account at the
  bottom; active item = accent-soft fill + 3 px inset bar), the page on one
  glass sheet (radius 24, 12 px margin, own scroll) and the dock floating at
  the bottom of the sheet. Below 768 px the rail becomes a drawer and the dock
  a bottom tab bar (five items + "Mais", safe-area aware; "Mais" also opens
  the rail). `layout="topbar"` keeps the wave-1 frame.
- **`FloatingActionBar`**: toolbar with roving focus (arrows, Home/End), item
  menus (Down Arrow, Shift+F10, right click, long press), overflow into
  "more", tooltips, counts, auto-hide, and a focus chord (`Alt+Shift+D` by
  default, `focusShortcut` to change or `null` to disable). It publishes
  `--ty-action-bar-inset-<edge>` so the sheet never hides content under it.
- **Research pieces**: `PageHeader variant="editorial"` (mono trail, serif
  title, 68ch lead, actions, divider), `StatStrip`, `StageStrip`,
  `AttentionList`, `PhaseBar`, `ActivityFeed`, `EvidencePanel` (docked 340–420
  px ≥ 1280, drawer 1024–1279, bottom sheet below) and `ResizableSplit`.

### Providers

- **`TympanProvider`**: copy (`messages` overrides on top of `baseMessages`,
  English by default, `messagesPtBR` included) and the router adapter
  (`navigate`, `useHref`) used by every link-like component. Components hold no
  hard-coded copy. `I18nAdapterProvider` and `RoutingProvider` (wave 2)
  plug a host i18n library or router in without TympanProvider.
- **`ThemeProvider` / `useTheme`**: sets `data-ty-theme` (`tympan` by default,
  `fakhir`, `neutral`, `high-contrast`, an opt-in `print-*` theme or a generated theme), `data-ty-mode` (`system`, `light`,
  `dark`) and `data-ty-density` (`compact`, `default`, `comfortable`) on
  `<html>` (or on a wrapper with `target="scope"`). Persistence belongs to the
  host: pass controlled values and callbacks, or `storageKey` for localStorage.
  `fonts` (theme name to stylesheet URL, e.g. `printThemeFontUrls`) adds the
  font link of the current theme.
- **No flash of the wrong theme (SPA)**: put the output of
  `themeInitScript('ty-theme')` in an inline `<script>` in `<head>`, before the
  stylesheet; it sets the three attributes from storage before first paint
  (`themeInitScript(key, defaults, { fonts })` also adds the theme's font link).
  The gallery's `vite.config.ts` shows it with a `transformIndexHtml` hook.
- **`ThemeScope`**: applies a theme/mode/density to a subtree (previews).
- **`variants()`**: variants declared as data; returns `data-*` attributes the
  component CSS selects on.

## Components

Wave 1 (36 specs): ActionMenu, AppFrame, Avatar, Breadcrumbs, Button,
Checkbox/CheckboxGroup, DataTable, Drawer, EmptyState, ErrorState,
Field/Fieldset/FieldStack, Heading/Subheading, InlineNotice, Link,
ListboxSelect, ModalDialog, NativeSelect, PageHeader, Pagination, Popover,
ProgressBar, SectionHeading, SegmentedControl, Separator,
Skeleton/PageLoadingState, SkipLink, Spinner, StatusPill, Surface,
Switch/SwitchGroup, Tabs, Tag/TagList, TextArea, TextField, Text/Strong/Code,
Toast (ToastProvider/useToast). Plus ProofBadge and ActorChip (design
direction §2.11).

Wave 2 (89 specs) and wave 4 (20 non-canvas specs plus 9 research-shell
specs), grouped as in the gallery:

- **Shell and research**: AppFrame rail layout (RailNavSection, RailNavItem,
  RailContextButton), FloatingActionBar, PageHeader editorial, EvidencePanel,
  ResizableSplit, StatStrip, StageStrip, AttentionList, PhaseBar, ActivityFeed.
- **Choices and filters**: ThemeSwitcher, StateSwitch, OneTimeCodeField,
  PasswordStrength, SearchBar, FilterField, FilterChips, FilterTile,
  ChoiceCard, ChoiceTile, ChoiceGrid, ChipGroup, FlagSetPicker.
- **Pickers and forms**: CategoryTabs, TagField, CurrencyField, DateField,
  TimeField, MonthField, WheelPicker, LocalePicker, ImagePicker,
  SchemaRequestForm, FormLayout parts, FormActions.
- **Overlays and navigation**: SectionedModal, SettingsDialog and
  PreferenceGroup, ConfirmProvider/useConfirm, CompactConfirm, DetailsPopover,
  NavigationFlyout, ToolbarTrigger, AppNavigation (and its builders),
  AppLauncherGrid, CommandPalette, LongPressMenu, FloatingActionButton,
  StepList, PageDots, WizardPage.
- **Lists and records**: SectionPanel, ListPanel, ListRow, SummaryRow,
  CountBadge, NotificationCenter, ProfileAvatar, CopyIdentifier, HistoryList,
  GroupedDisclosureList, RecoveryCodeList, MarkdownView.
- **Metrics and cards**: StatTile, MetricTile, TweenedNumber, DeltaIndicator,
  AgentOutputCard, RecordCard, ProfileSummary, ContactCard parts, InsightCard,
  TickerCard.
- **Charts and regions**: Chart, ReportView, LiveReportView, RegionMap,
  ToneTint, RegionThemeRegistry, RegionThemeData (BR), CountryProfileData (BR).
- **Auth, brand and pages**: FederatedSignIn, AuthFrame, BrandPanel,
  BrandMark, BrandLoader and LoaderPresets, UpgradeGate, HttpErrorPage,
  RouteProgress, ConsentBanner, EnvironmentBanner, AmbientBackdrop,
  LegalDocumentFrame, SkeletonFill, ThirdPartyMarkSlot/ProviderMark.
- **Touch and utilities**: SwipeRow, PullToRefresh, EdgeSwipeBack,
  SafeAreaInset, Haptics, animateChange (view transitions), EntityListLoader, Routing (router adapter),
  I18nAdapter, MotionFoundation, Formatters, ApiErrorModel, GlassCheckToggle
  (developer only), CascadeGrid (off unless `decorativeMotion`), and the
  LegacyAliasMap decision record (no aliases exported).
- **Public pages**: ShowcaseHeading (Kicker, Lead), RevealNumber,
  ShowcaseBackdrop and AccentBand, FeatureShowcaseCard, RuledGrid,
  HighlightStat, FeatureTile.

The canvas specs (wave 3 and the five canvas items of wave 4) are the flow
canvas, a separate entry point of this package (below).

## Flow and provenance canvas (`@datatechsolutions/tympan/flow`)

A W3C PROV provenance graph viewer, a DAG workflow editor, run inspection and
the forms and dialogs around them ship as the `/flow` subpath, with their own
stylesheet. The main entry does not re-export them, so hosts that only use
the components never load the canvas. The canvas lays graphs out with
`@dagrejs/dagre`, an optional peer dependency: install it when you import
`/flow`.

```sh
npm install @datatechsolutions/tympan @dagrejs/dagre
```

```tsx
import '@datatechsolutions/tympan/styles.css'
import '@datatechsolutions/tympan/flow.css'   // after styles.css
import { TympanProvider } from '@datatechsolutions/tympan'
import { ProvenanceGraph, FlowEditor } from '@datatechsolutions/tympan/flow'
```

What is inside, canvas tools, languages and accessibility: `src/flow/README.md`;
records: `src/flow/CLEAN-ROOM.md` and `src/flow/PROVENANCE.md`.

**Migrating from `@datatechsolutions/tympan-flow`.** The separate package is
gone; its exports are unchanged under the subpath:

| Before | After |
|---|---|
| `npm install @datatechsolutions/tympan-flow` | `npm install @dagrejs/dagre` (next to `@datatechsolutions/tympan`) |
| `from '@datatechsolutions/tympan-flow'` | `from '@datatechsolutions/tympan/flow'` |
| `import '@datatechsolutions/tympan-flow/styles.css'` | `import '@datatechsolutions/tympan/flow.css'` |

## Generated avatars (`@datatechsolutions/tympan/avatars`)

Deterministic avatars drawn by [DiceBear](https://www.dicebear.com) 9 from a
seed, in the colours of the active theme. `@dicebear/core` and the style
packages are optional peer dependencies: install core and only the styles you
use.

```sh
npm install @dicebear/core@^9 @dicebear/shapes@^9 @dicebear/notionists@^9
```

```tsx
import * as shapes from '@dicebear/shapes'
import { GeneratedAvatar, avatarSvg, avatarPalette } from '@datatechsolutions/tympan/avatars'

<GeneratedAvatar seed={user.id} avatarStyle={shapes} name={user.name} fallbackText="IC" />
<GeneratedAvatar seed={agent.key} avatarStyle={shapes} name={agent.name} actorKind="agent" />

avatarSvg({ seed: 'user-42', style: shapes })                      // SVG string, colours as --ty-* custom properties
avatarSvg({ seed: 'user-42', style: shapes, size: 64, theme: avatarPalette('tympan', 'dark') }) // fixed hex colours
```

- **Licence gate.** Only styles whose artwork is CC0 1.0 or MIT are accepted:
  glass, icons (Bootstrap Icons, MIT), identicon, initials, lorelei,
  lorelei-neutral, notionists, notionists-neutral, open-peeps, pixel-art,
  pixel-art-neutral, rings, shapes and thumbs. Any other style throws
  `AvatarStyleError` (the component shows its fallback), `check:provenance`
  fails on an import of an excluded style, and a test compares the allow-list
  with the installed LICENSE files. The CC BY 4.0 styles (adventurer,
  big-ears, big-smile, croodles, dylan, fun-emoji, micah, miniavs, personas,
  toon-head) and the custom-licensed ones (avataaars, bottts) are left out;
  so is `@dicebear/collection`, which re-exports all of them. Details:
  `ALLOWED_AVATAR_STYLES`, `EXCLUDED_AVATAR_STYLES`, THIRD_PARTY_NOTICES.md.
- **Theme colours.** By default every colour is
  `var(--ty-avatar-<slot>, <theme expression>)`: soft backgrounds mixed from
  `--ty-brand` and `--ty-bg`, ink shapes from `--ty-brand`/`--ty-brand-strong`,
  solid fills from the brand ramp, light paper (brand 100/200) behind the
  black line art of figure styles. The inline SVG follows all themes and
  both modes without re-rendering; set a `--ty-avatar-*` property to repaint a
  slot. Figure styles keep the artist's skin, hair and eye colours.
  `avatarPalette(theme, mode)` resolves the same recipe to hex for images,
  e-mail or files.
- **People and agents.** `actorKind="agent"` keeps Avatar's rounded, dashed
  frame, draws from the neutral ink instead of the brand, and accepts only the
  abstract styles (glass, icons, identicon, rings, shapes): an agent never gets
  a face or initials.
- **Avatar behaviour kept.** GeneratedAvatar is Avatar with generated
  `artwork`: a loaded `src` wins, the frame is `role="img"` named by `name` (or
  `aria-hidden` with `decorative` next to a visible name), `onPress`/`href`
  make it a control, and when the artwork cannot be drawn the initials (or
  the agent bot icon) show. Avatars do not mirror in right-to-left layouts.
- **Determinism.** Same seed, style, kind and palette give the same SVG;
  internal ids are prefixed per instance so avatars never share a mask.
- DiceBear 10 (`@dicebear/core` 10 with `@dicebear/styles`) packs styles
  differently; this subpath targets the 9.x core and per-style packages,
  whose majors match.

## Flags (`@datatechsolutions/tympan/flags`)

```tsx
import { Flag, flagName } from '@datatechsolutions/tympan/flags'

<Flag code="JP" />                          // role="img", named "Japan" / "Japão" / "日本" by locale
<Flag code="gb-sct" aspect="1x1" size="small" />
<Flag code="eu" aspect="circle" />
<Flag code="ke" decorative /> {flagName('ke', locale)}
```

- Artwork: [flag-icons](https://github.com/lipis/flag-icons) 7.5.0 (MIT), 271
  flags (ISO 3166-1 alpha-2, England, Scotland, Wales, Northern Ireland,
  Catalonia, Galicia, Basque Country, Ascension, Saint Helena, Tristan da
  Cunha, the EU, the UN, ASEAN, the Arab League, CEFTA, the EAC, the Pacific
  Community and an "unknown" flag) in 4:3 and 1:1. `aspect="circle"` clips
  the square art.
- Each flag is its own lazily loaded chunk (`dist/flags/<aspect>/<code>-*.js`),
  generated at build time from the flag-icons SVGs; importing `Flag` does not
  bundle 271 flags, and hosts need no bundler setup for SVG files. The flag
  appears once its chunk has loaded; the named frame is there from the first
  render.
- Accessible name: `Intl.DisplayNames` in the active locale (from
  `TympanProvider`/`I18nProvider`), own names in English, Portuguese and
  Spanish for the flags CLDR has no region for, the code otherwise; `label`
  overrides it, `decorative` hides the flag next to a visible name. Unknown
  codes draw the "unknown" flag and keep the code as the name.
- **Flags stand for countries and regions, never for languages.** Spanish,
  Arabic, English or Portuguese are spoken in many countries, and many
  countries have several languages. A language picker lists each language by
  its own name (English, Español, العربية, 日本語), as the gallery's language
  menu does; use a flag only where the place itself is meant (an office, a
  shipping destination, a phone country code).
- Flags never mirror in right-to-left layouts.

## Styling rules

- Class names are `ty-` prefixed (BEM-ish); state comes from React Aria data
  attributes (`[data-hovered]`, `[data-focus-visible]`, …) or `data-*` variants.
- Layers: `tympan.tokens`, `tympan.base`, `tympan.components`. Host styles
  outside the layers win without `!important`.
- Every interactive control keeps a 44 × 44 px hit area; visible controls are
  40 px on desktop and 44 px below 1024 px.
- `prefers-reduced-motion`, `prefers-reduced-transparency`,
  `prefers-contrast`, and `forced-colors` are handled by the tokens and by each
  component stylesheet.

## Languages and scripts

Copy ships in English, Brazilian Portuguese and Spanish; any other locale gets
English copy with locale-correct numbers, dates, lists and plurals (`Intl.*`
with the provider's `locale`). Override any string with `messages` or with ICU
MessageFormat strings through `icuMessages`; `pseudo` turns on
pseudo-localization. Layout CSS is logical only, so `dir="rtl"` mirrors the
whole library; the token stylesheet adapts fonts, line heights and line
breaking per script with `:lang()` (Noto fallbacks for Arabic, Hebrew,
Devanagari and other Indic scripts, Thai, Ethiopic, CJK and more). Set `lang`
and `dir` on `<html>` (or on a subtree).

## Records

`CLEAN-ROOM.md` (process and inputs), `PROVENANCE.md` (per component),
`THIRD_PARTY_NOTICES.md` (including the avatar style and flag artwork
licences), `LICENSE`; for the flow canvas, `src/flow/CLEAN-ROOM.md` and
`src/flow/PROVENANCE.md`.
