import type { ElementDefinition, ElementNode } from '../definition.ts'

/**
 * `<ty-heading>`: the Heading's single source (spec: wave-1/heading.md).
 *
 * The document level (`level`, h1 to h6) and the visual step (`appearance`)
 * are independent; unset, the step derives from the level (1 → h1, 2 → h2,
 * 3 and deeper → h3). The convenience Subheading of the React component is
 * this element with `level="2" appearance="h3"`. The optional `eyebrow`
 * renders before, and outside, the heading element, so the heading's
 * accessible name stays the heading text alone. The heading carries a
 * stable id (`heading-id`, generated from the instance otherwise) so
 * sections and dialogs can label themselves by it.
 *
 * The anatomy root is always the group wrapper (the React component renders
 * it only with an eyebrow); it adds no box beyond the column gap, and
 * keeping it unconditional lets every renderer express one tree.
 */
export const headingDefinition = {
  tag: 'ty-heading',
  name: 'TyHeading',
  kind: 'enhancing',
  doc: 'Section title whose document level (`level`, h1 to h6) and visual step (`appearance`: display, h1, h2, h3 or label) are set independently; unset, the step derives from the level. An optional `eyebrow` labels the section above the heading, outside the heading element. The heading id (`heading-id`, generated otherwise) lets a section or dialog reference it with `aria-labelledby`. `level="2" appearance="h3"` is the Subheading.',
  props: {
    level: { type: 'enum', values: ['1', '2', '3', '4', '5', '6'], default: '1', attribute: 'level', doc: 'Document outline level (1 to 6, as its attribute spelling); one h1 per page, no skipped levels.' },
    appearance: { type: 'enum', values: ['display', 'h1', 'h2', 'h3', 'label'], attribute: 'appearance', doc: 'Visual step from the type scale of §2.2, decoupled from `level`; derived from the level when unset (1 → h1, 2 → h2, 3+ → h3).' },
    eyebrow: { type: 'string', attribute: 'eyebrow', doc: 'Small uppercase label rendered before, and outside, the heading element (the §2.2 eyebrow token); the heading text alone stays the accessible name.' },
    headingId: { type: 'string', attribute: 'heading-id', doc: 'Stable id of the heading element, for `aria-labelledby` of the enclosing section or dialog; `<instance>-heading` when unset.' },
  },
  events: [],
  slots: {
    default: { doc: 'The heading text.' },
  },
  anatomy: {
    tag: 'div',
    class: 'ty-heading-group',
    children: [
      { tag: 'p', class: 'ty-heading__eyebrow', when: ['eyebrow'], children: [{ text: { prop: 'eyebrow' } }] },
      ...([1, 2, 3, 4, 5, 6] as const).map((n): ElementNode => ({
        tag: `h${n}`,
        class: 'ty-heading',
        when: [`level:${n}`],
        attrs: {
          id: { idref: 'heading', prop: 'headingId' },
          'data-appearance': {
            prop: 'appearance',
            kind: 'map',
            values: { display: 'display', h1: 'h1', h2: 'h2', h3: 'h3', label: 'label' },
            fallback: { prop: 'level', values: { '1': 'h1', '2': 'h2', '3': 'h3', '4': 'h3', '5': 'h3', '6': 'h3' } },
          },
        },
        children: [{ slot: 'default' }],
      })),
    ],
  },
  examples: [
    { name: 'page-title', props: {}, slots: { default: 'Sources' } },
    { name: 'level-3', props: { level: '3' }, slots: { default: 'Field mapping' } },
    { name: 'small-level-big-step', props: { level: '2', appearance: 'h1' }, slots: { default: 'Workspace' } },
    { name: 'eyebrow', props: { level: '2', eyebrow: 'Datasets' }, slots: { default: 'Revenue by state' } },
    { name: 'label-step', props: { level: '4', appearance: 'label' }, slots: { default: 'Owner' } },
    { name: 'subheading', props: { level: '2', appearance: 'h3' }, slots: { default: 'Recent runs' } },
  ],
} as const satisfies ElementDefinition
