import type { ElementDefinition } from '../definition.ts'

/**
 * `<ty-breadcrumbs>`: the Breadcrumbs' single source (spec: wave-1/breadcrumbs.md).
 *
 * The anatomy is the chrome both modes share: the labelled navigation
 * landmark, the trail's ordered list and the compact bar with its slots.
 * The element composes what the definition language cannot express (the
 * skeleton preset precedent): the trail items from the JSON `items`, the
 * collapsed overflow menu (`maxVisible`), the compact back link and title,
 * and the resolution of `mode="auto"` against the 640 px breakpoint (§2.8).
 * Examples therefore carry no `items` — the composed items could not be
 * produced by the parity renderers.
 */
export const breadcrumbsDefinition = {
  tag: 'ty-breadcrumbs',
  name: 'TyBreadcrumbs',
  kind: 'enhancing',
  doc: 'Shows where the current page sits in the hierarchy and goes up one or more levels. A trail at 640 px and above, a compact back link (with optional centred title and trailing actions) below. The last item is the current page — static text marked `aria-current="page"`, never a link; separators are decorative. Long labels truncate with an ellipsis, the full label kept in `title` and as the accessible name. Activating a link emits a cancelable `ty-navigate`: a host with a client-side router prevents the default and navigates through its adapter.',
  props: {
    items: { type: 'string', attribute: 'items', doc: 'JSON array of `{ "label": string, "href": string }`, ancestors first and the current page last. Composed by the element on upgrade (the theme palette\'s `theme-labels` precedent).' },
    label: { type: 'string', default: 'Breadcrumb', attribute: 'label', doc: 'Accessible name of the navigation landmark (the I18n adapter\'s default); translate through this attribute.' },
    mode: { type: 'enum', values: ['trail', 'compact', 'auto'], default: 'auto', attribute: 'mode', doc: '`auto` shows the trail at 640 px and above, the compact bar below; the element resolves it live.' },
    rootHref: { type: 'string', attribute: 'root-href', doc: 'Parent href of the compact back link when there is only one item.' },
    rootLabel: { type: 'string', attribute: 'root-label', doc: 'Parent label of the compact back link when there is only one item (with `rootHref`).' },
    maxVisible: { type: 'number', attribute: 'max-visible', doc: 'Collapses middle items into an overflow menu when the trail exceeds this many entries (the first and the last `maxVisible - 1` stay visible).' },
    backLabel: { type: 'string', default: 'Back to {parent}', attribute: 'back-label', doc: 'Accessible-name template of the compact back link; `{parent}` is filled with the parent\'s label.' },
    overflowLabel: { type: 'string', default: 'Show hidden levels', attribute: 'overflow-label', doc: 'Accessible name of the overflow menu\'s toggle; translate through this attribute.' },
  },
  events: [
    { type: 'ty-navigate', kind: 'custom', detail: { href: 'string' }, reactProp: 'onNavigate', doc: 'A trail, overflow or back link was activated; `href` is its destination. Cancelable: a host with a client-side router calls `preventDefault()` and navigates through its adapter; uncanceled, the native anchor navigates.' },
  ],
  slots: {
    center: { doc: 'Replaces the centred title of the compact bar (the current page\'s label when empty).' },
    actions: { doc: 'Trailing actions of the compact bar (narrow screens use it as a top bar).' },
  },
  anatomy: {
    tag: 'nav',
    class: 'ty-breadcrumbs',
    attrs: {
      'aria-label': { prop: 'label' },
      // The raw mode; the element resolves `auto` into `trail`/`compact` on upgrade.
      'data-mode': { prop: 'mode' },
    },
    children: [
      // The trail's list: the element composes the items into it. Rendered
      // for `trail` and `auto`; `auto` below 640 px hides it on upgrade.
      { tag: 'ol', class: 'ty-breadcrumbs__list', when: ['!mode:compact'] },
      // The compact bar: the element composes the back link and the title.
      {
        tag: 'div',
        class: 'ty-breadcrumbs__bar',
        when: ['mode:compact|mode:auto'],
        children: [
          { tag: 'div', class: 'ty-breadcrumbs__back' },
          {
            tag: 'div',
            class: 'ty-breadcrumbs__center',
            when: ['slot:center|slot:actions'],
            children: [
              { slot: 'center', when: ['slot:center'] },
              {
                tag: 'span',
                class: 'ty-breadcrumbs__title',
                when: ['!slot:center'],
                attrs: { 'aria-current': { value: 'page' } },
              },
            ],
          },
          {
            tag: 'div',
            class: 'ty-breadcrumbs__actions',
            when: ['slot:actions'],
            children: [{ slot: 'actions' }],
          },
        ],
      },
    ],
  },
  examples: [
    { name: 'auto-empty', props: {}, slots: {} },
    { name: 'trail-empty', props: { mode: 'trail' }, slots: {} },
    { name: 'compact-bar', props: { mode: 'compact' }, slots: { center: 'Sources', actions: 'Share' } },
  ],
} as const satisfies ElementDefinition
