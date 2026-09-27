# Wave 5 (general): behaviour additions to existing Tympan components

Date: 2026-09-26. Behaviour reference: shadcn/ui (MIT), read by the spec
writer only. Each section adds behaviour to a component that already has a
spec and an implementation; everything not mentioned stays as specified.
Sections follow the spec template in short form: additions (properties and
behaviour), keyboard and ARIA, responsive and motion, acceptance tests.
Order follows `COVERAGE.md`.

---

## ActionMenu

Also used by Menubar and ContextMenu.

### Additions
- **Submenu entry**: `{ type: 'submenu'; id; label; icon?; disabled?; items: ActionMenuEntry[] }`. Opens a nested menu beside its item; nesting depth is not limited but more than two levels is discouraged.
- **Checkbox item**: `{ type: 'checkbox'; id; label; checked; disabled?; shortcut? }`; changes reported by `onCheckedChange(id, checked)`. The menu stays open after toggling when `closeOnSelect` is false (default true, as today).
- **Radio group**: `{ type: 'radio-group'; id; title?; value; items: { value; label; disabled? }[] }`; changes reported by `onRadioChange(groupId, value)`.
- **Section title alignment**: when any item in a menu has an icon or a check column, section titles and plain items line up with the text column (inset), so labels form one column.
- **Item description**: optional second line under the label.
- `closeOnSelect` prop (default true) for menus used as quick filters.

### Keyboard and ARIA
- RAC `SubmenuTrigger`, `MenuSection`, and `MenuItem` in `selectionMode` single or multiple per section.
- Submenu item: `aria-haspopup="menu"` and `aria-expanded`; Arrow Right (reading direction aware), Enter or Space open it on its first item; Arrow Left or Escape closes it and returns to its item; pointer hover opens it after a short intent delay and keeps it open while moving diagonally toward it.
- Checkbox items: `menuitemcheckbox` with `aria-checked`. Radio items: `menuitemradio` with `aria-checked`, grouped under the title.
- The check indicator is an icon, never colour alone.

### Responsive and motion
- In the Drawer presentation (narrow screens and ContextMenu long press), a submenu opens as a nested page with a back button named "Back to {parent}".
- Submenus open with opacity only, `--ty-dur-quick`, zero under reduced motion.

### Acceptance tests
- Given a submenu "Move to" focused, when Arrow Right is pressed, then the submenu opens with its first item focused; Arrow Left closes it and focus returns to "Move to".
- Given a checkbox item "Show grid" unchecked, when activated, then `onCheckedChange("grid", true)` fires and it reports checked.
- Given a radio group with "Name" checked, when "Date" is activated, then `onRadioChange` fires with "date" and only Date is checked.
- Given `closeOnSelect` false, when a checkbox item is toggled, then the menu stays open.
- Given a narrow viewport, when a submenu item is chosen in the Drawer, then its items replace the list and a Back button is first.

---

## AppNavigation (Sidebar and Navigation Menu gaps)

### Additions
- **Toggle shortcut**: optional `toggleShortcut` (default Mod+B, off unless the host enables it) that collapses and expands the sidebar or rail; ignored while focus is in a text entry.
- **Remembered state**: optional `persistKey`; the collapsed state is stored per device (storage failures are silent) and restored before first paint where possible, so the layout does not jump.
- **Item badges and actions**: each entry may carry a count (CountBadge) and one secondary action (a "more" ActionMenu trigger) revealed on hover or focus within, always visible on touch.
- **Rich top-bar panels** (`layout="topbar"`): a top-level entry may open a panel of grouped links with titles and one-line descriptions instead of a plain list. Panels share one floating surface that resizes between entries.

### Keyboard and ARIA
- The shortcut is announced in the collapse button's `aria-keyshortcuts` and shown with KeyboardKey in its tooltip.
- Collapsed icon-only entries keep their names and show the Tooltip spec on focus and hover.
- Rich top-bar panels follow the APG **Disclosure Navigation Menu** pattern: each top-level item is a button with `aria-expanded` controlling its panel; the panel content is ordinary links in a `nav` landmark; Escape closes the panel and returns focus to its button; Tab moves through the panel then on to the next top-level item. Hover opens after an intent delay; a press toggles.
- Item actions are separate tab stops after the item link, with names that include the item ("More actions for Reports").

