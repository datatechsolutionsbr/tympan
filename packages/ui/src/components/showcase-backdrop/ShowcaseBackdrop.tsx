import type { CSSProperties } from 'react'
import { cx } from '../../internal/cx'

export type BackdropPlacement = 'corners' | 'top' | 'bottom'
export type BackdropIntensity = 'calm' | 'faint'

export interface ShowcaseBackdropProps {
  /** Where the two glows sit. */
  placement?: BackdropPlacement
  /** `faint` halves the Ambient effect for dense sections. */
  intensity?: BackdropIntensity
  className?: string
  style?: CSSProperties
}

/**
 * Two soft glows behind one showcase section, in the Ambient hues of §2.5
 * (spec: wave-4/showcase-backdrop.md). Fills its positioned parent, clips
 * itself, is hidden from assistive technology and never takes pointer events.
 * Content placed after it with `position: relative` sits above it.
 */
export function ShowcaseBackdrop(props: ShowcaseBackdropProps) {
  return (
    <div
      aria-hidden="true"
      className={cx('fk-showcase-backdrop', props.className)}
      style={props.style}
      data-placement={props.placement ?? 'corners'}
      data-intensity={props.intensity ?? 'calm'}
    >
      <span className="fk-showcase-backdrop__glow" data-hue="1" />
      <span className="fk-showcase-backdrop__glow" data-hue="2" />
    </div>
  )
}

export interface AccentBandProps {
  /** Edge of the positioned parent the band sticks to. */
  edge?: 'top' | 'bottom'
  className?: string
  style?: CSSProperties
}

/** Thin strip of the brand accent marking the top (or bottom) of a showcase section. */
export function AccentBand(props: AccentBandProps) {
  return <div aria-hidden="true" className={cx('fk-accent-band', props.className)} style={props.style} data-edge={props.edge ?? 'top'} />
}
