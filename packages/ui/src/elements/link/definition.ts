import type { ElementDefinition } from '../definition.ts'

/** `<ty-link>`: the Link's single source (spec: wave-1/link.md). */
export const linkDefinition = {
  tag: 'ty-link',
  name: 'TyLink',
  kind: 'enhancing',
  doc: 'Moves to another location. A native <a> inside, so focus, keyboard activation and opening in a new context are the platform\'s; an external destination opens in a new context with a safe rel, an icon and a screen-reader hint.',
  props: {
    href: { type: 'string', attribute: 'href', doc: 'Destination. The element is a navigation link; an inline action without one is a plain <button class="ty-link" data-action="">' },
    emphasis: { type: 'enum', values: ['underlined', 'subtle'], default: 'underlined', attribute: 'emphasis', doc: '`subtle` hides the underline at rest (only where the context makes the link obvious).' },
    external: { type: 'boolean', attribute: 'external', doc: 'Opens in a new context with `rel="noopener noreferrer"`, an icon and a screen-reader hint. Inferred on upgrade from absolute URLs to another origin; hosts render it explicitly.' },
    current: { type: 'boolean', attribute: 'current', doc: 'Marks the link as the current page (`aria-current="page"`).' },
    standalone: { type: 'boolean', attribute: 'standalone', doc: 'Standalone links (lists, footers) get a 44 px tall hit area; inline prose links do not.' },
    newTabLabel: { type: 'string', attribute: 'new-tab-label', default: '(opens in a new tab)', doc: 'Screen-reader hint appended to an external link\'s name on upgrade; translate through this attribute.' },
    accessibleLabel: { type: 'string', attribute: 'accessible-label', doc: 'Accessible name when the visible text is not enough (`aria-label`).' },
    describedBy: { type: 'string', attribute: 'described-by', doc: 'Id of an element describing the link (`aria-describedby`).' },
  },
  events: [{ type: 'click', kind: 'native', reactProp: 'onClick', rustProp: 'onclick', doc: 'The native click of the anchor.' }],
  slots: {
    default: { doc: 'The link text.' },
  },
  anatomy: {
    tag: 'a',
    class: 'ty-link',
    attrs: {
      href: { prop: 'href' },
      target: { value: '_blank', when: ['external'] },
      rel: { value: 'noopener noreferrer', when: ['external'] },
      'aria-current': { value: 'page', when: ['current'] },
      'aria-label': { prop: 'accessibleLabel' },
      'aria-describedby': { prop: 'describedBy' },
      'data-emphasis': { prop: 'emphasis' },
      'data-standalone': { prop: 'standalone', kind: 'flag' },
    },
    children: [
      { slot: 'default' },
      {
        tag: 'svg',
        class: 'ty-icon ty-mirror-rtl ty-link__external',
        when: ['external'],
        attrs: {
          'aria-hidden': { value: 'true' },
          focusable: { value: 'false' },
          width: { value: '24' },
          height: { value: '24' },
          viewBox: { value: '0 0 24 24' },
          fill: { value: 'none' },
          stroke: { value: 'currentColor' },
          'stroke-width': { value: '2' },
          'stroke-linecap': { value: 'round' },
          'stroke-linejoin': { value: 'round' },
        },
        children: [
          { tag: 'path', attrs: { d: { value: 'M15 3h6v6' } } },
          { tag: 'path', attrs: { d: { value: 'M10 14 21 3' } } },
          { tag: 'path', attrs: { d: { value: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' } } },
        ],
      },
      { tag: 'span', class: 'ty-visually-hidden ty-link__hint', when: ['external'] },
    ],
  },
  examples: [
    { name: 'inline', props: { href: '/runs' }, slots: { default: 'Runs' } },
    { name: 'subtle-standalone', props: { href: '/runs/01HX', emphasis: 'subtle', standalone: true }, slots: { default: 'Details' } },
    { name: 'external', props: { href: 'https://example.org/report', external: true }, slots: { default: 'Report' } },
    { name: 'current', props: { href: '/overview', current: true }, slots: { default: 'Overview' } },
    { name: 'translated-hint', props: { href: 'https://example.org/relatorio', external: true, newTabLabel: '(abre em nova aba)', describedBy: 'report-hint' }, slots: { default: 'Relatório' } },
  ],
} as const satisfies ElementDefinition
