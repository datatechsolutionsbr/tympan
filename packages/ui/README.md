# @datatechsolutions/tympan

Tympan: accessible React components (React 18.3 or 19), built on
[React Aria Components](https://react-spectrum.adobe.com/react-aria/) and
styled with plain CSS custom properties (`--ty-*`) in `@layer tympan`.
Tympan is an Astrlabe-family component published by Datatech. Licence: FSL-1.1-ALv2 (Functional Source License, Version 1.1,
Apache 2.0 Future License); see `LICENSE`.

```sh
npm run build -w @datatechsolutions/tympan          # dist/index.js, index.d.ts, styles.css (builds @datatechsolutions/tympan-tokens first)
npm run typecheck -w @datatechsolutions/tympan
npm test -w @datatechsolutions/tympan               # vitest + Testing Library + axe-core
npm run gallery -w @datatechsolutions/tympan        # http://localhost:3310 (components, theme customizer)
npm run gallery:build -w @datatechsolutions/tympan  # static gallery in dist-gallery/
```

## Ready-made components and a ready theme system

Install (workspace or package registry), then import one stylesheet. It
already contains the `@datatechsolutions/tympan-tokens` stylesheet (every `--ty-*` custom
property for the `tympan`, `fakhir`, `astrlabe`, `neutral` and `high-contrast` presets, light and
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
            brand="Acme Research"
            context={<RailContextButton scope="EACH/USP" name="Censo IA gov" />}
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
            <PageHeader variant="editorial" title="Visão geral" trail={[{ label: 'EACH/USP', href: '/org' }, { label: 'Visão geral' }]} lead="…" />
            <StatStrip label="Estado da pesquisa" items={[{ id: 'r', value: 94, label: 'registros', href: '/base' }]} />
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
  `fakhir`, `astrlabe`, `neutral`, `high-contrast`, an opt-in `print-*` theme or a generated theme), `data-ty-mode` (`system`, `light`,
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

The canvas specs (wave 3 and the five canvas items of wave 4) live in a
separate package.

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
`THIRD_PARTY_NOTICES.md`, `LICENSE`.
