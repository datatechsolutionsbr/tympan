// Canvas tools as data: the same list feeds the design system's bottom dock
// (each entry is a dock item) and the stand-alone CanvasToolbar.

import { Hand, ListTree, Maximize, MousePointer2, Network, Search, ZoomIn, ZoomOut } from 'lucide-react'
import type { IconComponent } from '@fakhir/design-system'
import { bundleFor, defineLabels, fill } from '../internal/labels'

export interface CanvasToolItem {
  id: 'select' | 'pan' | 'zoom-out' | 'zoom-level' | 'zoom-in' | 'fit' | 'auto-layout' | 'list-view' | 'search' | (string & {})
  /** Accessible name (also the revealed label). */
  label: string
  icon?: IconComponent
  /** Visible text instead of an icon (the zoom percentage). */
  text?: string
  /** `toggle` exposes aria-pressed; `mode` items form a single-select pair. */
  kind: 'action' | 'toggle' | 'mode'
  pressed?: boolean
  disabled?: boolean
  /** aria-keyshortcuts value, also shown in the revealed label. */
  shortcut?: string
  group: 'mode' | 'view' | 'layout' | 'find'
  onPress?: () => void
}

export interface CanvasToolLabels {
  select: string
  pan: string
  zoomOut: string
  zoomIn: string
  zoomLevel: string
  fit: string
  autoLayout: string
  listView: string
  search: string
  toolbar: string
}

export const canvasToolLabels = defineLabels<CanvasToolLabels>('CanvasTools', {
  en: {
    select: 'Select',
    pan: 'Pan',
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    zoomLevel: 'Zoom {percent}, reset to 100%',
    fit: 'Fit to view',
    autoLayout: 'Arrange automatically',
    listView: 'List view',
    search: 'Find a node',
    toolbar: 'Canvas tools',
  },
  'pt-BR': {
    select: 'Selecionar',
    pan: 'Mover a vista',
    zoomOut: 'Diminuir zoom',
    zoomIn: 'Aumentar zoom',
    zoomLevel: 'Zoom {percent}, voltar a 100%',
    fit: 'Ajustar à tela',
    autoLayout: 'Organizar automaticamente',
    listView: 'Ver como lista',
    search: 'Encontrar um nó',
    toolbar: 'Ferramentas do canvas',
  },
  es: {
    select: 'Seleccionar',
    pan: 'Desplazar la vista',
    zoomOut: 'Alejar',
    zoomIn: 'Acercar',
    zoomLevel: 'Zoom {percent}, volver a 100 %',
    fit: 'Ajustar a la vista',
    autoLayout: 'Organizar automáticamente',
    listView: 'Ver como lista',
    search: 'Buscar un nodo',
    toolbar: 'Herramientas del lienzo',
  },
})

export const defaultCanvasToolLabels: CanvasToolLabels = canvasToolLabels.bundles.en

export interface CanvasToolOptions {
  zoom: number
  mode: 'select' | 'pan'
  onModeChange: (mode: 'select' | 'pan') => void
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  onFit: () => void
  onAutoLayout?: () => void
  listView?: boolean
  onToggleListView?: () => void
  onSearch?: () => void
  locale?: string
  labels?: Partial<CanvasToolLabels>
  /** Tools to leave out (for example 'auto-layout' on a read-only canvas). */
  omit?: readonly string[]
}

/** The canvas tools as dock items, in dock order. */
export function canvasToolItems(o: CanvasToolOptions): CanvasToolItem[] {
  // Pure (usable outside React): built-in bundle for `locale`, then overrides.
  const l: CanvasToolLabels = { ...canvasToolLabels.bundles.en, ...(o.locale ? bundleFor(canvasToolLabels, o.locale) : {}), ...(o.labels ?? {}) }
  const percent = new Intl.NumberFormat(o.locale, { style: 'percent', maximumFractionDigits: 0 }).format(o.zoom)
  const items: CanvasToolItem[] = [
    { id: 'select', label: l.select, icon: MousePointer2, kind: 'mode', pressed: o.mode === 'select', shortcut: 'V', group: 'mode', onPress: () => o.onModeChange('select') },
    { id: 'pan', label: l.pan, icon: Hand, kind: 'mode', pressed: o.mode === 'pan', shortcut: 'H', group: 'mode', onPress: () => o.onModeChange('pan') },
    { id: 'zoom-out', label: l.zoomOut, icon: ZoomOut, kind: 'action', shortcut: 'Control+-', group: 'view', onPress: o.onZoomOut },
    { id: 'zoom-level', label: fill(l.zoomLevel, { percent }, o.locale), text: percent, kind: 'action', shortcut: 'Shift+1', group: 'view', onPress: o.onZoomReset },
    { id: 'zoom-in', label: l.zoomIn, icon: ZoomIn, kind: 'action', shortcut: 'Control+=', group: 'view', onPress: o.onZoomIn },
    { id: 'fit', label: l.fit, icon: Maximize, kind: 'action', shortcut: 'Control+1', group: 'view', onPress: o.onFit },
  ]
  if (o.onAutoLayout) items.push({ id: 'auto-layout', label: l.autoLayout, icon: Network, kind: 'action', group: 'layout', onPress: o.onAutoLayout })
  if (o.onToggleListView) items.push({ id: 'list-view', label: l.listView, icon: ListTree, kind: 'toggle', pressed: !!o.listView, group: 'layout', onPress: o.onToggleListView })
  if (o.onSearch) items.push({ id: 'search', label: l.search, icon: Search, kind: 'action', shortcut: 'Control+F', group: 'find', onPress: o.onSearch })
  return o.omit ? items.filter((i) => !o.omit!.includes(i.id)) : items
}
