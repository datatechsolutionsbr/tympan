import type { ElementDefinition } from '../definition.ts'

/** `<ty-checkbox>`: the Checkbox's single source (spec: wave-1/checkbox.md). */
export const checkboxDefinition = {
  tag: 'ty-checkbox',
  name: 'TyCheckbox',
  kind: 'enhancing',
  doc: 'A labelled choice that submits with its form. A native checkbox inside a <label> row, so labelling, keyboard (Space) and form participation are the platform\'s. The indicator holds both marks; CSS shows the check while the input is :checked, the minus while it is :indeterminate, so every renderer (and the page before upgrade) shows the right state.',
  props: {
    checked: { type: 'boolean', attribute: 'checked', doc: 'On.' },
    indeterminate: { type: 'boolean', attribute: 'indeterminate', doc: 'Mixed state for "select all" rows (the input\'s `indeterminate` property); cleared by the next toggle.' },
    disabled: { type: 'boolean', attribute: 'disabled', doc: 'Native disabled.' },
    required: { type: 'boolean', attribute: 'required', doc: 'Native required; the form will not submit while off.' },
    name: { type: 'string', attribute: 'name', doc: 'Form field name; the value is sent while on.' },
    value: { type: 'string', attribute: 'value', doc: 'Form value sent while on (the browser sends "on" without one).' },
    appearance: { type: 'enum', values: ['tile', 'bare'], default: 'tile', attribute: 'appearance', doc: '`tile` draws a surface around the row; `bare` is indicator plus text.' },
    accessibleLabel: { type: 'string', attribute: 'accessible-label', doc: 'Accessible name when there is no visible label.' },
    testId: { type: 'string', attribute: 'test-id', doc: 'Test hook on the native checkbox (`data-testid`).' },
  },
  events: [{ type: 'change', kind: 'native', detail: { checked: 'boolean' }, reactProp: 'onChange', rustProp: 'onchange', doc: 'The native change of the checkbox; `checked` is the new state.' }],
  slots: {
    default: { doc: 'The visible label.' },
    description: { doc: 'A secondary line, announced as the description.' },
    error: { doc: 'The error message; marks the checkbox invalid (`aria-invalid`, `aria-errormessage`).' },
  },
  anatomy: {
    tag: 'div',
    class: 'ty-checkbox',
    attrs: {
      'data-appearance': { prop: 'appearance' },
    },
    children: [
      {
        tag: 'label',
        class: 'ty-checkbox__row',
        attrs: {
          'data-selected': { prop: 'checked', kind: 'flag' },
          'data-indeterminate': { prop: 'indeterminate', kind: 'flag' },
          'data-disabled': { prop: 'disabled', kind: 'flag' },
        },
        children: [
          {
            tag: 'input',
            class: 'ty-visually-hidden',
            attrs: {
              type: { value: 'checkbox' },
              name: { prop: 'name' },
              value: { prop: 'value' },
              checked: { prop: 'checked', kind: 'boolean-attr' },
              disabled: { prop: 'disabled', kind: 'boolean-attr' },
              required: { prop: 'required', kind: 'boolean-attr' },
              'aria-label': { prop: 'accessibleLabel', when: ['!slot:default'] },
              'aria-labelledby': { idref: 'label', when: ['slot:default'] },
              'aria-describedby': { idref: 'description', when: ['slot:description'] },
              'aria-invalid': { value: 'true', when: ['slot:error'] },
              'aria-errormessage': { idref: 'error', when: ['slot:error'] },
              'data-testid': { prop: 'testId' },
            },
          },
          {
            tag: 'span',
            class: 'ty-checkbox__indicator',
            attrs: { 'aria-hidden': { value: 'true' } },
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
                children: [
                  { tag: 'path', class: 'ty-checkbox__check', attrs: { d: { value: 'M20 6 9 17l-5-5' } } },
                  { tag: 'path', class: 'ty-checkbox__minus', attrs: { d: { value: 'M5 12h14' } } },
                ],
              },
            ],
          },
          {
            tag: 'span',
            class: 'ty-checkbox__text',
            when: ['slot:default|slot:description'],
            children: [
              { tag: 'span', class: 'ty-checkbox__label', attrs: { id: { idref: 'label' } }, when: ['slot:default'], children: [{ slot: 'default' }] },
              { tag: 'span', class: 'ty-checkbox__description', attrs: { id: { idref: 'description' } }, when: ['slot:description'], children: [{ slot: 'description' }] },
            ],
          },
        ],
      },
      {
        tag: 'p',
        class: 'ty-checkbox__error',
        attrs: { id: { idref: 'error' }, 'aria-live': { value: 'polite' } },
        when: ['slot:error'],
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
            children: [
              { tag: 'path', class: 'ty-checkbox__error-glyph', attrs: { d: { value: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 8v4M12 16h.01' } } },
            ],
          },
          { tag: 'span', class: 'ty-checkbox__error-text', children: [{ slot: 'error' }] },
        ],
      },
    ],
  },
  examples: [
    { name: 'off', props: {}, slots: { default: 'Notify me' } },
    { name: 'on-with-description', props: { checked: true, name: 'notify', value: 'email' }, slots: { default: 'Notify me', description: 'By email' } },
    { name: 'bare', props: { appearance: 'bare', testId: 'newsletter' }, slots: { default: 'Newsletter' } },
    { name: 'indeterminate', props: { indeterminate: true }, slots: { default: 'Select all' } },
    { name: 'invalid-required', props: { required: true }, slots: { default: 'I accept the terms', error: 'Required' } },
    { name: 'disabled-unlabelled', props: { disabled: true, accessibleLabel: 'Notifications' }, slots: {} },
  ],
} as const satisfies ElementDefinition
