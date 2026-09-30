import type { ElementDefinition, ElementNode } from '../definition.ts'

/** A lucide glyph (ISC, THIRD_PARTY_NOTICES): every child carries a class so the element's patch pass can match it. */
const glyph = (tag: string, attrs: Record<string, string>): ElementNode => ({
  tag,
  class: 'ty-action-menu__glyph',
  attrs: Object.fromEntries(Object.entries(attrs).map(([name, value]) => [name, { value }])),
})

/** The built-in trigger's ellipsis (lucide strokes), used only in trigger mode when the trigger slot is empty. */
const ellipsisIcon: ElementNode = {
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
    glyph('circle', { cx: '12', cy: '12', r: '1' }),
    glyph('circle', { cx: '19', cy: '12', r: '1' }),
    glyph('circle', { cx: '5', cy: '12', r: '1' }),
  ],
}

/**
 * `<ty-action-menu>`: the ActionMenu's single source (spec: wave-1/action-menu.md).
 *
 * The entries are data (`items`, JSON), which the declarative anatomy cannot
 * express (no dynamic repetition), so — as the skeleton composes its presets
 * — the element composes the item rows into the anatomy's empty
 * `.ty-action-menu__menu` on upgrade. Examples therefore stay closed: an open
 * example would render its rows only after the element runs, and the parity
 * renderers could not produce them.
 */
export const actionMenuDefinition = {
  tag: 'ty-action-menu',
  name: 'TyActionMenu',
  kind: 'enhancing',
  doc: 'A list of commands opened from a trigger button (mode `trigger`, the APG Menu Button pattern) or at a pointer position over a target (mode `context`: secondary click, Shift+F10, the ContextMenu key, or a long press on touch). Opening moves focus to the first enabled item (ArrowUp from the trigger: the last); ArrowDown/ArrowUp move with wrapping, Home/End jump, typing a character moves to the next enabled item starting with it, Enter/Space activate, Escape closes and returns focus to the origin, Tab and an outside press close. Disabled items are skipped and announced as disabled. In context mode the surface is clamped so it never overflows the viewport. Visibility is controlled: the element asks with `ty-open-change`, the host flips `open`.',
  props: {
    open: { type: 'boolean', attribute: 'open', doc: 'Shown (controlled). The anatomy stays mounted but `hidden` while closed, so nothing reaches the accessibility tree.' },
    mode: { type: 'enum', values: ['trigger', 'context'], default: 'trigger', attribute: 'mode', doc: '`trigger`: opens from the trigger button; `context`: opens at a viewport point over the trigger slot\'s target.' },
    label: { type: 'string', attribute: 'label', doc: 'Accessible name of the menu (required by the spec).' },
    triggerLabel: { type: 'string', default: 'More actions', attribute: 'trigger-label', doc: 'Accessible name of the built-in icon-only trigger (the React messages.moreActions default), used in trigger mode when the trigger slot is empty.' },
    items: { type: 'string', attribute: 'items', doc: 'JSON array of entries in order: an item `{ id, label, icon?, iconPath?, tone?, disabled?, shortcut? }` (`icon` a decorative text glyph; `iconPath` an SVG icon as 24×24 path data rendered in the standard icon frame — when both are present `iconPath` wins, and subpaths separated by " | " become one `<path>` each; `tone` "danger" marks a destructive command, `shortcut` a displayed hint only), `{ "type": "separator" }`, or `{ "type": "section", "id", "title", "items": [...] }`. The element composes the rows on upgrade.' },
    position: { type: 'string', attribute: 'position', doc: 'Context mode: the viewport point the menu opens at, "x,y" in CSS pixels (controlled); the last context-request point when unset. Clamped so the menu stays inside the viewport.' },
  },
  events: [
    { type: 'ty-action', kind: 'custom', detail: { id: 'string' }, reactProp: 'onAction', doc: 'An item was activated (pointer, Enter or Space); the element then asks to close. A disabled item never fires.' },
    { type: 'ty-open-change', kind: 'custom', detail: { open: 'boolean' }, reactProp: 'onOpenChange', doc: 'The element asks the host to change visibility — `open: true` on a trigger activation or a context request (secondary click, Shift+F10, the ContextMenu key, a long press), `open: false` on Escape, Tab, an outside press or after an action. Controlled: the element does not toggle itself; the host flips `open`.' },
  ],
  slots: {
    trigger: { doc: 'Trigger mode: the host\'s own toggle — any single focusable element, wired with aria-haspopup="menu" and aria-expanded. Context mode: the target that receives the context request (secondary click, Shift+F10, long press). Empty in trigger mode: the built-in ellipsis button named by `triggerLabel`.' },
  },
  anatomy: {
    tag: 'span',
    class: 'ty-action-menu__target',
    attrs: { 'data-mode': { prop: 'mode' } },
    children: [
      // The built-in trigger (only in trigger mode, only when the trigger
      // slot is empty): a quiet, icon-only button with the ellipsis glyph —
      // exactly the chrome ActionMenu.tsx composes.
      {
        tag: 'button',
        class: 'ty-button ty-action-menu__trigger',
        when: ['!slot:trigger', 'mode:trigger'],
        attrs: {
          type: { value: 'button' },
          'aria-label': { prop: 'triggerLabel' },
          'aria-haspopup': { value: 'menu' },
          'data-variant': { value: 'quiet' },
          'data-icon-only': { value: '' },
        },
        children: [
          {
            tag: 'span',
            class: 'ty-button__icon',
            attrs: { 'aria-hidden': { value: 'true' } },
            children: [ellipsisIcon],
          },
        ],
      },
      { slot: 'trigger', when: ['slot:trigger'] },
      {
        tag: 'div',
        class: 'ty-action-menu',
        // Always rendered (a framework's closed menu has an anatomy to
        // find); `hidden` while closed, so nothing reaches the tree.
        attrs: {
          hidden: { value: '', when: ['!open'] },
          'data-mode': { prop: 'mode' },
        },
        children: [
          // Rendered empty: the element composes the item rows from the
          // `items` JSON on upgrade (the anatomy cannot repeat).
          {
            tag: 'div',
            class: 'ty-action-menu__menu',
            attrs: {
              id: { idref: 'menu' },
              role: { value: 'menu' },
              'aria-label': { prop: 'label' },
              'aria-orientation': { value: 'vertical' },
              tabindex: { value: '-1' },
            },
          },
        ],
      },
    ],
  },
  examples: [
    { name: 'closed', props: { label: 'Item actions' }, slots: {} },
    { name: 'own-trigger', props: { label: 'Run actions' }, slots: { trigger: 'More' } },
    { name: 'context', props: { mode: 'context', label: 'File actions' }, slots: { trigger: 'report.csv' } },
    { name: 'translated', props: { label: 'Ações do item', triggerLabel: 'Mais ações' }, slots: {} },
  ],
} as const satisfies ElementDefinition
