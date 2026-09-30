import type { ElementDefinition, ElementNode } from '../definition.ts'

/** A lucide glyph (ISC, THIRD_PARTY_NOTICES). */
const glyph = (tag: string, attrs: Record<string, string>): ElementNode => ({
  tag,
  class: 'ty-popover__glyph',
  attrs: Object.fromEntries(Object.entries(attrs).map(([name, value]) => [name, { value }])),
})

/** The built-in info trigger's "i" (lucide strokes), used only when the trigger slot is empty. */
const infoIcon: ElementNode = {
  tag: 'svg',
  class: 'ty-icon',
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
  children: [
    glyph('circle', { cx: '12', cy: '12', r: '10' }),
    glyph('path', { d: 'M12 16v-4' }),
    glyph('path', { d: 'M12 8h.01' }),
  ],
}

/**
 * The built-in trigger (only when the trigger slot is empty): a quiet,
 * compact, icon-only button carrying the info glyph — exactly the chrome
 * Popover.tsx composes.
 */
/** `<ty-popover>`: the Popover's single source (spec: wave-1/popover.md). */
export const popoverDefinition = {
  tag: 'ty-popover',
  name: 'TyPopover',
  kind: 'enhancing',
  doc: 'Non-modal floating panel anchored to a trigger, for short explanations or arbitrary small content (help text, a mini form, a brand menu). The trigger is the host\'s own focusable element in the trigger slot — or the built-in info button when the slot is empty and `triggerLabel` names it. The element wires aria-expanded on the trigger, places the panel with the shared placement model (side preference, collision flip, viewport clamp, arrow inset), and asks to close with `ty-open-change` on Escape, an outside press, or focus leaving the panel; the host flips `open`. Not a focus trap — content that needs one is a dialog, not a popover.',
  props: {
    open: { type: 'boolean', attribute: 'open', doc: 'Shown (controlled). The anatomy stays mounted but `hidden` while closed, so nothing reaches the accessibility tree.' },
    triggerLabel: { type: 'string', attribute: 'trigger-label', doc: 'Accessible name of the built-in info trigger (required when the trigger slot is empty).' },
    title: { type: 'string', attribute: 'title', doc: 'Heading at the top of the panel; also its accessible name.' },
    placement: { type: 'enum', values: ['top', 'end', 'bottom', 'start'], default: 'bottom', attribute: 'placement', doc: 'Preferred side; `start`/`end` follow the reading direction. Flips when there is no room.' },
    align: { type: 'enum', values: ['start', 'center', 'end'], default: 'center', attribute: 'align', doc: 'Alignment along the chosen side.' },
    offset: { type: 'string', default: '2', attribute: 'offset', doc: 'Gap between trigger and panel as a step of the spacing scale (0–9); the arrow\'s inset is added to it.' },
    showArrow: { type: 'string', attribute: 'show-arrow', doc: '`true` or `false`; unset: the arrow shows.' },
    panelTestId: { type: 'string', attribute: 'panel-test-id', doc: 'Test hook on the panel (`data-testid`).' },
    accessibleLabel: { type: 'string', attribute: 'accessible-label', doc: 'Accessible name of the panel when `title` is empty.' },
  },
  events: [
    { type: 'ty-open-change', kind: 'custom', detail: { open: 'boolean' }, reactProp: 'onOpenChange', doc: 'The element asks the host to change visibility — `open: false` on Escape, an outside press or focus leaving the panel, `open: true` on a trigger activation. Controlled: the element does not toggle itself; the host flips `open`.' },
  ],
  slots: {
    trigger: { doc: 'The host\'s own toggle — any single focusable element; wired to the panel (aria-expanded, activation). Empty: the built-in info button.' },
    default: { doc: 'The panel body.' },
  },
  anatomy: {
    tag: 'div',
    class: 'ty-popover__anchor',
    attrs: {},
    children: [
      // The trigger slot projects the host\'s control; the built-in info
      // button stands in when it is empty.
      {
        tag: 'button',
        class: 'ty-button ty-popover__trigger',
        when: ['!slot:trigger'],
        attrs: {
          type: { value: 'button' },
          'aria-label': { prop: 'triggerLabel' },
          'aria-haspopup': { value: 'dialog' },
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
            children: [infoIcon],
          },
        ],
      },
      { slot: 'trigger', when: ['slot:trigger'] },
      {
        tag: 'div',
        class: 'ty-popover',
        // Always rendered (a framework's closed popover has an anatomy to
        // find); `hidden` while closed, so nothing reaches the tree.
        attrs: {
          hidden: { value: '', when: ['!open'] },
          role: { value: 'dialog' },
          'data-placement': { prop: 'placement' },
          'data-testid': { prop: 'panelTestId' },
        },
        children: [
          {
            tag: 'div',
            class: 'ty-popover__arrow',
            when: ['!showArrow:false'],
            attrs: { 'aria-hidden': { value: 'true' } },
          },
          {
            tag: 'div',
            class: 'ty-popover__dialog',
            children: [
              {
                tag: 'h3',
                class: 'ty-popover__title',
                when: ['title'],
                children: [{ text: { prop: 'title' } }],
              },
              {
                tag: 'div',
                class: 'ty-popover__content',
                when: ['slot:default'],
                children: [{ slot: 'default' }],
              },
            ],
          },
        ],
      },
    ],
  },
  examples: [
    { name: 'closed', props: { triggerLabel: 'Details' }, slots: {} },
    { name: 'info-open', props: { open: true, triggerLabel: 'About this', title: 'What this means' }, slots: { default: 'A short explanation.' } },
    { name: 'own-trigger', props: { open: true, placement: 'top', align: 'start' }, slots: { trigger: 'Open', default: 'Anchored above, aligned to the start.' } },
    { name: 'no-arrow', props: { open: true, triggerLabel: 'Where', title: 'Somewhere', showArrow: 'false' }, slots: { default: 'Without a pointer.' } },
    { name: 'offset-4', props: { open: true, triggerLabel: 'Gap', title: 'Further away', offset: '4' }, slots: { default: 'A wider gap.' } },
  ],
} as const satisfies ElementDefinition
