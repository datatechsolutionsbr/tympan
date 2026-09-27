import type { ElementDefinition } from '../definition.ts'

/**
 * `<ty-skeleton>`: the Skeleton's single source (spec: wave-1/skeleton.md).
 *
 * Accessibility mirrors the React Skeleton and PageLoadingState: the blocks
 * are decorative, so the anatomy hides them (`aria-hidden` on the content,
 * which the React component carries on the root — here the root also holds
 * the announcement, so the hidden subtree moves one level down). With
 * `label`, the root is `aria-busy` and the label is announced once in a
 * visually-hidden `role="status"`, the PageLoadingState pattern; without it
 * the skeleton is purely decorative and the host announces the loading
 * region itself.
 *
 * The anatomy covers the block level (a single shape, and the stacked-lines
 * container with its first line). The composed `preset`s repeat per `count`
 * and `columns`, which the declarative anatomy cannot express (no dynamic
 * repetition), so the element composes them into the `ty-skeleton-preset`
 * container on upgrade — self-rendering for the preset case, as the theme
 * palette self-renders its composite. For the same reason the element (not
 * the anatomy) repeats stacked lines beyond the first and resolves a custom
 * CSS `width` to `data-width="custom"` plus an inline size. Preset, repeated
 * and custom-width examples therefore stay out of `examples` (the parity
 * renderers could not produce them).
 */
export const skeletonDefinition = {
  tag: 'ty-skeleton',
  name: 'TySkeleton',
  kind: 'enhancing',
  doc: 'Content-shaped placeholder, hidden from assistive technology; with `label`, one polite status announces the loading and the region is marked busy. Presets (stats, cards, section-heading, filters, analysis) are composed by the element on upgrade.',
  props: {
    shape: { type: 'enum', values: ['line', 'heading', 'circle', 'rect'], default: 'line', attribute: 'shape', doc: 'Block form: a text line, a heading line, a circle (avatar) or a rectangle (media, a chart).' },
    width: { type: 'string', attribute: 'width', doc: 'Named width (`short`, `medium`, `long`, `full`) or any CSS length; full width when unset. A custom length resolves on upgrade (`data-width="custom"` and an inline size).' },
    lines: { type: 'number', default: 1, attribute: 'lines', doc: 'Stacked text lines for the `line` and `heading` shapes, widths varied automatically (the last is short).' },
    preset: { type: 'enum', values: ['stats', 'cards', 'section-heading', 'filters', 'analysis'], attribute: 'preset', doc: 'A composed skeleton instead of blocks; the element composes it on upgrade.' },
    count: { type: 'number', attribute: 'count', doc: 'Repetitions of the preset (tiles, pills, items); the preset\'s default when unset.' },
    columns: { type: 'number', attribute: 'columns', doc: 'Grid columns of a tiled preset (1 to 4); the preset\'s default when unset.' },
    label: { type: 'string', attribute: 'label', doc: 'Announced once in a visually-hidden status while loading, the region marked `aria-busy` (the PageLoadingState pattern); unset, the skeleton is purely decorative and the host announces.' },
  },
  events: [],
  anatomy: {
    tag: 'span',
    class: 'ty-skeleton-root',
    attrs: {
      'aria-busy': { prop: 'label', kind: 'bool' },
    },
    children: [
      {
        tag: 'span',
        class: 'ty-skeleton-content',
        attrs: { 'aria-hidden': { value: 'true' } },
        children: [
          {
            tag: 'span',
            class: 'ty-skeleton-lines',
            when: ['!preset', 'shape:line|shape:heading'],
            children: [
              { tag: 'span', class: 'ty-skeleton', attrs: { 'data-shape': { prop: 'shape' }, 'data-width': { prop: 'width' } } },
            ],
          },
          {
            tag: 'span',
            class: 'ty-skeleton',
            when: ['!preset', 'shape:circle|shape:rect'],
            attrs: { 'data-shape': { prop: 'shape' }, 'data-width': { prop: 'width' } },
          },
          {
            tag: 'span',
            class: 'ty-skeleton-preset',
            when: ['preset'],
            attrs: { 'data-preset': { prop: 'preset' } },
          },
        ],
      },
      {
        tag: 'span',
        class: 'ty-visually-hidden',
        attrs: { role: { value: 'status' } },
        when: ['label'],
        children: [{ text: { prop: 'label' } }],
      },
    ],
  },
  examples: [
    { name: 'line', props: {}, slots: {} },
    { name: 'heading-short', props: { shape: 'heading', width: 'short' }, slots: {} },
    { name: 'circle', props: { shape: 'circle' }, slots: {} },
    { name: 'rect-medium', props: { shape: 'rect', width: 'medium' }, slots: {} },
    { name: 'announced', props: { label: 'Loading the catalogue' }, slots: {} },
  ],
} as const satisfies ElementDefinition
