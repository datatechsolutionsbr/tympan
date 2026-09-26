import { LoaderCircle } from 'lucide-react'
import { forwardRef, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Button as AriaButton, Link as AriaLink, type PressEvent } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { devWarning } from '../../internal/dev'
import { useDomAttributes, useMergedRefs } from '../../internal/dom'
import { requestHaptic, type HapticStrength } from '../../internal/haptics'
import { variants } from '../../internal/variants'
import type { RouterNavigateOptions } from '../../internal/provider'

/** Variant axes of the button, declared as data (CSS selects on the data attributes). */
export const buttonVariants = variants(
  {
    variant: ['primary', 'secondary', 'quiet', 'danger'],
    size: ['compact', 'regular', 'large'],
    shape: ['rounded', 'pill', 'circle'],
  } as const,
  { variant: 'secondary', size: 'regular', shape: 'rounded' },
)
export type ButtonVariant = (typeof buttonVariants.axes.variant)[number]
export type ButtonSize = (typeof buttonVariants.axes.size)[number]
export type ButtonShape = (typeof buttonVariants.axes.shape)[number]

export interface ButtonProps {
  /** Visual weight (§2.10). At most one `primary` per view. */
  variant?: ButtonVariant
  /** Visible height step; `compact` only inside compact tables. */
  size?: ButtonSize
  /** `circle` only for icon-only buttons. */
  shape?: ButtonShape
  /** Hides the label; `accessibleLabel` is then required. */
  iconOnly?: boolean
  /** Accessible name when there is no visible label; also the tooltip text. */
  accessibleLabel?: string
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  /** Renders a link through the router adapter; `onPress` still fires. */
  href?: string
  routerOptions?: RouterNavigateOptions
  target?: string
  rel?: string
  type?: 'button' | 'submit' | 'reset'
  /** Shows the busy indicator, blocks presses, keeps the width stable. */
  busy?: boolean
  /** Replaces the label while busy. */
  busyLabel?: string
  disabled?: boolean
  /** Keeps a disabled button in the tab order (reports `aria-disabled`). */
  focusableWhenDisabled?: boolean
  fullWidth?: boolean
  onPress?: (event: PressEvent) => void
  /** Haptic feedback on press start (`danger` defaults to medium). */
  haptic?: HapticStrength
  /** Link mode: marks the link as the current page. */
  current?: boolean
  children?: ReactNode
  className?: string
  id?: string
  form?: string
  name?: string
  value?: string
  autoFocus?: boolean
  'aria-describedby'?: string
  'aria-controls'?: string
  'aria-expanded'?: boolean
  'aria-haspopup'?: boolean | 'menu' | 'dialog' | 'listbox'
  'aria-pressed'?: boolean
  slot?: string
}

/** Triggers one action or navigates to one destination (spec: wave-1/button.md). */
export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(function Button(props, forwardedRef) {
  const {
    variant = 'secondary',
    size = 'regular',
    shape = 'rounded',
    iconOnly = false,
    accessibleLabel,
    leadingIcon,
    trailingIcon,
    href,
    routerOptions,
    target,
    rel,
    type = 'button',
    busy = false,
    busyLabel,
    disabled = false,
    focusableWhenDisabled = false,
    fullWidth = false,
    onPress,
    haptic,
    current = false,
    children,
    className,
    ...rest
  } = props

  devWarning(iconOnly && !accessibleLabel, 'Button: `iconOnly` requires `accessibleLabel`.')

  const innerRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null)
  const ref = useMergedRefs(innerRef, forwardedRef)
  const softDisabled = disabled && focusableWhenDisabled
  const hardDisabled = disabled && !focusableWhenDisabled
  const strength: HapticStrength = haptic ?? (variant === 'danger' ? 'medium' : 'light')

  // Keep the width stable while busy: freeze the current width as a minimum.
  const [minWidth, setMinWidth] = useState<number | undefined>(undefined)
  useLayoutEffect(() => {
    if (busy && innerRef.current) setMinWidth(innerRef.current.getBoundingClientRect().width || undefined)
    if (!busy) setMinWidth(undefined)
  }, [busy])

  useDomAttributes(innerRef, {
    'aria-busy': busy ? 'true' : undefined,
    'aria-disabled': softDisabled || busy ? 'true' : undefined,
    'aria-current': href && current ? 'page' : undefined,
    title: iconOnly && accessibleLabel ? accessibleLabel : undefined,
  })

  // React Aria forwards data-* attributes; CSS keys variants off them.
  const dataAttrs = {
    ...buttonVariants.attributes({ variant, size, shape }),
    'data-icon-only': iconOnly || undefined,
    'data-busy': busy || undefined,
    'data-full-width': fullWidth || undefined,
    'data-soft-disabled': softDisabled || undefined,
    'data-current': (href && current) || undefined,
  }

  const blocked = busy || softDisabled
  const handlePress = (e: PressEvent) => {
    if (blocked) return
    onPress?.(e)
  }
  const handlePressStart = () => {
    if (!blocked && !hardDisabled) requestHaptic(strength)
  }

  const label = busy && busyLabel ? busyLabel : children
  const content = (
    <>
      {busy ? (
        <LoaderCircle className="fk-icon fk-button__busy" aria-hidden="true" focusable="false" />
      ) : leadingIcon ? (
        <span className="fk-button__icon" aria-hidden="true">
          {leadingIcon}
        </span>
      ) : null}
      {iconOnly ? null : <span className="fk-button__label">{label}</span>}
      {trailingIcon && !iconOnly ? (
        <span className="fk-button__icon" aria-hidden="true">
          {trailingIcon}
        </span>
      ) : null}
    </>
  )

  const classes = cx('fk-button', className)
  const style = minWidth ? { minInlineSize: `${minWidth}px` } : undefined
  const ariaLabel = iconOnly ? accessibleLabel : busy && busyLabel ? busyLabel : undefined

  if (href) {
    return (
      <AriaLink
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={blocked ? undefined : href}
        routerOptions={routerOptions}
        target={target}
        rel={rel}
        isDisabled={hardDisabled}
        onPress={handlePress}
        onPressStart={handlePressStart}
        className={classes}
        style={style}
        aria-label={ariaLabel}
        id={rest.id}
        aria-describedby={rest['aria-describedby']}
        autoFocus={rest.autoFocus}
        slot={rest.slot}
        {...dataAttrs}
      >
        {content}
      </AriaLink>
    )
  }

  return (
    <AriaButton
      {...rest}
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type}
      isDisabled={hardDisabled}
      isPending={busy}
      onPress={handlePress}
      onPressStart={handlePressStart}
      className={classes}
      style={style}
      aria-label={ariaLabel}
      {...dataAttrs}
    >
      {content}
    </AriaButton>
  )
})
