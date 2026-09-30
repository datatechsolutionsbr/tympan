import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react'
import { OverlayArrow, Tooltip as AriaTooltip, TooltipTrigger } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { devWarning } from '../../internal/dev'
import { VisuallyHidden } from '../../internal/VisuallyHidden'

export type TooltipPlacement = 'top' | 'bottom' | 'start' | 'end'
export type TooltipRole = 'label' | 'description'

export interface TooltipProps {
  /** Hint text; plain text only, never interactive content. */
  content: ReactNode
  /** The focusable trigger (usually an icon-only Button). */
  children: ReactElement
  /** Preferred side; flips when there is no room. */
  placement?: TooltipPlacement
  /** Shows the arrow (default true). */
  showArrow?: boolean
  /** `default` keeps the warm-up delay; `immediate` opens without it. */
  delay?: 'default' | 'immediate'
  /** Never opens (for example when a visible label shows the same text). */
  disabled?: boolean
  /** Controlled open state; rare, for tours and tests. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /**
   * `description` (default): the bubble describes an already-named trigger
   * through `aria-describedby`. `label`: the tooltip text is the trigger's
   * accessible name (icon-only triggers), through a persistent hidden label.
   */
  role?: TooltipRole
  className?: string
}

/** Warm-up (and cool-down) of the shared tooltip timing, in ms. */
const WARM_UP_MS = 300

/**
 * Short, non-interactive hint for a control, on hover or keyboard focus
 * (spec: wave-5-general/tooltip.md).
 */
export function Tooltip(props: TooltipProps) {
  const {
    content,
    children,
    placement = 'top',
    showArrow = true,
    delay = 'default',
    disabled = false,
    open,
    defaultOpen,
    onOpenChange,
    role = 'description',
    className,
  } = props
  devWarning(!isValidElement(children), 'Tooltip: `children` must be one focusable element.')

  const labelId = useId()
  const asLabel = role === 'label'
  // With role="label" the name must exist while the bubble is closed, so it
  // comes from a persistent hidden label; the trigger keeps any description it
  // brought itself, and RAC's open-state description is suppressed so the text
  // is never spoken twice.
  const child = children as ReactElement<Record<string, unknown>>
  const trigger =
    asLabel && isValidElement(child)
      ? cloneElement(child, {
          'aria-labelledby': labelId,
          ...(child.props['aria-describedby'] === undefined ? { 'aria-describedby': undefined } : {}),
        })
      : children

  return (
    <TooltipTrigger
      delay={delay === 'immediate' ? 0 : WARM_UP_MS}
      closeDelay={delay === 'immediate' ? 0 : WARM_UP_MS}
      isDisabled={disabled}
      {...(open !== undefined ? { isOpen: open } : {})}
      {...(defaultOpen !== undefined ? { defaultOpen } : {})}
      onOpenChange={onOpenChange}
    >
      {trigger}
      {asLabel ? <VisuallyHidden id={labelId}>{content}</VisuallyHidden> : null}
      <AriaTooltip
        className={cx('ty-tooltip', className)}
        placement={placement}
        offset={showArrow ? 8 : 6}
        containerPadding={12}
      >
        {showArrow ? (
          <OverlayArrow className="ty-tooltip__arrow">
            <svg width={10} height={6} viewBox="0 0 10 6" aria-hidden="true">
              <path d="M0 0 L5 6 L10 0" />
            </svg>
          </OverlayArrow>
        ) : null}
        <span className="ty-tooltip__content">{content}</span>
      </AriaTooltip>
    </TooltipTrigger>
  )
}
