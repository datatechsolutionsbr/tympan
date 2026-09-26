// Non-modal panel docked beside or over a canvas: a labelled `region` or
// `complementary` landmark with a heading, a close control and Escape to close.
// The canvas stays usable (no focus trap). Placement follows design direction
// §2.8: pushes at ≥1280, overlays 1024–1279, full-width sheet below 1024; the
// host layout decides pushing vs overlaying through `data-placement`.

import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button, useMediaQuery, useMessages } from '@fakhir/design-system'

export interface DockedPanelProps {
  title: ReactNode
  /** Accessible name when the title is not plain text. */
  label?: string
  landmark?: 'region' | 'complementary'
  /** Where it docks on wide screens. */
  edge?: 'end' | 'bottom' | 'float'
  onClose?: () => void
  closeLabel?: string
  /** Controls placed before the close button (switch view, run, stop …). */
  actions?: ReactNode
  /** Leading icon of the header. */
  icon?: ReactNode
  /** Element to return focus to when the panel closes. */
  returnFocusTo?: HTMLElement | null
  /** Moves focus to the heading on mount. */
  focusOnOpen?: boolean
  busy?: boolean
  className?: string
  children?: ReactNode
  /** Extra attributes on the root (data-* only). */
  data?: Record<`data-${string}`, string | undefined>
}

export function DockedPanel(props: DockedPanelProps) {
  const { title, label, landmark = 'region', edge = 'end', onClose, closeLabel, actions, icon, returnFocusTo, focusOnOpen = false, busy, className, children, data } = props
  const messages = useMessages()
  const headingId = useId()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const phone = !useMediaQuery('(min-width: 1024px)', true)
  const opener = useRef<HTMLElement | null>(null)

  useEffect(() => {
    opener.current = returnFocusTo ?? (document.activeElement as HTMLElement | null)
    if (focusOnOpen) headingRef.current?.focus()
    return () => {
      const back = opener.current
      if (back && back.isConnected && typeof back.focus === 'function') {
        // After unmount, return focus only if it was inside the panel (now gone).
        if (!document.activeElement || document.activeElement === document.body) back.focus()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape' && onClose && !e.defaultPrevented) {
      e.preventDefault()
      e.stopPropagation()
      onClose()
    }
  }

  const Tag = landmark === 'complementary' ? 'aside' : 'section'
  return (
    <Tag
      className={['fk-docked-panel', className].filter(Boolean).join(' ')}
      aria-labelledby={label ? undefined : headingId}
      aria-label={label}
      aria-busy={busy || undefined}
      data-edge={phone ? 'sheet' : edge}
      onKeyDown={onKeyDown}
      {...(landmark === 'region' ? { role: 'region' } : {})}
      {...data}
    >
      <header className="fk-docked-panel__header">
        {icon ? (
          <span className="fk-docked-panel__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <h2 id={headingId} ref={headingRef} tabIndex={-1} className="fk-docked-panel__title">
          {title}
        </h2>
        <div className="fk-docked-panel__actions">
          {actions}
          {onClose ? (
            <Button variant="quiet" size="compact" shape="circle" iconOnly accessibleLabel={closeLabel ?? messages.close} leadingIcon={<X />} onPress={onClose} />
          ) : null}
        </div>
      </header>
      <div className="fk-docked-panel__body">{children}</div>
    </Tag>
  )
}
