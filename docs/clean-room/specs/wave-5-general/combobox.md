# Combobox

Wave 5 · forms · Status: specified

Behaviour reference: shadcn/ui (MIT), read by the spec writer only.

## Purpose
Choose one value from a long list by typing to filter it. Covers the single-value case; TagField stays the multiple-value field.

## Anatomy
- **Label**, optional **hint**, optional **error message**.
- **Input** where the user types.
- **Open button** at the input end (optional) that shows the full list.
- **Clear button** at the input end (optional), shown only when there is text.
- **Popup list**: options (label, optional description and icon), optional **section headers** and **separators**, a **selected mark** on the chosen option, an **empty result** row, a **loading** row.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| label / accessibleLabel | string | one required | Field name. |
| options / sections | { id; label; description?; icon?; disabled? }[] or sections of them | required | Items; sections have a title. |
| selectedKey / defaultSelectedKey | string \| null | null | Chosen option. |
| onSelectionChange | (key: string \| null) => void | none | Fires on pick or clear. |
| inputValue / defaultInputValue / onInputChange | controlled text | label of the selection | Typed text. |
| filter | 'contains' \| 'startsWith' \| 'none' | 'contains' | Built-in filtering, locale-aware and accent-insensitive; `none` when the host filters (async search). |
| allowsCustomValue | boolean | false | When true, typed text that matches nothing is kept on blur and reported through `onInputChange`; when false, blur restores the selected option's label. |
| menuTrigger | 'input' \| 'focus' \| 'manual' | 'input' | Open when typing, on focus, or only by the open button or Arrow Down. |
| showOpenButton / showClear | boolean | true / false | End buttons. |
| loading | boolean | false | Shows a loading row and sets the busy state. |
| emptyLabel | string | from i18n ("No results") | Shown when nothing matches. |
| onLoadMore | () => void | none | Called when the list is scrolled near its end (paged results). |
| required / disabled / readOnly / errorMessage / hint / name / placeholder | as TextField | — | Standard field props. `name` submits the selected key. |

## States
Closed, open with results, open empty, open loading, option focused (virtual focus), selected, invalid, disabled, read-only.

## Keyboard and ARIA
- RAC `ComboBox` with `Input`, `Button`, `Popover` and `ListBox`; APG **Combobox** pattern (list popup, editable, with or without auto-select).
- Input has `role="combobox"`, `aria-expanded`, `aria-controls` the list and `aria-activedescendant` for the focused option; DOM focus stays in the input.
- Arrow Down opens the list (or moves to the next option); Arrow Up moves to the previous; Home and End move the caret in the input, not the option.
- Enter selects the focused option and closes; Escape closes; a second Escape clears the text when `allowsCustomValue` is false.
- Tab selects nothing new, closes the list and moves on.
- Clear button is a real button with an accessible name ("Clear"); after clearing, focus returns to the input.
- Section headers are group labels; separators are not focusable.
- The number of results is announced politely when the list changes ("5 results"); the empty state is announced.

## Responsive, touch, motion, forced colours
- On narrow screens the popup opens as a full-width Drawer (bottom placement) with the input repeated at its top, so the software keyboard does not cover the list.
- Option rows are at least `--ty-control-target` high on touch.
- Popup surface `--ty-surface-raised-solid`, shadow `--ty-shadow-floating`, stacking `--ty-z-popover`; focused option `--ty-accent-soft`; selected mark uses an icon, not colour alone.
- Popup opens with opacity only (`--ty-dur-quick`), zero under reduced motion.
- Forced colours: focused option in `Highlight` / `HighlightText`, popup border `CanvasText`.

## Acceptance tests
- Given options Brazil, Bulgaria, Chile, when "b" is typed, then the list opens with Brazil and Bulgaria.
- Given "bra" typed and Arrow Down then Enter, then Brazil is selected, the input shows "Brazil" and `onSelectionChange("brazil")` fires.
- Given `filter="contains"`, when "ile" is typed, then Chile is listed; given "startsWith", then it is not.
- Given text with accents typed without them ("sao"), then "São Paulo" matches.
- Given nothing matches, then the empty row reads the `emptyLabel` and is announced.
- Given `allowsCustomValue` false and "Xyz" typed, when focus leaves, then the input shows the previous selection's label.
- Given `allowsCustomValue` true and "Xyz" typed, when focus leaves, then "Xyz" stays and the selection is null.
- Given a selection and `showClear`, when Clear is pressed, then the selection is null, the text is empty and focus is in the input.
- Given the list open, when Escape is pressed, then it closes and the text is unchanged.
- Given a narrow viewport, when the list opens, then it is presented in a Drawer.
- Given `loading`, then the list shows the loading row and the field is marked busy.
