// Bridge from the canvas tool list to the research dock of the design system
// (the `contextual` slot of FloatingActionBar). Each tool becomes one dock
// entry; unavailable tools are dropped. Anything that is not a plain action
// (modes, toggles) reports its on/off state, so the dock can set aria-pressed.
// The zoom readout carries its percentage as text rather than a pictogram, and
// the tool's `group` lets the dock draw dividers between clusters.

import type { ActionBarItem } from '@fakhir/ui'
import type { CanvasToolItem } from './canvasTools'

type Tool = CanvasToolItem
type DockEntry = ActionBarItem

/**
 * Optional dock fields, each described by the rule that decides whether a
 * tool contributes it and how its value is read. Fields absent from the
 * result stay absent (no `undefined` keys), which keeps equality checks and
 * snapshots of the dock stable.
 */
const optionalFields: ReadonlyArray<{
  field: 'onPress' | 'pressed' | 'shortcut'
  appliesTo: (tool: Tool) => boolean
  read: (tool: Tool) => DockEntry[keyof DockEntry]
}> = [
  { field: 'onPress', appliesTo: (tool) => tool.onPress != null, read: (tool) => tool.onPress },
  { field: 'pressed', appliesTo: (tool) => tool.kind !== 'action', read: (tool) => tool.pressed === true },
  { field: 'shortcut', appliesTo: (tool) => Boolean(tool.shortcut), read: (tool) => tool.shortcut },
]

function pictogram(tool: Tool) {
  if (tool.text) return <span className="fk-canvas-tool__text">{tool.text}</span>
  const Glyph = tool.icon
  if (!Glyph) return null
  return <Glyph className="fk-icon" aria-hidden="true" focusable="false" />
}

function toDockEntry(tool: Tool): DockEntry {
  const entry: DockEntry = { id: tool.id, label: tool.label, icon: pictogram(tool), group: tool.group }
  for (const rule of optionalFields) {
    if (rule.appliesTo(tool)) Object.assign(entry, { [rule.field]: rule.read(tool) })
  }
  return entry
}

export function dockItemsFromCanvasTools(items: readonly CanvasToolItem[]): ActionBarItem[] {
  const usable: DockEntry[] = []
  for (const tool of items) {
    if (!tool.disabled) usable.push(toDockEntry(tool))
  }
  return usable
}
