# @fakhir/ui

Accessible React components for Fakhir (React 18.3 or 19), built on
[React Aria Components](https://react-spectrum.adobe.com/react-aria/) and
styled with plain CSS custom properties (`--fk-*`) in `@layer fakhir`. No
Tailwind. Licence: FSL-1.1-ALv2 (Functional Source License, Version 1.1,
Apache 2.0 Future License); see `LICENSE`.

```sh
npm run build -w @fakhir/ui          # dist/index.js, index.d.ts, styles.css (builds @fakhir/tokens first)
npm run typecheck -w @fakhir/ui
npm test -w @fakhir/ui               # vitest + Testing Library + axe-core
npm run gallery -w @fakhir/ui        # http://localhost:3310 (components, theme customizer)
npm run gallery:build -w @fakhir/ui  # static gallery in dist-gallery/
```

## Ready-made components and a ready theme system

Install (workspace or package registry), then import one stylesheet. It
already contains the `@fakhir/tokens` stylesheet (every `--fk-*` custom
property for the `fakhir`, `neutral` and `high-contrast` presets, light and
dark), so no other CSS is needed:

```sh
npm install @fakhir/ui @fakhir/tokens react react-dom
```

```tsx
import '@fakhir/ui/styles.css' // components + tokens, in @layer fakhir.*
```

For a tailored theme, generate its CSS with `@fakhir/tokens`
(`generateThemeCss(resolveTheme(config))`, see its README or the gallery's
theme customizer, which exports DTCG and CSS) and load it after the
stylesheet; then select it with `ThemeProvider theme="<name>"`. Hosts that use
the tokens without components can import `@fakhir/tokens/tokens.css` alone.

### The research shell (no top bar)

```tsx
import '@fakhir/ui/styles.css'
import {
  AppFrame, FakhirProvider, FloatingActionBar, PageHeader, RailContextButton,
  RailNavItem, RailNavSection, StatStrip, ThemeProvider, ToastProvider, messagesPtBR,
} from '@fakhir/ui'
import { CheckSquare, FileStack, Home } from 'lucide-react'

export function App() {
  const [navOpen, setNavOpen] = useState(false)
  return (
    <FakhirProvider baseMessages={messagesPtBR} locale="pt-BR" navigate={router.navigate} useHref={useHref}>
      <ThemeProvider storageKey="fk-theme">
        <ToastProvider>
          <AppFrame
            layout="rail"
            ambient
            navOpen={navOpen}
            onNavOpenChange={setNavOpen}
            brand="Fakhir"
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
    </FakhirProvider>
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
  `--fk-action-bar-inset-<edge>` so the sheet never hides content under it.
- **Research pieces**: `PageHeader variant="editorial"` (mono trail, serif
  title, 68ch lead, actions, divider), `StatStrip`, `StageStrip`,
  `AttentionList`, `PhaseBar`, `ActivityFeed`, `EvidencePanel` (docked 340–420
  px ≥ 1280, drawer 1024–1279, bottom sheet below) and `ResizableSplit`.

### Providers

- **`FakhirProvider`**: copy (`messages` overrides on top of `baseMessages`,
  English by default, `messagesPtBR` included) and the router adapter
  (`navigate`, `useHref`) used by every link-like component. Components hold no
  hard-coded copy. `I18nAdapterProvider` and `RoutingProvider` (wave 2)
  plug a host i18n library or router in without FakhirProvider.
- **`ThemeProvider` / `useTheme`**: sets `data-fk-theme` (`fakhir`, `neutral`,
  `high-contrast` or a generated theme), `data-fk-mode` (`system`, `light`,
  `dark`) and `data-fk-density` (`compact`, `default`, `comfortable`) on
  `<html>` (or on a wrapper with `target="scope"`). Persistence belongs to the
  host: pass controlled values and callbacks, or `storageKey` for localStorage.
- **No flash of the wrong theme (SPA)**: put the output of
  `themeInitScript('fk-theme')` in an inline `<script>` in `<head>`, before the
  stylesheet; it sets the three attributes from storage before first paint.
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

- Class names are `fk-` prefixed (BEM-ish); state comes from React Aria data
  attributes (`[data-hovered]`, `[data-focus-visible]`, …) or `data-*` variants.
- Layers: `fakhir.tokens`, `fakhir.base`, `fakhir.components`. Host styles
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
