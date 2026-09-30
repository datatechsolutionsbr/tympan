import type { ElementDefinition, ElementNode } from '../definition.ts'

/** `<ty-section-heading>`: the SectionHeading's single source (spec: wave-1/section-heading.md). */
export const sectionHeadingDefinition = {
  tag: 'ty-section-heading',
  name: 'TySectionHeading',
  kind: 'enhancing',
  doc: 'Heads a section inside a page or a sheet: the title at the section level (h2 by default, h3 or h4 inside a sheet), an optional subtitle line (plain meta text, not a heading), an optional decorative leading icon, and a `trailing` slot for the section\'s own actions, a count, a toggle or a link. The title wraps by default; `truncate` clips it to one line with the full text as a tooltip. The heading id (`heading-id`, generated otherwise) lets the enclosing section name itself with `aria-labelledby`.',
  props: {
    title: { type: 'string', attribute: 'title', doc: 'Section name; the heading text, and the tooltip when `truncate` clips it.' },
    level: { type: 'enum', values: ['2', '3', '4'], default: '2', attribute: 'level', doc: 'Heading level (2, 3 or 4, as its attribute spelling); level 2 uses the h2 step, 3 and 4 the h3 step (§2.2).' },
    subtitle: { type: 'string', attribute: 'subtitle', doc: 'Supporting line under the title; plain meta text in reading order, not a heading.' },
    truncate: { type: 'boolean', attribute: 'truncate', doc: 'Clip the title to one line with an ellipsis; the full text stays accessible and becomes the tooltip. Wraps by default.' },
    headingId: { type: 'string', attribute: 'heading-id', doc: 'Id of the heading element, so the enclosing section can be a region labelled by it; `<instance>-heading` when unset.' },
  },
  events: [],
  slots: {
    icon: { doc: 'A decorative leading icon (`aria-hidden`).' },
    trailing: { doc: 'Section actions, a count, a toggle or a link; follows the title in DOM order and wraps under it when it does not fit.' },
    default: { doc: 'Extra content under the heading row.' },
  },
  anatomy: {
    tag: 'div',
    class: 'ty-section-heading',
    attrs: {
      'data-level': { prop: 'level' },
    },
    children: [
      {
        tag: 'div',
        class: 'ty-section-heading__row',
        children: [
          {
            tag: 'span',
            class: 'ty-section-heading__icon',
            when: ['slot:icon'],
            attrs: { 'aria-hidden': { value: 'true' } },
            children: [{ slot: 'icon' }],
          },
          {
            tag: 'div',
            class: 'ty-section-heading__text',
            children: [
              ...([2, 3, 4] as const).map((n): ElementNode => ({
                tag: `h${n}`,
                class: 'ty-section-heading__title',
                when: [`level:${n}`],
                attrs: {
                  id: { idref: 'heading', prop: 'headingId' },
                  'data-truncate': { prop: 'truncate', kind: 'flag' },
                  title: { prop: 'title', when: ['truncate'] },
                },
                children: [{ text: { prop: 'title' } }],
              })),
              { tag: 'p', class: 'ty-section-heading__subtitle', when: ['subtitle'], children: [{ text: { prop: 'subtitle' } }] },
            ],
          },
          {
            tag: 'div',
            class: 'ty-section-heading__trailing',
            when: ['slot:trailing'],
            children: [{ slot: 'trailing' }],
          },
        ],
      },
      {
        tag: 'div',
        class: 'ty-section-heading__extra',
        when: ['slot:default'],
        children: [{ slot: 'default' }],
      },
    ],
  },
  examples: [
    { name: 'title', props: { title: 'Members' }, slots: {} },
    { name: 'level-3-subtitle', props: { title: 'API keys', level: '3', subtitle: 'Keys of every integration' }, slots: {} },
    { name: 'icon-trailing', props: { title: 'Webhooks' }, slots: { icon: '⚡', trailing: 'Add' } },
    { name: 'truncate', props: { title: 'A section name that runs well past the width of its container', truncate: true }, slots: {} },
    { name: 'extra', props: { title: 'Filters' }, slots: { trailing: 'Clear all', default: 'Status: active' } },
  ],
} as const satisfies ElementDefinition