### Responsive and motion
- Below the medium breakpoint the sidebar is a Drawer opened from the top bar (as today); the shortcut toggles that Drawer.
- Width change animates with `--ty-dur-base`, instant under reduced motion. The shared panel surface resizes with `--ty-dur-quick`, instant under reduced motion.

### Acceptance tests
- Given `toggleShortcut` enabled, when Mod+B is pressed outside a text field, then the sidebar toggles; inside a text field, nothing happens.
- Given `persistKey` and a collapsed sidebar, when the page reloads, then it opens collapsed without a visible expand-then-collapse.
- Given an entry with a count of 3, then the entry's name includes "3 new" (from i18n) and a CountBadge is shown.
- Given a top-bar item with a rich panel, when Enter is pressed on it, then the panel opens and Escape closes it with focus back on the item.

---

## Avatar

### Additions
- **Status badge**: optional `status` of 'online' \| 'away' \| 'busy' \| 'offline' or a custom icon, drawn as a small mark on the frame's bottom end corner, sized with the avatar step (hidden at the smallest size, where the status goes into the name only).
- **Image loading state**: while the image loads, the fallback shows (not an empty frame); the image replaces it when loaded.

### Keyboard and ARIA
- The status is appended to the accessible name ("Ana, online"), from i18n. The mark is decorative.
- Status uses shape and colour together (filled dot, ring, dash), never colour alone.

### Acceptance tests
- Given `status="busy"` and name "Ana", then the accessible name is "Ana, busy".
- Given the smallest size and a status, then no mark is drawn but the name still includes the status.
- Given a slow image, then the fallback initials show until the image has loaded.

---

## Button

### Additions
- None required. The reference set's "link-looking button" is served by Link (navigation) and Button `quiet` (action). Document this pairing in the Button docs so hosts do not style buttons as links.

---

## CommandPalette

### Additions
- **Inline presentation**: `presentation: 'modal' | 'inline'` (default 'modal'). Inline renders the search input and results inside any container (a Popover used as a searchable picker, a side panel, an empty state) with the same grouping, scopes, recent items and empty and loading rows, but without the modal frame, backdrop or global open shortcut.
- `onSelect(action)` fires in both presentations; inline does not close anything by itself.

### Keyboard and ARIA
- Inline uses the same combobox-plus-listbox pattern (RAC `Autocomplete` with `SearchField` and `Menu` or `ListBox`), focus stays in the input, Arrow keys move through results, Enter runs the focused one, Escape clears the query (and, inside a Popover, a second Escape closes the Popover).

### Acceptance tests
- Given `presentation="inline"` inside a Popover, when "rep" is typed and Enter pressed, then `onSelect` fires with the first matching action and the palette stays mounted.
- Given inline with a query, when Escape is pressed, then the query clears; a second Escape closes the surrounding Popover.
- Given inline, then no backdrop is rendered and the global shortcut does not open it.

---

## DataTable

### Additions
- **Column visibility**: `hiddenColumns` / `defaultHiddenColumns` / `onHiddenColumnsChange`, plus a ready-made "Columns" ActionMenu with checkbox items listing hideable columns (`hideable` flag per column; the first column is never hideable).
- **Filter bar slot**: a `toolbar` slot above the table for host filters (FilterField, FilterChips) with a documented contract: the table reports `rowCount` changes and shows the host `emptyState` with a "Clear filters" action when filters produce no rows.
- **Row count text**: optional "{selected} of {total} rows selected" status line below the table, announced politely when selection changes.

### Keyboard and ARIA
- Hidden columns are removed from the grid (not only hidden visually); `aria-colcount` reflects the visible count.
- The Columns menu follows the ActionMenu checkbox items.

### Acceptance tests
- Given a hideable "Email" column, when it is unchecked in the Columns menu, then the column is gone from the grid and `onHiddenColumnsChange` reports it.
- Given the first column, then it is not listed in the Columns menu.
- Given two selected rows out of 40, then the status line reads "2 of 40 rows selected".

---

## Drawer

