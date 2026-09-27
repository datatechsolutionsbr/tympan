// ConditionalConnector: the line between two nodes, with its branch word, a
// wide invisible hit path, and a control pill (insert a step, delete). The
// surface calls `renderConditionalConnector` once per connector; it returns the
// SVG part (drawn under nodes) and the HTML part (drawn above, in canvas
// coordinates). Line and pill share one hover state per connector so the pill
// stays while the pointer travels between them.

import { useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react'
import { Button as AriaButton } from 'react-aria-components'
import { Check, Info, Minus, Plus, Repeat, Trash2, X } from 'lucide-react'
import type { BranchTone } from '../catalog/kindCatalog'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { createId } from '../internal/ids'
import type { FlowConnector, Point } from '../model/types'
import type { ConnectorParts, ConnectorShape } from '../surface/types'
import { ConnectorInsertMenu, type InsertOption } from './ConnectorInsertMenu'

export interface ConditionalConnectorLabels {
  name: string
  nameBranch: string
  insert: string
  remove: string
  true: string
  false: string
  loop: string
  controls: string
}

export const conditionalConnectorLabels = defineLabels<ConditionalConnectorLabels>('ConditionalConnector', {
  en: {
    name: 'from {source} to {target}',
    nameBranch: 'from {source} to {target}, branch {branch}',
    insert: 'Insert step between {source} and {target}',
    remove: 'Delete connection from {source} to {target}',
    true: 'true',
    false: 'false',
    loop: 'loop',
    controls: 'Connection tools',
  },
  'pt-BR': {
    name: 'de {source} para {target}',
    nameBranch: 'de {source} para {target}, ramo {branch}',
    insert: 'Inserir etapa entre {source} e {target}',
    remove: 'Excluir conexão de {source} para {target}',
    true: 'verdadeiro',
    false: 'falso',
    loop: 'repetição',
    controls: 'Ferramentas da conexão',
  },
  es: {
    name: 'de {source} a {target}',
    nameBranch: 'de {source} a {target}, rama {branch}',
    insert: 'Insertar paso entre {source} y {target}',
    remove: 'Eliminar conexión de {source} a {target}',
    true: 'verdadero',
    false: 'falso',
    loop: 'bucle',
    controls: 'Herramientas de la conexión',
  },
})
export const defaultConditionalConnectorLabels = conditionalConnectorLabels.bundles.en

/** Logic kinds offered by the built-in insert menu when the host gives none. */
export const DEFAULT_INSERTABLE_KINDS: readonly InsertOption[] = [
  { kind: 'code', label: 'Compute' },
  { kind: 'if-else', label: 'Branch' },
  { kind: 'decision', label: 'Decision' },
  { kind: 'iteration', label: 'Loop' },
]

type WellKnownBranch = 'true' | 'false' | 'loop'
const BRANCH_TONE: Record<WellKnownBranch, BranchTone> = { true: 'success', false: 'error', loop: 'info' }

/** Branch key of a connector: explicit label wins; well-known outputs name themselves. */
export function branchOf(c: Pick<FlowConnector, 'label' | 'sourcePort'>): { key: string; wellKnown: WellKnownBranch | null } | null {
  const port = c.sourcePort as WellKnownBranch | undefined
  const wellKnown = port && port in BRANCH_TONE ? port : null
  if (c.label) return { key: c.label, wellKnown: (c.label as WellKnownBranch) in BRANCH_TONE ? (c.label as WellKnownBranch) : wellKnown }
  return wellKnown ? { key: wellKnown, wellKnown } : null
}

/**
 * Splits connector `id` through `newNodeId`: the first half keeps the label
 * and condition, the second half is unconditional. Other connectors untouched.
 */
export function splitConnector(connectors: readonly FlowConnector[], id: string, newNodeId: string): FlowConnector[] {
  const out: FlowConnector[] = []
  for (const c of connectors) {
    if (c.id !== id) {
      out.push(c)
      continue
    }
    const { target, targetPort, selected: _s, ...first } = c
    out.push({ ...first, target: newNodeId })
    out.push({ id: createId('connector'), source: newNodeId, target, ...(targetPort ? { targetPort } : {}) })
  }
  return out
}

// ---- shared hover per connector ------------------------------------------

let hovered: string | null = null
let leaveTimer: ReturnType<typeof setTimeout> | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
function enter(id: string) {
  if (leaveTimer) clearTimeout(leaveTimer)
  leaveTimer = null
  if (hovered !== id) {
    hovered = id
    emit()
  }
}
function leave(id: string) {
  if (leaveTimer) clearTimeout(leaveTimer)
  // A short grace lets the pointer cross the gap between line and pill.
  leaveTimer = setTimeout(() => {
    if (hovered === id) {
      hovered = null
      emit()
    }
  }, 160)
}
function useHovered(id: string) {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => hovered === id,
    () => false,
  )
}

// ---- rendering -------------------------------------------------------------

export interface ConditionalConnectorOptions {
  sourceName: string
  targetName: string
  selected?: boolean
  locked?: boolean
  /** The path currently executing (active token). */
  active?: boolean
  insertableKinds?: readonly InsertOption[]
  onInsertStep?: (connectorId: string, kind: string, point: Point) => void
  /** When set, replaces the built-in insert menu with the host's picker. */
  onOpenInsertPicker?: (connectorId: string, point: Point) => void
  onDelete?: (connectorId: string) => void
  onSelect?: (connectorId: string) => void
  labels?: Partial<ConditionalConnectorLabels>
}

