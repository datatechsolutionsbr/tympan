import type { ElementDefinition } from '../definition.ts'

/**
 * `<ty-segmented-control>`: the SegmentedControl's single source (spec:
 * wave-1/segmented-control.md).
 *
 * APG Radio Group: one tab stop on the selected segment, the arrow keys move
 * the selection and the focus (wrapping, direction following the reading
 * direction), Home/End jump. No live region — the `aria-checked` state
 * conveys the change.
 *
 * The anatomy is the track only (the labelled group with its size, width and
 * disabled states); the segments are a dynamic repetition the declarative
 * anatomy cannot express, so the element composes them from `options` on
 * upgrade, the way the skeleton composes its presets. The segment nodes the
 * element renders mirror the React SegmentedControl exactly (`.ty-segmented-
 * control__segment` with `data-selected`, a `.ty-segmented-control__label`
 * span, an optional lucide-style stroke icon) so the one component CSS
 * covers every renderer. `options` is a JSON array — a string is both value
 * and label, an object is `{ value, label, icon? }` with `icon` the `d` of a
 * 24×24 stroke path.
 */
export const segmentedControlDefinition = {
  tag: 'ty-segmented-control',
  name: 'TySegmentedControl',
  kind: 'enhancing',
  doc: 'Exactly one of a small set (two to five) of mutually exclusive options, changed in place — a radio group painted as segments. The segments are composed by the element from `options` (JSON); selecting the selected segment again does nothing. With `value` the control is controlled (the host answers `ty-change`); without it the element keeps the selection and mirrors it into the `value` attribute.',
  props: {
    options: { type: 'string', attribute: 'options', doc: 'The segments as a JSON array of `string` (both value and label) or `{ "value", "label", "icon"? }`; `icon` is the `d` of a 24×24 stroke path (lucide style).' },
    value: { type: 'string', attribute: 'value', doc: 'The selected value (controlled). Unset, the element keeps the selection itself and mirrors it here.' },
    defaultValue: { type: 'string', attribute: 'default-value', doc: 'The initially selected value when uncontrolled; the first option when unset.' },
    label: { type: 'string', attribute: 'label', doc: 'Accessible name of the group (required).' },
    size: { type: 'enum', values: ['compact', 'regular', 'large'], default: 'regular', attribute: 'size', doc: 'Visible height; the hit area stays at least 44 px on every size.' },
    fullWidth: { type: 'boolean', attribute: 'full-width', doc: 'The segments share the available width equally; labels truncate with the full label as the accessible name.' },
    disabled: { type: 'boolean', attribute: 'disabled', doc: 'The whole control disabled; the group is exposed as disabled and nothing selects.' },
    iconOnly: { type: 'boolean', attribute: 'icon-only', doc: 'Hide the labels visually; each label stays the segment\'s accessible name.' },
  },
  events: [
    { type: 'ty-change', kind: 'custom', detail: { value: 'string' }, reactProp: 'onChange', rustProp: 'on_change', doc: 'The selection changed; `value` is the new value. Only real changes fire it — re-selecting the selected segment does nothing.' },
  ],
  anatomy: {
    tag: 'div',
    class: 'ty-segmented-control',
    attrs: {
      role: { value: 'radiogroup' },
      'aria-label': { prop: 'label' },
      'aria-disabled': { prop: 'disabled', kind: 'bool' },
      'data-size': { prop: 'size' },
      'data-full-width': { prop: 'fullWidth', kind: 'flag' },
      'data-icon-only': { prop: 'iconOnly', kind: 'flag' },
      'data-disabled': { prop: 'disabled', kind: 'flag' },
    },
    // The segments are composed by the element from `options`.
    children: [],
  },
  examples: [
    { name: 'period-week', props: { label: 'Period', options: '["Day","Week","Month"]', value: 'Week' }, slots: {} },
    { name: 'objects-compact', props: { label: 'View', size: 'compact', defaultValue: 'chart', options: '[{"value":"table","label":"Table"},{"value":"chart","label":"Chart"}]' }, slots: {} },
    { name: 'full-width-large', props: { label: 'Mode', size: 'large', fullWidth: true, options: '["Preview","Code"]' }, slots: {} },
    { name: 'disabled', props: { label: 'Period', disabled: true, value: 'Day', options: '["Day","Week"]' }, slots: {} },
    {
      name: 'icon-only',
      props: {
        label: 'Layout',
        iconOnly: true,
        value: 'grid',
        options: '[{"value":"list","label":"List","icon":"M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"},{"value":"grid","label":"Grid","icon":"M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"}]',
      },
      slots: {},
    },
  ],
} as const satisfies ElementDefinition
