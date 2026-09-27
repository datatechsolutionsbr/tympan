import type { ElementDefinition } from '../definition.ts'

/** `<ty-separator>`: the Separator's single source (spec: wave-1/separator.md). */
export const separatorDefinition = {
  tag: 'ty-separator',
  name: 'TySeparator',
  kind: 'enhancing',
  doc: 'Thin rule between groups of content, optionally with a short caption centred on it ("or"). Decorative by default (`aria-hidden`); `semantic` exposes the non-focusable separator role. A captioned rule keeps the caption readable as plain text and the strokes decorative, so it never carries the role.',
  props: {
    orientation: { type: 'enum', values: ['horizontal', 'vertical'], default: 'horizontal', attribute: 'orientation', doc: 'Direction of the rule; vertical takes the height of its row.' },
    emphasis: { type: 'enum', values: ['regular', 'soft'], default: 'regular', attribute: 'emphasis', doc: 'Line strength: `--ty-line` or the fainter `--ty-line-soft`.' },
    semantic: { type: 'boolean', attribute: 'semantic', doc: 'Exposes the separator role (with `aria-orientation`); decorative otherwise.' },
    spacing: { type: 'enum', values: ['none', 'regular', 'roomy'], default: 'regular', attribute: 'spacing', doc: 'Margin step from the spacing scale.' },
  },
  events: [],
  slots: {
    caption: { doc: 'Short text centred on the rule, such as "or"; readable plain text between the two decorative strokes.' },
  },
  anatomy: {
    tag: 'div',
    class: 'ty-separator',
    attrs: {
      role: { value: 'separator', when: ['semantic', '!slot:caption'] },
      'aria-orientation': { prop: 'orientation', when: ['semantic', '!slot:caption'] },
      'aria-hidden': { value: 'true', when: ['!semantic', '!slot:caption'] },
      'data-orientation': { prop: 'orientation' },
      'data-emphasis': { prop: 'emphasis' },
      'data-spacing': { prop: 'spacing' },
      'data-captioned': { value: '', when: ['slot:caption'] },
    },
    children: [
      { tag: 'span', class: 'ty-separator__line', attrs: { 'aria-hidden': { value: 'true' } }, when: ['slot:caption'] },
      { tag: 'span', class: 'ty-separator__caption', when: ['slot:caption'], children: [{ slot: 'caption' }] },
      { tag: 'span', class: 'ty-separator__line', attrs: { 'aria-hidden': { value: 'true' } }, when: ['slot:caption'] },
    ],
  },
  examples: [
    { name: 'decorative', props: {}, slots: {} },
    { name: 'semantic', props: { semantic: true }, slots: {} },
    { name: 'semantic-vertical', props: { semantic: true, orientation: 'vertical' }, slots: {} },
    { name: 'soft-roomy', props: { emphasis: 'soft', spacing: 'roomy' }, slots: {} },
    { name: 'caption', props: {}, slots: { caption: 'or' } },
  ],
} as const satisfies ElementDefinition
