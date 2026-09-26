import { CircleHelp, TriangleAlert } from 'lucide-react'
import { useEffect, useId, type ReactNode } from 'react'
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { requestHaptic } from '../../internal/haptics'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'

export type ConfirmTone = 'neutral' | 'danger'

export interface CompactConfirmProps {
  open: boolean
  title: string
  message?: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmTone
  icon?: ReactNode
  /** App or module name shown above the question. */
  sourceLabel?: string
  /** Warning haptic when it opens (where supported). */
  haptic?: boolean
  className?: string
}

function ToneTile({ tone, icon, word }: { tone: ConfirmTone; icon?: ReactNode; word: string }) {
  const glyph = icon ?? (tone === 'danger' ? <TriangleAlert /> : <CircleHelp />)
  return (
    <div className="fk-compact-confirm__tone">
      <span className="fk-compact-confirm__tile" aria-hidden="true">
        {glyph}
      </span>
      {tone === 'danger' ? <span className="fk-compact-confirm__word">{word}</span> : null}
    </div>
  )
}

/** Small top-anchored confirmation card (spec: wave-2/compact-confirm.md). */
export function CompactConfirm(props: CompactConfirmProps) {
  const copy = useMessages().confirm
  const tone = props.tone ?? 'danger'
  const titleId = useId()
  const messageId = useId()
  const wantsHaptic = props.haptic ?? true

  useEffect(() => {
    if (props.open && wantsHaptic) requestHaptic('medium')
  }, [props.open, wantsHaptic])

  return (
    <ModalOverlay
      isOpen={props.open}
      isDismissable
      onOpenChange={(next) => {
        if (!next) props.onCancel()
      }}
      className="fk-compact-confirm__scrim"
    >
      <Modal className={cx('fk-compact-confirm', props.className)} data-tone={tone}>
        <Dialog role="alertdialog" aria-labelledby={titleId} aria-describedby={props.message ? messageId : undefined} className="fk-compact-confirm__card">
          <ToneTile tone={tone} icon={props.icon} word={copy.caution} />
          <div className="fk-compact-confirm__text">
            {props.sourceLabel ? <p className="fk-compact-confirm__source">{props.sourceLabel}</p> : null}
            <Heading id={titleId} level={2} className="fk-compact-confirm__question">
              {props.title}
            </Heading>
            {props.message ? (
              <p id={messageId} className="fk-compact-confirm__message">
                {props.message}
              </p>
            ) : null}
          </div>
          <div className="fk-compact-confirm__actions">
            <Button autoFocus={tone === 'danger'} onPress={props.onCancel}>
              {props.cancelLabel ?? copy.cancel}
            </Button>
            <Button autoFocus={tone !== 'danger'} variant={tone === 'danger' ? 'danger' : 'primary'} onPress={props.onConfirm}>
              {props.confirmLabel ?? copy.confirm}
            </Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
