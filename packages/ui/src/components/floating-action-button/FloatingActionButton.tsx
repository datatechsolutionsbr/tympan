import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../internal/cx'
import { requestHaptic } from '../../internal/haptics'
import { breakpoints, useMediaQuery } from '../../internal/media'
import { Button } from '../button/Button'

export type FabPlacement = 'end-bottom' | 'start-bottom' | 'center-bottom'
export type FabPresentation = 'responsive' | 'floating' | 'inline'

export interface FloatingActionButtonProps {
  label: string
  icon?: ReactNode
  onPress: () => void
  placement?: FabPlacement
  presentation?: FabPresentation
  /** Shows the label beside the icon while floating. */
  extended?: boolean
  size?: 'regular' | 'large'
  emphasis?: 'primary' | 'secondary'
  loading?: boolean
  disabled?: boolean
  /** Haptic tick on activation where supported. */
  haptic?: boolean
  className?: string
}

/** Page attribute that reserves room under the last row while a button floats. */
const RESERVE_ATTRIBUTE = 'data-ty-fab-reserve'

function useReserveBottom(active: boolean) {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return
    const body = document.body
    const depth = Number(body.getAttribute(RESERVE_ATTRIBUTE) ?? '0') + 1
    body.setAttribute(RESERVE_ATTRIBUTE, String(depth))
    return () => {
      const left = Number(body.getAttribute(RESERVE_ATTRIBUTE) ?? '1') - 1
      if (left > 0) body.setAttribute(RESERVE_ATTRIBUTE, String(left))
      else body.removeAttribute(RESERVE_ATTRIBUTE)
    }
  }, [active])
}

/**
 * The screen's main creation action (spec: wave-2/floating-action-button.md).
 * One element only: inline where it is placed on wide screens; on small
 * screens the same element moves (portal) to the end of the document so it
 * follows the main content in reading order and floats above the safe area.
 */
export function FloatingActionButton(props: FloatingActionButtonProps) {
  const wide = useMediaQuery(`(min-width: ${breakpoints.lg}px)`, true)
  const presentation = props.presentation ?? 'responsive'
  const floats = presentation === 'floating' || (presentation === 'responsive' && !wide)
  const showsText = !floats || (props.extended ?? false)
  useReserveBottom(floats)

  const press = () => {
    if (props.haptic) requestHaptic('light')
    props.onPress()
  }

  const control = (
    <Button
      className={cx('ty-fab', props.className)}
      variant={props.emphasis === 'secondary' ? 'secondary' : 'primary'}
      size={props.size === 'large' ? 'large' : 'regular'}
      shape={floats ? (showsText ? 'pill' : 'circle') : 'rounded'}
      iconOnly={!showsText}
      accessibleLabel={props.label}
      leadingIcon={props.icon}
      busy={props.loading}
      disabled={props.disabled}
      onPress={press}
    >
      {props.label}
    </Button>
  )

  if (!floats) return <span className="ty-fab-inline">{control}</span>
  const floating = (
    <div className="ty-fab-dock" data-placement={props.placement ?? 'end-bottom'} data-size={props.size ?? 'regular'}>
      {control}
    </div>
  )
  return typeof document === 'undefined' ? floating : createPortal(floating, document.body)
}
