import { CircleCheck, CircleX, Hourglass } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Button as AriaButton } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import type { IconComponent } from '../../internal/types'
import { ActorChip } from '../actor-chip/ActorChip'

export type AgentOutcome = 'completed' | 'failed' | 'pending'

export interface AgentOutputCardProps {
  agentName: string
  /** Machine key, shown in mono. */
  agentKey?: string
  /**
   * Accepted for hosts that keep agent pictures; design direction §2.11 draws
   * every agent as the square bot mark, so the picture is not shown.
   */
  avatarUrl?: string
  /** Human-readable duration, formatted by the host. */
  duration: string
  outcome?: AgentOutcome
  output: string
  /** Clamp of the excerpt; the full text is reached through `onOpen`. */
  maxLines?: number
  onOpen?: () => void
  className?: string
}

const OUTCOME_ICON: Record<AgentOutcome, IconComponent> = {
  completed: CircleCheck,
  failed: CircleX,
  pending: Hourglass,
}

function OutcomeMark({ outcome }: { outcome: AgentOutcome }) {
  const word = useMessages().agentOutput.outcome[outcome]
  const Icon = OUTCOME_ICON[outcome]
  return (
    <span className="ty-agent-output__outcome" data-outcome={outcome}>
      <Icon aria-hidden="true" focusable="false" />
      {word}
    </span>
  )
}

/** What one agent produced in a run (spec: wave-2/agent-output-card.md). */
export function AgentOutputCard(props: AgentOutputCardProps) {
  const m = useMessages().agentOutput
  const outcome = props.outcome ?? 'completed'
  const chip = <ActorChip kind="agent" name={props.agentName} agentKey={props.agentKey} compact={!props.agentKey} />
  const clamp = { '--ty-agent-output-lines': String(props.maxLines ?? 4) } as CSSProperties

  return (
    <article className={cx('ty-agent-output', props.className)} aria-label={props.agentName} data-interactive={props.onOpen ? '' : undefined}>
      <header className="ty-agent-output__head">
        {props.onOpen ? (
          <AriaButton className="ty-agent-output__open" onPress={props.onOpen}>
            {chip}
          </AriaButton>
        ) : (
          chip
        )}
        <span className="ty-agent-output__meta">
          <span className="ty-agent-output__duration">{m.duration(props.duration)}</span>
          <OutcomeMark outcome={outcome} />
        </span>
      </header>
      <p className="ty-agent-output__excerpt" style={clamp} title={props.onOpen ? undefined : props.output}>
        {props.output}
      </p>
    </article>
  )
}
