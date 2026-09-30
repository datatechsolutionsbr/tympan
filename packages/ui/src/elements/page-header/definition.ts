import type { ElementDefinition, ElementNode } from '../definition.ts'

/**
 * `<ty-page-header>`: the PageHeader's single source (spec: wave-1/page-header.md).
 *
 * The wave-1 (standard) variant: breadcrumbs, eyebrow, leading icon, title,
 * summary, metadata row, actions and extra content. The wave-4 editorial
 * variant of the React component (`variant`, `trail`, `lead`, `divider`)
 * is intentionally not part of this element.
 *
 * The data-driven parts of the React component become slots: `breadcrumbs`
 * takes the breadcrumb navigation, `meta` the `li.ty-page-header__meta-item`
 * items, `icon` the decorative leading icon and `actions` the page actions
 * (at most one primary button, §2.10).
 *
 * With `editable`, the title is an input that looks like the title
 * (editorial screens); a visually hidden heading of the same level keeps
 * the document outline (one h1 per page). The input is named by
 * `title-label`; typing is the platform's, reported as the native `input`
 * event. The `error` slot marks the title invalid and is announced.
 */
export const pageHeaderDefinition = {
  tag: 'ty-page-header',
  name: 'TyPageHeader',
  kind: 'enhancing',
  doc: 'The single top-of-page block that names the page: optional breadcrumbs, eyebrow, leading icon, title, reading summary, metadata row and page actions, plus a free slot below for tags, tabs or filters. `scale` picks the type step (`page` the h1 step, `display` for login and public pages, `section` inside a section); `heading-level` the document level. With `editable` the title is an input named by `title-label` and a visually hidden heading keeps the outline. Below 640 px the actions move under the summary and span the width (stylesheet).',
  props: {
    title: { type: 'string', attribute: 'title', doc: 'Page title; the heading text. Not needed with `editable` (`value` carries the text).' },
    headingLevel: { type: 'enum', values: ['1', '2', '3'], default: '1', attribute: 'heading-level', doc: 'Heading level of the title (1, 2 or 3, as its attribute spelling); exactly one level-1 heading per page, which the header provides by default.' },
    scale: { type: 'enum', values: ['page', 'display', 'section'], default: 'page', attribute: 'scale', doc: '`page` uses the h1 step; `display` the display step (login, public page only); `section` the h3 step.' },
    eyebrow: { type: 'string', attribute: 'eyebrow', doc: 'Short uppercase context line above the title (the §2.2 eyebrow token).' },
    summary: { type: 'string', attribute: 'summary', doc: 'One or two sentences (body-lg, max 60ch) saying what the screen shows.' },
    editable: { type: 'boolean', attribute: 'editable', doc: 'The title is an input that looks like the title (editorial screens); a visually hidden heading of the same level keeps the document outline.' },
    value: { type: 'string', attribute: 'value', doc: 'The editable title\'s text (controlled); the element mirrors it into the input (while the user types, the live value is the input\'s own).' },
    titlePlaceholder: { type: 'string', attribute: 'title-placeholder', doc: 'Placeholder of the editable title (the empty state); also the hidden heading\'s text while empty.' },
    titleLabel: { type: 'string', default: 'Page title', attribute: 'title-label', doc: 'Accessible name of the editable title input.' },
    headingId: { type: 'string', attribute: 'heading-id', doc: 'Id of the title heading, for `aria-labelledby` of the page region; `<instance>-title` when unset.' },
  },
  events: [
    { type: 'input', kind: 'native', detail: { value: 'string' }, reactProp: 'onTitleChange', doc: 'Typing in the editable title; `value` is the whole text.' },
  ],
  slots: {
    breadcrumbs: { doc: 'The breadcrumb navigation, rendered above the title.' },
    icon: { doc: 'A decorative leading icon, in an accent-soft container (`aria-hidden`).' },
    meta: { doc: 'The metadata row: `li.ty-page-header__meta-item` items of icon plus short text (owner, date, count); icons decorative, text in reading order.' },
    actions: { doc: 'Page actions, aligned to the end: at most one primary button plus secondary buttons (§2.10); below 640 px they move under the summary and span the width.' },
    error: { doc: 'Host-provided validation message under the editable title; marks it invalid and is announced.' },
    default: { doc: 'Extra content below the header (tags, tabs, filters).' },
  },
  anatomy: {
    tag: 'div',
    class: 'ty-page-header',
    attrs: {
      'data-scale': { prop: 'scale' },
    },
    children: [
      {
        tag: 'div',
        class: 'ty-page-header__breadcrumbs',
        when: ['slot:breadcrumbs'],
        children: [{ slot: 'breadcrumbs' }],
      },
      {
        tag: 'div',
        class: 'ty-page-header__row',
        children: [
          {
            tag: 'span',
            class: 'ty-page-header__icon',
            when: ['slot:icon'],
            attrs: { 'aria-hidden': { value: 'true' } },
            children: [{ slot: 'icon' }],
          },
          {
            tag: 'div',
            class: 'ty-page-header__text',
            children: [
              { tag: 'p', class: 'ty-page-header__eyebrow', when: ['eyebrow'], children: [{ text: { prop: 'eyebrow' } }] },
              // Static title: the page's heading.
              ...([1, 2, 3] as const).map((n): ElementNode => ({
                tag: `h${n}`,
                class: 'ty-page-header__title',
                when: ['!editable', `headingLevel:${n}`],
                attrs: { id: { idref: 'title', prop: 'headingId' } },
                children: [{ text: { prop: 'title' } }],
              })),
              // Editable title: a visually hidden heading keeps the outline.
              ...([1, 2, 3] as const).map((n): ElementNode => ({
                tag: `h${n}`,
                class: 'ty-heading ty-visually-hidden',
                when: ['editable', `headingLevel:${n}`],
                attrs: { id: { idref: 'title', prop: 'headingId' } },
                children: [
                  { text: { prop: 'value' }, when: ['value'] },
                  { text: { prop: 'titlePlaceholder' }, when: ['!value'] },
                ],
              })),
              {
                tag: 'input',
                class: 'ty-page-header__title-input ty-page-header__title',
                when: ['editable'],
                attrs: {
                  'aria-label': { prop: 'titleLabel' },
                  placeholder: { prop: 'titlePlaceholder' },
                  'aria-invalid': { value: 'true', when: ['slot:error'] },
                  'aria-describedby': { idrefs: [{ id: 'error', when: ['slot:error'] }] },
                  'data-invalid': { value: '', when: ['slot:error'] },
                },
              },
              {
                tag: 'p',
                class: 'ty-page-header__error',
                when: ['editable', 'slot:error'],
                attrs: { id: { idref: 'error' } },
                children: [{ slot: 'error' }],
              },
              { tag: 'p', class: 'ty-page-header__summary', when: ['summary'], children: [{ text: { prop: 'summary' } }] },
              {
                tag: 'ul',
                class: 'ty-page-header__meta',
                when: ['slot:meta'],
                children: [{ slot: 'meta' }],
              },
            ],
          },
          {
            tag: 'div',
            class: 'ty-page-header__actions',
            when: ['slot:actions'],
            children: [{ slot: 'actions' }],
          },
        ],
      },
      {
        tag: 'div',
        class: 'ty-page-header__extra',
        when: ['slot:default'],
        children: [{ slot: 'default' }],
      },
    ],
  },
  examples: [
    { name: 'minimal', props: { title: 'Sources' }, slots: {} },
    { name: 'reading-summary', props: { title: 'Sources', eyebrow: 'Datasets', summary: 'Every dataset this workspace reads, and when each was last synced.' }, slots: { meta: 'Owner: Data team' } },
    { name: 'breadcrumbs-actions', props: { title: 'Sources' }, slots: { breadcrumbs: 'Datasets', actions: 'Add source', icon: '◈' } },
    { name: 'section-scale', props: { title: 'Connection', headingLevel: '2', scale: 'section' }, slots: { default: 'Status: connected' } },
    { name: 'display', props: { title: 'Welcome to Alidade', scale: 'display', summary: 'Sign in to continue.' }, slots: {} },
    { name: 'editable', props: { editable: true, value: 'Untitled report', titlePlaceholder: 'Name the report', titleLabel: 'Report title' }, slots: { actions: 'Share' } },
    { name: 'editable-error', props: { editable: true, titlePlaceholder: 'Name the report', titleLabel: 'Report title' }, slots: { error: 'A name is required.' } },
  ],
} as const satisfies ElementDefinition
