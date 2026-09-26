import { LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { ProgressBar as AriaProgressBar } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useReducedMotion } from '../../internal/media'
import { useMessages } from '../../internal/provider'

export type SpinnerSize = 'small' | 'medium' | 'large'
export type SpinnerShape = 'ring' | 'dots'
export type SpinnerTone = 'inherit' | 'accent' | 'on-accent' | 'neutral'

export interface SpinnerProps {
  /** Accessible name; visible when `showLabel` (or under reduced motion). */
  label?: string
  showLabel?: boolean
  size?: SpinnerSize
  shape?: SpinnerShape
  tone?: SpinnerTone
  /** Render as a blocking overlay over `children` (the covered region). */
  overlay?: boolean
  /** Overlay only: whether the overlay is shown. */
  visible?: boolean
  /** Overlay only: the region the overlay covers. */
  children?: ReactNode
  className?: string
}

function Indicator({ shape }: { shape: SpinnerShape }) {
  if (shape === 'dots') {
    return (
      <span className="fk-spinner__dots" aria-hidden="true">
        <span className="fk-spinner__dot" />
        <span className="fk-spinner__dot" />
        <span className="fk-spinner__dot" />
      </span>
    )
  }
  return <LoaderCircle className="fk-spinner__ring" aria-hidden="true" focusable="false" />
}

/** Indeterminate work indicator, inline or as a region overlay (spec: wave-1/spinner.md). */
export function Spinner({
  label,
  showLabel = false,
  size = 'medium',
  shape = 'ring',
  tone = 'inherit',
  overlay = false,
  visible = true,
  children,
  className,
}: SpinnerProps) {
  const messages = useMessages()
  const reduced = useReducedMotion()
  const name = label ?? messages.loading
  // Under reduced motion the indicator is static, so the label carries the meaning visibly.
  const labelVisible = showLabel || reduced

  if (overlay) {
    return (
      <div className={cx('fk-spinner-region', className)} aria-busy={visible || undefined}>
        <div className="fk-spinner-region__content" inert={visible || undefined}>
          {children}
        </div>
        {visible ? (
          <div className="fk-spinner-overlay" data-reduced-motion={reduced || undefined}>
            <div className="fk-spinner-overlay__card">
              <span className="fk-spinner" data-size={size} data-shape={shape} data-tone={tone} aria-hidden="true">
                <Indicator shape={shape} />
              </span>
              <span className="fk-spinner__label" role="status" aria-live="polite">
                {name}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <AriaProgressBar
      isIndeterminate
      aria-label={name}
      className={cx('fk-spinner', className)}
      data-size={size}
      data-shape={shape}
      data-tone={tone}
      data-reduced-motion={reduced || undefined}
    >
      <Indicator shape={shape} />
      {labelVisible ? (
        <span className="fk-spinner__label" aria-hidden="true">
          {name}
        </span>
      ) : null}
    </AriaProgressBar>
  )
}
