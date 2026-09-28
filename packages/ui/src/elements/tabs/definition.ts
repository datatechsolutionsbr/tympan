import type { ElementDefinition } from '../definition.ts'

/**
 * `<ty-tabs>`: the Tabs' single source (spec: wave-1/tabs.md).
 *
 * The anatomy covers the shell: the root and the tab list. The tabs
 * themselves repeat per entry of the `tabs` prop, which the declarative
 * anatomy cannot express (no dynamic repetition), so the element composes
 * them into the list on upgrade — as the skeleton composes its presets.
 * Panels are the host's own children (the default slot), each keyed to a tab
 * by `data-panel`; the element wires their role, id, `aria-labelledby` and
 * visibility. Examples therefore show the shell only: the parity renderers
 * could not produce the composed tabs or the wired panels.
 */
export const tabsDefinition = {
  tag: 'ty-tabs',
  name: 'TyTabs',
  kind: 'enhancing',
  doc: 'Sibling views of one object, one panel at a time (the APG tabs pattern). The tab list is one tab stop: the arrow keys move along the `orientation` axis, wrapping and skipping disabled tabs, Home and End jump, and Left/Right follow the reading direction. `activation` decides whether moving focus also selects. Selection is controlled with `selected-key` or uncontrolled from `default-selected-key` (the first enabled tab when neither is set); a different selection is reported with `ty-selection-change`.',
  props: {
    selectedKey: { type: 'string', attribute: 'selected-key', doc: 'Controlled selection: the selected tab\'s id. The element asks for a change with `ty-selection-change`; the host flips the attribute.' },
    defaultSelectedKey: { type: 'string', attribute: 'default-selected-key', doc: 'Initial selection of an uncontrolled list; the first enabled tab when unset.' },
    orientation: { type: 'enum', values: ['horizontal', 'vertical'], default: 'horizontal', attribute: 'orientation', doc: 'Layout of the list and the arrow-key axis: Left/Right (following the reading direction), or Up/Down when vertical.' },
    activation: { type: 'enum', values: ['automatic', 'manual'], default: 'automatic', attribute: 'activation', doc: 'Automatic selects on focus; manual needs Enter or Space on the focused tab.' },
    label: { type: 'string', attribute: 'label', doc: 'Accessible name of the tab list (required).' },
    tabs: { type: 'string', attribute: 'tabs', doc: 'JSON array of the tabs: [{ "id", "label", "count"?, "disabled"? }]. The count follows the label and joins the accessible name; a disabled tab cannot be selected and the arrow keys skip it. (The React component\'s decorative icon has no attribute form.)' },
    keepMounted: { type: 'boolean', attribute: 'keep-mounted', doc: 'Keep inactive panels in the DOM (hidden) to preserve their state. The element always keeps them — their nodes belong to the host — so the attribute only tells a wrapper it may unmount.' },
  },
  events: [
    { type: 'ty-selection-change', kind: 'custom', detail: { key: 'string' }, reactProp: 'onSelectionChange', rustProp: 'on_selection_change', doc: 'A different tab was selected (a click, or the keyboard per `activation`). Uncontrolled, the element has already applied it; controlled (`selected-key`), the host flips the attribute.' },
  ],
  slots: {
    default: { doc: 'The panels: one element per tab, keyed by `data-panel` (the tab\'s id). The element wires the role, id, `aria-labelledby` and visibility; only the selected panel shows.' },
  },
  anatomy: {
    tag: 'div',
    class: 'ty-tabs',
    attrs: {
      'data-orientation': { prop: 'orientation' },
    },
    children: [
      {
        tag: 'div',
        class: 'ty-tabs__list',
        attrs: {
          role: { value: 'tablist' },
          'aria-label': { prop: 'label' },
          'aria-orientation': { prop: 'orientation' },
          'data-orientation': { prop: 'orientation' },
        },
      },
      { slot: 'default' },
    ],
  },
  examples: [
    { name: 'horizontal', props: { label: 'Run sections' }, slots: {} },
    { name: 'vertical', props: { label: 'Run sections', orientation: 'vertical' }, slots: {} },
    { name: 'manual', props: { label: 'Run sections', activation: 'manual' }, slots: {} },
  ],
} as const satisfies ElementDefinition
