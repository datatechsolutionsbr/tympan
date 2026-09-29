import type { ElementDefinition } from '../definition.ts'

const text = (attribute: string, fallback: string, doc: string) => ({ type: 'string', attribute, default: fallback, doc }) as const

/**
 * `<ty-command-palette>`: the CommandPalette's single source (spec:
 * wave-2/command-palette.md). The global "jump to anything" dialog: a search
 * field over grouped commands, fuzzy-matched and highlighted, narrowed by
 * optional scopes, with per-item secondary actions, fallback actions when
 * nothing matches, and a remembered list of recent choices.
 *
 * The content is data-driven (groups of items, scopes, fallback actions),
 * which the declarative anatomy cannot express, so the element is
 * self-rendering like `<ty-theme-palette>`: while `open`, a native `<dialog>`
 * in the top layer holds the palette and the element composes the rows. Rows
 * carry ids, never callbacks (the same source can be rebuilt from any
 * catalogue); a choice is reported as `ty-select` and the host decides what
 * the id means. Row icons are text glyphs in the JSON form (`icon`) or 24×24
 * SVG path data (`iconPath`, which wins). Examples stay empty: the
 * parity renderers could not produce the composed rows.
 */
export const commandPaletteDefinition = {
  tag: 'ty-command-palette',
  name: 'TyCommandPalette',
  kind: 'self-rendering',
  doc: 'Global search-and-commands dialog in the top layer: a combobox field over grouped, fuzzy-matched results with scopes, per-item actions, fallback actions and recents. The query, the highlight and the actions sub-list reset on each open.',
  props: {
    open: { type: 'boolean', attribute: 'open', doc: 'Shown (a modal dialog in the top layer). The element closes itself after a choice or the stepped-back Escape — removing the attribute and asking the host with `ty-close` — so a controlled host follows the attribute.' },
    groups: { type: 'string', attribute: 'groups', doc: 'JSON array of groups: `{ id, heading, scopeId?, items: [{ id, label, description?, icon?, iconPath?, keywords?, hint?, shortcut?, scopeId?, actions?: [{ id, label, icon?, iconPath?, shortcut? }] }] }`. `keywords` are matched but not shown; `icon` is a text glyph; `iconPath` is an SVG icon as 24×24 path data rendered in the standard icon frame — when both are present `iconPath` wins, and subpaths separated by " | " become one `<path>` each. Unparseable or missing: no groups.' },
    scopes: { type: 'string', attribute: 'scopes', doc: 'JSON array of scopes: `[{ id, label, icon? }]`; empty means no scoping (no scope column, no scope keys).' },
    activeScope: { type: 'string', attribute: 'active-scope', doc: 'The active scope id; unset: everything. The element reflects user changes back to this attribute and reports them with `ty-scope-change`.' },
    loading: { type: 'boolean', attribute: 'loading', doc: 'Shows skeleton rows and announces the loading label instead of results.' },
    fallbackActions: { type: 'string', attribute: 'fallback-actions', doc: 'JSON array of actions offered when the query matches nothing: `[{ id, label, icon?, iconPath?, shortcut? }]`; `{query}` in a label is replaced by the query. `iconPath` is as in `groups` (an SVG icon wins over the `icon` text glyph).' },
    recentKey: { type: 'string', attribute: 'recent-key', doc: 'Browser-storage key of the recent store; enables it. Records the chosen item id with a count and a time, tolerant of storage being unavailable.' },
    recentVisible: { type: 'number', default: 5, attribute: 'recent-visible', doc: 'Recents shown when the query is empty, most chosen first (ties: most recent).' },
    recentKeep: { type: 'number', default: 12, attribute: 'recent-keep', doc: 'Most recent ids the store keeps.' },
    label: text('label', 'Search and commands', 'Accessible name of the dialog and the field.'),
    placeholder: text('placeholder', 'Search or type a command', 'Field placeholder.'),
    emptyLabel: text('empty-label', 'Type to search records, sources and screens.', 'Shown on an empty query with nothing to list.'),
    noResultsLabel: text('no-results-label', 'Nothing matches “{query}”.', 'Shown and announced when the query matches nothing; {query} is replaced.'),
    loadingLabel: text('loading-label', 'Loading results', 'Announced in the status region while `loading`.'),
    removeScopeLabel: text('remove-scope-label', 'Remove scope {scope}', 'Accessible name of the scope chip; {scope} is replaced by the scope label.'),
    actionsForLabel: text('actions-for-label', 'Actions for {label}', 'Heading of the actions sub-list; {label} is replaced by the item label.'),
    recentLabel: text('recent-label', 'Recent', 'Heading of the recent group.'),
    resultsLabel: text('results-label', '{count} results', 'Announced result count; {count} is replaced.'),
    scopesLabel: text('scopes-label', 'Scopes', 'Accessible name of the scope column.'),
    fallbackLabel: text('fallback-label', 'Other actions', 'Heading of the fallback group.'),
    hintNavigate: text('hint-navigate', 'move', 'Footer hint beside ↑↓.'),
    hintSelect: text('hint-select', 'open', 'Footer hint beside ↵.'),
    hintActions: text('hint-actions', 'actions', 'Footer hint beside →.'),
    hintBack: text('hint-back', 'back', 'Footer hint beside ←.'),
    hintClose: text('hint-close', 'close', 'Footer hint beside esc.'),
  },
  events: [
    { type: 'ty-select', kind: 'custom', detail: { id: 'string', kind: 'string', itemId: 'string' }, reactProp: 'onSelect', rustProp: 'on_select', doc: 'A row was chosen: an item (`kind: "item"`, `id` the item id), a secondary action (`kind: "action"`, `id` the action id, `itemId` its item) or a fallback action (`kind: "fallback"`). `itemId` is empty except for actions. The palette then closes itself and asks the host with `ty-close`.' },
    { type: 'ty-scope-change', kind: 'custom', detail: { scope: 'string' }, reactProp: 'onScopeChange', rustProp: 'on_scope_change', doc: 'The active scope changed (a scope button, the chip, Tab or Backspace); `scope` is the scope id, empty when cleared. The element reflects it to the `active-scope` attribute.' },
    { type: 'ty-close', kind: 'custom', reactProp: 'onClose', rustProp: 'on_close', doc: 'The palette asks to close (the stepped-back Escape reaching the top level, a press outside, or after a choice). The element closes itself too.' },
  ],
  examples: [],
} as const satisfies ElementDefinition
