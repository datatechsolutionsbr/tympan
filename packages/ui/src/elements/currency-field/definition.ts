import type { ElementDefinition, ElementNode } from '../definition.ts'

/** A lucide glyph (ISC, THIRD_PARTY_NOTICES): every child carries a class so the element's patch pass can match it. */
const glyph = (tag: string, attrs: Record<string, string>): ElementNode => ({
  tag,
  class: 'ty-currency-field__glyph',
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

/** `<ty-currency-field>`: the CurrencyField's single source (spec: wave-2/currency-field.md). */
export const currencyFieldDefinition = {
  tag: 'ty-currency-field',
  name: 'TyCurrencyField',
  kind: 'enhancing',
  doc: 'Money or count entry with live grouping in the locale\'s separators; reports a plain canonical number (digits, an optional dot and decimals, never grouped). A native <input> inside, so typing, keyboard, autofill and form participation are the platform\'s; the element regroups the display on every edit, keeps the caret after the same digit, shows the currency symbol and names the currency to assistive technology.',
  props: {
    value: { type: 'string', attribute: 'value', doc: 'Canonical value: digits with an optional dot and decimals, never grouped ("1500000.5"); "" when empty. The element mirrors it into the control as grouped display text (while the user types, the live value is the control\'s own).' },
    defaultValue: { type: 'string', attribute: 'default-value', doc: 'Initial canonical value of an uncontrolled field, applied once on connect; a form reset returns to it.' },
    currency: { type: 'string', attribute: 'currency', doc: 'ISO 4217 code ("BRL"); the symbol is shown (visual only) and the currency name is announced as part of the description. Omit for plain counts.' },
    decimals: { type: 'number', default: 2, attribute: 'decimals', doc: 'Maximum fraction digits; 0 means integers only (the decimal separator is ignored and the mobile keyboard is numeric).' },
    locale: { type: 'string', attribute: 'locale', doc: 'Locale that decides the group and decimal separators ("pt-BR"); the document language, then the browser locale, when unset. Changing it changes only the display, never the canonical value.' },
    size: { type: 'enum', values: ['small', 'medium', 'large', 'display'], default: 'medium', attribute: 'size', doc: 'Type scale step; `display` uses the KPI numeral style.' },
    currencyLabel: { type: 'string', default: 'Currency: {currency}', attribute: 'currency-label', doc: 'Template of the visually hidden currency note; `{currency}` is filled with the locale\'s currency name ("Currency: Brazilian real").' },
    required: { type: 'boolean', attribute: 'required', doc: 'Native required.' },
    disabled: { type: 'boolean', attribute: 'disabled', doc: 'Native disabled.' },
    readOnly: { type: 'boolean', attribute: 'read-only', doc: 'Shown but not changeable.' },
    invalid: { type: 'boolean', attribute: 'invalid', doc: 'Painted and announced as invalid without an error message (a surrounding field marks it).' },
    name: { type: 'string', attribute: 'name', doc: 'Form field name.' },
    placeholder: { type: 'string', attribute: 'placeholder', doc: 'Native placeholder.' },
    accessibleLabel: { type: 'string', attribute: 'accessible-label', doc: 'Accessible name when there is no visible label.' },
    labelledBy: { type: 'string', attribute: 'labelled-by', doc: '`aria-labelledby` from a surrounding field (used when there is no visible label and no `accessibleLabel`).' },
    describedBy: { type: 'string', attribute: 'described-by', doc: '`aria-describedby` from a surrounding field, joined before the field\'s own parts.' },
    controlId: { type: 'string', attribute: 'control-id', doc: 'Explicit id of the control (a surrounding field\'s control id); `<instance>-input` otherwise.' },
    testId: { type: 'string', attribute: 'test-id', doc: 'Test hook on the root (`data-testid`).' },
  },
  events: [
    { type: 'ty-value-change', kind: 'custom', detail: { value: 'string' }, reactProp: 'onValueChange', doc: 'After every edit; `value` is the canonical number (digits, an optional dot and decimals, never grouped; "" when empty). The display text is never reported.' },
  ],
  slots: {
    label: { doc: 'The visible label, targeting the input.' },
    hint: { doc: 'Help text above the group, announced as the description.' },
    error: { doc: 'The error message; marks the field invalid and is announced.' },
  },
  anatomy: {
    tag: 'div',
    class: 'ty-currency-field',
    attrs: {
      'data-size': { prop: 'size' },
      'data-invalid': { value: '', when: ['invalid|slot:error'] },
      'data-readonly': { prop: 'readOnly', kind: 'flag' },
      'data-disabled': { prop: 'disabled', kind: 'flag' },
      'data-testid': { prop: 'testId' },
    },
    children: [
      {
        tag: 'div',
        class: 'ty-currency-field__field',
        children: [
          {
            tag: 'label',
            class: 'ty-fb-line',
            when: ['slot:label'],
            attrs: { 'data-line': { value: 'label' }, for: { idref: 'input', prop: 'controlId' } },
            children: [{ slot: 'label' }],
          },
          {
            tag: 'p',
            class: 'ty-fb-line',
            when: ['slot:hint'],
            attrs: { 'data-line': { value: 'hint' }, id: { idref: 'hint' } },
            children: [{ slot: 'hint' }],
          },
          {
            tag: 'div',
            class: 'ty-currency-field__box',
            children: [
              {
                tag: 'span',
                class: 'ty-currency-field__symbol',
                when: ['currency'],
                attrs: { 'aria-hidden': { value: 'true' } },
              },
              {
                tag: 'input',
                class: 'ty-currency-field__input',
                attrs: {
                  id: { idref: 'input', prop: 'controlId' },
                  type: { value: 'text' },
                  name: { prop: 'name' },
                  placeholder: { prop: 'placeholder' },
                  autocomplete: { value: 'off' },
                  disabled: { prop: 'disabled', kind: 'boolean-attr' },
                  readonly: { prop: 'readOnly', kind: 'boolean-attr' },
                  required: { prop: 'required', kind: 'boolean-attr' },
                  'aria-label': { prop: 'accessibleLabel', when: ['!slot:label'] },
                  'aria-labelledby': { prop: 'labelledBy', when: ['!slot:label', '!accessibleLabel'] },
                  'aria-describedby': {
                    idrefs: [
                      { prop: 'describedBy' },
                      { id: 'hint', when: ['slot:hint'] },
                      { id: 'currency', when: ['currency'] },
                      { id: 'error', when: ['slot:error'] },
                    ],
                  },
                  'aria-invalid': { value: 'true', when: ['invalid|slot:error'] },
                },
              },
            ],
          },
          {
            tag: 'span',
            class: 'ty-visually-hidden ty-currency-field__currency',
            when: ['currency'],
            attrs: { id: { idref: 'currency' } },
          },
          {
            tag: 'p',
            class: 'ty-fb-line',
            when: ['slot:error'],
            attrs: { 'data-line': { value: 'error' }, id: { idref: 'error' } },
            children: [
              icon([
                glyph('circle', { cx: '12', cy: '12', r: '10' }),
                glyph('line', { x1: '12', y1: '8', x2: '12', y2: '12' }),
                glyph('line', { x1: '12', y1: '16', x2: '12.01', y2: '16' }),
              ]),
              { tag: 'span', class: 'ty-currency-field__error-text', children: [{ slot: 'error' }] },
            ],
          },
        ],
      },
    ],
  },
  examples: [
    { name: 'count', props: { decimals: 0, locale: 'pt-BR', value: '3000', name: 'seats' }, slots: { label: 'Vagas' } },
    { name: 'brl', props: { currency: 'BRL', locale: 'pt-BR', value: '1500000.5', name: 'price', placeholder: '0,00' }, slots: { label: 'Preço', hint: 'Em reais' } },
    { name: 'usd', props: { currency: 'USD', locale: 'en-US', value: '1500000.5', name: 'amount' }, slots: { label: 'Amount' } },
    { name: 'display', props: { size: 'display', currency: 'BRL', locale: 'pt-BR', value: '99.9' }, slots: { label: 'Total' } },
    { name: 'error', props: { value: '12', required: true }, slots: { label: 'Amount', error: 'Required' } },
    { name: 'disabled-unlabelled', props: { disabled: true, accessibleLabel: 'Amount', testId: 'amount' }, slots: {} },
  ],
} as const satisfies ElementDefinition
