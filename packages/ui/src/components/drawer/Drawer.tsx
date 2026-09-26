import { X } from 'lucide-react'
import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'

export type DrawerPlacement = 'bottom' | 'end'
export type DrawerWidth = 'medium' | 'large' | 'wide'

export interface DrawerProps {
  open: boolean
  /** Called with false on any dismissal: backdrop, Escape, close button, drag. */
  onOpenChange: (open: boolean) => void
  /** Visible heading and accessible name. */
  title: string
  placement?: DrawerPlacement
  /** Maximum width of an end-placed panel. */
  width?: DrawerWidth
  /** Maximum height of a bottom-placed panel (CSS length, e.g. '85dvh'). */
  maxHeight?: string
  /** Shows the grab handle (bottom placement only). */
  showHandle?: boolean
  /** When false, backdrop press and drag do not close (Escape and the close button still do). */
  dismissible?: boolean
  children?: ReactNode
  className?: string
}

/** Distance (px) or velocity (px/ms) past which a released drag closes the drawer. */
export const DRAWER_DRAG_DISTANCE = 120
export const DRAWER_DRAG_VELOCITY = 0.6

/** Modal panel attached to the bottom or end edge (spec: wave-1/drawer.md). */
export function Drawer(props: DrawerProps) {
  const {
    open,
    onOpenChange,
    title,
    placement = 'bottom',
    width = 'medium',
    maxHeight,
    showHandle = true,
    dismissible = true,
    children,
    className,
  } = props
  const messages = useMessages()
  const [drag, setDrag] = useState(0)
  const start = useRef<{ y: number; t: number } | null>(null)
  const canDrag = placement === 'bottom' && dismissible

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (!canDrag || (e.button !== undefined && e.button > 0)) return
    if ((e.target as HTMLElement).closest('button')) return
    start.current = { y: e.clientY, t: e.timeStamp || performance.now() }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (!start.current) return
    setDrag(Math.max(0, e.clientY - start.current.y))
  }
  const onPointerUp = (e: ReactPointerEvent<HTMLElement>) => {
    if (!start.current) return
    const distance = Math.max(0, e.clientY - start.current.y)
    const elapsed = Math.max(1, (e.timeStamp || performance.now()) - start.current.t)
    start.current = null
    setDrag(0)
    if (distance >= DRAWER_DRAG_DISTANCE || distance / elapsed >= DRAWER_DRAG_VELOCITY) onOpenChange(false)
  }

  const dragging = drag > 0
  const panelStyle: CSSProperties = {
    ...(maxHeight && placement === 'bottom' ? { maxBlockSize: maxHeight } : {}),
    ...(dragging ? { transform: `translateY(${drag}px)`, transition: 'none' } : {}),
  }
  const overlayStyle: CSSProperties | undefined = dragging ? { opacity: Math.max(0.2, 1 - drag / 400) } : undefined
  const dragHandlers = canDrag ? { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp } : {}

  return (
    <ModalOverlay
      isOpen={open}
      onOpenChange={(o) => {
        if (!o) onOpenChange(false)
      }}
      isDismissable={dismissible}
      className="ty-drawer__backdrop"
      data-placement={placement}
      style={overlayStyle}
    >
      <Modal
        className={cx('ty-drawer', className)}
        data-placement={placement}
        data-width={width}
        data-dragging={dragging || undefined}
        style={panelStyle}
      >
        <Dialog className="ty-drawer__dialog">
          <header className="ty-drawer__header" {...dragHandlers}>
            {placement === 'bottom' && showHandle ? <span className="ty-drawer__handle" aria-hidden="true" /> : null}
            <Heading slot="title" level={2} className="ty-drawer__title">
              {title}
            </Heading>
            <Button
              className="ty-drawer__close"
              variant="quiet"
              size="compact"
              shape="circle"
              iconOnly
              accessibleLabel={messages.close}
              leadingIcon={<X />}
              onPress={() => onOpenChange(false)}
            />
          </header>
          <div className="ty-drawer__body">{children}</div>
          {placement === 'bottom' ? <div className="ty-drawer__inset" aria-hidden="true" /> : null}
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
