import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { devWarning } from '../../internal/dev'
import { useMessages } from '../../internal/provider'
import { ActorChip, type ActorKind } from '../actor-chip/ActorChip'
import { Button } from '../button/Button'
import { DeltaIndicator, type DeltaIndicatorProps } from '../delta-indicator/DeltaIndicator'
import { InlineNotice } from '../inline-notice/InlineNotice'
import { Link } from '../link/Link'
import { ProgressBar } from '../progress-bar/ProgressBar'
import { ProofBadge, type ProofState } from '../proof-badge/ProofBadge'

/** Who proposed: rendered with ActorChip (§2.11). */
export interface ActorRef {
  kind: ActorKind
  name: string
  agentKey?: string
  model?: string
  email?: string
}

export interface InsightMeasure {
  id: string
  label: string
  value: string
  /** 0 to 1: draws a determinate bar whose value text is `value`. */
  meter?: number
}

export interface InsightAction {
  id: string
  label: string
  icon?: ReactNode
  emphasis?: 'primary' | 'secondary' | 'quiet'
  tone?: 'neutral' | 'danger'
}

export interface InsightCardProps {
  actor: ActorRef
  title: string
  value: ReactNode
  delta?: DeltaIndicatorProps
  measures?: InsightMeasure[]
  actions?: InsightAction[]
  /** A returned promise keeps the card pending until it settles; a rejection shows its message. */
  onAction?: (id: string) => void | Promise<void>
  footnote?: { text: string; href?: string }
  /** Replaces the actions once the proposal is resolved. */
  outcome?: { text: string }
  proofState?: ProofState
  labels?: { actions?: string; pending?: string; failed?: string }
  className?: string
}

type Phase = { kind: 'idle' } | { kind: 'pending'; id: string } | { kind: 'failed'; message: string }

/** Keeps at most one primary button (§2.3): the first one asked for. */
function useButtonVariants(actions: InsightAction[]) {
  let primaryTaken = false
  let demoted = false
  const out = actions.map((a) => {
    if (a.tone === 'danger') return 'danger' as const
    if (a.emphasis === 'primary') {
      if (primaryTaken) {
        demoted = true
        return 'secondary' as const
      }
      primaryTaken = true
      return 'primary' as const
    }
    return a.emphasis ?? 'secondary'
  })
  devWarning(demoted, 'InsightCard: only one action may use the primary emphasis; later ones were shown as secondary.')
  return out
}

function Measures({ items }: { items: InsightMeasure[] }) {
  return (
    <dl className="ty-insight-card__measures">
      {items.map((it) => (
        <div key={it.id} className="ty-insight-card__measure">
          <dt>{it.label}</dt>
          <dd>{it.value}</dd>
          {typeof it.meter === 'number' ? (
            <dd className="ty-insight-card__meter">
              <ProgressBar aria-label={it.label} value={it.meter * 100} valueLabel={it.value} showValue={false} size="thin" />
            </dd>
          ) : null}
        </div>
      ))}
    </dl>
  )
}

/** A proposed value by an agent or rule, with its measures and actions (spec: wave-4/insight-card.md). */
export function InsightCard(props: InsightCardProps) {
  const all = useMessages()
  const m = all.insight
  const kindWord = all.actor[props.actor.kind === 'user' ? 'person' : props.actor.kind]
  const titleId = useId()
  const byId = useId()
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const outcomeRef = useRef<HTMLParagraphElement>(null)
  const actions = props.actions ?? []
  const variantsFor = useButtonVariants(actions)
  const alive = useRef(true)
  useEffect(
    () => () => {
      alive.current = false
    },
    [],
  )

  useEffect(() => {
    if (props.outcome) outcomeRef.current?.focus()
  }, [props.outcome?.text])

  const trigger = (id: string) => {
    const result = props.onAction?.(id)
    if (!result || typeof (result as Promise<void>).then !== 'function') return
    setPhase({ kind: 'pending', id })
    ;(result as Promise<void>).then(
      () => alive.current && setPhase({ kind: 'idle' }),
      (err: unknown) =>
        alive.current &&
        setPhase({ kind: 'failed', message: err instanceof Error && err.message ? err.message : (props.labels?.failed ?? m.failed) }),
    )
  }

  const pendingId = phase.kind === 'pending' ? phase.id : null

  return (
    <article className={cx('ty-insight-card', props.className)} aria-labelledby={titleId} aria-describedby={byId} data-phase={phase.kind}>
      <header className="ty-insight-card__head">
        <span className="ty-insight-card__by">
          <span id={byId} className="ty-visually-hidden">{`${m.proposedBy} ${props.actor.name}, ${kindWord}`}</span>
          <ActorChip kind={props.actor.kind} name={props.actor.name} agentKey={props.actor.agentKey} model={props.actor.model} email={props.actor.email} compact />
        </span>
        {props.proofState ? <ProofBadge state={props.proofState} /> : null}
      </header>
      <h3 id={titleId} className="ty-insight-card__title">
        {props.title}
      </h3>
      <p className="ty-insight-card__value">
        <span className="ty-insight-card__figure">{props.value}</span>
        {props.delta ? <DeltaIndicator {...props.delta} /> : null}
      </p>
      {props.measures?.length ? <Measures items={props.measures} /> : null}

      {phase.kind === 'failed' ? (
        <InlineNotice tone="danger" urgency="assertive">
          {phase.message}
        </InlineNotice>
      ) : null}

      {props.outcome ? (
        <p ref={outcomeRef} tabIndex={-1} role="status" className="ty-insight-card__outcome">
          {props.outcome.text}
        </p>
      ) : actions.length ? (
        <div role="group" aria-label={props.labels?.actions ?? m.actions} className="ty-insight-card__actions">
          {actions.map((a, i) => (
            <Button
              key={a.id}
              variant={variantsFor[i]}
              leadingIcon={a.icon}
              disabled={pendingId !== null && pendingId !== a.id}
              busy={pendingId === a.id}
              busyLabel={props.labels?.pending ?? m.pending}
              onPress={() => trigger(a.id)}
            >
              {a.label}
            </Button>
          ))}
        </div>
      ) : null}

      {props.footnote ? (
        <p className="ty-insight-card__footnote">
          {props.footnote.href ? <Link href={props.footnote.href}>{props.footnote.text}</Link> : props.footnote.text}
        </p>
      ) : null}
    </article>
  )
}
