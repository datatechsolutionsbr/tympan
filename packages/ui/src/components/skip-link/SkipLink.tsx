import type { MouseEvent } from 'react'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'

export interface SkipLinkProps {
  /** Id of the main content element. */
  targetId?: string
  /** Link text (defaults to the I18n "Skip to main content"). */
  label?: string
  className?: string
}

/** Moves focus to `targetId`, making it programmatically focusable when needed. */
export function focusSkipTarget(targetId: string): boolean {
  const target = document.getElementById(targetId)
  if (!target) return false
  const needsTabIndex = !target.hasAttribute('tabindex') && target.tabIndex < 0
  if (needsTabIndex) {
    target.setAttribute('tabindex', '-1')
    target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true })
  }
  target.focus({ preventScroll: true })
  // scroll-padding-top on the document keeps the target clear of the sticky top bar (§2.6).
  target.scrollIntoView?.({ block: 'start' })
  return true
}

/** First focusable element: jumps past navigation to the main content (spec: wave-1/skip-link.md). */
export function SkipLink({ targetId = 'main-content', label, className }: SkipLinkProps) {
  const messages = useMessages()
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (focusSkipTarget(targetId)) {
      e.preventDefault()
      if (typeof history !== 'undefined' && history.replaceState) history.replaceState(history.state, '', `#${targetId}`)
    }
  }
  return (
    <a href={`#${targetId}`} className={cx('ty-skip-link', className)} onClick={onClick}>
      {label ?? messages.skipLink}
    </a>
  )
}
