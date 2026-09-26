import { ChevronDown, CircleAlert, FileQuestion, GitMerge, Lock, ServerCrash, WifiOff } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Disclosure, DisclosurePanel } from 'react-aria-components'
import { cx } from '../../internal/cx'
import type { ErrorKind } from '../../internal/messages'
import { useMessages } from '../../internal/provider'
import type { IconComponent } from '../../internal/types'
import { Button } from '../button/Button'

export type ErrorStateKind = ErrorKind

export interface ErrorStateProps {
  kind?: ErrorStateKind
  title?: string
  message?: string
  /** HTTP status shown as small metadata. */
  statusCode?: number
  /** problem+json `type`, shown in mono meta text. */
  problemType?: string
  /** Technical details inside a disclosure. */
  details?: string
  /** Shows "Try again"; while a returned promise is pending the button is busy. */
  onRetry?: () => void | Promise<void>
  secondaryAction?: { label: string; onPress?: () => void; href?: string }
  /** `page` fills the sheet; `block` replaces only the failed part. */
  scope?: 'page' | 'block'
  /**
   * The error appeared after the content was already shown: announce it with
   * `role="alert"`. When false (first render) the page-scope title takes focus instead.
   */
  appearedAfterLoad?: boolean
  headingLevel?: 2 | 3 | 4
  labels?: { retry?: string; details?: string }
  className?: string
}

const icons: Record<ErrorStateKind, IconComponent> = {
  generic: CircleAlert,
  network: WifiOff,
  server: ServerCrash,
  permission: Lock,
  'not-found': FileQuestion,
  conflict: GitMerge,
}

/** Plain-language failure with retry and a way back (spec: wave-1/error-state.md). */
export function ErrorState({
  kind = 'generic',
  title,
  message,
  statusCode,
  problemType,
  details,
  onRetry,
  secondaryAction,
  scope = 'page',
  appearedAfterLoad = false,
  headingLevel,
  labels,
  className,
}: ErrorStateProps) {
  const messages = useMessages()
  const copy = messages.error[kind]
  const titleId = useId()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [retrying, setRetrying] = useState(false)
  const mounted = useRef(true)
  const Icon = icons[kind]
  const level = headingLevel ?? (scope === 'page' ? 2 : 3)
  const H = `h${level}` as 'h2' | 'h3' | 'h4'

  useEffect(() => {
    mounted.current = true
    if (scope === 'page' && !appearedAfterLoad) titleRef.current?.focus()
    return () => {
      mounted.current = false
    }
    // Focus only on first render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const retry = () => {
    if (!onRetry || retrying) return
    const result = onRetry()
    if (result && typeof (result as Promise<void>).then === 'function') {
      setRetrying(true)
      ;(result as Promise<void>).then(
        () => mounted.current && setRetrying(false),
        () => mounted.current && setRetrying(false),
      )
    }
  }

  return (
    <div
      className={cx('fk-error', className)}
      data-scope={scope}
      data-kind={kind}
      role={appearedAfterLoad ? 'alert' : scope === 'block' ? 'region' : undefined}
      aria-labelledby={!appearedAfterLoad && scope === 'block' ? titleId : undefined}
    >
      <Icon className="fk-error__icon" aria-hidden="true" focusable="false" />
      <H id={titleId} ref={titleRef} tabIndex={-1} className="fk-error__title">
        {title ?? copy.title}
      </H>
      <p className="fk-error__message">{message ?? copy.message}</p>
      {statusCode !== undefined || problemType ? (
        <p className="fk-error__meta">
          {statusCode !== undefined ? <span>{messages.error.statusCode(statusCode)}</span> : null}
          {problemType ? <code className="fk-error__type">{problemType}</code> : null}
        </p>
      ) : null}
      {details ? (
        <Disclosure className="fk-error__details">
          <Button slot="trigger" variant="quiet" size="compact" trailingIcon={<ChevronDown className="fk-error__chevron" />}>
            {labels?.details ?? messages.error.details}
          </Button>
          <DisclosurePanel className="fk-error__details-panel">
            <pre className="fk-error__details-text">{details}</pre>
          </DisclosurePanel>
        </Disclosure>
      ) : null}
      {onRetry || secondaryAction ? (
        <div className="fk-error__actions">
          {onRetry ? (
            <Button
              variant="secondary"
              busy={retrying}
              disabled={retrying}
              focusableWhenDisabled
              onPress={retry}
            >
              {labels?.retry ?? messages.error.retry}
            </Button>
          ) : null}
          {secondaryAction ? (
            <Button variant="quiet" href={secondaryAction.href} onPress={() => secondaryAction.onPress?.()}>
              {secondaryAction.label}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
