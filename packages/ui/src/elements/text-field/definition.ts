import type { ElementDefinition, ElementNode } from '../definition.ts'

/** A lucide glyph (ISC, THIRD_PARTY_NOTICES): every child carries a class so the element's patch pass can match it. */
const glyph = (tag: string, attrs: Record<string, string>): ElementNode => ({
  tag,
  class: 'ty-text-field__glyph',
  attrs: Object.fromEntries(Object.entries(attrs).map(([name, value]) => [name, { value }])),
})

/** A decorative 24px icon (lucide strokes). */
const icon = (children: ElementNode[], className = 'ty-icon'): ElementNode => ({
  tag: 'svg',
  class: className,
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
  children,
})

/** `<ty-text-field>`: the TextField's single source (spec: wave-1/text-field.md). */
export const textFieldDefinition = {
  tag: 'ty-text-field',
  name: 'TyTextField',
  kind: 'enhancing',
  doc: 'Single-line text entry: plain, search and password. A native <input> inside, so typing, keyboard, autofill and form participation are the platform\'s; the element adds the clear action (search mode, or `clearable`), the reveal action (password mode), the character counter and the over-limit state.',
  props: {
    mode: { type: 'enum', values: ['text', 'search', 'password'], default: 'text', attribute: 'mode', doc: '`search` adds the magnifier and the clear action (Escape clears); `password` adds the reveal action.' },
    inputType: { type: 'enum', values: ['text', 'email', 'url', 'tel', 'number'], attribute: 'input-type', doc: 'Native type for `mode="text"` (`text` when unset); `mode` wins when both are set.' },
    value: { type: 'string', attribute: 'value', doc: 'Controlled text; the element mirrors it into the input (while the user types, the live value is the input\'s own).' },
    defaultValue: { type: 'string', attribute: 'default-value', doc: 'Initial text of an uncontrolled field, applied once on connect; a form reset returns to it.' },
    appearance: { type: 'enum', values: ['outlined', 'filled'], default: 'outlined', attribute: 'appearance', doc: 'Surface treatment of the group.' },
    clearable: { type: 'boolean', attribute: 'clearable', doc: 'The clear action outside search mode (search always has it); shown while the field is non-empty and editable.' },
    clearLabel: { type: 'string', default: 'Clear', attribute: 'clear-label', doc: 'Accessible name of the clear action.' },
    showPasswordLabel: { type: 'string', default: 'Show password', attribute: 'show-password-label', doc: 'Accessible name of the reveal action while the password is hidden.' },
    hidePasswordLabel: { type: 'string', default: 'Hide password', attribute: 'hide-password-label', doc: 'Accessible name of the reveal action while the password is shown.' },
    maxLength: { type: 'number', attribute: 'max-length', doc: 'Counted for the counter and the over-limit state; typing is not cut off.' },
    showCounter: { type: 'boolean', attribute: 'show-counter', doc: 'A character counter under the field (needs `maxLength`).' },
    counterLabel: { type: 'string', default: '{count} of {max} characters', attribute: 'counter-label', doc: 'Counter template; `{count}` and `{max}` are filled in.' },
    overLimitLabel: { type: 'string', default: '{count} of {max} characters, {over} over the limit', attribute: 'over-limit-label', doc: 'Counter template past the limit; `{over}` is the excess.' },
    required: { type: 'boolean', attribute: 'required', doc: 'Native required.' },
    disabled: { type: 'boolean', attribute: 'disabled', doc: 'Native disabled.' },
    readOnly: { type: 'boolean', attribute: 'read-only', doc: 'Shown but not changeable.' },
    invalid: { type: 'boolean', attribute: 'invalid', doc: 'Painted and announced as invalid without an error message (a surrounding field marks it).' },
    name: { type: 'string', attribute: 'name', doc: 'Form field name.' },
    placeholder: { type: 'string', attribute: 'placeholder', doc: 'Native placeholder.' },
    autoComplete: { type: 'string', attribute: 'autocomplete', doc: 'Native autocomplete hint.' },
    accessibleLabel: { type: 'string', attribute: 'accessible-label', doc: 'Accessible name when there is no visible label.' },
    labelledBy: { type: 'string', attribute: 'labelled-by', doc: '`aria-labelledby` from a surrounding field (used when there is no visible label and no `accessibleLabel`).' },
    describedBy: { type: 'string', attribute: 'described-by', doc: '`aria-describedby` from a surrounding field, joined before the field\'s own parts.' },
    controlId: { type: 'string', attribute: 'control-id', doc: 'Explicit id of the control (a surrounding field\'s control id); `<instance>-input` otherwise.' },
    testId: { type: 'string', attribute: 'test-id', doc: 'Test hook on the root (`data-testid`).' },
  },
  events: [
    { type: 'input', kind: 'native', detail: { value: 'string' }, reactProp: 'onChange', rustProp: 'oninput', doc: 'The native input of the field; `value` is the whole text.' },
    { type: 'ty-clear', kind: 'custom', reactProp: 'onClear', rustProp: 'on_clear', doc: 'The clear action ran (its button, or Escape in search mode); the value is already empty and focus is back on the input.' },
  ],
  slots: {
    label: { doc: 'The visible label, targeting the input.' },
    hint: { doc: 'Help text above the group, announced as the description.' },
    error: { doc: 'The error message; marks the field invalid and is announced.' },
    success: { doc: 'Confirmation of a valid value; only without an error, and hidden while over the limit.' },
    leading: { doc: 'A decorative leading icon; wins over the search magnifier.' },
  },
  anatomy: {
    tag: 'div',
    class: 'ty-text-field',
    attrs: {
      'data-appearance': { prop: 'appearance' },
      'data-mode': { prop: 'mode' },
      'data-invalid': { value: '', when: ['invalid|slot:error'] },
      'data-readonly': { prop: 'readOnly', kind: 'flag' },
      'data-disabled': { prop: 'disabled', kind: 'flag' },
      'data-testid': { prop: 'testId' },
    },
    children: [
      {
        tag: 'label',
        class: 'ty-text-field__label',
        when: ['slot:label'],
        attrs: { for: { idref: 'input', prop: 'controlId' } },
        children: [{ slot: 'label' }],
      },
      {
        tag: 'p',
        class: 'ty-text-field__hint',
        when: ['slot:hint'],
        attrs: { id: { idref: 'hint' } },
        children: [{ slot: 'hint' }],
      },
      {
        tag: 'div',
        class: 'ty-text-field__group',
        children: [
          {
            tag: 'span',
            class: 'ty-text-field__leading',
            when: ['slot:leading'],
            attrs: { 'aria-hidden': { value: 'true' } },
            children: [{ slot: 'leading' }],
          },
          {
            tag: 'span',
            class: 'ty-text-field__leading',
            when: ['mode:search', '!slot:leading'],
            attrs: { 'aria-hidden': { value: 'true' } },
            children: [icon([glyph('circle', { cx: '11', cy: '11', r: '8' }), glyph('path', { d: 'm21 21-4.34-4.34' })])],
          },
          {
            tag: 'input',
            class: 'ty-text-field__input',
            attrs: {
              id: { idref: 'input', prop: 'controlId' },
              // `mode` decides; `inputType` only when it is set (text mode).
              type: {
                prop: 'inputType',
                kind: 'map',
                values: { text: 'text', email: 'email', url: 'url', tel: 'tel', number: 'number' },
                fallback: { prop: 'mode', values: { text: 'text', search: 'search', password: 'password' } },
              },
              name: { prop: 'name' },
              placeholder: { prop: 'placeholder' },
              autocomplete: { prop: 'autoComplete' },
              disabled: { prop: 'disabled', kind: 'boolean-attr' },
              readonly: { prop: 'readOnly', kind: 'boolean-attr' },
              required: { prop: 'required', kind: 'boolean-attr' },
              'aria-label': { prop: 'accessibleLabel', when: ['!slot:label'] },
              'aria-labelledby': { prop: 'labelledBy', when: ['!slot:label', '!accessibleLabel'] },
              'aria-describedby': {
                idrefs: [
                  { prop: 'describedBy' },
                  { id: 'hint', when: ['slot:hint'] },
                  { id: 'error', when: ['slot:error'] },
                  { id: 'success', when: ['slot:success', '!slot:error'] },
                  { id: 'counter', when: ['showCounter', 'maxLength'] },
                ],
              },
              'aria-invalid': { value: 'true', when: ['invalid|slot:error'] },
            },
          },
          {
            tag: 'button',
            class: 'ty-text-field__clear ty-text-field__action',
            when: ['clearable|mode:search'],
            attrs: {
              type: { value: 'button' },
              'aria-label': { prop: 'clearLabel' },
            },
            children: [icon([glyph('path', { d: 'M18 6 6 18' }), glyph('path', { d: 'm6 6 12 12' })])],
          },
          {
            tag: 'button',
            class: 'ty-text-field__reveal ty-text-field__action',
            when: ['mode:password'],
            attrs: {
              type: { value: 'button' },
              'aria-label': { prop: 'showPasswordLabel' },
              'aria-pressed': { value: 'false' },
              disabled: { prop: 'disabled', kind: 'boolean-attr' },
            },
            children: [
              icon([
                {
                  tag: 'g',
                  class: 'ty-text-field__eye',
                  children: [
                    glyph('path', { d: 'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0' }),
                    glyph('circle', { cx: '12', cy: '12', r: '3' }),
                  ],
                },
                {
                  tag: 'g',
                  class: 'ty-text-field__eye-off',
                  children: [
                    glyph('path', { d: 'M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49' }),
                    glyph('path', { d: 'M14.084 14.158a3 3 0 0 1-4.242-4.242' }),
                    glyph('path', { d: 'M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143' }),
                    glyph('path', { d: 'm2 2 20 20' }),
                  ],
                },
              ]),
            ],
          },
          {
            ...icon([glyph('circle', { cx: '12', cy: '12', r: '10' }), glyph('path', { d: 'm16 9-5.5 5.5L8 12' })], 'ty-icon ty-text-field__success-mark'),
            when: ['slot:success', '!slot:error'],
          },
        ],
      },
      {
        tag: 'p',
        class: 'ty-text-field__error',
        when: ['slot:error'],
        attrs: { id: { idref: 'error' } },
        children: [
          icon([
            glyph('circle', { cx: '12', cy: '12', r: '10' }),
            glyph('line', { x1: '12', y1: '8', x2: '12', y2: '12' }),
            glyph('line', { x1: '12', y1: '16', x2: '12.01', y2: '16' }),
          ]),
          { tag: 'span', class: 'ty-text-field__error-text', children: [{ slot: 'error' }] },
        ],
      },
      {
        tag: 'p',
        class: 'ty-text-field__success',
        when: ['slot:success', '!slot:error'],
        attrs: { id: { idref: 'success' } },
        children: [{ slot: 'success' }],
      },
      {
        tag: 'p',
        class: 'ty-text-field__counter',
        when: ['showCounter', 'maxLength'],
        attrs: { id: { idref: 'counter' } },
      },
    ],
  },
  examples: [
    { name: 'labelled', props: {}, slots: { label: 'Name' } },
    { name: 'hint-and-placeholder', props: { name: 'name', placeholder: 'Ada Lovelace', autoComplete: 'name' }, slots: { label: 'Name', hint: 'As on your badge' } },
    { name: 'email-filled-leading', props: { inputType: 'email', appearance: 'filled', name: 'email', autoComplete: 'email' }, slots: { label: 'Email', leading: '✉' } },
    { name: 'search', props: { mode: 'search', name: 'q', value: 'brazil', placeholder: 'Search states' }, slots: { label: 'Search' } },
    { name: 'password', props: { mode: 'password', name: 'password', autoComplete: 'current-password', required: true }, slots: { label: 'Password', hint: 'At least 12 characters' } },
    { name: 'error', props: { value: 'ab', required: true }, slots: { label: 'Code', error: 'Too short' } },
    { name: 'counter', props: { value: 'Hello', maxLength: 20, showCounter: true }, slots: { label: 'Title' } },
    { name: 'success', props: { inputType: 'email', value: 'ada@example.org' }, slots: { label: 'Email', success: 'Looks right' } },
    { name: 'disabled-unlabelled', props: { disabled: true, accessibleLabel: 'Name', describedBy: 'external-hint', testId: 'name' }, slots: {} },
  ],
} as const satisfies ElementDefinition
