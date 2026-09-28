import type { ElementDefinition } from '../definition.ts'

/**
 * `<ty-wheel-picker>`: the WheelPicker's single source (spec: wave-2/wheel-picker.md).
 *
 * Self-rendering: the choices are data (a JSON array in `options`, or one
 * entry per wheel in `columns`), which the declarative anatomy cannot
 * express (no dynamic repetition), so the element owns its whole subtree and
 * frameworks render an empty host — the theme palette precedent. `examples`
 * stays empty for the same reason: the parity renderers have no anatomy to
 * render.
 *
 * Accessibility mirrors the React WheelPicker (RAC ListBox) and the APG
 * single-select listbox: each wheel is a focusable `role="listbox"` named by
 * its label, each row an `option` with `aria-selected`, the centred row named
 * by `aria-activedescendant`. The multi-column form wraps the wheels in a
 * `group` named by `label`. ArrowUp/ArrowDown move one row, PageUp/PageDown
 * move by `visibleRows`, Home/End go to the ends, and a printable character
 * jumps to the next row whose label starts with it.
 */
export const wheelPickerDefinition = {
  tag: 'ty-wheel-picker',
  name: 'TyWheelPicker',
  kind: 'self-rendering',
  doc: 'Touch-friendly vertical scroller that picks one value from an ordered list by centring it in a selection band (drag or flick scrolls and snaps, a tap selects, the keyboard moves by row, page or ends). With `columns`, several wheels sit side by side for compound values (day, month, year), each with its own width share.',
  props: {
    options: { type: 'string', attribute: 'options', doc: 'JSON array of the ordered choices: plain strings, or { "value", "label" } objects when the shown text differs from the reported value.' },
    value: { type: 'string', attribute: 'value', doc: 'Selected value. A value no option holds centres the first row and reports nothing until the wheel moves; programmatic changes animate the wheel to the new row.' },
    label: { type: 'string', attribute: 'label', doc: 'Accessible name of the wheel; with `columns`, of the whole group.' },
    visibleRows: { type: 'number', default: 5, attribute: 'visible-rows', doc: 'Rows visible at once; an even number rounds up to the next odd one (minimum 3).' },
    disabled: { type: 'boolean', attribute: 'disabled', doc: 'Shown but not changeable: the wheel stays focusable, taps, scrolling and keys do not select.' },
    columns: { type: 'string', attribute: 'columns', doc: 'Multi-column form: JSON array of { "label", "options", "value", "share"? }, one wheel per entry; `share` is its relative width. Wins over `options` and `value`.' },
    testId: { type: 'string', attribute: 'test-id', doc: 'Test hook on the wheel (`data-testid`).' },
  },
  events: [
    { type: 'ty-change', kind: 'custom', detail: { value: 'string', column: 'number' }, reactProp: 'onChange', rustProp: 'on_change', doc: 'The wheel settled on a new value, or a row was activated (tap, arrows, PageUp/PageDown, Home/End, typeahead). `value` is the option\'s value, not its label; `column` is the wheel\'s index (0 for a single wheel).' },
  ],
  examples: [],
} as const satisfies ElementDefinition
