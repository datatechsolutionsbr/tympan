import type { ElementDefinition, ElementNode } from '../definition.ts'

const TONES = ['danger', 'warning', 'info', 'success'] as const
const TITLE_TAGS = ['p', 'h2', 'h3', 'h4'] as const

const pascal = (s: string) => s[0]!.toUpperCase() + s.slice(1)

/** The visually hidden tone word of one tone, in the title or, without a title, in the message. */
const toneWordSpans = (withoutTitle: boolean): ElementNode[] =>
  TONES.map((tone) => ({
    tag: 'span',
    class: 'ty-visually-hidden',
    when: withoutTitle ? ['!slot:title', `tone:${tone}`] : [`tone:${tone}`],
    children: [{ text: { prop: `toneWord${pascal(tone)}` } }],
  }))

/** A lucide glyph (ISC, THIRD_PARTY_NOTICES): every child carries a class so the element's patch pass can match it. */
const glyph = (tag: string, attrs: Record<string, string>): ElementNode => ({
  tag,
  class: 'ty-notice__glyph',
  attrs: Object.fromEntries(Object.entries(attrs).map(([name, value]) => [name, { value }])),
})

/** The tone's default icon, shown while the icon slot is empty. */
const toneIcon = (tone: string, children: ElementNode[]): ElementNode => ({
  tag: 'svg',
  class: 'ty-icon',
  when: ['!slot:icon', `tone:${tone}`],
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

const CIRCLE = glyph('circle', { cx: '12', cy: '12', r: '10' })

/** `<ty-inline-notice>`: the InlineNotice's single source (spec: wave-1/inline-notice.md). */
export const inlineNoticeDefinition = {
  tag: 'ty-inline-notice',
  name: 'TyInlineNotice',
  kind: 'enhancing',
  doc: 'Short message about the state of a form, section or page. Assertive tones (danger and warning unless `urgency` says otherwise) are `role="alert"`, polite ones `role="status"`; a visually hidden tone word precedes the message. Dismissal is the host\'s: the element emits `ty-dismiss` and moves focus to the next logical element.',
  props: {
    tone: { type: 'enum', values: TONES, default: 'info', attribute: 'tone', doc: 'Semantic tone; colours the surface and picks the default icon and tone word.' },
    align: { type: 'enum', values: ['start', 'centre'], default: 'start', attribute: 'align', doc: '`centre` only for short single-message confirmations.' },
    urgency: { type: 'enum', values: ['polite', 'assertive', 'none'], attribute: 'urgency', doc: 'How the notice is announced when it appears; unset: assertive for danger and warning, polite otherwise. `none` (no live role) for notices present on page load.' },
    titleAs: { type: 'enum', values: TITLE_TAGS, default: 'p', attribute: 'title-as', doc: 'Element for the title; a plain strong paragraph unless configured.' },
    dismissible: { type: 'boolean', attribute: 'dismissible', doc: 'Shows the dismiss button; the host removes the notice on `ty-dismiss`.' },
    dismissLabel: { type: 'string', attribute: 'dismiss-label', default: 'Dismiss', doc: 'Accessible name of the dismiss button.' },
    toneWordDanger: { type: 'string', attribute: 'tone-word-danger', default: 'Error: ', doc: 'Visually hidden word announced before a danger notice.' },
    toneWordWarning: { type: 'string', attribute: 'tone-word-warning', default: 'Warning: ', doc: 'Visually hidden word announced before a warning notice.' },
    toneWordInfo: { type: 'string', attribute: 'tone-word-info', default: 'Information: ', doc: 'Visually hidden word announced before an info notice.' },
    toneWordSuccess: { type: 'string', attribute: 'tone-word-success', default: 'Success: ', doc: 'Visually hidden word announced before a success notice.' },
  },
  events: [
    { type: 'ty-dismiss', kind: 'custom', reactProp: 'onDismiss', rustProp: 'on_dismiss', doc: 'The dismiss button was pressed; the host removes the notice. Focus has moved to the next logical element.' },
  ],
  slots: {
    default: { doc: 'The message body.' },
    title: { doc: 'Short heading above the message.' },
    icon: { doc: "Overrides the tone's icon (decorative)." },
    actions: { doc: 'Buttons or links below the message (up to two).' },
  },
  anatomy: {
    tag: 'div',
    class: 'ty-notice',
    attrs: {
      role: {
        prop: 'urgency',
        kind: 'map',
        values: { assertive: 'alert', polite: 'status' },
        fallback: { prop: 'tone', values: { danger: 'alert', warning: 'alert', info: 'status', success: 'status' } },
      },
      'data-tone': { prop: 'tone' },
      'data-align': { prop: 'align' },
    },
    children: [
      {
        tag: 'span',
        class: 'ty-notice__icon',
        attrs: { 'aria-hidden': { value: 'true' } },
        children: [
          toneIcon('danger', [CIRCLE, glyph('line', { x1: '12', x2: '12', y1: '8', y2: '12' }), glyph('line', { x1: '12', x2: '12.01', y1: '16', y2: '16' })]),
          toneIcon('warning', [
            glyph('path', { d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3' }),
            glyph('path', { d: 'M12 9v4' }),
            glyph('path', { d: 'M12 17h.01' }),
          ]),
          toneIcon('info', [CIRCLE, glyph('path', { d: 'M12 16v-4' }), glyph('path', { d: 'M12 8h.01' })]),
          toneIcon('success', [CIRCLE, glyph('path', { d: 'm16 9-5.5 5.5L8 12' })]),
          { slot: 'icon', when: ['slot:icon'] },
        ],
      },
      {
        tag: 'div',
        class: 'ty-notice__body',
        children: [
          ...TITLE_TAGS.map(
            (tag): ElementNode => ({
              tag,
              class: 'ty-notice__title',
              when: ['slot:title', `titleAs:${tag}`],
              children: [...toneWordSpans(false), { slot: 'title' }],
            }),
          ),
          {
            tag: 'div',
            class: 'ty-notice__message',
            children: [...toneWordSpans(true), { slot: 'default' }],
          },
          { tag: 'div', class: 'ty-notice__actions', when: ['slot:actions'], children: [{ slot: 'actions' }] },
        ],
      },
      {
        tag: 'button',
        class: 'ty-button ty-notice__dismiss',
        when: ['dismissible'],
        attrs: {
          type: { value: 'button' },
          'data-variant': { value: 'quiet' },
          'data-size': { value: 'compact' },
          'data-icon-only': { value: '' },
          'aria-label': { prop: 'dismissLabel' },
        },
        children: [
          {
            tag: 'span',
            class: 'ty-button__icon',
            attrs: { 'aria-hidden': { value: 'true' } },
            children: [
              {
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
                children: [glyph('path', { d: 'M18 6 6 18' }), glyph('path', { d: 'm6 6 12 12' })],
              },
            ],
          },
        ],
      },
    ],
  },
  examples: [
    { name: 'info', props: {}, slots: { default: 'Unseal the vault to run workflows that use credentials.' } },
    { name: 'danger-title', props: { tone: 'danger' }, slots: { title: 'Vault sealed', default: 'Unseal it to run workflows that use credentials.' } },
    { name: 'warning-heading', props: { tone: 'warning', titleAs: 'h3' }, slots: { title: 'Two sources unavailable', default: 'Results may be incomplete.' } },
    { name: 'success-dismissible', props: { tone: 'success', dismissible: true }, slots: { default: 'Version 12 is live.' } },
    { name: 'centred-actions', props: { align: 'centre', urgency: 'none' }, slots: { default: 'Nothing to review.', actions: 'Help' } },
    { name: 'custom-icon', props: {}, slots: { icon: '★', default: 'Starred runs appear first.' } },
  ],
} as const satisfies ElementDefinition
