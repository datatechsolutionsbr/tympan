import { useId, useRef } from 'react'
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { useDomAttributes } from '../../internal/dom'
import { useMessages } from '../../internal/provider'
import type { AuthBrandMessages } from '../../internal/messages/auth-brand'
import { AmbientBackdrop } from '../ambient-backdrop/AmbientBackdrop'
import { Button } from '../button/Button'
import { InlineNotice } from '../inline-notice/InlineNotice'

export type UpgradeGateTexts = AuthBrandMessages['upgradeGate']

export interface UpgradeGateProps {
  onViewPlans: () => void
  onSignOut: () => void
  busy?: boolean
  texts?: Partial<UpgradeGateTexts>
  className?: string
}

/** Non-dismissable blocking screen for organisations without a plan (spec: wave-2/upgrade-gate.md). */
export function UpgradeGate({ onViewPlans, onSignOut, busy = false, texts, className }: UpgradeGateProps) {
  const t: UpgradeGateTexts = { ...useMessages().upgradeGate, ...texts }
  const ids = useId().replace(/:/g, '')
  const titleId = `ty-gate-title-${ids}`
  const descId = `ty-gate-desc-${ids}`
  const dialogRef = useRef<HTMLElement>(null)
  // RAC's Dialog does not forward aria-modal; the gate is modal, so say it.
  useDomAttributes(dialogRef, { 'aria-modal': 'true' })
  return (
    <ModalOverlay isOpen isDismissable={false} isKeyboardDismissDisabled className={className ? `ty-gate ${className}` : 'ty-gate'}>
      <AmbientBackdrop />
      <Modal className="ty-gate__modal">
        <Dialog className="ty-gate__dialog" ref={dialogRef} role="dialog" aria-labelledby={titleId} aria-describedby={descId}>
          <p className="ty-gate__eyebrow">{t.eyebrow}</p>
          <Heading slot="title" level={1} id={titleId} className="ty-gate__title">
            {t.title}
          </Heading>
          <p id={descId} className="ty-gate__description">
            {t.description} <span className="ty-visually-hidden">{t.cannotDismiss}</span>
          </p>
          <InlineNotice tone="warning" title={t.noticeTitle} urgency="none">
            {t.noticeBody}
          </InlineNotice>
          <div className="ty-gate__actions">
            <Button variant="primary" busy={busy} onPress={onViewPlans} autoFocus>
              {t.viewPlans}
            </Button>
            <Button variant="quiet" onPress={onSignOut}>
              {t.signOut}
            </Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
