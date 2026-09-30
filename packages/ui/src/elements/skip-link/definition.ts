import type { ElementDefinition } from '../definition.ts'

/** `<ty-skip-link>`: the SkipLink's single source (spec: wave-1/skip-link.md). */
export const skipLinkDefinition = {
  tag: 'ty-skip-link',
  name: 'TySkipLink',
  kind: 'enhancing',
  doc: 'First focusable element of the page: jumps past the navigation straight to the main content (WCAG 2.4.1 Bypass Blocks). A native anchor to the target\'s fragment, visually hidden until focused — never `display: none`, so it stays in the accessibility tree. On activation the element moves focus to the target (a temporary negative tabindex when the target is not natively focusable) and scrolls it clear of the sticky top bar.',
  props: {
    targetId: { type: 'string', default: 'main-content', attribute: 'target-id', doc: 'Id of the main content element; the anchor\'s href is its fragment (`#main-content`).' },
    label: { type: 'string', default: 'Skip to main content', attribute: 'label', doc: 'Link text (the I18n adapter\'s default); translate through this attribute.' },
  },
  events: [{ type: 'click', kind: 'native', reactProp: 'onClick', doc: 'The native click of the anchor, before the focus move.' }],
  anatomy: {
    tag: 'a',
    class: 'ty-skip-link',
    // No href binding: the fragment (`#` + targetId) is derived, which the
    // definition language cannot express; the element applies it on upgrade.
    attrs: {},
    children: [{ text: { prop: 'label' } }],
  },
  examples: [
    { name: 'default', props: {}, slots: {} },
    { name: 'translated', props: { targetId: 'conteudo', label: 'Ir para o conteúdo' }, slots: {} },
  ],
} as const satisfies ElementDefinition
