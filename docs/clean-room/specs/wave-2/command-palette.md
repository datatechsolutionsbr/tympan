# CommandPalette

Wave 2 · overlay · Status: specified

## Purpose
The global "jump to anything" dialog opened with Cmd/Ctrl+K: a search field over grouped commands and records, fuzzy-matched and highlighted, narrowed by optional scopes, with per-item secondary actions, fallback actions when nothing matches, and a remembered list of recent choices.

## Anatomy
- **Dialog panel** near the top of the screen (§2.5 level 4).
- **Search field** with the active scope shown as a removable chip before the text.
- **Scope column** (optional): list of scopes (for example Records, Sources, References, Screens).
- **Results**: groups with a heading; each item has icon, label with matched characters marked, optional description, trailing hint (for example a path), shortcut keys, and a chevron when it has actions.
- **Actions sub-list**: the secondary actions of the highlighted item, titled "Actions for {item}".
- **Fallback list**: actions offered when there is no match (for example "Create '{query}'").
- **Empty, no-results and loading views** (loading uses Skeleton rows).
- **Footer hints**: keys for navigate, select, actions, back, close.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| open / onClose | boolean / () => void | required | Visibility. Query, highlight and sub-list reset on each open. |
| groups | { id; heading; scopeId?; items: CommandItem[] }[] | required | Content. |
| CommandItem | { id; label; description?; icon?; keywords?; hint?; shortcut?; scopeId?; actions?: CommandAction[]; onSelect } | — | One row; `keywords` are matched but not shown. |
| CommandAction | { id; label; icon?; shortcut?; onSelect } | — | Secondary or fallback action; `{query}` in a fallback label is replaced by the query. |
| scopes | { id; label; icon? }[] | [] | Scope column; empty means no scoping. |
| activeScope / onScopeChange | string \| null / (id: string \| null) => void | uncontrolled | Scope state. |
| loading | boolean | false | Shows loading rows and a status message. |
| fallbackActions | CommandAction[] | [] | Shown when the query matches nothing. |
| labels | object | from I18nAdapter | Placeholder, empty, no results with `{query}`, loading, remove scope, actions for `{label}`, footer hints. |
| label | string | from I18nAdapter | Accessible name of dialog and field. |
| recent | { storageKey: string; visible?: number } | none | Enables the recent store (below). |

Matching: a query matches when its characters appear in order in the label, description, keywords or group heading; contiguous runs, word starts and earlier positions rank higher; results are sorted by score within groups. Only label matches are highlighted.

Recent store: records the chosen item id with a count and time, keeps at most 12 (configurable), shows up to 5 when the query is empty, ordered by count then recency; persisted in browser storage under the host key and tolerant of storage being unavailable.

## States
Closed; open-empty query (recent and all items); filtering; no results (with or without fallback); loading; scope active; actions sub-list open; item highlighted by keyboard or pointer.

## Keyboard and ARIA
- APG Combobox (list popup) inside an APG Dialog (Modal). RAC `Modal` + `Dialog` containing `Autocomplete` with `SearchField` and `Menu`/`ListBox` sections; `aria-activedescendant` tracks the highlight; `aria-expanded` reflects whether results exist.
- Down/Up move the highlight and wrap; Home/End jump; Enter runs the highlighted item (or action) and closes.
- Right Arrow or the row chevron opens the actions sub-list without running the primary; Left Arrow returns.
- Tab or Right Arrow on an empty query activates the first scope; with a typed prefix matching a scope label, Tab activates that scope and clears the query; Backspace on an empty query removes the scope; activating the active scope again clears it.
- Escape steps back: first closes the sub-list, then clears the scope, then closes the dialog; focus returns to the opener.
- Matched characters use `mark`. Result counts and "no results" are announced politely; loading is a status region.
- The global shortcut is registered by the host (AppFrame) and ignored while typing in another text field unless the host opts in.

## Responsive, touch, motion, forced colours
- Under 640 the dialog is full screen and the scope column becomes a horizontal chip row; footer hints are hidden on touch.
- Rows at least 44 px tall on touch.
- Opening fade in `--fk-dur-quick`; reduced motion: none.
- Forced colours: highlighted row uses `Highlight`/`HighlightText`; `mark` keeps a visible style.

## Acceptance tests
- Given closed, then nothing renders; given open, then a combobox and all items render with group headings.
- Given query "src", then only items whose text contains s, r, c in order remain, and matched label characters are marked.
- Given two matches where one is a contiguous prefix, then the prefix ranks first.
- Given Down pressed on the last row, then the highlight wraps to the first.
- Given an item with actions highlighted, when Right Arrow then Enter, then the first action runs, the primary does not, and the dialog closes.
- Given an active scope and an empty query, when Escape, then the scope clears and the dialog stays open.
- Given no match and a fallback "Create '{query}'", then "Create 'xyz'" is offered and Enter runs it.
- Given `loading`, then a status region with the loading label is present and no results.
- Given the dialog is reopened, then the query is empty.
- Given item "a" chosen three times and "b" once, when reopened with an empty query, then recent shows "a" before "b".
