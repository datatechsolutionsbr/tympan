import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react'
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'

export type ModalDialogWidth = 'narrow' | 'regular' | 'wide' | 'xwide'

export interface ModalDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  width?: ModalDialogWidth
  /** `alertdialog` for destructive or blocking confirmations. */
  role?: 'dialog' | 'alertdialog'
  /** Whether pressing outside closes (default: true for dialog, false for alertdialog). */
  dismissOnBackdrop?: boolean
  /** Visible close control (default: true for dialog, false for alertdialog). */
  showCloseButton?: boolean
  /** Where focus lands on open. For `alertdialog`, mark the least destructive action with `autoFocus`. */
  initialFocus?: 'first' | 'title' | RefObject<HTMLElement | null>
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  /** Disables closing while an action is pending. */
  busy?: boolean
  children?: ReactNode
  className?: string
}

/** Focused modal window for a decision or a short form (spec: wave-1/modal-dialog.md). */
export function ModalDialog(props: ModalDialogProps) {
  const {
    isOpen,
    onOpenChange,
    width = 'regular',
    role = 'dialog',
    dismissOnBackdrop = role === 'dialog',
    showCloseButton = role === 'dialog',
    initialFocus = 'first',
    title,
    description,
    actions,
    busy = false,
    children,
    className,
  } = props
  const messages = useMessages()
  const descriptionId = useId()
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const id = requestAnimationFrame(() => {
      if (initialFocus === 'title') titleRef.current?.focus()
      else if (typeof initialFocus === 'object') initialFocus.current?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [isOpen, initialFocus])

  const handleOpenChange = (open: boolean) => {
    if (!open && busy) return
    onOpenChange(open)
  }

  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      isDismissable={dismissOnBackdrop && !busy}
      isKeyboardDismissDisabled={busy}
      className="fk-modal-dialog__backdrop"
    >
      <Modal className={cx('fk-modal-dialog', className)} data-width={width}>
        <Dialog
          role={role}
          className="fk-modal-dialog__panel"
          aria-describedby={description ? descriptionId : undefined}
          data-busy={busy || undefined}
        >
          <div className="fk-modal-dialog__inner" aria-busy={busy || undefined}>
            <header className="fk-modal-dialog__header">
              <Heading slot="title" level={2} className="fk-modal-dialog__title" ref={titleRef} tabIndex={-1}>
                {title}
              </Heading>
              {showCloseButton ? (
                <Button
                  className="fk-modal-dialog__close"
                  variant="quiet"
                  size="compact"
                  shape="circle"
                  iconOnly
                  accessibleLabel={messages.close}
                  leadingIcon={<X />}
                  disabled={busy}
                  onPress={() => handleOpenChange(false)}
                />
              ) : null}
            </header>
            {description ? (
              <p id={descriptionId} className="fk-modal-dialog__description">
                {description}
              </p>
            ) : null}
            {children ? <div className="fk-modal-dialog__body">{children}</div> : null}
            {actions ? <footer className="fk-modal-dialog__actions">{actions}</footer> : null}
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
