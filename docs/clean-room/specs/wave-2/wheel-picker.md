# WheelPicker

Wave 2 · form · Status: specified

## Purpose
A touch-friendly vertical scroller that picks one value from an ordered list by centring it in a selection band; several can sit side by side to pick compound values (e.g. day, month, year).

## Anatomy
- Viewport showing an odd number of rows, with fade masks at top and bottom.
- Selection band across the middle row.
- Scrolling column of option rows; rows farther from the band are shown with less emphasis.
- Multi-column variant: several wheels in a row, each with its own width share and label.

## Properties and events
Single wheel:
| Name | Type | Default | Meaning |
|---|---|---|---|
| options | string[] or { value: string; label: string }[] | required | Ordered choices. |
| value | string | required | Selected value; a value not in the list shows the first row centred and reports nothing. |
| onChange | (value: string) => void | required | Called after the wheel settles on a new value, or on tap of a row. |
| label | string | required | Accessible name of the wheel. |
| visibleRows | odd number | 5 | Rows visible at once. |

Multi-column:
| Name | Type | Default | Meaning |
|---|---|---|---|
| columns | { label: string; options; value; onChange; share?: number }[] | required | One wheel per entry; `share` is a relative width. |
| label | string | required | Name of the whole group. |

## Behaviour
- Dragging or flicking scrolls; on release the wheel snaps to the nearest row and reports it if it changed.
- Tapping a row selects it (ignored if the tap ended a drag).
- A selection haptic tick fires as each row crosses the band and on settle (see Haptics).
- Programmatic value changes animate the wheel to the new row.

## States
Idle, dragging, settling, focus-visible (band outlined), disabled.

## Keyboard and ARIA
- APG pattern: Listbox (single select, with the active option centred). Backed by RAC `ListBox` with `selectionMode="single"` and `shouldFocusWrap` false; alternatively APG Spinbutton when options are numeric.
- ArrowUp/ArrowDown move one row and select; PageUp/PageDown move by `visibleRows`; Home/End go to first/last; typing a character jumps to the next label starting with it.
- Each row is an option; the selected option has `aria-selected`. Multi-column wraps wheels in a group named by `label`.

## Responsive, touch, motion, forced colours
- Row height at least 44.
- Snap and programmatic scroll use `--fk-dur-base` with `--fk-ease`; with reduced motion the wheel jumps without animation and rows keep equal emphasis (no scale effect).
- Reduced transparency: fade masks become solid surface bands.
- Forced colours: the selection band is drawn with a system-highlight border; the selected label stays in CanvasText.

## Acceptance tests
- Given options ["a","b","c"] and value "a", When the row "c" is clicked, Then onChange receives "c".
- Given object options, When a row is activated, Then onChange receives the value, not the label.
- Given focus on the wheel and value "a", When ArrowDown is pressed, Then onChange receives "b".
- Given a value not in the list, When rendered, Then nothing throws and onChange is not called.
- Given a multi-column picker with two columns, When the second column changes, Then only the second column's onChange is called.
- Given reduced motion, When the value changes, Then the wheel moves without animation.

## Open questions
- The fork offered only pointer and touch interaction; keyboard and listbox semantics are required here.
