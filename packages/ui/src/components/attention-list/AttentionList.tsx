import type { ReactNode } from 'react'
import { Link as AriaLink } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import { VisuallyHidden } from '../../internal/VisuallyHidden'
import { Button } from '../button/Button'
import { ProofBadge, type ProofState } from '../proof-badge/ProofBadge'

export interface AttentionAction {
  label: string
  href?: string
  onPress?: () => void
}

export interface AttentionItem {
  id: string
  proof: ProofState | 'none'
  title: string
  detail?: string
  action?: AttentionAction
}

export interface AttentionListProps {
  items: AttentionItem[]
  /** Name of the list. */
  label: string
  /** Visible heading above the list. */
  heading?: ReactNode
  emptyText?: string
  maxRows?: number
  seeAllHref?: string
  seeAllLabel?: string
  className?: string
}

function RowAction({ action, title, suffix }: { action: AttentionAction; title: string; suffix: (title: string) => string }) {
  // Visible label stays short; the hidden suffix makes the name unique ("Verify: TAMM").
  const label = (
    <>
      {action.label}
      <VisuallyHidden>{suffix(title)}</VisuallyHidden>
    </>
  )
  return (
    <Button variant="quiet" size="compact" href={action.href} onPress={action.onPress} className="fk-attention__action">
      {label}
    </Button>
  )
}

/** What needs the person now: proof state, title, detail, one action (spec: wave-4/attention-list.md). */
export function AttentionList(props: AttentionListProps) {
  const words = useMessages().attentionList
  const rows = props.maxRows !== undefined ? props.items.slice(0, props.maxRows) : props.items
  const truncated = rows.length < props.items.length
  return (
    <div className={cx('fk-attention', props.className)}>
      {props.heading ? <div className="fk-attention__heading">{props.heading}</div> : null}
      {rows.length === 0 ? (
        <p className="fk-attention__empty">{props.emptyText ?? words.empty}</p>
      ) : (
        <ul className="fk-attention__list" aria-label={props.label}>
          {rows.map((row) => (
            <li key={row.id} className="fk-attention__row">
              <ProofBadge state={row.proof === 'none' ? null : row.proof} className="fk-attention__proof" />
              <div className="fk-attention__text">
                <span className="fk-attention__title" dir="auto">{row.title}</span>
                {row.detail ? <span className="fk-attention__detail" dir="auto">{row.detail}</span> : null}
              </div>
              {row.action ? <RowAction action={row.action} title={row.title} suffix={words.actionTarget} /> : null}
            </li>
          ))}
        </ul>
      )}
      {props.seeAllHref && (truncated || props.maxRows === undefined) ? (
        <AriaLink className="fk-attention__more" href={props.seeAllHref}>
          {props.seeAllLabel ?? words.seeAll}
        </AriaLink>
      ) : null}
    </div>
  )
}
