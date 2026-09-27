import type { ElementDefinition } from '../definition.ts'

/** `<ty-status-pill>`: the StatusPill's single source (spec: wave-1/status-pill.md). */
export const statusPillDefinition = {
  tag: 'ty-status-pill',
  name: 'TyStatusPill',
  kind: 'enhancing',
  doc: 'Current state of an item as icon, word and semantic tone. Nothing interactive inside; a known `status` takes its tone and busy state from the element\'s status map unless `tone` overrides.',
  props: {
    status: { type: 'string', attribute: 'status', doc: 'The status key (`data-status`); the built-in map colours the common ones (`pending`, `approved`, `processing`, …) while `tone` is absent.' },
    tone: { type: 'enum', values: ['neutral', 'info', 'success', 'warning', 'danger'], attribute: 'tone', doc: 'The semantic tone (`data-tone`); left out, the status map decides (server renderings pass it themselves).' },
    size: { type: 'enum', values: ['small', 'regular'], default: 'regular', attribute: 'size', doc: 'Pill size.' },
    busy: { type: 'boolean', attribute: 'busy', doc: 'In-progress: the icon spins (static under reduced motion).' },
    announce: { type: 'boolean', attribute: 'announce', doc: 'Announce changes politely (`role="status"`); off by default, so tables of pills create no live regions.' },
    label: { type: 'string', attribute: 'label', doc: 'Plain-HTML label text; the default slot (what frameworks render) wins, then the status map\'s label, then the status key.' },
    accessibleLabel: { type: 'string', attribute: 'accessible-label', doc: 'Accessible name of the pill (`aria-label`), e.g. "Status: Running" on an announced badge.' },
    testId: { type: 'string', attribute: 'test-id', doc: 'Test hook on the pill (`data-testid`).' },
  },
  events: [],
  slots: {
    default: { doc: 'The status word.' },
    icon: { doc: 'The status icon (decorative); spins while busy.' },
  },
  anatomy: {
    tag: 'span',
    class: 'ty-status',
    attrs: {
      role: { value: 'status', when: ['announce'] },
      'aria-label': { prop: 'accessibleLabel' },
      'data-tone': { prop: 'tone' },
      'data-size': { prop: 'size' },
      'data-busy': { prop: 'busy', kind: 'flag' },
      'data-status': { prop: 'status' },
      'data-testid': { prop: 'testId' },
    },
    children: [
      { tag: 'span', class: 'ty-status__icon', attrs: { 'aria-hidden': { value: 'true' } }, when: ['slot:icon'], children: [{ slot: 'icon' }] },
      { tag: 'span', class: 'ty-status__label', children: [{ slot: 'default' }] },
    ],
  },
  examples: [
    { name: 'success', props: { status: 'active', tone: 'success' }, slots: { default: 'Active', icon: '✓' } },
    { name: 'busy-info', props: { status: 'processing', tone: 'info', busy: true }, slots: { default: 'Processing', icon: '↻' } },
    { name: 'small-warning', props: { status: 'pending', tone: 'warning', size: 'small' }, slots: { default: 'Pending' } },
    { name: 'announced-danger', props: { status: 'error', tone: 'danger', announce: true, accessibleLabel: 'Status: Error', testId: 'status-badge-error' }, slots: { default: 'Error' } },
    { name: 'unknown-neutral', props: { status: 'archived' }, slots: { default: 'archived' } },
  ],
} as const satisfies ElementDefinition
