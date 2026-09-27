// Editor tools: the shared canvas tools (canvasTools.ts) plus the editing
// ones (undo, redo, view toggles, layout direction, shortcut list). Same item
// shape, so a host can hand them to its dock.

import { ArrowDownToLine, ArrowRightToLine, Grid3x3, Keyboard, Map as MapIcon, Move, Redo2, Rows3, Undo2 } from 'lucide-react'
import { canvasToolItems, type CanvasToolItem, type CanvasToolOptions } from '../toolbar/canvasTools'
import { defineLabels, fill } from '../internal/labels'
import { ariaShortcut } from './keyMap'

export type LayoutCycle = 'free' | 'left-right' | 'top-down'

/** Tool groups beyond the shared ones only draw dividers. */
const grp = (name: string) => name as CanvasToolItem['group']

/** free → left-right → top-down → free */
export function nextLayout(current: LayoutCycle): LayoutCycle {
  return current === 'free' ? 'left-right' : current === 'left-right' ? 'top-down' : 'free'
}

export interface EditorToolLabels {
  undo: string
  redo: string
  minimap: string
  grid: string
  compact: string
  layout: string
  layoutFree: string
  layoutLeftRight: string
  layoutTopDown: string
  shortcuts: string
}

export const editorToolLabels = defineLabels<EditorToolLabels>('editorTools', {
  en: {
    undo: 'Undo',
    redo: 'Redo',
    minimap: 'Overview map',
    grid: 'Dot grid',
    compact: 'Compact cards',
    layout: 'Layout: {direction}',
    layoutFree: 'free',
    layoutLeftRight: 'in reading direction',
    layoutTopDown: 'top to bottom',
    shortcuts: 'Keyboard shortcuts',
  },
  'pt-BR': {
    undo: 'Desfazer',
    redo: 'Refazer',
    minimap: 'Mapa geral',
    grid: 'Grade de pontos',
    compact: 'Cartões compactos',
    layout: 'Disposição: {direction}',
    layoutFree: 'livre',
    layoutLeftRight: 'no sentido da leitura',
    layoutTopDown: 'de cima para baixo',
    shortcuts: 'Atalhos de teclado',
  },
  es: {
    undo: 'Deshacer',
    redo: 'Rehacer',
    minimap: 'Mapa general',
    grid: 'Cuadrícula de puntos',
    compact: 'Tarjetas compactas',
    layout: 'Disposición: {direction}',
    layoutFree: 'libre',
    layoutLeftRight: 'en el sentido de la lectura',
    layoutTopDown: 'de arriba abajo',
    shortcuts: 'Atajos de teclado',
  },
})

export const defaultEditorToolLabels: EditorToolLabels = editorToolLabels.bundles.en

export interface EditorToolOptions extends Partial<CanvasToolOptions> {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  showMap: boolean
  showGrid: boolean
  compactCards: boolean
  onToggleMap: () => void
  onToggleGrid: () => void
  onToggleCompact: () => void
  layoutDirection: LayoutCycle
  onLayoutDirectionChange: (next: LayoutCycle) => void
  shortcutsOpen?: boolean
  onToggleShortcuts?: () => void
  editorLabels: EditorToolLabels
}

/** Editor tools in bar order; canvas tools are included when their handlers are given. */
export function editorToolItems(o: EditorToolOptions): CanvasToolItem[] {
  const l = o.editorLabels
  const base =
    o.onModeChange && o.onZoomIn && o.onZoomOut && o.onZoomReset && o.onFit
      ? canvasToolItems({
          zoom: o.zoom ?? 1,
          mode: o.mode ?? 'select',
          onModeChange: o.onModeChange,
          onZoomIn: o.onZoomIn,
          onZoomOut: o.onZoomOut,
          onZoomReset: o.onZoomReset,
          onFit: o.onFit,
          ...(o.onAutoLayout ? { onAutoLayout: o.onAutoLayout } : {}),
          ...(o.onToggleListView ? { onToggleListView: o.onToggleListView, listView: !!o.listView } : {}),
          ...(o.onSearch ? { onSearch: o.onSearch } : {}),
          ...(o.locale ? { locale: o.locale } : {}),
          ...(o.labels ? { labels: o.labels } : {}),
          ...(o.omit ? { omit: o.omit } : {}),
        })
      : []
  const direction = o.layoutDirection === 'free' ? l.layoutFree : o.layoutDirection === 'left-right' ? l.layoutLeftRight : l.layoutTopDown
  const history: CanvasToolItem[] = [
    { id: 'undo', label: l.undo, icon: Undo2, kind: 'action', disabled: !o.canUndo, shortcut: ariaShortcut('undo'), group: grp('history'), onPress: o.onUndo },
    { id: 'redo', label: l.redo, icon: Redo2, kind: 'action', disabled: !o.canRedo, shortcut: ariaShortcut('redo'), group: grp('history'), onPress: o.onRedo },
  ]
  const toggles: CanvasToolItem[] = [
    { id: 'minimap', label: l.minimap, icon: MapIcon, kind: 'toggle', pressed: o.showMap, shortcut: 'M', group: grp('toggles'), onPress: o.onToggleMap },
    { id: 'grid', label: l.grid, icon: Grid3x3, kind: 'toggle', pressed: o.showGrid, shortcut: 'G', group: grp('toggles'), onPress: o.onToggleGrid },
    { id: 'compact', label: l.compact, icon: Rows3, kind: 'toggle', pressed: o.compactCards, group: grp('toggles'), onPress: o.onToggleCompact },
    {
      id: 'layout-direction',
      label: fill(l.layout, { direction }),
      icon: o.layoutDirection === 'top-down' ? ArrowDownToLine : o.layoutDirection === 'left-right' ? ArrowRightToLine : Move,
      kind: 'action',
      group: 'layout',
      onPress: () => o.onLayoutDirectionChange(nextLayout(o.layoutDirection)),
    },
  ]
  const help: CanvasToolItem[] = o.onToggleShortcuts
    ? [{ id: 'shortcuts', label: l.shortcuts, icon: Keyboard, kind: 'toggle', pressed: !!o.shortcutsOpen, group: 'find', onPress: o.onToggleShortcuts }]
    : []
  return [...base, ...history, ...toggles, ...help]
}
