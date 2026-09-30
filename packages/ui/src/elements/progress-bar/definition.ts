import type { ElementDefinition } from '../definition.ts'

/**
 * `<ty-progress-bar>`: the ProgressBar's single source (spec: wave-1/progress-bar.md).
 *
 * The anatomy carries everything declarative: the `progressbar` role, its
 * name (the visible label by `aria-labelledby`, `accessibleLabel` without
 * one), the range and the in-range value, the tone/size/indeterminate
 * states. The element adds what the definition language cannot compute: the
 * clamped value outside the range, the percentage value text (visible and
 * `aria-valuetext`), the "in progress" text of an indeterminate bar, the
 * complete state and the fill's inline size. `showValue` is a string like
 * the popover's `showArrow`: `'true'` or `'false'`, unset shows the value.
 */
export const progressBarDefinition = {
  tag: 'ty-progress-bar',
  name: 'TyProgressBar',
  kind: 'enhancing',
  doc: 'Determinate or indeterminate task progress (upload, batch run, profile completion). Not focusable; the host announces completion through a Toast or status message, not through the bar. Values outside the range are clamped on upgrade; the fill width changes with `--ty-dur-quick`, instantly under reduced motion, where the indeterminate sweep becomes a static partial fill with the label still stating "in progress".',
  props: {
    value: { type: 'number', default: 0, attribute: 'value', doc: 'Current value; clamped into the range on upgrade.' },
    minValue: { type: 'number', default: 0, attribute: 'min-value', doc: 'Start of the range.' },
    maxValue: { type: 'number', default: 100, attribute: 'max-value', doc: 'End of the range; reaching it is the complete state.' },
    label: { type: 'string', attribute: 'label', doc: 'Visible and accessible name (required unless `accessibleLabel` is given).' },
    accessibleLabel: { type: 'string', attribute: 'accessible-label', doc: 'Accessible name when there is no visible label (`aria-label`).' },
    valueLabel: { type: 'string', attribute: 'value-label', doc: 'Custom value text, such as "3 of 8 steps"; the computed percentage when unset.' },
    showValue: { type: 'string', attribute: 'show-value', doc: '`true` or `false`; unset: the value text shows. An indeterminate bar always shows its "in progress" text.' },
    indeterminate: { type: 'boolean', attribute: 'indeterminate', doc: 'Unknown progress: no `aria-valuenow` and no percentage, the value text states "in progress".' },
    inProgressLabel: { type: 'string', default: 'In progress', attribute: 'in-progress-label', doc: 'Value text of an indeterminate bar; translate through this attribute.' },
    tone: { type: 'enum', values: ['accent', 'success', 'warning', 'danger'], default: 'accent', attribute: 'tone', doc: 'Semantic tone of the fill; never the only signal (pair with value text or a status word).' },
    size: { type: 'enum', values: ['thin', 'regular'], default: 'regular', attribute: 'size', doc: 'Track thickness.' },
  },
  events: [],
  anatomy: {
    tag: 'div',
    class: 'ty-progress',
    attrs: {
      role: { value: 'progressbar' },
      'aria-labelledby': { idref: 'label', when: ['label'] },
      'aria-label': { prop: 'accessibleLabel', when: ['!label'] },
      'aria-valuemin': { prop: 'minValue' },
      'aria-valuemax': { prop: 'maxValue' },
      'aria-valuenow': { prop: 'value', when: ['!indeterminate'] },
      'aria-valuetext': { prop: 'valueLabel', when: ['!indeterminate'] },
      'data-tone': { prop: 'tone' },
      'data-size': { prop: 'size' },
      'data-indeterminate': { prop: 'indeterminate', kind: 'flag' },
    },
    children: [
      {
        tag: 'div',
        class: 'ty-progress__header',
        when: ['label|indeterminate|!showValue:false'],
        children: [
          {
            tag: 'span',
            class: 'ty-progress__label',
            when: ['label'],
            attrs: { id: { idref: 'label' } },
            children: [{ text: { prop: 'label' } }],
          },
          {
            tag: 'span',
            class: 'ty-progress__value',
            when: ['indeterminate|!showValue:false'],
          },
        ],
      },
      {
        tag: 'div',
        class: 'ty-progress__track',
        attrs: { 'aria-hidden': { value: 'true' } },
        children: [{ tag: 'div', class: 'ty-progress__fill' }],
      },
    ],
  },
  examples: [
    { name: 'determinate', props: { value: 40, label: 'Upload' }, slots: {} },
    { name: 'custom-value-label', props: { value: 3, maxValue: 8, valueLabel: '3 of 8 steps', label: 'Setup' }, slots: {} },
    { name: 'indeterminate', props: { indeterminate: true, label: 'Import' }, slots: {} },
    { name: 'complete-success-thin', props: { value: 100, label: 'Upload', tone: 'success', size: 'thin' }, slots: {} },
    { name: 'unlabelled-hidden-value', props: { value: 20, accessibleLabel: 'Storage used', showValue: 'false' }, slots: {} },
  ],
} as const satisfies ElementDefinition
