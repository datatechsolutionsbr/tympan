import type { ElementDefinition } from '../definition.ts'

/** `<ty-brand-wordmark>`: the BrandWordmark's single source (element-first; see docs/design/single-source-components.md). */
export const brandWordmarkDefinition = {
  tag: 'ty-brand-wordmark',
  name: 'TyBrandWordmark',
  kind: 'enhancing',
  doc: 'Two-tone product wordmark: the plain part (`text`) in ink and the accent part (`accent`) in the brand gradient (`background-clip: text`). Plain text for assistive tech as-is; `label` turns it into an img role with that name (a logo lockup).',
  props: {
    text: { type: 'string', attribute: 'text', doc: 'The plain part of the wordmark, in ink.' },
    accent: { type: 'string', attribute: 'accent', doc: 'The accent part of the wordmark, in the brand gradient; rendered right after `text`.' },
    size: { type: 'enum', values: ['small', 'medium', 'large'], default: 'medium', attribute: 'size', doc: 'Type step of the wordmark.' },
    label: { type: 'string', attribute: 'label', doc: 'Accessible name as an img role (a logo lockup); left out, the wordmark is plain text read as-is.' },
    testId: { type: 'string', attribute: 'test-id', doc: 'Test hook on the wordmark (`data-testid`).' },
  },
  events: [],
  anatomy: {
    tag: 'span',
    class: 'ty-brand-wordmark',
    attrs: {
      role: { value: 'img', when: ['label'] },
      'aria-label': { prop: 'label' },
      'data-size': { prop: 'size' },
      'data-testid': { prop: 'testId' },
    },
    children: [
      { tag: 'span', class: 'ty-brand-wordmark__text', when: ['text'], children: [{ text: { prop: 'text' } }] },
      { tag: 'span', class: 'ty-brand-wordmark__accent', when: ['accent'], children: [{ text: { prop: 'accent' } }] },
    ],
  },
  examples: [
    { name: 'default', props: { text: 'North', accent: 'star' }, slots: {} },
    { name: 'small', props: { text: 'North', accent: 'star', size: 'small' }, slots: {} },
    { name: 'large-labelled', props: { text: 'North', accent: 'star', size: 'large', label: 'Northstar' }, slots: {} },
    { name: 'accent-only', props: { accent: 'Solo' }, slots: {} },
  ],
} as const satisfies ElementDefinition
