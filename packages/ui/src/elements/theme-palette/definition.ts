import type { ElementDefinition } from '../definition.ts'

const text = (attribute: string, fallback: string, doc: string) => ({ type: 'string', attribute, default: fallback, doc }) as const

/**
 * `<ty-theme-palette>`: a command palette over every Tympan theme, the
 * colour mode and the density. Choosing a row applies it to the document
 * (`data-ty-theme` / `data-ty-mode` / `data-ty-density` on `<html>`) and
 * stores it under `storage-key` in the format ThemeProvider and
 * `themeInitScript` read, so React and non-React hosts share one choice.
 */
export const themePaletteDefinition = {
  tag: 'ty-theme-palette',
  name: 'TyThemePalette',
  kind: 'self-rendering',
  doc: 'Theme, mode and density picker in the command palette\'s look; a native <dialog> in the top layer while open.',
  props: {
    open: { type: 'boolean', attribute: 'open', doc: 'Shown (a modal dialog in the top layer).' },
    apply: { type: 'boolean', attribute: 'apply', doc: 'Apply the stored choice (or the defaults) to the document as soon as the element connects, and again when a default changes.' },
    storageKey: text('storage-key', 'ty-theme', 'localStorage key of the choice ({ theme, mode, density } JSON, as ThemeProvider stores it).'),
    defaultTheme: text('default-theme', 'tympan', 'Theme when nothing is stored (a host passes its organization default here).'),
    defaultMode: { type: 'enum', values: ['system', 'light', 'dark'], default: 'system', attribute: 'default-mode', doc: 'Mode when nothing is stored.' },
    defaultDensity: { type: 'enum', values: ['compact', 'default', 'comfortable'], default: 'default', attribute: 'default-density', doc: 'Density when nothing is stored.' },
    themes: { type: 'string', attribute: 'themes', doc: 'Comma-separated theme names to offer; all of them when empty.' },
    printStylesheet: { type: 'string', attribute: 'print-stylesheet', doc: 'URL of print-themes.css, linked while a print theme is applied.' },
    loadFonts: { type: 'boolean', attribute: 'load-fonts', doc: 'Link the font stylesheet a theme names (off: no request to a font host).' },
    themeLabels: { type: 'string', attribute: 'theme-labels', doc: 'JSON object of translated theme names, by theme name.' },
    label: text('label', 'Appearance', 'Accessible name of the dialog and the field.'),
    placeholder: text('placeholder', 'Search themes, modes and densities', 'Field placeholder.'),
    emptyLabel: text('empty-label', 'No matches', 'Shown when nothing matches.'),
    resultsLabel: text('results-label', '{count} results', 'Announced result count; {count} is replaced.'),
    groupPresets: text('group-presets', 'Themes', 'Heading of the built-in themes.'),
    groupPrint: text('group-print', 'Print styles', 'Heading of the print themes.'),
    groupMode: text('group-mode', 'Mode', 'Heading of the colour modes.'),
    groupDensity: text('group-density', 'Density', 'Heading of the densities.'),
    modeSystem: text('mode-system', 'System', 'Label of the system colour mode.'),
    modeLight: text('mode-light', 'Light', 'Label of the light mode.'),
    modeDark: text('mode-dark', 'Dark', 'Label of the dark mode.'),
    densityCompact: text('density-compact', 'Compact', 'Label of the compact density.'),
    densityDefault: text('density-default', 'Default', 'Label of the default density.'),
    densityComfortable: text('density-comfortable', 'Comfortable', 'Label of the comfortable density.'),
    currentLabel: text('current-label', 'Current', 'Marks the row in use.'),
    hintNavigate: text('hint-navigate', 'move', 'Footer hint beside ↑↓.'),
    hintSelect: text('hint-select', 'choose', 'Footer hint beside ↵.'),
    hintClose: text('hint-close', 'close', 'Footer hint beside esc.'),
  },
  events: [
    { type: 'ty-theme-change', kind: 'custom', detail: { theme: 'string', mode: 'string', density: 'string' }, reactProp: 'onThemeChange', doc: 'A row was chosen and applied; the detail is the whole appearance.' },
    { type: 'ty-close', kind: 'custom', reactProp: 'onClose', doc: 'The palette asks to close (Escape, a press outside, or after a choice). The element closes itself too.' },
  ],
  examples: [],
} as const satisfies ElementDefinition