### Additions
- **Placements**: add `start` and `top` to `bottom` and `end`.
- **Drag to dismiss** (bottom and top placements, and `end` and `start` on touch): dragging the handle or the sheet toward its edge beyond a threshold, or with enough velocity, closes it; releasing before the threshold springs it back. Scrolling content inside the sheet takes priority until it is scrolled to its edge.
- **Snap points** (bottom placement): `snapPoints` as named stops ('peek', 'half', 'full') and `activeSnap` / `onActiveSnapChange`; dragging settles on the nearest stop; the handle cycles through stops on press.
- `dismissible` false disables both drag and backdrop dismissal (already present for the backdrop).

### Keyboard and ARIA
- The handle is a RAC `Button` named "Resize sheet" (from i18n) when snap points exist, cycling stops with Enter and Space and announcing the new stop; without snap points it is decorative.
- Escape still closes; focus handling unchanged.

### Responsive and motion
- Drag follows the finger with no easing; settle and dismiss use `--ty-dur-base` and `--ty-ease-out`; under reduced motion the sheet moves instantly and dragging still works.
- The backdrop opacity follows the drag position.

### Acceptance tests
- Given a bottom Drawer, when dragged down past the threshold and released, then it closes and `onOpenChange(false)` fires.
- Given a short drag and release, then it returns to its position.
- Given scrolled content inside the sheet, when the user drags down, then the content scrolls until its top before the sheet moves.
- Given snap points peek and full, when the handle is pressed, then the sheet moves to the next stop and the stop name is announced.
- Given `placement="start"`, then the sheet enters from the reading-direction start edge.

---

## Field

### Additions
- **Orientation**: `orientation: 'vertical' | 'horizontal' | 'responsive'` (default vertical). Horizontal puts the label (and description) beside the control, used for switches and checkboxes in settings lists; responsive is vertical in narrow containers and horizontal from the container's medium width (container query, not viewport).
- **Labelled separator**: FieldSeparator with optional text ("or continue with") between groups of fields; the text is ordinary content, the lines are decorative.
- **Merged errors**: `errorMessage` may be a list; duplicates are removed; one message renders as text, several as a list.
- **Choice-card label**: a Field whose label wraps the whole control row so the entire card toggles the checkbox or switch inside.

### Keyboard and ARIA
- Orientation does not change reading or tab order: label, description, control, error.
- Several errors are one error region linked by `aria-describedby` and announced as a whole.

### Acceptance tests
- Given `orientation="responsive"` in a narrow container, then the label is above the control; in a wide container, beside it.
- Given errors ["Required", "Required", "Too short"], then two messages show as a list.
- Given a FieldSeparator with text "or", then "or" is read and no separator role hides it.

---

## ListRow (Item gaps)

### Additions
- **Media**: `media` with `kind: 'icon' | 'avatar' | 'image'`; image media is a square thumbnail (AspectFrame square) at the start.
- **Whole-row link**: `href` or `onPress` makes the row's main area one Link or Button; row actions stay separate controls after it.
- **Header and footer lines**: optional `header` (above the title, for example a category or time) and `footer` (below, for example tags).
- **Size steps**: `size: 'compact' | 'small' | 'regular'`.
- **Appearance**: `appearance: 'plain' | 'outlined' | 'quiet'` (outlined frames each row; quiet uses the sunken fill).
- **ListRowGroup**: wraps rows in a `list` with optional separators between them.

### Keyboard and ARIA
- With `href`, the row's name is the title (plus subtitle as description); actions are named with the row ("Delete Invoice 42").
- Whole-row press area never contains the actions (no nested interactive elements).

### Acceptance tests
- Given `href`, when the title area is activated with Enter, then navigation happens; the actions remain separately focusable.
- Given `media.kind="image"`, then a square thumbnail shows at the start and is decorative unless an alt text is given.
- Given a ListRowGroup of 3 rows, then a list with 3 items is exposed.

---

## OneTimeCodeField

### Additions
- **Grouping**: `groups` as a list of box counts (for example [3, 3]) with a decorative separator between groups; `length` equals the sum.
- **Pattern**: the existing `characters` option gains 'alphanumeric-upper' (typed letters become upper case).

### Keyboard and ARIA
- Grouping is visual only; the field remains one control for assistive tech, and each box keeps its "{n} of {total}" label; the separator is hidden from assistive tech.
- Paste of a code with a separator character ("123-456") strips it.

### Acceptance tests
- Given `groups` [3, 3], then two groups of three boxes show with a separator between them.
- Given "123-456" pasted, then all six boxes are filled and `onComplete("123456")` fires.
- Given 'alphanumeric-upper' and "a" typed, then "A" is entered.

