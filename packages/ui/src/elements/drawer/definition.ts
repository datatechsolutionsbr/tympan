import type { ElementDefinition, ElementNode } from '../definition.ts'

/** A lucide glyph (ISC, THIRD_PARTY_NOTICES): every child carries a class so the element's patch pass can match it. */
const glyph = (tag: string, attrs: Record<string, string>): ElementNode => ({
  tag,
  class: 'ty-drawer__glyph',
  attrs: Object.fromEntries(Object.entries(attrs).map(([name, value]) => [name, { value }])),
})

/** A decorative 24px icon (lucide strokes). */
const icon = (children: ElementNode[], className = 'ty-icon'): ElementNode => ({
  tag: 'svg',
  class: className,
  attrs: {
    viewBox: { value: '0 0 24 24' },
    fill: { value: 'none' },
    stroke: { value: 'currentColor' },
    'stroke-width': { value: '2' },
    'stroke-linecap': { value: 'round' },
    'stroke-linejoin': { value: 'round' },
    'aria-hidden': { value: 'true' },
    focusable: { value: 'false' },
  },
  children,
})

/**
 * The close control — always rendered (spec: backdrop, Escape and drag are
 * never the only way out): a quiet, compact, icon-only button, exactly the
 * Button chrome Drawer.tsx composes.
 */
const closeButton: ElementNode = {
  tag: 'button',
  class: 'ty-button ty-drawer__close',
  attrs: {
    type: { value: 'button' },
    'aria-label': { prop: 'closeLabel' },
    title: { prop: 'closeLabel' },
    'data-variant': { value: 'quiet' },
    'data-size': { value: 'compact' },
    'data-shape': { value: 'circle' },
    'data-icon-only': { value: '' },
  },
  children: [
    {
      tag: 'span',
      class: 'ty-button__icon',
      attrs: { 'aria-hidden': { value: 'true' } },
      children: [icon([glyph('path', { d: 'M18 6 6 18' }), glyph('path', { d: 'm6 6 12 12' })])],
    },
  ],
}

/** `<ty-drawer>`: the Drawer's single source (spec: wave-1/drawer.md). */
export const drawerDefinition = {
  tag: 'ty-drawer',
  name: 'TyDrawer',
  kind: 'enhancing',
  doc: 'Modal panel sliding in from an edge of the viewport for a secondary task: a backdrop, a panel anchored to the bottom (sheet) or end (side panel) edge, a header with the title and an always-present close button, an optional grab handle, a scrolling body and a bottom safe-area inset. Controlled through `open`; the element asks to close with `ty-open-change` (Escape, close button, an allowed backdrop press, a drag past the threshold) and the host flips `open`. Focus moves into the panel on open, is trapped while open, and returns to the invoking element on close; the page behind is inert and does not scroll.',
  props: {
    open: { type: 'boolean', attribute: 'open', doc: 'Shown (controlled). The anatomy stays mounted but `hidden` while closed, so nothing reaches the accessibility tree.' },
    placement: { type: 'enum', values: ['bottom', 'end'], default: 'bottom', attribute: 'placement', doc: 'The edge the panel attaches to; `end` follows the reading direction.' },
    width: { type: 'enum', values: ['medium', 'large', 'wide'], default: 'medium', attribute: 'width', doc: 'Maximum width step of an end-placed panel.' },
    maxHeight: { type: 'string', attribute: 'max-height', doc: 'Maximum height of a bottom-placed panel (a CSS length, e.g. `85dvh`); applied to the panel on upgrade.' },
    showHandle: { type: 'string', attribute: 'show-handle', doc: '`true` or `false`; unset: the grab handle shows on bottom placement.' },
    dismissible: { type: 'string', attribute: 'dismissible', doc: '`true` or `false`; unset (or `true`): a backdrop press and a drag past the threshold dismiss. Escape and the close button always work.' },
    closeLabel: { type: 'string', default: 'Close', attribute: 'close-label', doc: 'Accessible name of the close button.' },
    accessibleLabel: { type: 'string', attribute: 'accessible-label', doc: 'Accessible name of the dialog when the title slot is empty.' },
    panelTestId: { type: 'string', attribute: 'panel-test-id', doc: 'Test hook on the panel (`data-testid`).' },
    backdropTestId: { type: 'string', attribute: 'backdrop-test-id', doc: 'Test hook on the backdrop (`data-testid`).' },
  },
  events: [
    { type: 'ty-open-change', kind: 'custom', detail: { open: 'boolean' }, reactProp: 'onOpenChange', doc: 'The element asks the host to change visibility — `open: false` on Escape, the close button, an allowed backdrop press or a drag past the threshold. Controlled: the element does not close itself; the host flips `open`.' },
  ],
  slots: {
    title: { doc: 'The visible heading; also the accessible name (`accessibleLabel` when empty).' },
    default: { doc: 'The body; scrolls when long.' },
  },
  anatomy: {
    tag: 'div',
    class: 'ty-drawer__backdrop',
    // Always rendered (a framework's closed drawer has an anatomy to find);
    // `hidden` while closed, so nothing reaches the accessibility tree.
    attrs: {
      hidden: { value: '', when: ['!open'] },
      'data-placement': { prop: 'placement' },
      'data-testid': { prop: 'backdropTestId' },
    },
    children: [
      {
        tag: 'div',
        class: 'ty-drawer',
        attrs: {
          'data-placement': { prop: 'placement' },
          'data-width': { prop: 'width' },
        },
        children: [
          {
            tag: 'div',
            class: 'ty-drawer__dialog',
            attrs: {
              role: { value: 'dialog' },
              'aria-modal': { value: 'true' },
              tabindex: { value: '-1' },
              'aria-labelledby': { idref: 'title', when: ['slot:title'] },
              'aria-label': { prop: 'accessibleLabel', when: ['!slot:title'] },
              'data-testid': { prop: 'panelTestId' },
            },
            children: [
              {
                tag: 'header',
                class: 'ty-drawer__header',
                children: [
                  {
                    tag: 'span',
                    class: 'ty-drawer__handle',
                    when: ['placement:bottom', '!showHandle:false'],
                    attrs: { 'aria-hidden': { value: 'true' } },
                  },
                  {
                    tag: 'h2',
                    class: 'ty-drawer__title',
                    when: ['slot:title'],
                    attrs: { id: { idref: 'title' } },
                    children: [{ slot: 'title' }],
                  },
                  closeButton,
                ],
              },
              {
                tag: 'div',
                class: 'ty-drawer__body',
                when: ['slot:default'],
                children: [{ slot: 'default' }],
              },
              {
                tag: 'div',
                class: 'ty-drawer__inset',
                when: ['placement:bottom'],
                attrs: { 'aria-hidden': { value: 'true' } },
              },
            ],
          },
        ],
      },
    ],
  },
  examples: [
    { name: 'closed', props: {}, slots: {} },
    { name: 'bottom', props: { open: true }, slots: { title: 'Language', default: 'Pick a locale.' } },
    { name: 'end-wide', props: { open: true, placement: 'end', width: 'wide' }, slots: { title: 'Run details', default: 'Timeline.' } },
    { name: 'no-handle', props: { open: true, showHandle: 'false' }, slots: { title: 'Filters', default: 'Filter rows.' } },
    { name: 'not-dismissible', props: { open: true, dismissible: 'false' }, slots: { title: 'Required step', default: 'Finish the form.' } },
    { name: 'max-height', props: { open: true, maxHeight: '60dvh' }, slots: { title: 'Shortcuts', default: 'Keys.' } },
  ],
} as const satisfies ElementDefinition
