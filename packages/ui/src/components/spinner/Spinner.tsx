import type { ReactNode } from 'react'
import { ProgressBar as AriaProgressBar } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { inertProps } from '../../internal/inert'
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

/** Drawing of the indicator: a CSS ring (border arc) or three pulsing dots. Never announced. */
const glyphs: Record<SpinnerShape, () => ReactNode> = {
  ring: () => <span className="ty-spinner__ring" aria-hidden="true" />,
  dots: () => (
    <span className="ty-spinner__dots" aria-hidden="true">
      {[0, 1, 2].map((n) => (
        <span key={n} className="ty-spinner__dot" />
      ))}
    </span>
  ),
}

interface Look {
  'data-size': SpinnerSize
  'data-shape': SpinnerShape
  'data-tone': SpinnerTone
}

function Covered(p: { look: Look; name: string; shown: boolean; reduced: boolean; className?: string; children?: ReactNode }) {
  const busy = p.shown || undefined
  return (
    <div className={cx('ty-spinner-region', p.className)} aria-busy={busy}>
      <div className="ty-spinner-region__content" {...inertProps(busy)}>
        {p.children}
      </div>
      {p.shown && (
        <div className="ty-spinner-overlay" data-reduced-motion={p.reduced || undefined}>
          <div className="ty-spinner-overlay__card">
            <span className="ty-spinner" aria-hidden="true" {...p.look}>
              {glyphs[p.look['data-shape']]()}
            </span>
            <span className="ty-spinner__label" role="status" aria-live="polite">
              {p.name}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

/** Indeterminate work indicator, inline or as a region overlay (spec: wave-1/spinner.md). */
export function Spinner(props: SpinnerProps) {
  const catalogue = useMessages()
  const reduced = useReducedMotion()
  const name = props.label ?? catalogue.loading
  const look: Look = {
    'data-size': props.size ?? 'medium',
    'data-shape': props.shape ?? 'ring',
    'data-tone': props.tone ?? 'inherit',
  }

  if (props.overlay) {
    return (
      <Covered look={look} name={name} shown={props.visible ?? true} reduced={reduced} className={props.className}>
        {props.children}
      </Covered>
    )
  }

  // A static indicator says nothing by itself, so reduced motion reveals the label.
  const caption = (props.showLabel ?? false) || reduced
  return (
    <AriaProgressBar isIndeterminate aria-label={name} className={cx('ty-spinner', props.className)} data-reduced-motion={reduced || undefined} {...look}>
      {glyphs[look['data-shape']]()}
      {caption && (
        <span className="ty-spinner__label" aria-hidden="true">
          {name}
        </span>
      )}
    </AriaProgressBar>
  )
}
