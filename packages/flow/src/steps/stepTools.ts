// Dock items of the research-step editor, in three groups:
// select, move | add a step (A), rearrange, fit | list view, find a step.

import { Hand, ListOrdered, Maximize, MousePointer2, Network, Plus, Search } from 'lucide-react'
import type { CanvasToolItem } from '../toolbar/canvasTools'
import type { StepEditorWords } from './stepLabels'

export interface StepToolOptions {
  words: Pick<StepEditorWords, 'toolSelect' | 'toolPan' | 'toolAdd' | 'toolArrange' | 'toolFit' | 'toolList' | 'toolSearch'>
  mode: 'select' | 'pan'
  onModeChange: (mode: 'select' | 'pan') => void
  /** Absent while the flow is locked. */
  onAdd?: (() => void) | undefined
  onArrange?: (() => void) | undefined
  onFit: () => void
  listView: boolean
  onToggleList: () => void
  onSearch: () => void
}

export function stepToolItems(o: StepToolOptions): CanvasToolItem[] {
  const w = o.words
  const pointer: CanvasToolItem[] = [
    { id: 'select', label: w.toolSelect, icon: MousePointer2, kind: 'mode', pressed: o.mode === 'select', shortcut: 'V', group: 'mode', onPress: () => o.onModeChange('select') },
    { id: 'pan', label: w.toolPan, icon: Hand, kind: 'mode', pressed: o.mode === 'pan', shortcut: 'H', group: 'mode', onPress: () => o.onModeChange('pan') },
  ]
  const shaping: CanvasToolItem[] = [
    ...(o.onAdd ? [{ id: 'add-step', label: w.toolAdd, icon: Plus, kind: 'action' as const, shortcut: 'A', group: 'layout' as const, onPress: o.onAdd }] : []),
    ...(o.onArrange ? [{ id: 'auto-layout', label: w.toolArrange, icon: Network, kind: 'action' as const, group: 'layout' as const, onPress: o.onArrange }] : []),
    { id: 'fit', label: w.toolFit, icon: Maximize, kind: 'action', shortcut: 'Control+1', group: 'layout', onPress: o.onFit },
  ]
  const finding: CanvasToolItem[] = [
    { id: 'list-view', label: w.toolList, icon: ListOrdered, kind: 'toggle', pressed: o.listView, group: 'find', onPress: o.onToggleList },
    { id: 'search', label: w.toolSearch, icon: Search, kind: 'action', shortcut: 'Control+F', group: 'find', onPress: o.onSearch },
  ]
  return [...pointer, ...shaping, ...finding]
}
