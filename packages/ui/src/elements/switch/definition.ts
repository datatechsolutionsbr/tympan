import type { ElementDefinition } from '../definition.ts'

/** `<ty-switch>`: the Switch's single source (spec: wave-1/switch.md). */
export const switchDefinition = {
  tag: 'ty-switch',
  name: 'TySwitch',
  kind: 'enhancing',
  doc: 'On/off setting with immediate effect. A native checkbox with role="switch" inside a <label>, so labelling, keyboard and form participation are the platform\'s; Enter toggles as well as Space.',
  props: {
    checked: { type: 'boolean', attribute: 'checked', doc: 'On.' },
    disabled: { type: 'boolean', attribute: 'disabled', doc: 'Native disabled.' },
    readOnly: { type: 'boolean', attribute: 'read-only', doc: 'Shown but not changeable (`aria-readonly`).' },
    name: { type: 'string', attribute: 'name', doc: 'Form field name; the value is sent while on.' },
    value: { type: 'string', attribute: 'value', doc: 'Form value sent while on (the browser sends "on" without one).' },
    size: { type: 'enum', values: ['small', 'regular', 'large'], default: 'regular', attribute: 'size', doc: 'Track size.' },
    layout: { type: 'enum', values: ['inline', 'tile'], default: 'inline', attribute: 'layout', doc: '`tile`: text at the start, control at the end, the whole row is the target.' },
    accessibleLabel: { type: 'string', attribute: 'accessible-label', doc: 'Accessible name when there is no visible label.' },
    testId: { type: 'string', attribute: 'test-id', doc: 'Test hook on the native checkbox (`data-testid`).' },
  },
  events: [{ type: 'change', kind: 'native', detail: { checked: 'boolean' }, reactProp: 'onChange', rustProp: 'onchange', doc: 'The native change of the checkbox; `checked` is the new state.' }],
  slots: {
    default: { doc: 'The visible label.' },
    description: { doc: 'A secondary line, announced as the description.' },
  },
  anatomy: {
    tag: 'label',
    class: 'ty-switch',
    attrs: {
      'data-layout': { prop: 'layout' },
      'data-size': { prop: 'size' },
      'data-selected': { prop: 'checked', kind: 'flag' },
      'data-disabled': { prop: 'disabled', kind: 'flag' },
      'data-readonly': { prop: 'readOnly', kind: 'flag' },
    },
    children: [
      {
        tag: 'input',
        class: 'ty-visually-hidden',
        attrs: {
          type: { value: 'checkbox' },
          role: { value: 'switch' },
          name: { prop: 'name' },
          value: { prop: 'value' },
          checked: { prop: 'checked', kind: 'boolean-attr' },
          disabled: { prop: 'disabled', kind: 'boolean-attr' },
          'aria-readonly': { prop: 'readOnly', kind: 'bool' },
          'aria-label': { prop: 'accessibleLabel', when: ['!slot:default'] },
          'aria-labelledby': { idref: 'label', when: ['slot:default'] },
          'aria-describedby': { idref: 'description', when: ['slot:description'] },
          'data-testid': { prop: 'testId' },
        },
      },
      { tag: 'span', class: 'ty-switch__track', attrs: { 'aria-hidden': { value: 'true' } }, children: [{ tag: 'span', class: 'ty-switch__thumb' }] },
      {
        tag: 'span',
        class: 'ty-switch__text',
        when: ['slot:default|slot:description'],
        children: [
          { tag: 'span', class: 'ty-switch__label', attrs: { id: { idref: 'label' } }, when: ['slot:default'], children: [{ slot: 'default' }] },
          { tag: 'span', class: 'ty-switch__description', attrs: { id: { idref: 'description' } }, when: ['slot:description'], children: [{ slot: 'description' }] },
        ],
      },
    ],
  },
  examples: [
    { name: 'off', props: {}, slots: { default: 'Autosave' } },
    { name: 'on-with-description', props: { checked: true, name: 'autosave' }, slots: { default: 'Autosave', description: 'Save every change' } },
    { name: 'tile-large', props: { layout: 'tile', size: 'large', value: 'yes', testId: 'notifications' }, slots: { default: 'Notifications' } },
    { name: 'read-only', props: { checked: true, readOnly: true }, slots: { default: 'Managed by your organization' } },
    { name: 'disabled-unlabelled', props: { disabled: true, accessibleLabel: 'Dark mode' }, slots: {} },
  ],
} as const satisfies ElementDefinition
