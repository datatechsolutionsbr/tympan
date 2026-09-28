import type { ElementDefinition, ElementNode } from '../definition.ts'

/** A lucide glyph (ISC, THIRD_PARTY_NOTICES): every child carries a class so the element's patch pass can match it. */
const glyph = (tag: string, attrs: Record<string, string>): ElementNode => ({
  tag,
  class: 'ty-notification-center__glyph',
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

/** The bell (lucide `bell`): the trigger and the drawer header. */
const bellIcon = icon([
  glyph('path', { d: 'M10.268 21a2 2 0 0 0 3.464 0' }),
  glyph('path', { d: 'M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326' }),
])

/** The crossed-out bell (lucide `bell-off`): the empty view. */
const bellOffIcon = icon([
  glyph('path', { d: 'M10.268 21a2 2 0 0 0 3.464 0' }),
  glyph('path', { d: 'M17 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 .258-1.742' }),
  glyph('path', { d: 'm2 2 20 20' }),
  glyph('path', { d: 'M8.668 3.01A6 6 0 0 1 18 8c0 2.687.77 4.653 1.707 6.05' }),
])

/** The close X (lucide `x`). */
const xIcon = icon([glyph('path', { d: 'M18 6 6 18' }), glyph('path', { d: 'm6 6 12 12' })])

/**
 * `<ty-notification-center>`: the NotificationCenter's single source (spec:
 * wave-2/notification-center.md).
 *
 * The anatomy covers the static shell: the bell trigger, and the drawer
 * (backdrop, dialog, header with title/clear-all/close, the empty view, the
 * list container, the polite status). What the anatomy cannot express — the
 * unseen CountBadge on the bell and the history entries in the list — the
 * element composes from the `notices` JSON on upgrade, the way the skeleton
 * composes its presets. Examples therefore stay out of `notices` states
 * (the parity renderers could not produce them); the attribute is left
 * unset whenever the history is empty, so the static conditions
 * (`notices` / `!notices`) agree with the element's parsed entries.
 *
 * Accessibility mirrors the React NotificationCenter: the bell is an APG
 * button with `aria-haspopup="dialog"` (and `aria-expanded` while open),
 * named with the unseen count; the drawer is an APG modal dialog labelled
 * by its heading; the cleared announcement lives in a visually-hidden
 * `role="status"`.
 */
export const notificationCenterDefinition = {
  tag: 'ty-notification-center',
  name: 'TyNotificationCenter',
  kind: 'enhancing',
  doc: 'Bell button with an unseen count and the session\'s notification history in a modal drawer (review, dismiss one, clear all). The host owns the history and feeds it through `notices` (JSON, newest first); the element composes the badge and the entries, asks to open or close with `ty-open-change` (controlled: the host flips `open`), and reports a dismiss (`ty-dismiss`) or a clear (`ty-clear`) so the host can update its own state. Focus moves into the drawer on open, is trapped while open, Escape asks to close, and focus returns to the bell; after a dismissal focus lands on the next entry\'s dismiss button (or the previous one, or the heading when the list became empty).',
  props: {
    open: { type: 'boolean', attribute: 'open', doc: 'Drawer shown (controlled). The anatomy stays mounted but `hidden` while closed, so nothing reaches the accessibility tree.' },
    notices: { type: 'string', attribute: 'notices', doc: 'The history as a JSON array, newest first: `[{ "id", "tone", "title", "message"?, "createdAt" }]`, `tone` one of `success`/`error`/`warning`/`info`, `createdAt` a Unix ms timestamp. Left unset (not `"[]"`) while the history is empty. The element renders at most `historyLimit` entries; it never raises toasts itself — the same call that shows a toast feeds this list.' },
    historyLimit: { type: 'number', default: 50, attribute: 'history-limit', doc: 'Cap of the rendered history (the newest survive).' },
    bellLabel: { type: 'string', default: 'Notifications', attribute: 'bell-label', doc: 'Accessible name of the bell; with unseen entries the `unreadLabel` phrase is appended.' },
    unreadLabel: { type: 'string', default: '{count} unread', attribute: 'unread-label', doc: 'Unseen phrase appended to the bell name and carried by the badge; `{count}` is replaced.' },
    titleLabel: { type: 'string', default: 'Notifications', attribute: 'title-label', doc: 'Heading of the drawer; also its accessible name (aria-labelledby).' },
    clearAllLabel: { type: 'string', default: 'Clear all', attribute: 'clear-all-label', doc: 'Name of the clear-all button (shown only with entries).' },
    closeLabel: { type: 'string', default: 'Close', attribute: 'close-label', doc: 'Accessible name of the close button.' },
    dismissLabel: { type: 'string', default: 'Dismiss, {title}', attribute: 'dismiss-label', doc: 'Accessible name of an entry\'s dismiss button; `{title}` is replaced by the entry\'s title.' },
    emptyLabel: { type: 'string', default: 'There are no notifications in this session.', attribute: 'empty-label', doc: 'The empty view\'s sentence.' },
    clearedLabel: { type: 'string', default: 'Notifications cleared', attribute: 'cleared-label', doc: 'Announced politely after clear all (no confirmation: history only).' },
    toneSuccess: { type: 'string', default: 'Success', attribute: 'tone-success', doc: 'Tone word of a success entry.' },
    toneError: { type: 'string', default: 'Error', attribute: 'tone-error', doc: 'Tone word of an error entry.' },
    toneWarning: { type: 'string', default: 'Warning', attribute: 'tone-warning', doc: 'Tone word of a warning entry.' },
    toneInfo: { type: 'string', default: 'Information', attribute: 'tone-info', doc: 'Tone word of an information entry.' },
    timeJustNow: { type: 'string', default: 'just now', attribute: 'time-just-now', doc: 'Relative time of an entry less than a minute old.' },
    timeMinutesAgo: { type: 'string', default: '{count} minutes ago', attribute: 'time-minutes-ago', doc: 'Relative time of an entry minutes old; `{count}` is replaced.' },
    timeHoursAgo: { type: 'string', default: '{count} hours ago', attribute: 'time-hours-ago', doc: 'Relative time of an entry hours old; `{count}` is replaced.' },
    timeDaysAgo: { type: 'string', default: '{count} days ago', attribute: 'time-days-ago', doc: 'Relative time of an entry days old; `{count}` is replaced.' },
  },
  events: [
    { type: 'ty-open-change', kind: 'custom', detail: { open: 'boolean' }, reactProp: 'onOpenChange', rustProp: 'on_open_change', doc: 'The element asks the host to change visibility — `open: true` on a bell press, `open: false` on Escape, the close button, a backdrop press or a second bell press. Controlled: the element does not toggle itself; the host flips `open`.' },
    { type: 'ty-dismiss', kind: 'custom', detail: { id: 'string' }, reactProp: 'onDismiss', rustProp: 'on_dismiss', doc: 'An entry\'s dismiss button was pressed. The element drops the entry from its rendered history at once; the host removes it from its own state.' },
    { type: 'ty-clear', kind: 'custom', reactProp: 'onClear', rustProp: 'on_clear', doc: 'Clear all was pressed (no confirmation: history only). The element empties its rendered history and announces the `clearedLabel` politely; the host clears its own state.' },
  ],
  anatomy: {
    tag: 'span',
    class: 'ty-notification-center',
    attrs: {},
    children: [
      {
        tag: 'span',
        class: 'ty-notification-center__bell',
        attrs: {},
        children: [
          {
            tag: 'button',
            class: 'ty-button ty-notification-center__trigger',
            attrs: {
              type: { value: 'button' },
              'aria-label': { prop: 'bellLabel' },
              'aria-haspopup': { value: 'dialog' },
              // Mirrored by the element: `true` while open, left out while closed.
              'aria-expanded': { prop: 'open', kind: 'bool' },
              'aria-controls': { idref: 'dialog' },
              'data-variant': { value: 'quiet' },
              'data-icon-only': { value: '' },
            },
            children: [
              {
                tag: 'span',
                class: 'ty-button__icon',
                attrs: { 'aria-hidden': { value: 'true' } },
                children: [bellIcon],
              },
            ],
          },
          // The unseen CountBadge is composed here by the element.
        ],
      },
      {
        tag: 'div',
        class: 'ty-notification-center__backdrop',
        // Always rendered (a framework's closed drawer has an anatomy to
        // find); `hidden` while closed, so nothing reaches the tree.
        attrs: { hidden: { value: '', when: ['!open'] } },
        children: [
          {
            tag: 'div',
            class: 'ty-notification-center__drawer',
            attrs: {},
            children: [
              {
                tag: 'div',
                class: 'ty-notification-center__dialog',
                attrs: {
                  role: { value: 'dialog' },
                  'aria-modal': { value: 'true' },
                  tabindex: { value: '-1' },
                  id: { idref: 'dialog' },
                  'aria-labelledby': { idref: 'title' },
                },
                children: [
                  {
                    tag: 'header',
                    class: 'ty-notification-center__head',
                    attrs: {},
                    children: [
                      bellIcon,
                      {
                        tag: 'h2',
                        class: 'ty-notification-center__heading',
                        attrs: { id: { idref: 'title' }, tabindex: { value: '-1' } },
                        children: [{ text: { prop: 'titleLabel' } }],
                      },
                      {
                        tag: 'button',
                        class: 'ty-button ty-notification-center__clear',
                        attrs: {
                          type: { value: 'button' },
                          hidden: { value: '', when: ['!notices'] },
                          'data-variant': { value: 'quiet' },
                          'data-size': { value: 'compact' },
                        },
                        children: [{ text: { prop: 'clearAllLabel' } }],
                      },
                      {
                        tag: 'button',
                        class: 'ty-button ty-notification-center__close',
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
                            children: [xIcon],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    tag: 'div',
                    class: 'ty-notification-center__empty',
                    attrs: { hidden: { value: '', when: ['notices'] } },
                    children: [
                      bellOffIcon,
                      { tag: 'p', class: 'ty-notification-center__empty-text', children: [{ text: { prop: 'emptyLabel' } }] },
                    ],
                  },
                  {
                    tag: 'ul',
                    class: 'ty-notification-center__list',
                    // Filled by the element from `notices`.
                    attrs: { hidden: { value: '', when: ['!notices'] } },
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        tag: 'span',
        class: 'ty-visually-hidden ty-notification-center__status',
        attrs: { role: { value: 'status' } },
      },
    ],
  },
  examples: [
    { name: 'closed', props: {}, slots: {} },
    { name: 'open-empty', props: { open: true }, slots: {} },
    {
      name: 'translated',
      props: { open: true, bellLabel: 'Notificações', titleLabel: 'Notificações', clearAllLabel: 'Limpar tudo', closeLabel: 'Fechar', emptyLabel: 'Não há notificações nesta sessão.' },
      slots: {},
    },
  ],
} as const satisfies ElementDefinition
