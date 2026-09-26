import { Inbox, SearchX, WifiOff } from 'lucide-react'
import { useId } from 'react'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import type { IconComponent } from '../../internal/types'
import { Button, type ButtonVariant } from '../button/Button'

export type EmptyStateReason = 'no-data' | 'no-results' | 'offline' | 'custom'
export type EmptyStateFraming = 'inline' | 'section' | 'page'

export interface EmptyStateAction {
  label: string
  onPress: () => void
  /** Defaults to `primary` for the main action; use `secondary` when the view already has a primary. */
  variant?: ButtonVariant
}

export interface EmptyStateProps {
  reason?: EmptyStateReason
  title?: string
  description?: string
  icon?: IconComponent
  action?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  /** Adds the "Clear filters" action for `no-results`. */
  onClearFilters?: () => void
  /** Adds the retry action for `offline`. */
  onRetry?: () => void
  framing?: EmptyStateFraming
  headingLevel?: 2 | 3 | 4
  /** Wrap the title in a polite status (when it replaces content after a user action). */
  announce?: boolean
  className?: string
}

const icons: Record<Exclude<EmptyStateReason, 'custom'>, IconComponent> = {
  'no-data': Inbox,
  'no-results': SearchX,
  offline: WifiOff,
}

/** Explains that a region is empty and what to do next (spec: wave-1/empty-state.md). */
export function EmptyState({
  reason = 'no-data',
  title,
  description,
  icon,
  action,
  secondaryAction,
  onClearFilters,
  onRetry,
  framing = 'section',
  headingLevel = 3,
  announce = false,
  className,
}: EmptyStateProps) {
  const messages = useMessages()
  const titleId = useId()
  const copy = reason === 'custom' ? undefined : messages.empty[reason]
  const Icon = icon ?? (reason === 'custom' ? Inbox : icons[reason])
  const heading = title ?? copy?.title ?? ''
  const text = description ?? copy?.description

  let secondary = secondaryAction
  if (!secondary && reason === 'no-results' && onClearFilters) {
    secondary = { label: messages.empty.clearFilters, onPress: onClearFilters }
  }
  if (!secondary && reason === 'offline' && onRetry) {
    secondary = { label: messages.empty.retry, onPress: onRetry }
  }

  const H = `h${headingLevel}` as 'h2' | 'h3' | 'h4'
  const titleNode = (
    <H id={titleId} className="fk-empty__title">
      {heading}
    </H>
  )

  return (
    <div
      className={cx('fk-empty', className)}
      data-framing={framing}
      role={framing === 'page' ? 'region' : undefined}
      aria-labelledby={framing === 'page' ? titleId : undefined}
    >
      <Icon className="fk-empty__icon" aria-hidden="true" focusable="false" />
      {announce ? <div role="status">{titleNode}</div> : titleNode}
      {text ? <p className="fk-empty__description">{text}</p> : null}
      {action || secondary ? (
        <div className="fk-empty__actions">
          {action ? (
            <Button variant={action.variant ?? 'primary'} onPress={() => action.onPress()}>
              {action.label}
            </Button>
          ) : null}
          {secondary ? (
            <Button variant={secondary.variant ?? 'secondary'} onPress={() => secondary.onPress()}>
              {secondary.label}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
