import type { ElementDefinition } from '../definition.ts'

/** `<ty-native-select>`: the NativeSelect's single source (spec: wave-1/native-select.md). */
export const nativeSelectDefinition = {
  tag: 'ty-native-select',
  name: 'TyNativeSelect',
  kind: 'enhancing',
  doc: 'One value from a short list with the platform select. A native <select> inside, so the picker on touch devices, keyboard, screen-reader support and form participation are the platform\'s. The options are the host\'s children.',
  props: {
    value: { type: 'string', attribute: 'value', doc: 'The selected value; the element mirrors it into the control (while the user chooses, the live value is the control\'s own).' },
    placeholder: { type: 'string', attribute: 'placeholder', doc: 'Text of the empty, disabled first option, shown while nothing is selected.' },
    name: { type: 'string', attribute: 'name', doc: 'Form field name; the selected value is sent.' },
    required: { type: 'boolean', attribute: 'required', doc: 'Native required; the form will not submit while the empty option is the selection.' },
    disabled: { type: 'boolean', attribute: 'disabled', doc: 'Native disabled.' },
    invalid: { type: 'boolean', attribute: 'invalid', doc: 'Painted and announced as invalid without an error message (a surrounding field marks it).' },
    accessibleLabel: { type: 'string', attribute: 'accessible-label', doc: 'Accessible name when there is no visible label.' },
    labelledBy: { type: 'string', attribute: 'labelled-by', doc: '`aria-labelledby` from a surrounding field (used when there is no visible label and no `accessibleLabel`).' },
    describedBy: { type: 'string', attribute: 'described-by', doc: '`aria-describedby` from a surrounding field, joined before the select\'s own parts.' },
    controlId: { type: 'string', attribute: 'control-id', doc: 'Explicit id of the control (a surrounding field\'s control id); `<instance>-control` otherwise.' },
    testId: { type: 'string', attribute: 'test-id', doc: 'Test hook on the native select (`data-testid`).' },
  },
  events: [{ type: 'change', kind: 'native', detail: { value: 'string' }, reactProp: 'onChange', doc: 'The native change of the select; `value` is the new value.' }],
  slots: {
    default: { doc: 'The `<option>` and `<optgroup>` children.' },
    label: { doc: 'The visible label above the control.' },
    hint: { doc: 'Help text between the label and the control, announced as the description.' },
    error: { doc: 'The error message; marks the control invalid and is announced.' },
  },
  anatomy: {
    tag: 'div',
    class: 'ty-native-select',
    attrs: {
      'data-invalid': { value: '', when: ['invalid|slot:error'] },
      'data-disabled': { prop: 'disabled', kind: 'flag' },
    },
    children: [
      {
        tag: 'label',
        class: 'ty-native-select__label',
        when: ['slot:label'],
        attrs: { for: { idref: 'control', prop: 'controlId' } },
        children: [{ slot: 'label' }],
      },
      {
        tag: 'p',
        class: 'ty-native-select__hint',
        when: ['slot:hint'],
        attrs: { id: { idref: 'hint' } },
        children: [{ slot: 'hint' }],
      },
      {
        tag: 'div',
        class: 'ty-native-select__frame',
        children: [
          {
            tag: 'select',
            class: 'ty-native-select__control',
            attrs: {
              id: { idref: 'control', prop: 'controlId' },
              name: { prop: 'name' },
              required: { prop: 'required', kind: 'boolean-attr' },
              disabled: { prop: 'disabled', kind: 'boolean-attr' },
              'aria-label': { prop: 'accessibleLabel', when: ['!slot:label'] },
              'aria-labelledby': { prop: 'labelledBy', when: ['!slot:label', '!accessibleLabel'] },
              'aria-describedby': {
                idrefs: [
                  { prop: 'describedBy' },
                  { id: 'hint', when: ['slot:hint'] },
                  { id: 'error', when: ['slot:error'] },
                ],
              },
              'aria-invalid': { value: 'true', when: ['invalid|slot:error'] },
              'data-testid': { prop: 'testId' },
            },
            children: [
              {
                tag: 'option',
                class: 'ty-native-select__placeholder',
                when: ['placeholder'],
                attrs: {
                  label: { prop: 'placeholder' },
                  value: { value: '' },
                  disabled: { value: 'true' },
                },
              },
              { slot: 'default' },
            ],
          },
          {
            tag: 'svg',
            class: 'ty-icon ty-native-select__chevron',
            attrs: {
              viewBox: { value: '0 0 24 24' },
              fill: { value: 'none' },
              stroke: { value: 'currentColor' },
              'stroke-width': { value: '2' },
              'stroke-linecap': { value: 'round' },
              'stroke-linejoin': { value: 'round' },
              'aria-hidden': { value: 'true' },
              focusable: { value: 'false' },
            },
            children: [{ tag: 'path', class: 'ty-native-select__chevron-path', attrs: { d: { value: 'm6 9 6 6 6-6' } } }],
          },
        ],
      },
      {
        tag: 'p',
        class: 'ty-native-select__error',
        when: ['slot:error'],
        attrs: { id: { idref: 'error' }, role: { value: 'alert' } },
        children: [
          {
            tag: 'svg',
            class: 'ty-icon',
            attrs: {
              viewBox: { value: '0 0 24 24' },
              fill: { value: 'none' },
              stroke: { value: 'currentColor' },
              'stroke-width': { value: '2' },
              'stroke-linecap': { value: 'round' },
              'stroke-linejoin': { value: 'round' },
              'aria-hidden': { value: 'true' },
              focusable: { value: 'false' },
            },
            children: [{ tag: 'path', class: 'ty-native-select__error-glyph', attrs: { d: { value: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 8v4M12 16h.01' } } }],
          },
          { tag: 'span', class: 'ty-native-select__error-text', children: [{ slot: 'error' }] },
        ],
      },
    ],
  },
  examples: [
    { name: 'labelled-placeholder', props: { name: 'region', placeholder: 'Choose a region…' }, slots: { label: 'Region', default: 'us-east-1' } },
    { name: 'hint-required-value', props: { name: 'region', required: true, value: 'us-east-1' }, slots: { label: 'Region', hint: 'Where the workflow runs', default: 'us-east-1' } },
    { name: 'invalid-error', props: { name: 'region' }, slots: { label: 'Region', error: 'Pick a region', default: 'us-east-1' } },
    {
      name: 'field-wired',
      props: { controlId: 'field-3-control', describedBy: 'field-3-description field-3-error', invalid: true, required: true, name: 'region', testId: 'region', accessibleLabel: 'Region' },
      slots: { error: 'Required', default: 'us-east-1' },
    },
    { name: 'disabled-unlabelled', props: { disabled: true, accessibleLabel: 'Region' }, slots: { default: 'us-east-1' } },
  ],
} as const satisfies ElementDefinition
