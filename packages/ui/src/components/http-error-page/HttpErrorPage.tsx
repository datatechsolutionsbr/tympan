import { FileQuestion, ServerCrash, TriangleAlert } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import type { HttpErrorKind } from '../../internal/messages/auth-brand'
import { useMessages } from '../../internal/provider'

export type { HttpErrorKind }

const KINDS: Record<HttpErrorKind, { code: number; Icon: typeof FileQuestion }> = {
  'not-found': { code: 404, Icon: FileQuestion },
  'bad-request': { code: 400, Icon: TriangleAlert },
  'server-error': { code: 500, Icon: ServerCrash },
}

export interface HttpErrorPageProps {
  kind: HttpErrorKind
  /** Exact code for 5xx variants (502, 503 …); the kind's code otherwise. */
  code?: number
  title?: string
  message?: string
  action?: ReactNode
  /** problem+json `type`, shown as monospace metadata. */
  problemType?: string
  /** Moves focus to the heading on mount (client-side navigation). */
  focusHeading?: boolean
  className?: string
}

/** Whole-page 404, 400 and 5xx states (spec: wave-2/http-error-page.md). */
export function HttpErrorPage({ kind, code, title, message, action, problemType, focusHeading = true, className }: HttpErrorPageProps) {
  const copy = useMessages().httpError
  const heading = useRef<HTMLHeadingElement>(null)
  const { code: kindCode, Icon } = KINDS[kind]
  const shownCode = code ?? kindCode

  useEffect(() => {
    if (focusHeading) heading.current?.focus()
  }, [focusHeading])

  return (
    <main className={className ? `fk-http-error ${className}` : 'fk-http-error'} data-kind={kind}>
      <div className="fk-http-error__column">
        <Icon className="fk-http-error__icon" aria-hidden="true" focusable="false" />
        <p className="fk-http-error__code" aria-hidden="true">
          {shownCode}
        </p>
        <h1 ref={heading} tabIndex={-1} className="fk-http-error__title">
          <span className="fk-visually-hidden">{copy.codeLabel(shownCode)}: </span>
          {title ?? copy[kind].title}
        </h1>
        <p className="fk-http-error__message">{message ?? copy[kind].message}</p>
        {problemType ? (
          <p className="fk-http-error__problem">
            <span className="fk-visually-hidden">{copy.problemType}: </span>
            <code>{problemType}</code>
          </p>
        ) : null}
        {action ? <div className="fk-http-error__actions">{action}</div> : null}
      </div>
    </main>
  )
}
