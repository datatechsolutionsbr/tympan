import { Info } from 'lucide-react'
import { useRef, type FocusEvent, type ReactNode } from 'react'
import {
  Dialog,
  DialogTrigger,
  Heading,
  OverlayArrow,
  Popover as AriaPopover,
} from 'react-aria-components'
import { cx } from '../../internal/cx'
import { devWarning } from '../../internal/dev'
import { Button } from '../button/Button'

export type PopoverPlacement = 'top' | 'end' | 'bottom' | 'start'
export type PopoverAlign = 'start' | 'center' | 'end'

export interface PopoverProps {
  /** Element that toggles the panel; must be a pressable (e.g. Button). Defaults to an info button. */
  trigger?: ReactNode
  /** Accessible name of the built-in info trigger (required when `trigger` is omitted). */
  triggerLabel?: string
  /** Heading at the top of the panel; labels the panel. */
  title?: string
  children: ReactNode
  placement?: PopoverPlacement
  align?: PopoverAlign
  /** Gap between trigger and panel as a step of the spacing scale (1 to 9). */
  offset?: number
  showArrow?: boolean
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

const SPACE_STEPS = [0, 4, 8, 12, 16, 24, 32, 48, 64, 96]

function toAriaPlacement(placement: PopoverPlacement, align: PopoverAlign) {
  const side = placement === 'end' ? 'end' : placement === 'start' ? 'start' : placement
  if (align === 'center') return side
  if (side === 'top' || side === 'bottom') return `${side} ${align}` as const
  return `${side} ${align === 'start' ? 'top' : 'bottom'}` as const
}

/** Non-modal floating panel anchored to a trigger (spec: wave-1/popover.md). */
export function Popover(props: PopoverProps) {
  const {
    trigger,
    triggerLabel,
    title,
    children,
    placement = 'bottom',
    align = 'center',
    offset = 2,
    showArrow = true,
    open,
    defaultOpen,
    onOpenChange,
    className,
  } = props
  devWarning(!trigger && !triggerLabel, 'Popover: the built-in info trigger needs `triggerLabel`.')
  const closeRef = useRef<() => void>(() => {})

  const handleBlur = (e: FocusEvent<HTMLElement>) => {
    const next = e.relatedTarget as Node | null
    if (next && !e.currentTarget.contains(next)) closeRef.current()
  }

  return (
    <DialogTrigger
      {...(open !== undefined ? { isOpen: open } : {})}
      {...(defaultOpen !== undefined ? { defaultOpen } : {})}
      onOpenChange={onOpenChange}
    >
      {trigger ?? (
        <Button iconOnly variant="quiet" shape="circle" size="compact" accessibleLabel={triggerLabel ?? ''} leadingIcon={<Info />} />
      )}
      <AriaPopover
        className={cx('fk-popover', className)}
        placement={toAriaPlacement(placement, align)}
        offset={(SPACE_STEPS[offset] ?? 8) + (showArrow ? 6 : 0)}
        containerPadding={16}
        shouldFlip
      >
        {showArrow ? (
          <OverlayArrow className="fk-popover__arrow">
            <svg width={12} height={12} viewBox="0 0 12 12" aria-hidden="true">
              <path d="M0 0 L6 6 L12 0" />
            </svg>
          </OverlayArrow>
        ) : null}
        <Dialog className="fk-popover__dialog" aria-label={title ? undefined : triggerLabel}>
          {({ close }) => {
            closeRef.current = close
            return (
              <div className="fk-popover__body" onBlur={handleBlur}>
                {title ? (
                  <Heading slot="title" level={3} className="fk-popover__title">
                    {title}
                  </Heading>
                ) : null}
                <div className="fk-popover__content">{children}</div>
              </div>
            )
          }}
        </Dialog>
      </AriaPopover>
    </DialogTrigger>
  )
}
