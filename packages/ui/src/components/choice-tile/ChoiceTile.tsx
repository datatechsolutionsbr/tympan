import { Children, isValidElement, type ReactNode } from 'react'
import { ToggleButton } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { devWarning } from '../../internal/dev'
import { requestHaptic } from '../../internal/haptics'

export type ChoiceTileShape = 'pill' | 'control' | 'card'

export interface ChoiceTileProps {
  selected: boolean
  onPress?: () => void
  /** Accessible name; required when the content is not text. */
  label?: string
  disabled?: boolean
  shape?: ChoiceTileShape
  haptic?: boolean
  /** The caller draws its own selected treatment (never colour alone). */
  customSelection?: boolean
  children: ReactNode
  className?: string
  /** Key within a ToggleButtonGroup. */
  id?: string
}

/** True when some text node is present in the content (then it can name the tile). */
function carriesText(node: ReactNode): boolean {
  return Children.toArray(node).some((child) => {
    if (typeof child === 'string') return child.trim().length > 0
    if (typeof child === 'number') return true
    if (isValidElement<{ children?: ReactNode; 'aria-hidden'?: unknown }>(child)) {
      return child.props['aria-hidden'] ? false : carriesText(child.props.children)
    }
    return false
  })
}

/** Toggle primitive wrapping caller-drawn content (spec: wave-2/choice-tile.md). */
export function ChoiceTile({ selected, onPress, label, disabled, shape = 'control', haptic = true, customSelection, children, className, id }: ChoiceTileProps) {
  devWarning(!label && !carriesText(children), 'ChoiceTile: icon-only content needs `label`.')
  return (
    <ToggleButton
      id={id}
      className={cx('ty-choice-tile', className)}
      isSelected={selected}
      isDisabled={disabled}
      aria-label={label}
      data-shape={shape}
      data-own-selection={customSelection || undefined}
      onChange={() => {
        if (haptic) requestHaptic('light')
        onPress?.()
      }}
    >
      {children}
    </ToggleButton>
  )
}
