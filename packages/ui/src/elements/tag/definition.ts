import type { ElementDefinition } from '../definition.ts'

/** `<ty-tag>`: the Tag's single source (spec: wave-1/tag.md). */
export const tagDefinition = {
  tag: 'ty-tag',
  name: 'TyTag',
  kind: 'enhancing',
  doc: 'Small label for static metadata (a badge or chip), optionally removable; the remove button is a native <button>. An interactive tag (pressable or a link) is a plain styled native — <button class="ty-tag" data-interactive> or <a class="ty-tag" href> — not this element (see docs/html-contract.md).',
  props: {
    tone: { type: 'enum', values: ['neutral', 'accent'], default: 'neutral', attribute: 'tone', doc: '`accent` fills with the theme accent.' },
    categoryIndex: { type: 'number', attribute: 'category-index', doc: 'A categorical token (1 to 8) shown as a small colour square; normalised into range on upgrade.' },
    size: { type: 'enum', values: ['small', 'regular', 'large'], default: 'regular', attribute: 'size', doc: 'Text step; `small` never goes below the meta size.' },
    removable: { type: 'boolean', attribute: 'removable', doc: 'Shows the remove button at the end.' },
    removeLabel: { type: 'string', attribute: 'remove-label', doc: 'Accessible name of the remove button; must include the tag text (defaults to "Remove <text>" on upgrade).' },
    live: { type: 'boolean', attribute: 'live', doc: 'A polite live region (`role="status"`) for a tag whose text updates dynamically.' },
    testId: { type: 'string', attribute: 'test-id', doc: 'Test hook on the tag (`data-testid`).' },
  },
  events: [{ type: 'click', kind: 'native', reactProp: 'onClick', rustProp: 'onclick', doc: 'The remove button\'s native click (wired on that button).' }],
  slots: {
    default: { doc: 'The text; truncates with an ellipsis.' },
    icon: { doc: 'A leading icon (decorative); wins over the category square.' },
  },
  anatomy: {
    tag: 'span',
    class: 'ty-tag',
    attrs: {
      role: { value: 'status', when: ['live'] },
      'aria-live': { value: 'polite', when: ['live'] },
      'data-tone': { prop: 'tone' },
      'data-size': { prop: 'size' },
      'data-removable': { prop: 'removable', kind: 'flag' },
      'data-testid': { prop: 'testId' },
    },
    children: [
      { tag: 'span', class: 'ty-tag__icon', attrs: { 'aria-hidden': { value: 'true' } }, when: ['slot:icon'], children: [{ slot: 'icon' }] },
      { tag: 'span', class: 'ty-tag__swatch', attrs: { 'aria-hidden': { value: 'true' }, 'data-category': { prop: 'categoryIndex' } }, when: ['!slot:icon', 'categoryIndex'] },
      { tag: 'span', class: 'ty-tag__text', children: [{ slot: 'default' }] },
      {
        tag: 'button',
        class: 'ty-tag__remove',
        attrs: { type: { value: 'button' }, 'aria-label': { prop: 'removeLabel' } },
        when: ['removable'],
        children: [
          {
            tag: 'svg',
            class: 'ty-icon',
            attrs: {
              'aria-hidden': { value: 'true' },
              focusable: { value: 'false' },
              viewBox: { value: '0 0 12 12' },
              fill: { value: 'none' },
              stroke: { value: 'currentColor' },
              'stroke-width': { value: '1.5' },
              'stroke-linecap': { value: 'round' },
            },
            children: [{ tag: 'path', attrs: { d: { value: 'M2.5 2.5l7 7M9.5 2.5l-7 7' } } }],
          },
        ],
      },
    ],
  },
  examples: [
    { name: 'neutral', props: {}, slots: { default: 'postgres' } },
    { name: 'accent-small-icon', props: { tone: 'accent', size: 'small', testId: 'env' }, slots: { default: 'production', icon: '◆' } },
    { name: 'category', props: { categoryIndex: 3 }, slots: { default: 'Stage 3' } },
    { name: 'removable', props: { removable: true, removeLabel: 'Remove São Paulo' }, slots: { default: 'São Paulo' } },
    { name: 'live-large', props: { live: true, size: 'large' }, slots: { default: 'Running' } },
  ],
} as const satisfies ElementDefinition
