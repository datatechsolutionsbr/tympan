import type { ElementDefinition, ElementNode } from '../definition.ts'

/** A lucide glyph (ISC, THIRD_PARTY_NOTICES): every child carries a class so the element's patch pass can match it. */
const glyph = (tag: string, attrs: Record<string, string>): ElementNode => ({
  tag,
  class: 'ty-avatar__glyph',
  attrs: Object.fromEntries(Object.entries(attrs).map(([name, value]) => [name, { value }])),
})

/** A decorative fallback icon (lucide strokes), sized by the frame's `.ty-avatar__icon` rule. */
const icon = (children: ElementNode[], when: string[]): ElementNode => ({
  tag: 'svg',
  class: 'ty-avatar__icon',
  when,
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
 * The picture and the fallback it covers, shared by the static frame and
 * the two pressable controls. The fallback is `hidden` while the picture
 * holds; the element swaps them when the picture fails.
 */
const content = (): ElementNode[] => [
  // The picture. Decorative, or inside a named control: no text of its own.
  {
    tag: 'img',
    class: 'ty-avatar__image',
    when: ['src', 'decorative|pressable|href'],
    attrs: { src: { prop: 'src' }, alt: { value: '' } },
  },
  {
    tag: 'img',
    class: 'ty-avatar__image',
    when: ['src', '!decorative', '!pressable', '!href'],
    attrs: { src: { prop: 'src' }, alt: { prop: 'name' } },
  },
  {
    tag: 'span',
    class: 'ty-avatar__fallback',
    attrs: { hidden: { value: '', when: ['src'] } },
    children: [
      // Agents: a bot mark, never initials (§2.11).
      icon(
        [
          glyph('path', { d: 'M12 8V4H8' }),
          glyph('rect', { width: '16', height: '12', x: '4', y: '8', rx: '2' }),
          glyph('path', { d: 'M2 14h2' }),
          glyph('path', { d: 'M20 14h2' }),
          glyph('path', { d: 'M15 13v2' }),
          glyph('path', { d: 'M9 13v2' }),
        ],
        ['actorKind:agent'],
      ),
      {
        tag: 'span',
        class: 'ty-avatar__initials',
        when: ['actorKind:person', 'fallbackText'],
        attrs: { 'aria-hidden': { value: 'true' } },
        children: [{ text: { prop: 'fallbackText' } }],
      },
      icon(
        [
          glyph('path', { d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' }),
          glyph('circle', { cx: '12', cy: '7', r: '4' }),
        ],
        ['actorKind:person', '!fallbackText'],
      ),
    ],
  },
]

/** The frame (circle or agent square); the static one carries the img role and the name. */
const frame = (when: string[], pressable: boolean): ElementNode => ({
  tag: 'span',
  class: 'ty-avatar',
  when: when.length ? when : undefined,
  attrs: pressable
    ? {
        'data-kind': { prop: 'actorKind' },
        'data-size': { prop: 'size' },
        'data-tint': { prop: 'tint' },
        'data-image': { value: '', when: ['src'] },
        // Inside a named control the visual is decorative.
        'aria-hidden': { value: 'true' },
      }
    : {
        'data-kind': { prop: 'actorKind' },
        'data-size': { prop: 'size' },
        'data-tint': { prop: 'tint' },
        'data-image': { value: '', when: ['src'] },
        'aria-hidden': { value: 'true', when: ['decorative'] },
        role: { value: 'img', when: ['!decorative', '!src'] },
        'aria-label': { prop: 'name', when: ['!decorative', '!src'] },
      },
  children: content(),
})

/** `<ty-avatar>`: the Avatar's single source (spec: wave-1/avatar.md). */
export const avatarDefinition = {
  tag: 'ty-avatar',
  name: 'TyAvatar',
  kind: 'enhancing',
  doc: 'Represents a person or an agent with a picture or fallback initials, optionally as a pressable control. Static, the frame is an image role named by `name` (hidden when `decorative`); pressable, it is a link (`href`) or a button (`pressable`) named by `actionLabel`, with a 44 px hit area at every size. The fallback (initials for a person, a bot mark for an agent, a user mark otherwise) shows while there is no picture and when the picture fails to load.',
  props: {
    src: { type: 'string', attribute: 'src', doc: 'Image URL; on load error the fallback shows.' },
    fallbackText: { type: 'string', attribute: 'fallback-text', doc: 'One or two characters shown when there is no image (derived by the host from a name); the element keeps the first two grapheme clusters.' },
    name: { type: 'string', attribute: 'name', doc: 'Accessible name; required unless `decorative`. Initials are never read as letters while it is set.' },
    decorative: { type: 'boolean', attribute: 'decorative', doc: 'Hides the avatar from assistive tech when the name is already shown next to it.' },
    actorKind: { type: 'enum', values: ['person', 'agent'], default: 'person', attribute: 'actor-kind', doc: '`person`: circle with initials. `agent`: rounded square with a bot icon and a dashed border, never initials (§2.11).' },
    size: { type: 'enum', values: ['xsmall', 'small', 'regular', 'large'], default: 'regular', attribute: 'size', doc: 'Size step.' },
    tint: { type: 'enum', values: ['accent', 'neutral'], default: 'accent', attribute: 'tint', doc: 'Fallback background: accent-soft or neutral (§2.3).' },
    pressable: { type: 'boolean', attribute: 'pressable', doc: 'The avatar is one press target (a button); set it when `onPress` is wired. Implied by `href`.' },
    href: { type: 'string', attribute: 'href', doc: 'Makes the avatar a link to this destination (wins over `pressable`).' },
    actionLabel: { type: 'string', default: 'Open profile of {name}', attribute: 'action-label', doc: 'Accessible name of a pressable avatar; `{name}` is filled in. Translate through this attribute.' },
  },
  events: [{ type: 'click', kind: 'native', reactProp: 'onPress', rustProp: 'onclick', doc: 'The native click of the pressable avatar (its link or button).' }],
  anatomy: {
    // A boxless root (display: contents): the static frame and the two
    // pressable controls are mutually exclusive alternatives (the surface's
    // link-or-button precedent); only one renders at a time.
    tag: 'span',
    class: 'ty-avatar-root',
    attrs: {},
    children: [
      frame(['!pressable', '!href'], false),
      {
        tag: 'a',
        class: 'ty-avatar-control',
        when: ['href'],
        attrs: { href: { prop: 'href' }, 'data-size': { prop: 'size' } },
        children: [frame([], true)],
      },
      {
        tag: 'button',
        class: 'ty-avatar-control',
        when: ['!href', 'pressable'],
        attrs: { type: { value: 'button' }, 'data-size': { prop: 'size' } },
        children: [frame([], true)],
      },
    ],
  },
  examples: [
    { name: 'initials', props: { name: 'Natália Mesquita', fallbackText: 'NM' }, slots: {} },
    { name: 'image', props: { src: '/avatars/natalia.png', name: 'Natália Mesquita', fallbackText: 'NM' }, slots: {} },
    { name: 'agent', props: { actorKind: 'agent', name: 'stage-counter', size: 'small' }, slots: {} },
    { name: 'decorative-neutral', props: { decorative: true, fallbackText: 'NM', tint: 'neutral' }, slots: {} },
    { name: 'pressable', props: { pressable: true, name: 'Natália Mesquita', fallbackText: 'NM' }, slots: {} },
    { name: 'link', props: { href: '/users/natalia', name: 'Natália Mesquita', src: '/avatars/natalia.png' }, slots: {} },
    { name: 'translated-action', props: { pressable: true, name: 'Natália Mesquita', fallbackText: 'NM', actionLabel: 'Abrir perfil de {name}' }, slots: {} },
  ],
} as const satisfies ElementDefinition
