import { CircleAlert, CircleCheck, CircleHelp, CircleMinus, CircleX, Clock, LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { devWarning } from '../../internal/dev'
import type { Messages } from '../../internal/messages'
import { useMessages } from '../../internal/provider'

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export interface StatusDefinition {
  label: string
  tone: StatusTone
  icon?: ReactNode
  /** In-progress status: the icon rotates (static under reduced motion). */
  busy?: boolean
}

export type StatusMap = Record<string, StatusDefinition>

export interface StatusPillProps {
  status: string
  statusMap?: StatusMap
  tone?: StatusTone
  label?: string
  size?: 'small' | 'regular'
  /** Announce changes politely (off by default: tables of pills create no live regions). */
  announce?: boolean
  className?: string
}

/** Built-in map; labels come from the messages catalogue. */
export function builtInStatusMap(messages: Messages): StatusMap {
  const s = messages.status
  return {
    pending: { label: s.pending, tone: 'warning', icon: <Clock /> },
    approved: { label: s.approved, tone: 'success', icon: <CircleCheck /> },
    rejected: { label: s.rejected, tone: 'danger', icon: <CircleX /> },
    active: { label: s.active, tone: 'success', icon: <CircleCheck /> },
    inactive: { label: s.inactive, tone: 'neutral', icon: <CircleMinus /> },
    processing: { label: s.processing, tone: 'info', icon: <LoaderCircle />, busy: true },
    error: { label: s.error, tone: 'danger', icon: <CircleAlert /> },
    success: { label: s.success, tone: 'success', icon: <CircleCheck /> },
  }
}

/** Current state of an item with icon, word and semantic tone (spec: wave-1/status-pill.md). */
export function StatusPill({ status, statusMap, tone, label, size = 'regular', announce = false, className }: StatusPillProps) {
  const messages = useMessages()
  const map = statusMap ?? builtInStatusMap(messages)
  const entry = map[status]
  devWarning(!entry && !label, `StatusPill: unknown status "${status}"; showing it as a neutral pill.`)
  const def: StatusDefinition = entry ?? { label: status, tone: 'neutral', icon: <CircleHelp /> }
  const pill = (
    <span
      className={cx('ty-status', className)}
      data-tone={tone ?? def.tone}
      data-size={size}
      data-busy={def.busy || undefined}
      data-status={status}
    >
      <span className="ty-status__icon" aria-hidden="true">
        {def.icon ?? <CircleHelp />}
      </span>
      <span className="ty-status__label">{label ?? def.label}</span>
    </span>
  )
  if (!announce) return pill
  return (
    <span role="status" aria-live="polite" aria-atomic="true" className="ty-status-live">
      {pill}
    </span>
  )
}