function toneOf(c: FlowConnector): BranchTone {
  const b = branchOf(c)
  return b?.wellKnown ? BRANCH_TONE[b.wellKnown] : 'neutral'
}

export function renderConditionalConnector(connector: FlowConnector, shape: ConnectorShape, options: ConditionalConnectorOptions): ConnectorParts {
  return {
    svg: <ConnectorPath connector={connector} shape={shape} options={options} />,
    html: <ConnectorControls connector={connector} shape={shape} options={options} />,
  }
}

function ConnectorPath({ connector, shape, options }: { connector: FlowConnector; shape: ConnectorShape; options: ConditionalConnectorOptions }) {
  const isHovered = useHovered(connector.id)
  const branch = branchOf(connector)
  return (
    <g
      className="ty-connector"
      data-branch={branch?.wellKnown ?? (branch ? 'named' : 'none')}
      data-tone={toneOf(connector)}
      data-selected={options.selected ? 'true' : 'false'}
      data-hovered={isHovered ? 'true' : undefined}
      data-active={options.active ? 'true' : undefined}
      aria-hidden="true"
    >
      <path className="ty-connector__path" d={shape.d} markerEnd="url(#ty-surface-arrow)" />
      <path
        className="ty-connector__hit"
        d={shape.d}
        onPointerEnter={() => enter(connector.id)}
        onPointerLeave={() => leave(connector.id)}
        onClick={() => options.onSelect?.(connector.id)}
      />
    </g>
  )
}

const WELL_KNOWN_ICON: Record<WellKnownBranch, typeof Check> = { true: Check, false: X, loop: Repeat }

function ConnectorControls({ connector, shape, options }: { connector: FlowConnector; shape: ConnectorShape; options: ConditionalConnectorOptions }) {
  const l = useLabels(conditionalConnectorLabels, options.labels)
  const { locale } = useFlowLocale()
  const isHovered = useHovered(connector.id)
  const [menuOpen, setMenuOpen] = useState(false)
  const focusRef = useRef<HTMLButtonElement>(null)
  const insertRef = useRef<HTMLButtonElement>(null)
  const [focusWithin, setFocusWithin] = useState(false)
  const branch = branchOf(connector)
  const branchWord = branch ? (branch.wellKnown && !connector.label ? l[branch.wellKnown] : branch.key) : null
  const names = { source: options.sourceName, target: options.targetName }
  const name = branchWord ? fill(l.nameBranch, { ...names, branch: branchWord }, locale) : fill(l.name, names, locale)
  const canEdit = !options.locked
  const showControls = canEdit && (isHovered || !!options.selected || focusWithin || menuOpen)
  const Icon = branch?.wellKnown ? WELL_KNOWN_ICON[branch.wellKnown] : branch ? Info : Minus

  const openInsert = () => {
    if (!canEdit) return
    if (options.onOpenInsertPicker) options.onOpenInsertPicker(connector.id, shape.mid)
    else setMenuOpen(true)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!canEdit) return
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      e.stopPropagation()
      options.onDelete?.(connector.id)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      openInsert()
    }
  }

  return (
    <div
      className="ty-connector-controls"
      data-labelled={branch ? 'true' : 'false'}
      data-tone={toneOf(connector)}
      data-visible={showControls ? 'true' : 'false'}
      style={{ transform: `translate(${shape.mid.x}px, ${shape.mid.y}px)` }}
      onPointerEnter={() => enter(connector.id)}
      onPointerLeave={() => leave(connector.id)}
      onFocus={() => setFocusWithin(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusWithin(false)
      }}
      data-ty-surface-chrome=""
    >
      <AriaButton ref={focusRef} className="ty-connector-controls__handle" aria-label={name} onPress={() => options.onSelect?.(connector.id)} onKeyDown={onKeyDown}>
        {branchWord ? (
          <span className="ty-connector-controls__label">
            <Icon aria-hidden="true" focusable="false" />
            {branchWord}
          </span>
        ) : (
          <span className="ty-connector-controls__dot" aria-hidden="true" />
        )}
      </AriaButton>
      {canEdit ? (
        <span className="ty-connector-controls__pill" role="group" aria-label={l.controls}>
          <AriaButton ref={insertRef} className="ty-connector-controls__tool" aria-label={fill(l.insert, names, locale)} onPress={openInsert}>
            <Plus aria-hidden="true" focusable="false" />
          </AriaButton>
          <AriaButton className="ty-connector-controls__tool" data-tone="danger" aria-label={fill(l.remove, names, locale)} onPress={() => options.onDelete?.(connector.id)}>
            <Trash2 aria-hidden="true" focusable="false" />
          </AriaButton>
        </span>
      ) : null}
      {menuOpen ? (
        <ConnectorInsertMenu
          anchor={shape.mid}
          triggerRef={insertRef}
          options={options.insertableKinds ?? DEFAULT_INSERTABLE_KINDS}
          onSelect={(kind) => options.onInsertStep?.(connector.id, kind, shape.mid)}
          onClose={() => {
            setMenuOpen(false)
            requestAnimationFrame(() => insertRef.current?.focus())
          }}
        />
      ) : null}
    </div>
  )
}

/** Stand-alone component form, for hosts drawing their own SVG layer. */
export function ConditionalConnector(props: { connector: FlowConnector; shape: ConnectorShape } & ConditionalConnectorOptions) {
  const { connector, shape, ...options } = props
  const parts = renderConditionalConnector(connector, shape, options)
  return (
    <>
      <svg className="ty-connector-standalone" aria-hidden="true" focusable="false">
        {parts.svg}
      </svg>
      {parts.html}
    </>
  )
}
