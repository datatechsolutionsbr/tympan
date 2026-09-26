# @fakhir/design-system

Accessible React 19 components for Fakhir, built on
[React Aria Components](https://react-spectrum.adobe.com/react-aria/) and
styled with plain CSS custom properties (`--fk-*`) in `@layer fakhir`. No
Tailwind. MIT licence.

```sh
npm run build -w @fakhir/design-system          # dist/index.js, index.d.ts, styles.css (builds @fakhir/tokens first)
npm run typecheck -w @fakhir/design-system
npm test -w @fakhir/design-system               # vitest + Testing Library + axe-core
npm run gallery -w @fakhir/design-system        # http://localhost:3310 (components, theme customizer)
npm run gallery:build -w @fakhir/design-system  # static gallery in dist-gallery/
```

## Usage

```tsx
import '@fakhir/design-system/styles.css'
import { Button, FakhirProvider, PageHeader, ThemeProvider, ToastProvider, messagesPtBR } from '@fakhir/design-system'

export function App() {
  return (
    <FakhirProvider baseMessages={messagesPtBR} navigate={router.navigate} useHref={useHref}>
      <ThemeProvider storageKey="fk-theme">
        <ToastProvider>
          <PageHeader title="Fontes" actions={<Button variant="primary">Nova sessão</Button>} />
        </ToastProvider>
      </ThemeProvider>
    </FakhirProvider>
  )
}
```

- **`FakhirProvider`**: copy (`messages` overrides on top of `baseMessages`,
  English by default, `messagesPtBR` included) and the router adapter
  (`navigate`, `useHref`) used by every link-like component. Components hold no
  hard-coded copy.
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

## Records

`CLEAN-ROOM.md` (process and inputs), `PROVENANCE.md` (per component),
`THIRD_PARTY_NOTICES.md`, `LICENSE`.
