import { Server, User } from 'lucide-react'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import { Avatar } from '../avatar/Avatar'

/** Contract actor kinds (`user | agent | system`); `person` is accepted as an alias of `user`. */
export type ActorKind = 'user' | 'person' | 'agent' | 'system'

export interface ActorChipProps {
  kind: ActorKind
  /** Person name, agent name, or the rule/job name of a system actor. */
  name: string
  /** Person only: e-mail shown as meta. */
  email?: string
  /** Person only: avatar image. */
  avatarSrc?: string | null
  /** Person only: initials; derived from `name` when omitted. */
  initials?: string
  /** Person only: false shows the person icon instead of an avatar (lists without avatars). */
  avatar?: boolean
  /** Agent only: key identifier, shown in mono. */
  agentKey?: string
  /** Agent only: model, shown in mono. */
  model?: string
  /** Name and kind only: no e-mail, key or model. */
  compact?: boolean
  className?: string
}

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  const first = words[0]!.charAt(0)
  const last = words.length > 1 ? words[words.length - 1]!.charAt(0) : ''
  return (first + last).toUpperCase()
}

/**
 * Who did something: a person, an agent or the system (design direction
 * §2.11). An agent is never round and never has initials; a person is never
 * identified primarily by a mono id. Place it before the date in activity rows.
 */
export function ActorChip({ kind, name, email, avatarSrc, initials, avatar = true, agentKey, model, compact = false, className }: ActorChipProps) {
  const messages = useMessages()
  const k = kind === 'user' ? 'person' : kind

  if (k === 'agent') {
    const meta = [agentKey, model].filter(Boolean)
    return (
      <span className={cx('fk-actor-chip', className)} data-kind="agent" data-compact={compact || undefined}>
        <Avatar actorKind="agent" decorative size={compact ? 'xsmall' : 'small'} />
        <span className="fk-actor-chip__text">
          <span className="fk-actor-chip__line">
            <span className="fk-actor-chip__name">{name}</span>
            <span className="fk-actor-chip__kind">{messages.actor.agent}</span>
          </span>
          {!compact && meta.length > 0 ? (
            <span className="fk-actor-chip__meta">
              {meta.map((m) => (
                <code key={m} className="fk-actor-chip__mono">
                  {m}
                </code>
              ))}
            </span>
          ) : null}
        </span>
      </span>
    )
  }

  if (k === 'system') {
    return (
      <span className={cx('fk-actor-chip', className)} data-kind="system" data-compact={compact || undefined}>
        <Server className="fk-actor-chip__icon" aria-hidden="true" focusable="false" />
        <span className="fk-actor-chip__text">
          <span className="fk-actor-chip__line">
            <span className="fk-actor-chip__kind">{messages.actor.system}</span>
            <code className="fk-actor-chip__mono fk-actor-chip__rule">{name}</code>
          </span>
        </span>
      </span>
    )
  }

  return (
    <span className={cx('fk-actor-chip', className)} data-kind="person" data-compact={compact || undefined}>
      {avatar ? (
        <Avatar decorative src={avatarSrc ?? null} fallbackText={initials ?? initialsOf(name)} size={compact ? 'xsmall' : 'small'} />
      ) : (
        <User className="fk-actor-chip__icon" aria-hidden="true" focusable="false" />
      )}
      <span className="fk-actor-chip__text">
        <span className="fk-actor-chip__name">{name}</span>
        {!compact && email ? <span className="fk-actor-chip__meta">{email}</span> : null}
      </span>
    </span>
  )
}
