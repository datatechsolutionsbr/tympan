import { BadgeCheck, CircleDashed, CircleX, Hourglass, Minus } from 'lucide-react'
import type { ReactNode } from 'react'
import { Focusable, Tooltip, TooltipTrigger } from 'react-aria-components'
import { cx } from '../../internal/cx'
import type { ProofStateKey } from '../../internal/messages'
import { useMessages } from '../../internal/provider'
import type { IconComponent } from '../../internal/types'

/** Proof states of the contract, plus `none` ("no proof"). */
export type ProofState = 'proved' | 'pending' | 'refuted' | 'not_disclosed'
export type ProofBadgeSize = 'inline' | 'compact' | 'block'

export interface ProofBadgeProps {
  /** Contract state; `null`/`undefined` renders the "no proof" state. */
  state?: ProofState | null
  /** inline: icon + word pill; compact: icon only (word for AT and tooltip); block: evidence-panel strip. */
  size?: ProofBadgeSize
  /** Overrides the state word. */
  label?: string
  /** Short visible detail after the word or icon, such as "4/6". */
  detail?: string
  /** Compact only: makes the badge focusable and shows the word in a tooltip. */
  interactive?: boolean
  /** Block only: who proved it (a name, or an ActorChip). */
  provedBy?: ReactNode
  /** Block only: when (host-formatted date). */
  at?: ReactNode
  /** Block only: verifier rule, shown in mono. */
  rule?: string
  className?: string
}

const ICONS: Record<ProofStateKey, IconComponent> = {
  proved: BadgeCheck,
  pending: Hourglass,
  refuted: CircleX,
  not_disclosed: CircleDashed,
  none: Minus,
}

/** The shared proof-state language of design direction §2.11: icon, word and border style, never colour alone. */
export function ProofBadge({ state, size = 'inline', label, detail, interactive = false, provedBy, at, rule, className }: ProofBadgeProps) {
  const messages = useMessages()
  const key: ProofStateKey = state ?? 'none'
  const word = label ?? messages.proof[key]
  const Icon = ICONS[key]
  const common = {
    className: cx('fk-proof-badge', className),
    'data-state': key.replace('_', '-'),
    'data-size': size,
  }

  if (size === 'block') {
    return (
      <div {...common}>
        <div className="fk-proof-badge__head">
          <Icon className="fk-proof-badge__icon" aria-hidden="true" focusable="false" />
          <span className="fk-proof-badge__word">{word}</span>
          {detail ? <span className="fk-proof-badge__detail">{detail}</span> : null}
        </div>
        {provedBy != null || at != null || rule ? (
          <p className="fk-proof-badge__meta">
            {provedBy != null ? (
              <span className="fk-proof-badge__by">{typeof provedBy === 'string' ? messages.proof.provedBy(provedBy) : provedBy}</span>
            ) : null}
            {at != null ? <span className="fk-proof-badge__at">{at}</span> : null}
            {rule ? <code className="fk-proof-badge__rule">{messages.proof.rule(rule)}</code> : null}
          </p>
        ) : null}
      </div>
    )
  }

  if (size === 'compact') {
    const glyph = <Icon className="fk-proof-badge__icon" aria-hidden="true" focusable="false" />
    const tail = detail ? (
      <span className="fk-proof-badge__detail" aria-hidden={interactive ? true : undefined}>
        {detail}
      </span>
    ) : null
    if (interactive) {
      const name = detail ? `${word}, ${detail}` : word
      return (
        <TooltipTrigger delay={300}>
          <Focusable>
            <span {...common} role="img" aria-label={name} tabIndex={0} data-interactive="true">
              {glyph}
              {tail}
            </span>
          </Focusable>
          <Tooltip className="fk-proof-badge__tooltip" offset={6}>
            {word}
          </Tooltip>
        </TooltipTrigger>
      )
    }
    return (
      <span {...common} title={word}>
        {glyph}
        <span className="fk-visually-hidden">{word}</span>
        {tail}
      </span>
    )
  }

  return (
    <span {...common}>
      <Icon className="fk-proof-badge__icon" aria-hidden="true" focusable="false" />
      <span className="fk-proof-badge__word">{word}</span>
      {detail ? <span className="fk-proof-badge__detail">{detail}</span> : null}
    </span>
  )
}
