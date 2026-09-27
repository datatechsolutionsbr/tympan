import type { ElementDefinition } from '../definition.ts'

/** `<ty-spinner>`: the Spinner's single source (spec: wave-1/spinner.md). */
export const spinnerDefinition = {
  tag: 'ty-spinner',
  name: 'TySpinner',
  kind: 'enhancing',
  doc: 'Indeterminate work indicator: an indeterminate progressbar named by `label`, drawn as a CSS ring or three pulsing dots (never announced). Under reduced motion the animation stops (the stylesheet) and the element reveals the label as text.',
  props: {
    label: { type: 'string', default: 'Loading', attribute: 'label', doc: 'Accessible name; the visible caption should say the same.' },
    size: { type: 'enum', values: ['small', 'medium', 'large'], default: 'medium', attribute: 'size', doc: 'Diameter step (`small` follows the text size).' },
    shape: { type: 'enum', values: ['ring', 'dots'], default: 'ring', attribute: 'shape', doc: 'The drawing: a border-arc ring or three pulsing dots.' },
    tone: { type: 'enum', values: ['inherit', 'accent', 'on-accent', 'neutral'], default: 'inherit', attribute: 'tone', doc: 'Colour; `inherit` takes the current text colour.' },
  },
  events: [],
  slots: {
    default: { doc: 'The visible label next to the indicator (keep it the same text as `label`; it is decorative, the progressbar is named by `label`).' },
  },
  anatomy: {
    tag: 'span',
    class: 'ty-spinner',
    attrs: {
      role: { value: 'progressbar' },
      'aria-label': { prop: 'label' },
      'data-size': { prop: 'size' },
      'data-shape': { prop: 'shape' },
      'data-tone': { prop: 'tone' },
    },
    children: [
      { tag: 'span', class: 'ty-spinner__ring', attrs: { 'aria-hidden': { value: 'true' } }, when: ['shape:ring'] },
      {
        tag: 'span',
        class: 'ty-spinner__dots',
        attrs: { 'aria-hidden': { value: 'true' } },
        when: ['shape:dots'],
        children: [
          { tag: 'span', class: 'ty-spinner__dot' },
          { tag: 'span', class: 'ty-spinner__dot' },
          { tag: 'span', class: 'ty-spinner__dot' },
        ],
      },
      { tag: 'span', class: 'ty-spinner__label', attrs: { 'aria-hidden': { value: 'true' } }, when: ['slot:default'], children: [{ slot: 'default' }] },
    ],
  },
  examples: [
    { name: 'ring', props: {}, slots: {} },
    { name: 'dots-labelled', props: { shape: 'dots', label: 'Saving' }, slots: { default: 'Saving' } },
    { name: 'large-accent', props: { size: 'large', tone: 'accent', label: 'Indexing' }, slots: {} },
    { name: 'small-on-accent', props: { size: 'small', tone: 'on-accent', label: 'Uploading' }, slots: {} },
    { name: 'dots-neutral', props: { shape: 'dots', tone: 'neutral' }, slots: {} },
  ],
} as const satisfies ElementDefinition
