// CanvasCommandBar: a floating, movable bar of editor tools. The grip (its own
// tab stop, before the toolbar) moves the bar by pointer or arrow keys; the
// tools form one APG toolbar; the shortcut list is a non-modal popover dialog.
// Below 640 px the bar docks to the bottom edge and extra tools go into "More".

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { GripVertical } from 'lucide-react'
import { Dialog, Heading, Popover } from 'react-aria-components'
import { ActionMenu, useMediaQuery } from '@fakhir/ui'
import { CanvasToolbar } from '../toolbar/CanvasToolbar'
import type { CanvasToolItem } from '../toolbar/canvasTools'
import { defineLabels, useFlowLocale, useLabels } from '../internal/labels'
import type { Point } from '../model/types'
import { editorToolItems, editorToolLabels, type EditorToolLabels, type LayoutCycle } from './editorTools'
import { editorKeyMap, isApplePlatform, type EditorAction } from './keyMap'

export interface CommandBarLabels extends EditorToolLabels {
  bar: string
  grip: string
  more: string
  shortcutsTitle: string
  select: string
  pan: string
  zoomIn: string
  zoomOut: string
  fit: string
  /** One description per action of the key map. */
  actions: Record<EditorAction, string>
}

const actionsEn: Record<EditorAction, string> = {
  escape: 'Clear selection, then leave the canvas',
  selectTool: 'Pointer mode',
  panTool: 'Hand mode',
  toggleGrid: 'Show or hide the grid',
  toggleMinimap: 'Show or hide the overview map',
  zoom100: 'Zoom to 100%',
  zoom50: 'Zoom to 50%',
  group: 'Group the selection',
  ungroup: 'Ungroup',
  undo: 'Undo',
  redo: 'Redo',
  copy: 'Copy',
  paste: 'Paste',
  selectAll: 'Select all',
  duplicate: 'Duplicate',
  fit: 'Fit to view',
  zoomOut: 'Zoom out',
  zoomIn: 'Zoom in',
  delete: 'Delete the selection',
}
const actionsPt: Record<EditorAction, string> = {
  escape: 'Limpar a seleção e depois sair do canvas',
  selectTool: 'Modo de seleção',
  panTool: 'Modo mão',
  toggleGrid: 'Mostrar ou ocultar a grade',
  toggleMinimap: 'Mostrar ou ocultar o mapa geral',
  zoom100: 'Zoom em 100%',
  zoom50: 'Zoom em 50%',
  group: 'Agrupar a seleção',
  ungroup: 'Desagrupar',
  undo: 'Desfazer',
  redo: 'Refazer',
  copy: 'Copiar',
  paste: 'Colar',
  selectAll: 'Selecionar tudo',
  duplicate: 'Duplicar',
  fit: 'Ajustar à tela',
  zoomOut: 'Diminuir zoom',
  zoomIn: 'Aumentar zoom',
  delete: 'Excluir a seleção',
}

const actionsEs: Record<EditorAction, string> = {
  escape: 'Borrar la selección y luego salir del lienzo',
  selectTool: 'Modo puntero',
  panTool: 'Modo mano',
  toggleGrid: 'Mostrar u ocultar la cuadrícula',
  toggleMinimap: 'Mostrar u ocultar el mapa general',
  zoom100: 'Zoom al 100%',
  zoom50: 'Zoom al 50%',
  group: 'Agrupar la selección',
  ungroup: 'Desagrupar',
  undo: 'Deshacer',
  redo: 'Rehacer',
  copy: 'Copiar',
  paste: 'Pegar',
  selectAll: 'Seleccionar todo',
  duplicate: 'Duplicar',
  fit: 'Ajustar a la vista',
  zoomOut: 'Alejar',
  zoomIn: 'Acercar',
  delete: 'Eliminar la selección',
}

export const commandBarLabels = defineLabels<CommandBarLabels>('canvasCommandBar', {
  en: {
    ...editorToolLabels.bundles.en,
    bar: 'Canvas tools',
    grip: 'Move tool bar',
    more: 'More tools',
    shortcutsTitle: 'Keyboard shortcuts',
    select: 'Pointer',
    pan: 'Hand',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    fit: 'Fit to view',
    actions: actionsEn,
  },
  'pt-BR': {
    ...editorToolLabels.bundles['pt-BR'],
    bar: 'Ferramentas do canvas',
    grip: 'Mover a barra de ferramentas',
    more: 'Mais ferramentas',
    shortcutsTitle: 'Atalhos de teclado',
    select: 'Seleção',
    pan: 'Mão',
    zoomIn: 'Aumentar zoom',
    zoomOut: 'Diminuir zoom',
    fit: 'Ajustar à tela',
    actions: actionsPt,
  },
  es: {
    ...editorToolLabels.bundles.es,
    bar: 'Herramientas del lienzo',
    grip: 'Mover la barra de herramientas',
    more: 'Más herramientas',
    shortcutsTitle: 'Atajos de teclado',
    select: 'Puntero',
    pan: 'Mano',
    zoomIn: 'Acercar',
    zoomOut: 'Alejar',
    fit: 'Ajustar a la vista',
    actions: actionsEs,
  },
})

export const defaultCommandBarLabels: CommandBarLabels = commandBarLabels.bundles.en

export interface CanvasCommandBarProps {
  mode: 'pointer' | 'pan'
  onModeChange: (mode: 'pointer' | 'pan') => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  showMap: boolean
  showGrid: boolean
  compactCards: boolean
  onToggleMap: () => void
  onToggleGrid: () => void
  onToggleCompact: () => void
  layoutDirection: LayoutCycle
  onLayoutDirectionChange: (direction: LayoutCycle) => void
  shortcutsOpen: boolean
  onToggleShortcuts: () => void
  onCloseShortcuts: () => void
  labels?: Partial<CommandBarLabels>
  /** Initial offset from the resting position (screen px). */
  defaultOffset?: Point
  className?: string
}

