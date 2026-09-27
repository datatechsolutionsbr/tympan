import type { ElementDefinition } from '../definition.ts'

/** `<ty-surface>`: the Surface's single source (spec: wave-1/surface.md). */
export const surfaceDefinition = {
  tag: 'ty-surface',
  name: 'TySurface',
  kind: 'enhancing',
  doc: 'Bounded container at a chosen elevation. A titled surface is a region named by its title; a pressable one forwards presses anywhere on it to the single primary control in the title (a link with `href`, a button otherwise).',
  props: {
    elevation: { type: 'enum', values: ['sheet', 'raised', 'floating', 'flat'], default: 'sheet', attribute: 'elevation', doc: 'Level 1 (sheet glass), 2 (raised card), 3 (floating) or 0 (flat).' },
    padding: { type: 'enum', values: ['none', 'regular', 'roomy'], default: 'regular', attribute: 'padding', doc: 'Internal padding step.' },
    titleLevel: { type: 'enum', values: ['h2', 'h3', 'h4'], default: 'h3', attribute: 'title-level', doc: 'Heading level of the title.' },
    pressable: { type: 'boolean', attribute: 'pressable', doc: 'The whole surface is one press target that forwards to the title\'s primary control; set it when `onclick` is wired. Implied by `href`.' },
    href: { type: 'string', attribute: 'href', doc: 'Makes the surface a whole-card link: the title\'s primary control is an anchor and its hit area stretches over the card.' },
    selected: { type: 'boolean', attribute: 'selected', doc: 'A chosen card (accent-soft state).' },
    disabled: { type: 'boolean', attribute: 'disabled', doc: 'Pressable surfaces only: inert primary control, no forwarding.' },
    accessibleLabel: { type: 'string', attribute: 'accessible-label', doc: 'Accessible name of the region when there is no visible title.' },
  },
  events: [{ type: 'click', kind: 'native', reactProp: 'onClick', rustProp: 'onclick', doc: 'A press of the primary control (directly, or forwarded from anywhere on the surface).' }],
  slots: {
    default: { doc: 'The body.' },
    title: { doc: 'The header title (a heading). Required on a pressable surface: it holds the primary control.' },
    description: { doc: 'A secondary line under the title.' },
    footer: { doc: 'The footer region, usually actions.' },
  },
  anatomy: {
    tag: 'section',
    class: 'ty-surface',
    attrs: {
      'aria-labelledby': { idref: 'title', when: ['slot:title'] },
      'aria-label': { prop: 'accessibleLabel', when: ['!slot:title'] },
      'data-elevation': { prop: 'elevation' },
      'data-padding': { prop: 'padding' },
      'data-pressable': { value: '', when: ['pressable|href'] },
      'data-selected': { prop: 'selected', kind: 'flag' },
      'data-disabled': { value: '', when: ['pressable|href', 'disabled'] },
    },
    children: [
      {
        tag: 'header',
        class: 'ty-surface__header',
        when: ['slot:title|slot:description'],
        children: [
          {
            tag: 'h2',
            class: 'ty-surface__title',
            attrs: { id: { idref: 'title' } },
            when: ['slot:title', 'titleLevel:h2'],
            children: [
              { tag: 'a', class: 'ty-surface__primary', when: ['href'], attrs: { href: { prop: 'href', when: ['!disabled'] }, 'aria-disabled': { prop: 'disabled', kind: 'bool' } }, children: [{ slot: 'title' }] },
              { tag: 'button', class: 'ty-surface__primary', when: ['!href', 'pressable'], attrs: { type: { value: 'button' }, disabled: { prop: 'disabled', kind: 'boolean-attr' } }, children: [{ slot: 'title' }] },
              { slot: 'title', when: ['!href', '!pressable'] },
            ],
          },
          {
            tag: 'h3',
            class: 'ty-surface__title',
            attrs: { id: { idref: 'title' } },
            when: ['slot:title', 'titleLevel:h3'],
            children: [
              { tag: 'a', class: 'ty-surface__primary', when: ['href'], attrs: { href: { prop: 'href', when: ['!disabled'] }, 'aria-disabled': { prop: 'disabled', kind: 'bool' } }, children: [{ slot: 'title' }] },
              { tag: 'button', class: 'ty-surface__primary', when: ['!href', 'pressable'], attrs: { type: { value: 'button' }, disabled: { prop: 'disabled', kind: 'boolean-attr' } }, children: [{ slot: 'title' }] },
              { slot: 'title', when: ['!href', '!pressable'] },
            ],
          },
          {
            tag: 'h4',
            class: 'ty-surface__title',
            attrs: { id: { idref: 'title' } },
            when: ['slot:title', 'titleLevel:h4'],
            children: [
              { tag: 'a', class: 'ty-surface__primary', when: ['href'], attrs: { href: { prop: 'href', when: ['!disabled'] }, 'aria-disabled': { prop: 'disabled', kind: 'bool' } }, children: [{ slot: 'title' }] },
              { tag: 'button', class: 'ty-surface__primary', when: ['!href', 'pressable'], attrs: { type: { value: 'button' }, disabled: { prop: 'disabled', kind: 'boolean-attr' } }, children: [{ slot: 'title' }] },
              { slot: 'title', when: ['!href', '!pressable'] },
            ],
          },
          { tag: 'div', class: 'ty-surface__description', when: ['slot:description'], children: [{ slot: 'description' }] },
        ],
      },
      { tag: 'div', class: 'ty-surface__body', when: ['slot:default'], children: [{ slot: 'default' }] },
      { tag: 'footer', class: 'ty-surface__footer', when: ['slot:footer'], children: [{ slot: 'footer' }] },
    ],
  },
  examples: [
    { name: 'sheet', props: {}, slots: { title: 'Runs', description: 'Last 24 hours', default: 'Body' } },
    { name: 'raised-roomy', props: { elevation: 'raised', padding: 'roomy' }, slots: { default: 'Body' } },
    { name: 'flat-none-footer', props: { elevation: 'flat', padding: 'none' }, slots: { default: 'Body', footer: 'Actions' } },
    { name: 'pressable', props: { pressable: true }, slots: { title: 'Open workflow', default: 'Body' } },
    { name: 'link-selected', props: { href: '/runs/1', selected: true }, slots: { title: 'Nightly sync', default: 'Body' } },
    { name: 'pressable-disabled', props: { pressable: true, disabled: true }, slots: { title: 'Archived', default: 'Body' } },
    { name: 'title-level', props: { titleLevel: 'h2' }, slots: { title: 'Settings' } },
  ],
} as const satisfies ElementDefinition
