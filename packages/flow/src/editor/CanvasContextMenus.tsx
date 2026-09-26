// CanvasContextMenus: node, selection and empty-canvas menus on the design
// system's ActionMenu (context mode, opened at a screen point). Every item
// closes the menu after acting; closing returns focus to whatever opened it.

import { useEffect, useRef, type KeyboardEvent } from 'react'
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalSpaceAround,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalSpaceAround,
  ClipboardPaste,
  Copy,
  CopyPlus,
  Group,
  Maximize,
  Pencil,
  SquareDashedMousePointer,
  StickyNote,
  Trash2,
} from 'lucide-react'
import { ActionMenu, type ActionMenuEntry } from '@datatechsolutions/tympan'
import type { AlignEdge, DistributeAxis } from '../geometry/arrange'
import { FALLBACK_NODE_SIZE } from '../geometry/rect'
import { defineLabels, useLabels } from '../internal/labels'
import type { FlowNode, Point, Size } from '../model/types'

export interface CanvasMenuLabels {
  nodeMenu: string
  selectionMenu: string
  canvasMenu: string
  edit: string
  duplicate: string
  copy: string
  delete: string
  group: string
  alignLeft: string
  alignRight: string
  alignTop: string
  alignBottom: string
  centreHorizontal: string
  centreVertical: string
  distributeHorizontal: string
  distributeVertical: string
  paste: string
  selectAll: string
  fitView: string
  addNote: string
}

export const canvasMenuLabels = defineLabels<CanvasMenuLabels>('canvasContextMenus', {
  en: {
    nodeMenu: 'Node actions',
    selectionMenu: 'Selection actions',
    canvasMenu: 'Canvas actions',
    edit: 'Edit',
    duplicate: 'Duplicate',
    copy: 'Copy',
    delete: 'Delete',
    group: 'Group selection',
    alignLeft: 'Align to start',
    alignRight: 'Align to end',
    alignTop: 'Align top',
    alignBottom: 'Align bottom',
    centreHorizontal: 'Centre horizontally',
    centreVertical: 'Centre vertically',
    distributeHorizontal: 'Distribute horizontally',
    distributeVertical: 'Distribute vertically',
    paste: 'Paste',
    selectAll: 'Select all',
    fitView: 'Fit to view',
    addNote: 'Add note',
  },
  'pt-BR': {
    nodeMenu: 'Ações do nó',
    selectionMenu: 'Ações da seleção',
    canvasMenu: 'Ações do canvas',
    edit: 'Editar',
    duplicate: 'Duplicar',
    copy: 'Copiar',
    delete: 'Excluir',
    group: 'Agrupar seleção',
    alignLeft: 'Alinhar ao início',
    alignRight: 'Alinhar ao fim',
    alignTop: 'Alinhar ao topo',
    alignBottom: 'Alinhar à base',
    centreHorizontal: 'Centralizar na horizontal',
    centreVertical: 'Centralizar na vertical',
    distributeHorizontal: 'Distribuir na horizontal',
    distributeVertical: 'Distribuir na vertical',
    paste: 'Colar',
    selectAll: 'Selecionar tudo',
    fitView: 'Ajustar à tela',
    addNote: 'Adicionar nota',
  },
  es: {
    nodeMenu: 'Acciones del nodo',
    selectionMenu: 'Acciones de la selección',
    canvasMenu: 'Acciones del lienzo',
    edit: 'Editar',
    duplicate: 'Duplicar',
    copy: 'Copiar',
    delete: 'Eliminar',
    group: 'Agrupar selección',
    alignLeft: 'Alinear al inicio',
    alignRight: 'Alinear al final',
    alignTop: 'Alinear arriba',
    alignBottom: 'Alinear abajo',
    centreHorizontal: 'Centrar en horizontal',
    centreVertical: 'Centrar en vertical',
    distributeHorizontal: 'Distribuir en horizontal',
    distributeVertical: 'Distribuir en vertical',
    paste: 'Pegar',
    selectAll: 'Seleccionar todo',
    fitView: 'Ajustar a la vista',
    addNote: 'Añadir nota',
  },
})

export const defaultCanvasMenuLabels: CanvasMenuLabels = canvasMenuLabels.bundles.en

/** Rendered size of a node, else its declared size, else the documented default. */
export function nodeSize(node: Pick<FlowNode, 'measured' | 'size'>, fallback: Size = FALLBACK_NODE_SIZE): Size {
  if (node.measured && node.measured.width > 0 && node.measured.height > 0) return { ...node.measured }
  if (node.size && node.size.width > 0 && node.size.height > 0) return { ...node.size }
  return { ...fallback }
}

/** True for the keys that open a context menu from the keyboard (Shift+F10, ContextMenu). */
export function isContextMenuKey(e: Pick<KeyboardEvent, 'key' | 'shiftKey'>): boolean {
  return e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')
}

interface MenuBase {
  /** Screen position (pointer, or the focused element's corner). */
  anchor: Point
  onClose: () => void
  labels?: Partial<CanvasMenuLabels>
}

/** Remembers the element focused when a menu opened and returns focus to it on close. */
function useReturnFocus() {
  const opener = useRef<HTMLElement | null>(null)
  useEffect(() => {
    const el = document.activeElement
    opener.current = el instanceof HTMLElement && el !== document.body ? el : null
    return () => {
      const back = opener.current
      requestAnimationFrame(() => {
        if (back?.isConnected && (!document.activeElement || document.activeElement === document.body)) back.focus()
      })
    }
  }, [])
}

