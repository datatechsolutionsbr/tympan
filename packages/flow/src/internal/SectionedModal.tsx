// Stand-in for the wave-2 SectionedModal (not yet in @fakhir/ui):
// ModalDialog with an eyebrow, a kind icon, an optional section rail and
// Ctrl/Cmd+Enter to submit. Replace with the @fakhir/ui component when it
// lands; the props mirror its spec.

import { useMemo, type KeyboardEvent, type ReactNode } from 'react'
import { ModalDialog, Tabs, TabPanel, useMediaQuery, type ModalDialogWidth } from '@fakhir/ui'

export interface ModalSection {
  id: string
  label: string
  content: ReactNode
}

export interface SectionedModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  /** Accessible description (for example the node label). */
  subtitle?: ReactNode
  eyebrow?: string
  icon?: ReactNode
  /** Kind tone for the icon tile (a tone name, never a colour). */
  tone?: string
  width?: ModalDialogWidth
  footer?: ReactNode
  /** Ctrl/Cmd+Enter anywhere inside the body. */
  onSubmitShortcut?: () => void
  /** Section rail (vertical tabs from the medium breakpoint, a top strip below). */
  sections?: ModalSection[]
  railLabel?: string
  activeSection?: string
  onActiveSectionChange?: (id: string) => void
  /** Pane shown above the section content (identity card, status). */
  railHeader?: ReactNode
  railFooter?: ReactNode
  busy?: boolean
  role?: 'dialog' | 'alertdialog'
  className?: string
  children?: ReactNode
}

export function SectionedModal(props: SectionedModalProps) {
  const { isOpen, onOpenChange, title, subtitle, eyebrow, icon, tone, width = 'wide', footer, onSubmitShortcut, sections, railLabel, activeSection, onActiveSectionChange, railHeader, railFooter, busy, role, className, children } = props
  const wide = useMediaQuery('(min-width: 768px)', true)
  const phone = !useMediaQuery('(min-width: 640px)', true)

  const heading = useMemo(
    () => (
      <span className="fk-flow-sectioned-modal__heading">
        {icon ? (
          <span className="fk-flow-sectioned-modal__icon" data-tone={tone ?? 'neutral'} aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className="fk-flow-sectioned-modal__titles">
          {eyebrow ? (
            <span className="fk-flow-sectioned-modal__eyebrow" aria-hidden="true">
              {eyebrow}
            </span>
          ) : null}
          <span className="fk-flow-sectioned-modal__title">{title}</span>
        </span>
      </span>
    ),
    [eyebrow, icon, title, tone],
  )

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (onSubmitShortcut && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      onSubmitShortcut()
    }
  }

  const body = sections?.length ? (
    <div className="fk-flow-sectioned-modal__rail-layout" data-rail={wide ? 'side' : 'top'}>
      {railHeader ? <div className="fk-flow-sectioned-modal__rail-header">{railHeader}</div> : null}
      <Tabs
        label={railLabel ?? 'Sections'}
        tabs={sections.map((s) => ({ id: s.id, label: s.label }))}
        orientation={wide ? 'vertical' : 'horizontal'}
        activation="manual"
        {...(activeSection !== undefined ? { selectedKey: activeSection } : {})}
        {...(onActiveSectionChange ? { onSelectionChange: onActiveSectionChange } : {})}
      >
        {sections.map((s) => (
          <TabPanel key={s.id} id={s.id}>
            {s.content}
          </TabPanel>
        ))}
      </Tabs>
      {railFooter ? <div className="fk-flow-sectioned-modal__rail-footer">{railFooter}</div> : null}
      {children}
    </div>
  ) : (
    children
  )

  return (
    <ModalDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      width={phone ? 'xwide' : width}
      title={heading}
      description={subtitle}
      actions={footer}
      {...(busy !== undefined ? { busy } : {})}
      {...(role ? { role } : {})}
      className={['fk-flow-sectioned-modal', className].filter(Boolean).join(' ')}
    >
      <div className="fk-flow-sectioned-modal__body" data-phone={phone || undefined} onKeyDown={onKeyDown}>
        {body}
      </div>
    </ModalDialog>
  )
}
