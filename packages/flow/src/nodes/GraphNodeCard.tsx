// GraphNodeCard: the shell every node is drawn with (workflow kinds and the
// provenance graph). One primary control (the title button, stretched over the
// card) opens or selects the node; delete and other actions are sibling
// buttons, never nested inside it.

import { isValidElement, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Button as AriaButton, Input, TextField as AriaTextField, Label } from 'react-aria-components'
import { TriangleAlert, Trash2 } from 'lucide-react'
import { Button, type IconComponent } from '@datatechsolutions/tympan'
import { nodeStateAttributes, type NodeProofState, type NodeRunState } from '../catalog/nodeState'
import type { ToneName } from '../catalog/palette'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { useSurface } from '../surface/SurfaceContext'

export type CardWidth = 'narrow' | 'standard' | 'wide'
export type CardDensity = 'detailed' | 'compact'

/** Card widths in canvas units (multiples of the 4 px scale of §2.1). */
export const CARD_WIDTHS: Readonly<Record<CardWidth, number>> = Object.freeze({ narrow: 208, standard: 256, wide: 304 })

/** Height a card is laid out with before it is measured. */
export function estimatedCardHeight(density: CardDensity, hasMeta = true): number {
  return density === 'compact' ? 60 : hasMeta ? 104 : 76
}

export interface GraphNodeCardLabels {
  /** Accessible name pattern of the card's main control. */
  name: string
  rename: string
  renameField: string
  remove: string
  problem: string
  selected: string
  locked: string
  dimmed: string
  running: string
  succeeded: string
  failed: string
  skipped: string
}

export const graphNodeCardLabels = defineLabels<GraphNodeCardLabels>('GraphNodeCard', {
  en: {
    name: '{kind}: {title}',
    rename: 'Rename {title}',
    renameField: 'Name of {title}',
    remove: 'Remove {title}',
    problem: 'Needs attention',
    selected: 'selected',
    locked: 'read only',
    dimmed: 'not run',
    running: 'running',
    succeeded: 'succeeded',
    failed: 'failed',
    skipped: 'skipped',
  },
  'pt-BR': {
    name: '{kind}: {title}',
    rename: 'Renomear {title}',
    renameField: 'Nome de {title}',
    remove: 'Remover {title}',
    problem: 'Precisa de atenção',
    selected: 'selecionado',
    locked: 'somente leitura',
    dimmed: 'não executado',
    running: 'em execução',
    succeeded: 'concluído',
    failed: 'falhou',
    skipped: 'ignorado',
  },
  es: {
    name: '{kind}: {title}',
    rename: 'Cambiar el nombre de {title}',
    renameField: 'Nombre de {title}',
    remove: 'Quitar {title}',
    problem: 'Requiere atención',
    selected: 'seleccionado',
    locked: 'solo lectura',
    dimmed: 'no ejecutado',
    running: 'en ejecución',
    succeeded: 'completado',
    failed: 'falló',
    skipped: 'omitido',
  },
})

export const defaultGraphNodeCardLabels: GraphNodeCardLabels = graphNodeCardLabels.bundles.en

export interface GraphNodeCardProps {
  /** Kind key (tone, test hooks). */
  kind: string
  /** Spoken kind name (catalog label or category); defaults to the kind key. */
  kindLabel?: string
  title: string
  description?: string
  icon?: IconComponent | ReactNode
  tone?: ToneName
  width?: CardWidth
  density?: CardDensity
  selected?: boolean
  /** Missing or not configured: dashed border, warning icon and this text (or the default word). */
  problem?: boolean | string
  runState?: NodeRunState
  locked?: boolean
  dimmed?: boolean
  /** Provenance proof state: border line style per §2.11. */
  proofState?: NodeProofState | null
  /** When set, the card is a button (opens configuration or selects). */
  onActivate?: () => void
  /** Enables in-place rename (double-click or F2). */
  onRename?: (title: string) => void
  /** Shows the delete action. */
  onDelete?: () => void
  /** Content under the header (badges, counts); hidden in compact density. */
  meta?: ReactNode
  /** Small items next to the title (kind badge, dialect). */
  badges?: ReactNode
  /** Extra header actions (sibling buttons). */
  headerActions?: ReactNode
  /** Words added to the accessible description (run state detail, proof word …). */
  stateWords?: string[]
  /** Overrides the composed accessible name. */
  accessibleName?: string
  /** Ports, run indicator, hover toolbar: drawn inside the card, outside the main control. */
  children?: ReactNode
  labels?: Partial<GraphNodeCardLabels>
  className?: string
  /** Keys pressed on the main control (the host adds node shortcuts). */
  onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void
}

function renderIcon(icon: GraphNodeCardProps['icon']) {
  if (!icon) return null
  if (isValidElement(icon)) return icon
  if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && '$$typeof' in icon)) {
    const Icon = icon as IconComponent
    return <Icon aria-hidden="true" focusable="false" />
  }
  return icon as ReactNode
}

