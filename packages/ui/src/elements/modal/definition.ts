import type { ElementDefinition, ElementNode } from '../definition.ts'

/** A lucide glyph (ISC, THIRD_PARTY_NOTICES): every child carries a class so the element's patch pass can match it. */
const glyph = (tag: string, attrs: Record<string, string>): ElementNode => ({
  tag,
  class: 'ty-modal-dialog__glyph',
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
 * The close control: a quiet, compact, icon-only button, exactly the
 * Button chrome ModalDialog.tsx composes (`variant="quiet" size="compact"
 * shape="circle" iconOnly`).
 */
const closeButton: ElementNode = {
  tag: 'button',
  class: 'ty-button ty-modal-dialog__close',
  // Unset: shown on a dialog, hidden on an alertdialog. `show-close-button`
  // overrides both ways.
  when: ['!showCloseButton:false', 'showCloseButton:true|!role:alertdialog'],
  attrs: {
    type: { value: 'button' },
    'aria-label': { prop: 'closeLabel' },
    title: { prop: 'closeLabel' },
    disabled: { prop: 'busy', kind: 'boolean-attr' },
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

/** `<ty-modal>`: the ModalDialog's single source (spec: wave-1/modal-dialog.md). */
export const modalDefinition = {
  tag: 'ty-modal',
  name: 'TyModal',
  kind: 'enhancing',
  doc: 'Focused modal window for a decision or a short form: a backdrop and a panel (title, optional description, scrolling body, actions row, optional close button). Controlled through `open`; the element asks to close with `ty-open-change` (Escape, the close button, an allowed backdrop press) and the host flips `open`. Focus moves into the panel on open, is trapped while open, and returns to the invoking element on close; the page behind is inert and does not scroll.',
  props: {
    isOpen: { type: 'boolean', attribute: 'open', doc: 'Shown (controlled). The anatomy stays mounted but `hidden` while closed, so nothing reaches the accessibility tree.' },
    width: { type: 'enum', values: ['narrow', 'regular', 'wide', 'xwide'], default: 'regular', attribute: 'width', doc: 'Maximum panel width step.' },
    role: { type: 'enum', values: ['dialog', 'alertdialog'], default: 'dialog', attribute: 'dialog-role', doc: '`alertdialog` for destructive or blocking confirmations: the backdrop never dismisses it and the close button is hidden, unless the props below say otherwise.' },
    dismissOnBackdrop: { type: 'string', attribute: 'dismiss-on-backdrop', doc: '`true` or `false`; unset: the backdrop dismisses a `dialog`, never an `alertdialog`.' },
    showCloseButton: { type: 'string', attribute: 'show-close-button', doc: '`true` or `false`; unset: shown on a `dialog`, hidden on an `alertdialog`.' },
    initialFocus: { type: 'enum', values: ['first', 'title'], default: 'first', attribute: 'initial-focus', doc: 'Where focus lands on open; a `[data-autofocus]` control inside wins either way. Unset on an `alertdialog`: the first action (the least destructive, by convention).' },
    busy: { type: 'boolean', attribute: 'busy', doc: 'An action is pending: closing (Escape, the backdrop, the close button) is disabled and the panel is `aria-busy`.' },
    closeLabel: { type: 'string', default: 'Close', attribute: 'close-label', doc: 'Accessible name of the close button.' },
    accessibleLabel: { type: 'string', attribute: 'accessible-label', doc: 'Accessible name of the panel when the title slot is empty and no `labelledBy` is given.' },
    labelledBy: { type: 'string', attribute: 'labelled-by', doc: '`aria-labelledby` of the panel (a host that renders its own title element), joined before the title slot\'s heading.' },
    describedBy: { type: 'string', attribute: 'described-by', doc: '`aria-describedby` of the panel, joined before the description slot\'s paragraph.' },
    panelTestId: { type: 'string', attribute: 'panel-test-id', doc: 'Test hook on the panel (`data-testid`).' },
    backdropTestId: { type: 'string', attribute: 'backdrop-test-id', doc: 'Test hook on the backdrop (`data-testid`).' },
  },
  events: [
    { type: 'ty-open-change', kind: 'custom', detail: { open: 'boolean' }, reactProp: 'onOpenChange', rustProp: 'on_open_change', doc: 'The element asks the host to change visibility — `open: false` on Escape, the close button or an allowed backdrop press. Controlled: the element does not close itself; the host flips `isOpen`.' },
  ],
  slots: {
    title: { doc: 'The accessible name, rendered as the panel\'s heading (required by the spec; `accessibleLabel` or `labelledBy` names the panel when it is empty).' },
    description: { doc: 'Accessible description under the header.' },
    default: { doc: 'The body; scrolls when long while the header and the actions stay visible.' },
    actions: { doc: 'The actions row (primary last on the end side). Pressing an action runs its own handler; the dialog stays open unless the host flips `isOpen`.' },
  },
  anatomy: {
    tag: 'div',
    class: 'ty-modal-dialog__backdrop',
    // Always rendered (a framework's closed modal has an anatomy to find);
    // `hidden` while closed, so nothing reaches the accessibility tree.
    attrs: { hidden: { value: '', when: ['!isOpen'] }, 'data-testid': { prop: 'backdropTestId' } },
    children: [
      {
        tag: 'div',
        class: 'ty-modal-dialog',
        attrs: { 'data-width': { prop: 'width' } },
        children: [
          {
            tag: 'div',
            class: 'ty-modal-dialog__panel',
            attrs: {
              role: { prop: 'role' },
              'aria-modal': { value: 'true' },
              tabindex: { value: '-1' },
              'aria-labelledby': {
                idrefs: [{ prop: 'labelledBy' }, { id: 'title', when: ['slot:title'] }],
              },
              'aria-describedby': {
                idrefs: [{ prop: 'describedBy' }, { id: 'description', when: ['slot:description'] }],
              },
              'aria-label': { prop: 'accessibleLabel', when: ['!slot:title', '!labelledBy'] },
              'data-busy': { prop: 'busy', kind: 'flag' },
              'data-testid': { prop: 'panelTestId' },
            },
            children: [
              {
                tag: 'div',
                class: 'ty-modal-dialog__inner',
                attrs: { 'aria-busy': { prop: 'busy', kind: 'bool' } },
                children: [
                  {
                    tag: 'header',
                    class: 'ty-modal-dialog__header',
                    // The header holds the title and the close button; with
                    // neither there is no header.
                    when: ['slot:title|showCloseButton:true|!role:alertdialog', 'slot:title|!showCloseButton:false'],
                    children: [
                      {
                        tag: 'h2',
                        class: 'ty-modal-dialog__title',
                        when: ['slot:title'],
                        attrs: { id: { idref: 'title' }, tabindex: { value: '-1' } },
                        children: [{ slot: 'title' }],
                      },
                      closeButton,
                    ],
                  },
                  {
                    tag: 'p',
                    class: 'ty-modal-dialog__description',
                    when: ['slot:description'],
                    attrs: { id: { idref: 'description' } },
                    children: [{ slot: 'description' }],
                  },
                  {
                    tag: 'div',
                    class: 'ty-modal-dialog__body',
                    when: ['slot:default'],
                    children: [{ slot: 'default' }],
                  },
                  {
                    tag: 'footer',
                    class: 'ty-modal-dialog__actions',
                    when: ['slot:actions'],
                    children: [{ slot: 'actions' }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  examples: [
    { name: 'closed', props: {}, slots: {} },
    { name: 'open', props: { isOpen: true }, slots: { title: 'Delete file?', default: 'This cannot be undone.', actions: 'Delete' } },
    { name: 'open-description', props: { isOpen: true }, slots: { title: 'Invite member', description: 'They get an email with a link.', default: 'Form fields', actions: 'Invite' } },
    { name: 'alertdialog', props: { isOpen: true, role: 'alertdialog' }, slots: { title: 'Discard changes?', default: 'Your edits are not saved.', actions: 'Discard' } },
    { name: 'wide-busy', props: { isOpen: true, width: 'wide', busy: true }, slots: { title: 'Publishing', default: 'Uploading the bundle.' } },
    { name: 'no-close-button', props: { isOpen: true, showCloseButton: 'false' }, slots: { title: 'Terms of service', default: 'Scroll to the end.', actions: 'Accept' } },
  ],
} as const satisfies ElementDefinition
