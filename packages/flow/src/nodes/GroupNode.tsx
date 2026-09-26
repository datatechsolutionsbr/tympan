// GroupNode: a frame around several nodes. Expanded, it is a labelled group
// with a header and a child area (resizable when selected); collapsed, it is a
// card. Either way it has one input and one output so it wires as a unit.

import { useId, useRef, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { ChevronDown, ChevronRight, Focus, Group, Trash2 } from 'lucide-react'
import { Button as AriaButton } from 'react-aria-components'
import { Button } from '@datatechsolutions/tympan'
import { isToneName } from '../catalog/palette'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import type { FlowNode, LayoutDirection, Size } from '../model/types'
import { useSurface } from '../surface/SurfaceContext'
import { ConnectionPorts } from './ConnectionPorts'
import { GraphNodeCard, NodeBadge, type CardDensity } from './GraphNodeCard'
import { GROUP_MIN_SIZE, GROUP_RESIZE_STEP } from './groupLayout'
import { useKindPresentation } from './nodeChrome'
import { NodeRunIndicator, useRunWords } from './NodeRunIndicator'

export interface GroupNodeLabels {
  defaultName: string
  defaultDescription: string
  group: string
  members: string
  collapse: string
  expand: string
  focus: string
  remove: string
  resize: string
}

export const groupNodeLabels = defineLabels<GroupNodeLabels>('groupNode', {
  en: {
    defaultName: 'Group',
    defaultDescription: 'Several steps kept together',
    group: 'group',
    members: '{count, plural, =0 {no steps} one {# step} other {# steps}}',
    collapse: 'Collapse {name}',
    expand: 'Expand {name}',
    focus: 'Open {name} in focused view',
    remove: 'Delete group {name}',
    resize: 'Resize {name}',
  },
  'pt-BR': {
    defaultName: 'Grupo',
    defaultDescription: 'Várias etapas mantidas juntas',
    group: 'grupo',
    members: '{count, plural, =0 {nenhuma etapa} one {# etapa} other {# etapas}}',
    collapse: 'Recolher {name}',
    expand: 'Expandir {name}',
    focus: 'Abrir {name} em vista focada',
    remove: 'Excluir o grupo {name}',
    resize: 'Redimensionar {name}',
  },
  es: {
    defaultName: 'Grupo',
    defaultDescription: 'Varios pasos agrupados',
    group: 'grupo',
    members: '{count, plural, =0 {ningún paso} one {# paso} other {# pasos}}',
    collapse: 'Contraer {name}',
    expand: 'Expandir {name}',
    focus: 'Abrir {name} en vista enfocada',
    remove: 'Eliminar el grupo {name}',
    resize: 'Cambiar el tamaño de {name}',
  },
})
export const defaultGroupNodeLabels = groupNodeLabels.bundles.en

export interface GroupNodeProps {
  id: string
  name?: string
  description?: string
  tone?: string
  expanded?: boolean
  autoFit?: boolean
  size?: Size
  memberCount?: number
  /** Smallest manual size (the members' bounds plus padding). */
  minSize?: Size
  onToggleExpanded: (id: string) => void
  onConfigure?: (id: string) => void
  onEnterFocus?: (id: string) => void
  onRemove?: (id: string) => void
  /** Manual resize finished (the host turns auto-fit off and stores the size). */
  onResize?: (id: string, size: Size) => void
  selected?: boolean
  locked?: boolean
  preview?: boolean
  density?: CardDensity
  direction?: LayoutDirection
  labels?: Partial<GroupNodeLabels>
}

export function GroupNode(props: GroupNodeProps) {
  const { id, tone, expanded = true, size = { width: 400, height: 280 }, memberCount = 0, minSize = GROUP_MIN_SIZE, onToggleExpanded, onConfigure, onEnterFocus, onRemove, onResize, selected = false, locked = false, preview = false, density = 'detailed', direction = 'right' } = props
  const l = useLabels(groupNodeLabels, props.labels)
  const { locale } = useFlowLocale()
  const surface = useSurface()
  const name = props.name?.trim() || l.defaultName
  const description = props.description?.trim() || undefined
  const safeTone = isToneName(tone) ? tone : 'neutral'
  const node: FlowNode = { id, kind: 'group', position: { x: 0, y: 0 }, data: {} }
  const k = useKindPresentation(node, direction)
  const run = useRunWords(id)
  const countId = useId()
  const drag = useRef<{ x: number; y: number; size: Size } | null>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const canEdit = !preview && !locked
  const members = fill(l.members, { count: memberCount }, locale)

  const toggle = (
    <AriaButton className="ty-group-node__toggle" aria-label={fill(expanded ? l.collapse : l.expand, { name })} aria-expanded={expanded} onPress={() => onToggleExpanded(id)} data-ty-no-drag="">
      {expanded ? <ChevronDown aria-hidden="true" focusable="false" /> : <ChevronRight className="ty-group-node__chevron" aria-hidden="true" focusable="false" />}
    </AriaButton>
  )
  const controls = (
    <>
      {onEnterFocus && !preview ? <Button variant="quiet" size="compact" iconOnly accessibleLabel={fill(l.focus, { name })} leadingIcon={<Focus />} onPress={() => onEnterFocus(id)} /> : null}
      {onRemove && canEdit ? <Button variant="quiet" size="compact" iconOnly accessibleLabel={fill(l.remove, { name })} leadingIcon={<Trash2 />} onPress={() => onRemove(id)} /> : null}
    </>
  )

  if (!expanded) {
    return (
      <GraphNodeCard
        kind="group"
        kindLabel={l.group}
        title={name}
        description={description ?? l.defaultDescription}
        icon={<Group />}
        tone={safeTone}
        density={density}
        selected={selected}
        locked={locked}
        runState={run.runState}
        stateWords={[members, ...(run.words ? [run.words] : [])]}
        {...(onConfigure && (canEdit || preview) ? { onActivate: () => onConfigure(id) } : {})}
        badges={<NodeBadge>{l.group}</NodeBadge>}
        headerActions={
          <span className="ty-group-node__controls" data-ty-above="">
            {toggle}
            {controls}
          </span>
        }
        className="ty-flow-node ty-group-node__card"
      >
        <ConnectionPorts nodeId={id} nodeLabel={name} inputs={k.inputs} outputs={k.outputs} tone={safeTone} preview={preview} />
        <NodeRunIndicator nodeId={id} kind="group" nodeLabel={name} />
      </GraphNodeCard>
    )
  }

  const scale = surface.zoom || 1
  const onHandleDown = (e: ReactPointerEvent<HTMLSpanElement>) => {
    e.stopPropagation()
    e.preventDefault()
    drag.current = { x: e.clientX, y: e.clientY, size }
    const move = (ev: PointerEvent) => {
      if (!drag.current || !frameRef.current) return
      const w = Math.max(minSize.width, drag.current.size.width + (ev.clientX - drag.current.x) / scale)
      const h = Math.max(minSize.height, drag.current.size.height + (ev.clientY - drag.current.y) / scale)
      frameRef.current.style.inlineSize = `${w}px`
      frameRef.current.style.blockSize = `${h}px`
    }
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      if (!drag.current) return
      const w = Math.max(minSize.width, drag.current.size.width + (ev.clientX - drag.current.x) / scale)
      const h = Math.max(minSize.height, drag.current.size.height + (ev.clientY - drag.current.y) / scale)
      drag.current = null
      onResize?.(id, { width: Math.round(w), height: Math.round(h) })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== frameRef.current || !e.shiftKey || !canEdit || !onResize) return
    const steps: Record<string, [number, number]> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }
    const step = steps[e.key]
    if (!step) return
    e.preventDefault()
    e.stopPropagation()
    // Inline sides mirror in right-to-left canvases.
    const inline = getComputedStyle(frameRef.current).direction === 'rtl' ? -step[0] : step[0]
    onResize(id, {
      width: Math.max(minSize.width, size.width + inline * GROUP_RESIZE_STEP),
      height: Math.max(minSize.height, size.height + step[1] * GROUP_RESIZE_STEP),
    })
  }

  return (
    <div
      ref={frameRef}
      className="ty-group-node"
      role="group"
      aria-label={name}
      aria-describedby={countId}
      tabIndex={0}
      data-ty-node-focus=""
      data-tone={safeTone}
      data-selected={selected ? 'true' : 'false'}
      data-locked={locked ? 'true' : 'false'}
      data-run-state={run.runState}
      style={{ inlineSize: size.width, blockSize: size.height }}
      onKeyDown={onKeyDown}
    >
      <span id={countId} className="ty-visually-hidden">
        {[members, run.words].filter(Boolean).join(', ')}
      </span>
      <header className="ty-group-node__header" onDoubleClick={onConfigure && canEdit ? () => onConfigure(id) : undefined}>
        <span className="ty-group-node__icon" aria-hidden="true">
          <Group focusable="false" />
        </span>
        <span className="ty-group-node__titles">
          <span className="ty-group-node__name" title={name}>
            {name}
          </span>
          {description ? <span className="ty-group-node__description">{description}</span> : null}
        </span>
        <span className="ty-group-node__controls">
          {toggle}
          {controls}
        </span>
      </header>
      <div className="ty-group-node__members" aria-hidden="true" />
      <ConnectionPorts nodeId={id} nodeLabel={name} inputs={k.inputs} outputs={k.outputs} tone={safeTone} preview={preview} />
      <NodeRunIndicator nodeId={id} kind="group" nodeLabel={name} />
      {selected && canEdit && onResize ? <span className="ty-group-node__resize" data-ty-no-drag="" aria-hidden="true" title={fill(l.resize, { name })} onPointerDown={onHandleDown} /> : null}
    </div>
  )
}