export function GraphNodeCard(props: GraphNodeCardProps) {
  const {
    kind,
    kindLabel,
    title,
    description,
    icon,
    tone = 'neutral',
    width = 'standard',
    density = 'detailed',
    selected = false,
    problem = false,
    runState = 'idle',
    locked = false,
    dimmed = false,
    proofState,
    onActivate,
    onRename,
    onDelete,
    meta,
    badges,
    headerActions,
    stateWords = [],
    accessibleName,
    children,
    className,
    onKeyDown,
  } = props
  const l = useLabels(graphNodeCardLabels, props.labels)
  const { locale } = useFlowLocale()
  const surface = useSurface()
  const stateId = useId()
  const problemId = useId()
  const activatorRef = useRef<HTMLButtonElement>(null)
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState(title)
  const canRename = !!onRename && !locked

  const name = accessibleName ?? fill(l.name, { kind: kindLabel ?? kind, title }, locale)
  const words = [
    ...(selected ? [l.selected] : []),
    ...(runState !== 'idle' ? [l[runState]] : []),
    ...(locked ? [l.locked] : []),
    ...(dimmed ? [l.dimmed] : []),
    ...stateWords,
  ]

  const startRename = () => {
    if (!canRename) return
    setDraft(title)
    setRenaming(true)
  }
  const finishRename = (commit: boolean) => {
    const value = draft.trim()
    setRenaming(false)
    if (commit && value && value !== title) onRename?.(value)
    requestAnimationFrame(() => activatorRef.current?.focus())
  }

  const onActivatorKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'F2' && canRename) {
      e.preventDefault()
      startRename()
      return
    }
    onKeyDown?.(e)
  }

  const titleNode = renaming ? (
    <AriaTextField className="ty-node-card__rename" value={draft} onChange={setDraft} autoFocus aria-label={fill(l.renameField, { title }, locale)}>
      <Label className="ty-visually-hidden">{fill(l.renameField, { title }, locale)}</Label>
      <Input
        className="ty-node-card__rename-input"
        data-ty-no-drag=""
        onBlur={() => finishRename(true)}
        onKeyDown={(e) => {
          // Keys typed while renaming never reach canvas shortcuts.
          e.stopPropagation()
          if (e.key === 'Enter') {
            e.preventDefault()
            finishRename(true)
          } else if (e.key === 'Escape') {
            e.preventDefault()
            finishRename(false)
          }
        }}
      />
    </AriaTextField>
  ) : onActivate ? (
    <AriaButton
      ref={activatorRef}
      className="ty-node-card__activator"
      aria-label={name}
      aria-describedby={[words.length ? stateId : null, problem ? problemId : null].filter(Boolean).join(' ') || undefined}
      data-ty-node-focus=""
      onPress={() => {
        if (surface.justDragged()) return
        onActivate()
      }}
      onKeyDown={onActivatorKeyDown}
    >
      <span className="ty-node-card__title" title={title}>
        {title}
      </span>
    </AriaButton>
  ) : (
    <span className="ty-node-card__title" title={title}>
      {title}
    </span>
  )

  const root = {
    className: ['ty-node-card', className].filter(Boolean).join(' '),
    'data-kind': kind,
    'data-tone': tone,
    'data-width': width,
    'data-density': density,
    'data-problem': problem ? 'true' : 'false',
    'data-interactive': onActivate ? 'true' : 'false',
    ...nodeStateAttributes({ selected, runState, locked, dimmed, ...(proofState !== undefined ? { proofState } : {}) }),
    ...(surface.connectTarget && surface.connecting ? { 'data-connect-target': surface.connectTarget.valid ? 'valid' : 'invalid' } : {}),
  }

  const groupProps = onActivate
    ? {}
    : {
        role: 'group' as const,
        'aria-label': name,
        tabIndex: 0,
        'data-ty-node-focus': '',
        ...(words.length ? { 'aria-describedby': stateId } : {}),
        onKeyDown: onActivatorKeyDown,
      }

  return (
    <div {...root} {...groupProps}>
      <div className="ty-node-card__header">
        <span className="ty-node-card__bubble" data-tone={tone} aria-hidden="true">
          {renderIcon(icon)}
        </span>
        <div className="ty-node-card__titles" onDoubleClick={canRename && !renaming ? startRename : undefined}>
          {titleNode}
          {description && density === 'detailed' ? <span className="ty-node-card__description">{description}</span> : null}
        </div>
        {badges ? <div className="ty-node-card__badges">{badges}</div> : null}
        {headerActions || onDelete ? (
          <div className="ty-node-card__actions">
            {headerActions}
            {onDelete && !locked ? (
              <Button className="ty-node-card__delete" variant="quiet" size="compact" shape="circle" iconOnly accessibleLabel={fill(l.remove, { title }, locale)} leadingIcon={<Trash2 />} onPress={onDelete} />
            ) : null}
          </div>
        ) : null}
      </div>
      {problem ? (
        <p className="ty-node-card__problem" id={problemId}>
          <TriangleAlert aria-hidden="true" focusable="false" />
          <span>{typeof problem === 'string' ? problem : l.problem}</span>
        </p>
      ) : null}
      {meta && density === 'detailed' ? <div className="ty-node-card__meta">{meta}</div> : null}
      {words.length ? (
        <span id={stateId} className="ty-visually-hidden">
          {words.join(', ')}
        </span>
      ) : null}
      {children}
    </div>
  )
}

/** Small label in the header or meta row: neutral, or in the kind's tone. */
export function NodeBadge({ tone = 'neutral', icon, children }: { tone?: ToneName | 'neutral'; icon?: ReactNode; children: ReactNode }) {
  return (
    <span className="ty-node-badge" data-tone={tone}>
      {icon ? (
        <span className="ty-node-badge__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  )
}