---

## ResizableSplit

### Additions
- **Orientation**: `orientation: 'horizontal' | 'vertical'` (vertical stacks panes top and bottom; the splitter moves up and down).
- **More panes**: a ResizableGroup form with any number of panes, each with `defaultSize`, `minSize`, `maxSize` as shares of the group, and a splitter between each pair; moving one splitter only takes space from its two neighbours until they reach their minimum, then from the next ones.
- **Collapsible pane**: `collapsible` with `collapsedSize` (zero or a rail); dragging below the minimum snaps the pane collapsed; `onCollapsedChange`.
- **Persisted layout**: optional `persistKey` stores sizes per device.
- **Visible grip**: optional `showGrip` draws a small handle on the splitter for discoverability.

### Keyboard and ARIA
- Each splitter is an APG **Window Splitter** (as today) with `aria-orientation` matching the split and `aria-valuenow` as the share of the pane it controls.
- Arrow keys along the split axis move it; Enter toggles collapse on a collapsible pane; Home and End go to the pane's minimum and maximum.

### Acceptance tests
- Given `orientation="vertical"`, when Arrow Down is pressed on the splitter, then the top pane grows.
- Given three panes, when the first splitter is dragged toward the end past the second pane's minimum, then the third pane shrinks.
- Given a collapsible pane, when Enter is pressed on its splitter, then it collapses and `onCollapsedChange(true)` fires; Enter again restores the previous size.
- Given `persistKey`, when sizes change and the page reloads, then the sizes are restored.

---

## Surface (Card gaps)

### Additions
- **Header action**: `headerAction` slot at the end of the title row (a quiet Button, ActionMenu trigger or Switch), aligned with the title and wrapping below it on narrow widths.
- **Compact size**: `density: 'regular' | 'compact'` reduces inner spacing one step (`--ty-space-*` scale) for dense dashboards.
- **Full-bleed media**: an optional `media` slot at the top that reaches the frame edges (inside the rounded corners), for images via AspectFrame.

### Keyboard and ARIA
- When the Surface itself is pressable (`onPress` or `href`), `headerAction` is not allowed (no nested interactive elements); a development warning explains the conflict.

### Acceptance tests
- Given a title and a `headerAction`, then the action sits at the title row's end and is reachable after the title in tab order.
- Given `onPress` and `headerAction`, then a development warning is raised.
- Given `density="compact"`, then inner spacing is one step smaller than regular.

---

## Tabs

### Additions
- **Appearance**: `appearance: 'contained' | 'underline'` (default contained, the current look). Underline shows a line under the whole list and a thicker accent line under the selected tab, suited to page-level navigation.
- **Tab icons and counts**: each tab may carry an icon and a CountBadge.

### Keyboard and ARIA
- Unchanged (RAC `Tabs`); counts are part of the tab name ("Open, 4").

### Responsive and motion
- The underline indicator slides between tabs with `--ty-dur-quick` and `--ty-ease-out`; instant under reduced motion. Forced colours: the selected tab is marked by the indicator in `Highlight` and by weight.

### Acceptance tests
- Given `appearance="underline"`, then the selected tab has the indicator and the list has a baseline.
- Given a tab "Open" with count 4, then its accessible name is "Open, 4".

---

## Toast

### Additions
- **Promise-bound toast**: `toast.promise(promise, { loading, success, error })` shows a persistent loading toast (with Spinner), then replaces it in place with the success or error toast when the promise settles; success and error texts may be functions of the result or the error.
- **Update in place**: `toast.update(id, options)` changes title, message, tone, action or duration of an open toast without re-announcing unchanged text.
- **Description line and cancel action**: an optional secondary action ("Undo" plus "Dismiss") besides the existing single action.

### Keyboard and ARIA
- The loading toast is polite; the settled toast replaces it and is announced once (errors assertively, as today).
- Updating a toast keeps its position and focus if focus is inside it.

### Acceptance tests
- Given `toast.promise` with a promise that resolves, then a loading toast shows first and is replaced by the success toast with the same id.
- Given the promise rejects, then the error toast replaces it and is announced assertively.
- Given `toast.update(id, { title: "Saved" })` on an open toast, then its title changes in place and nothing new is stacked.
