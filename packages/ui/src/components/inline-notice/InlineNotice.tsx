import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import { useRef, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'

export type InlineNoticeTone = 'danger' | 'warning' | 'info' | 'success'
export type InlineNoticeUrgency = 'polite' | 'assertive' | 'none'

export interface InlineNoticeProps {
  tone?: InlineNoticeTone
  title?: string
  /** Element for the title; a plain strong paragraph unless configured. */
  titleAs?: 'p' | 'h2' | 'h3' | 'h4'
  children: ReactNode
  icon?: ReactNode
  actions?: ReactNode
  dismissible?: boolean
  onDismiss?: () => void
  align?: 'start' | 'centre'
  /** How the notice is announced when it appears; `none` for notices present on page load. */
  urgency?: InlineNoticeUrgency
  className?: string
}

const toneIcons = { danger: CircleAlert, warning: TriangleAlert, info: Info, success: CircleCheck }

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Short message about the state of a form, section or page (spec: wave-1/inline-notice.md). */
export function InlineNotice({
  tone = 'info',
  title,
  titleAs = 'p',
  children,
  icon,
  actions,
  dismissible = false,
  onDismiss,
  align = 'start',
  urgency,
  className,
}: InlineNoticeProps) {
  const messages = useMessages()
  const rootRef = useRef<HTMLDivElement>(null)
  const level = urgency ?? (tone === 'danger' || tone === 'warning' ? 'assertive' : 'polite')
  const role = level === 'assertive' ? 'alert' : level === 'polite' ? 'status' : undefined
  const Icon = toneIcons[tone]
  const TitleTag = titleAs

  const dismiss = () => {
    const root = rootRef.current
    // Focus moves to the next logical element, not the document body.
    let next: HTMLElement | null = null
    if (root) {
      const all = Array.from(document.querySelectorAll<HTMLElement>(focusableSelector))
      next =
        all.find((el) => !root.contains(el) && root.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) ??
        [...all].reverse().find((el) => !root.contains(el)) ??
        null
    }
    onDismiss?.()
    if (next) setTimeout(() => next?.isConnected && next.focus(), 0)
  }

  return (
    <div ref={rootRef} className={cx('ty-notice', className)} data-tone={tone} data-align={align} role={role}>
      <span className="ty-notice__icon" aria-hidden="true">
        {icon ?? <Icon />}
      </span>
      <div className="ty-notice__body">
        {title ? (
          <TitleTag className="ty-notice__title">
            <span className="ty-visually-hidden">{messages.notice.toneWord[tone]} </span>
            {title}
          </TitleTag>
        ) : null}
        <div className="ty-notice__message">
          {title ? null : <span className="ty-visually-hidden">{messages.notice.toneWord[tone]} </span>}
          {children}
        </div>
        {actions ? <div className="ty-notice__actions">{actions}</div> : null}
      </div>
      {dismissible ? (
        <Button
          className="ty-notice__dismiss"
          variant="quiet"
          size="compact"
          iconOnly
          accessibleLabel={messages.dismiss}
          leadingIcon={<X />}
          onPress={dismiss}
        />
      ) : null}
    </div>
  )
}
