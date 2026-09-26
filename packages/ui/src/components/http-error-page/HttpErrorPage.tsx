import { FileQuestion, ServerCrash, TriangleAlert } from 'lucide-react'
import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { cx } from '../../internal/cx'
import type { HttpErrorKind } from '../../internal/messages/auth-brand'
import { useMessages } from '../../internal/provider'
import type { IconComponent } from '../../internal/types'

export type { HttpErrorKind }

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

/** Status family per kind: its default code and its glyph. */
const FAMILY: Record<HttpErrorKind, readonly [number, IconComponent]> = {
  'bad-request': [400, TriangleAlert],
  'not-found': [404, FileQuestion],
  'server-error': [500, ServerCrash],
}

/** After a client-side navigation, the page title takes focus so the change is announced. */
function useArrivalFocus(target: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    if (enabled) target.current?.focus()
  }, [target, enabled])
}

/** Whole-page 404, 400 and 5xx states (spec: wave-2/http-error-page.md). */
export function HttpErrorPage(props: HttpErrorPageProps) {
  const words = useMessages().httpError
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [familyCode, Glyph] = FAMILY[props.kind]
  const status = props.code ?? familyCode
  const fallback = words[props.kind]
  useArrivalFocus(titleRef, props.focusHeading ?? true)

  return (
    <main className={cx('ty-http-error', props.className)} data-kind={props.kind}>
      <div className="ty-http-error__column">
        <Glyph className="ty-http-error__icon" aria-hidden="true" focusable="false" />
        {/* The big number is decoration; the heading says it in words. */}
        <p aria-hidden="true" className="ty-http-error__code">
          {status}
        </p>
        <h1 ref={titleRef} className="ty-http-error__title" tabIndex={-1}>
          <span className="ty-visually-hidden">{`${words.codeLabel(status)}: `}</span>
          {props.title ?? fallback.title}
        </h1>
        <p className="ty-http-error__message">{props.message ?? fallback.message}</p>
        {props.problemType && (
          <p className="ty-http-error__problem">
            <span className="ty-visually-hidden">{`${words.problemType}: `}</span>
            <code>{props.problemType}</code>
          </p>
        )}
        {props.action && <div className="ty-http-error__actions">{props.action}</div>}
      </div>
    </main>
  )
}