function MenuAt({ anchor, onClose, label, items, run }: { anchor: Point; onClose: () => void; label: string; items: ActionMenuEntry[]; run: (id: string) => void }) {
  useReturnFocus()
  return (
    <ActionMenu
      mode="context"
      open
      position={anchor}
      label={label}
      items={items}
      className="ty-canvas-menu"
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      onAction={(id) => {
        run(id)
        onClose()
      }}
    />
  )
}

export interface NodeContextMenuProps extends MenuBase {
  targetId: string
  onEdit: (id: string) => void
  onDuplicate: (id: string) => void
  onCopy: (id: string) => void
  onDelete: (id: string) => void
}

export function NodeContextMenu({ anchor, onClose, targetId, onEdit, onDuplicate, onCopy, onDelete, labels }: NodeContextMenuProps) {
  const l = useLabels(canvasMenuLabels, labels)
  const act: Record<string, (id: string) => void> = { edit: onEdit, duplicate: onDuplicate, copy: onCopy, delete: onDelete }
  return (
    <MenuAt
      anchor={anchor}
      onClose={onClose}
      label={l.nodeMenu}
      run={(id) => act[id]?.(targetId)}
      items={[
        { id: 'edit', label: l.edit, icon: Pencil },
        { id: 'duplicate', label: l.duplicate, icon: CopyPlus },
        { id: 'copy', label: l.copy, icon: Copy },
        { type: 'separator' },
        { id: 'delete', label: l.delete, icon: Trash2, tone: 'danger' },
      ]}
    />
  )
}

export interface SelectionContextMenuProps extends MenuBase {
  /** Number of selected nodes: align needs 2, distribute 3. */
  count: number
  onCopy: () => void
  onDuplicate: () => void
  onDelete: () => void
  onGroup: () => void
  onAlign: (direction: AlignEdge) => void
  onDistribute: (axis: DistributeAxis) => void
}

export function SelectionContextMenu({ anchor, onClose, count, onCopy, onDuplicate, onDelete, onGroup, onAlign, onDistribute, labels }: SelectionContextMenuProps) {
  const l = useLabels(canvasMenuLabels, labels)
  const run = (id: string) => {
    if (id === 'copy') onCopy()
    else if (id === 'duplicate') onDuplicate()
    else if (id === 'delete') onDelete()
    else if (id === 'group') onGroup()
    else if (id.startsWith('align:')) onAlign(id.slice(6) as AlignEdge)
    else if (id.startsWith('distribute:')) onDistribute(id.slice(11) as DistributeAxis)
  }
  return (
    <MenuAt
      anchor={anchor}
      onClose={onClose}
      label={l.selectionMenu}
      run={run}
      items={[
        { id: 'copy', label: l.copy, icon: Copy },
        { id: 'duplicate', label: l.duplicate, icon: CopyPlus },
        { id: 'group', label: l.group, icon: Group, disabled: count < 2 },
        { id: 'delete', label: l.delete, icon: Trash2, tone: 'danger' },
        { type: 'separator' },
        { id: 'align:left', label: l.alignLeft, icon: AlignStartVertical, disabled: count < 2 },
        { id: 'align:right', label: l.alignRight, icon: AlignEndVertical, disabled: count < 2 },
        { id: 'align:top', label: l.alignTop, icon: AlignStartHorizontal, disabled: count < 2 },
        { id: 'align:bottom', label: l.alignBottom, icon: AlignEndHorizontal, disabled: count < 2 },
        { id: 'align:centerHorizontal', label: l.centreHorizontal, icon: AlignCenterVertical, disabled: count < 2 },
        { id: 'align:centerVertical', label: l.centreVertical, icon: AlignCenterHorizontal, disabled: count < 2 },
        { type: 'separator' },
        { id: 'distribute:horizontal', label: l.distributeHorizontal, icon: AlignHorizontalSpaceAround, disabled: count < 3 },
        { id: 'distribute:vertical', label: l.distributeVertical, icon: AlignVerticalSpaceAround, disabled: count < 3 },
      ]}
    />
  )
}

export interface CanvasBackgroundMenuProps extends MenuBase {
  canvasPosition: Point
  hasClipboardContent: boolean
  onPaste: () => void
  onSelectAll: () => void
  onFitView: () => void
  onAddNote: (canvasPosition: Point) => void
}

export function CanvasBackgroundMenu({ anchor, onClose, canvasPosition, hasClipboardContent, onPaste, onSelectAll, onFitView, onAddNote, labels }: CanvasBackgroundMenuProps) {
  const l = useLabels(canvasMenuLabels, labels)
  const run = (id: string) => {
    if (id === 'paste') onPaste()
    else if (id === 'select-all') onSelectAll()
    else if (id === 'fit') onFitView()
    else if (id === 'note') onAddNote(canvasPosition)
  }
  return (
    <MenuAt
      anchor={anchor}
      onClose={onClose}
      label={l.canvasMenu}
      run={run}
      items={[
        { id: 'paste', label: l.paste, icon: ClipboardPaste, disabled: !hasClipboardContent },
        { id: 'select-all', label: l.selectAll, icon: SquareDashedMousePointer },
        { id: 'fit', label: l.fitView, icon: Maximize },
        { type: 'separator' },
        { id: 'note', label: l.addNote, icon: StickyNote },
      ]}
    />
  )
}
