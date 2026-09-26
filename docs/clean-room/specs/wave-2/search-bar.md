# SearchBar

Wave 2 · form · Status: specified

## Purpose
The search strip above a list or table: a search field, the currently active filters as removable chips, a clear-all or cancel control, an optional button that opens a filters dialog with a count, and a trailing slot for actions.

## Anatomy
- **Search landmark** wrapping everything.
- **Search field**: leading search icon, text input, inline clear button when text is present.
- **Active filter chips**: FilterChips inline (type icon or square of the category colour, label, remove button).
- **Clear all**: removes the query and all filters; replaced by **Cancel** (clears and leaves the field) in the mobile search style.
- **Filters trigger**: button with a count of active filters, opening the **filters dialog** (ModalDialog or Drawer on small screens) with title, optional context line (icon, label, count text), body from the host, a Clear action when filters are active, and Done.
- **Trailing slot**: extra controls (for example a create button or a density switch).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| query | string | required | Current text. |
| onQueryChange | (value: string) => void | required | Every edit. |
| placeholder | string | from I18nAdapter | Changes to a "refine" wording when filters are active. |
| filters | { kind: string; value: string; label: string; icon?: ReactNode }[] | [] | Active filters shown as chips. |
| onRemoveFilter | (filter) => void | none | Chip removal. |
| onClearAll | () => void | none | Clear all (shown when there is text or filters). |
| cancelStyle | boolean | false | Shows Cancel while focused instead of Clear all. |
| onCancel | () => void | none | Cancel pressed. |
| filterDialog | { open; onOpenChange; title?; activeCount?; onClear?; context?: { icon?; label; countText? }; content: ReactNode } | none | Enables the filters trigger and dialog. |
| end | ReactNode | none | Content inside the field end. |
| actions | ReactNode | none | Trailing slot. |
| bordered | boolean | true | Visual separation from what follows. |

Filter kinds map to category icons and categorical colours from §2.3 through a small host-supplied map; colour is never the only cue.

## States
Empty, typing, with filters, focused (Cancel visible in cancel style), filters dialog open, active count shown.

## Keyboard and ARIA
- Container: `search` landmark labelled by the placeholder or a host label.
- Field: APG pattern for a search textbox; RAC `SearchField` (Escape clears the text; the clear button is named "Clear search").
- Chips: RAC `TagGroup` with removable `Tag`s (Delete/Backspace removes the focused chip; arrow keys move between chips).
- Filters trigger: APG Button with `aria-haspopup="dialog"`; name includes the count ("Filters, 3 active"). Dialog: APG Dialog (Modal), RAC `Modal`; Done closes and returns focus to the trigger.
- Result count changes are announced by the list owner, not by the SearchBar.
- Cancel remains clickable after the field loses focus (the fork relies on a delay; the new component must keep the button reachable by keeping it visible while focus is anywhere inside the bar).

## Responsive, touch, motion, forced colours
- Under 640 chips wrap onto a second line and the trailing slot moves below; the filters dialog becomes a bottom Drawer.
- Clear, remove-chip, cancel and filters buttons at least 44 × 44 px target.
- No motion beyond `--fk-dur-instant` fades; none with reduced motion.
- Forced colours: field border and chip borders in system colours.

## Acceptance tests
- Given query "", then no inline clear and no clear-all are shown; given "abc", both apply.
- Given typing "a", then `onQueryChange("a")` fires.
- Given two filters, when a chip's remove button is pressed, then `onRemoveFilter` receives that filter.
- Given filters, then the placeholder uses the refine wording.
- Given `cancelStyle` and focus in the field, then Cancel is shown and pressing it calls `onCancel` and empties the query.
- Given a filter dialog with active count 3, then the trigger is named with "3" and opens a dialog; Clear appears only when `onClear` exists and count > 0; Done closes it.
- Given the bar, then a search landmark is exposed.