const NUDGE = 8
/** Tools kept in the bar on narrow screens; the rest go into "More". */
const NARROW_KEEP = 5

export function CanvasCommandBar(props: CanvasCommandBarProps) {
  const l = useLabels(commandBarLabels, props.labels)
  const narrow = !useMediaQuery('(min-width: 640px)', true)
  const [offset, setOffset] = useState<Point>(props.defaultOffset ?? { x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ id: number; start: Point; origin: Point } | null>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const shortcutsRef = useRef<HTMLElement | null>(null)

  const { locale } = useFlowLocale()
  const items = editorToolItems({
    locale,
    mode: props.mode === 'pointer' ? 'select' : 'pan',
    onModeChange: (m) => props.onModeChange(m === 'select' ? 'pointer' : 'pan'),
    onZoomIn: props.onZoomIn,
    onZoomOut: props.onZoomOut,
    onZoomReset: props.onFit,
    onFit: props.onFit,
    labels: { select: l.select, pan: l.pan, zoomIn: l.zoomIn, zoomOut: l.zoomOut, fit: l.fit },
    omit: ['zoom-level'],
    canUndo: props.canUndo,
    canRedo: props.canRedo,
    onUndo: props.onUndo,
    onRedo: props.onRedo,
    showMap: props.showMap,
    showGrid: props.showGrid,
    compactCards: props.compactCards,
    onToggleMap: props.onToggleMap,
    onToggleGrid: props.onToggleGrid,
    onToggleCompact: props.onToggleCompact,
    layoutDirection: props.layoutDirection,
    onLayoutDirectionChange: props.onLayoutDirectionChange,
    shortcutsOpen: props.shortcutsOpen,
    onToggleShortcuts: props.onToggleShortcuts,
    editorLabels: l,
  })

  useEffect(() => {
    shortcutsRef.current = barRef.current?.querySelector<HTMLElement>('[data-tool="shortcuts"]') ?? null
  })

  const visible: CanvasToolItem[] = narrow ? items.slice(0, NARROW_KEEP) : items
  const overflow: CanvasToolItem[] = narrow ? items.slice(NARROW_KEEP) : []

  const onGripDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (narrow || e.button !== 0) return
    drag.current = { id: e.pointerId, start: { x: e.clientX, y: e.clientY }, origin: offset }
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setDragging(true)
  }
  const onGripMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    setOffset({ x: d.origin.x + e.clientX - d.start.x, y: d.origin.y + e.clientY - d.start.y })
  }
  const onGripUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (drag.current?.id !== e.pointerId) return
    drag.current = null
    setDragging(false)
  }
  const onGripKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = e.shiftKey ? NUDGE * 4 : NUDGE
    const moves: Record<string, Point> = { ArrowLeft: { x: -step, y: 0 }, ArrowRight: { x: step, y: 0 }, ArrowUp: { x: 0, y: -step }, ArrowDown: { x: 0, y: step } }
    const m = moves[e.key]
    if (!m || narrow) return
    e.preventDefault()
    setOffset((o) => ({ x: o.x + m.x, y: o.y + m.y }))
  }

  const apple = isApplePlatform()
  return (
    <div
      ref={barRef}
      className={['fk-command-bar', props.className].filter(Boolean).join(' ')}
      data-docked={narrow ? 'bottom' : 'floating'}
      data-dragging={dragging || undefined}
      data-fk-surface-chrome=""
      style={narrow ? undefined : { translate: `${offset.x}px ${offset.y}px` }}
    >
      {narrow ? null : (
        <button
          type="button"
          className="fk-command-bar__grip"
          aria-label={l.grip}
          aria-describedby={undefined}
          onPointerDown={onGripDown}
          onPointerMove={onGripMove}
          onPointerUp={onGripUp}
          onPointerCancel={onGripUp}
          onKeyDown={onGripKey}
        >
          <GripVertical aria-hidden="true" focusable="false" />
        </button>
      )}
      <CanvasToolbar
        items={visible}
        label={l.bar}
        placement="inline"
        after={
          overflow.length ? (
            <ActionMenu
              label={l.more}
              items={overflow.map((i) => ({ id: i.id, label: i.label, ...(i.icon ? { icon: i.icon } : {}), ...(i.disabled ? { disabled: true } : {}) }))}
              onAction={(id) => overflow.find((i) => i.id === id)?.onPress?.()}
            />
          ) : null
        }
      />
      <Popover
        isOpen={props.shortcutsOpen}
        onOpenChange={(open) => {
          if (!open) props.onCloseShortcuts()
        }}
        triggerRef={shortcutsRef}
        isNonModal
        placement="top"
        offset={8}
        className="fk-command-bar__shortcuts"
      >
        <Dialog
          aria-label={l.shortcutsTitle}
          className="fk-command-bar__shortcuts-dialog"
        >
          <Heading slot="title" className="fk-command-bar__shortcuts-title">
            {l.shortcutsTitle}
          </Heading>
          <dl className="fk-command-bar__keys">
            {editorKeyMap.map((b) => (
              <div key={b.action} className="fk-command-bar__key-row">
                <dt>{l.actions[b.action]}</dt>
                <dd>
                  {b.chords.map((c) => (
                    <kbd key={c} className="fk-command-bar__kbd">
                      {c.replace('Mod', apple ? '⌘' : 'Ctrl')}
                    </kbd>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </Dialog>
      </Popover>
    </div>
  )
}
