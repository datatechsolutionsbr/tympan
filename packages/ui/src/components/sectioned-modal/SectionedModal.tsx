import { X } from 'lucide-react'
import { useEffect, useId, useRef, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { Button as AriaButton, Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useHeldOrOwn } from '../../internal/overlays-nav/state'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'
import { InlineNotice } from '../inline-notice/InlineNotice'

export type SectionedModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface ModalSection {
  id: string
  label: string
  icon?: ReactNode
  group?: string
  count?: number
  content?: ReactNode
}

export interface ModalFormFooter {
  cancelLabel?: string
  submitLabel?: string
  pending?: boolean
  submitDisabled?: boolean
}

export interface SectionedModalProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  eyebrow?: string
  icon?: ReactNode
  /** Name of the bare layout (no title). */
  ariaLabel?: string
  headerActions?: ReactNode
  size?: SectionedModalSize
  /** When false, Escape and the backdrop do nothing. */
  dismissible?: boolean
  /** Thin accent line on top of the header (decorative). */
  accent?: boolean
  error?: ReactNode
  footer?: ReactNode
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void
  formFooter?: ModalFormFooter
  sections?: ModalSection[]
  activeSection?: string
  defaultSection?: string
  onSectionChange?: (id: string) => void
  identity?: ReactNode
  navigationHeader?: ReactNode
  navigationFooter?: ReactNode
  closeLabel?: string
  children?: ReactNode
  className?: string
}

const FIELD = 'input:not([type=hidden]):not([disabled]), textarea:not([disabled]), select:not([disabled])'

/** Groups sections in first-seen group order, keeping the section order inside each group. */
function groupSections(list: ModalSection[]): Array<[string | undefined, ModalSection[]]> {
  const buckets = new Map<string | undefined, ModalSection[]>()
  for (const s of list) {
    const bucket = buckets.get(s.group)
    if (bucket) bucket.push(s)
    else buckets.set(s.group, [s])
  }
  return [...buckets.entries()]
}

function SectionRail(props: { label: string; sections: ModalSection[]; active: string; onPick: (id: string) => void; identity?: ReactNode; extras?: ReactNode; foot?: ReactNode }) {
  return (
    <div className="ty-sectioned-modal__rail">
      {props.identity ? <div className="ty-sectioned-modal__identity">{props.identity}</div> : null}
      {props.extras}
      <nav aria-label={props.label} className="ty-sectioned-modal__nav">
        {groupSections(props.sections).map(([group, items]) => (
          <div key={group ?? '·'} className="ty-sectioned-modal__group">
            {group ? <p className="ty-sectioned-modal__group-name">{group}</p> : null}
            <ul className="ty-sectioned-modal__list">
              {items.map((s) => (
                <li key={s.id}>
                  <AriaButton
                    className="ty-sectioned-modal__item"
                    aria-current={s.id === props.active ? 'page' : undefined}
                    data-active={s.id === props.active || undefined}
                    onPress={() => props.onPick(s.id)}
                  >
                    {s.icon ? (
                      <span className="ty-sectioned-modal__item-icon" aria-hidden="true">
                        {s.icon}
                      </span>
                    ) : null}
                    <span className="ty-sectioned-modal__item-label">{s.label}</span>
                    {s.count !== undefined ? <span className="ty-sectioned-modal__count">{s.count}</span> : null}
                  </AriaButton>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      {props.foot ? <div className="ty-sectioned-modal__rail-foot">{props.foot}</div> : null}
    </div>
  )
}

/** Large modal for editing and inspecting an item (spec: wave-2/sectioned-modal.md). */
export function SectionedModal(props: SectionedModalProps) {
  const copy = useMessages().sectionedModal
  const titleId = useId()
  const subtitleId = useId()
  const bodyRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const dismissible = props.dismissible ?? true
  const sections = props.sections ?? []
  const layout = sections.length ? 'sectioned' : props.title ? 'structured' : 'bare'
  const [active, setActive] = useHeldOrOwn(props.activeSection, props.defaultSection ?? sections[0]?.id ?? '', props.onSectionChange)
  const shown = sections.find((s) => s.id === active) ?? sections[0]
  const pending = props.formFooter?.pending ?? false

  // Initial focus: first field of the body, else the heading.
  useEffect(() => {
    if (!props.open) return
    const frame = requestAnimationFrame(() => {
      // The person may already have moved into the body (a click before this
      // frame): never take focus away from them.
      if (bodyRef.current?.contains(document.activeElement)) return
      const field = bodyRef.current?.querySelector<HTMLElement>(FIELD)
      if (field) field.focus()
      else headingRef.current?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [props.open])

  const submitShortcut = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      e.currentTarget.requestSubmit()
    }
  }

  const header =
    layout === 'bare' ? null : (
      <div className="ty-sectioned-modal__head" data-accent={props.accent || undefined}>
        {props.icon ? (
          <span className="ty-sectioned-modal__head-icon" aria-hidden="true">
            {props.icon}
          </span>
        ) : null}
        <div className="ty-sectioned-modal__titles">
          {props.eyebrow ? <p className="ty-sectioned-modal__eyebrow">{props.eyebrow}</p> : null}
          <Heading slot="title" id={titleId} level={2} ref={headingRef} tabIndex={-1} className="ty-sectioned-modal__title">
            {props.title}
          </Heading>
          {props.subtitle ? (
            <p id={subtitleId} className="ty-sectioned-modal__subtitle">
              {props.subtitle}
            </p>
          ) : null}
        </div>
        <div className="ty-sectioned-modal__head-actions">
          {props.headerActions}
          <Button variant="quiet" shape="circle" iconOnly accessibleLabel={props.closeLabel ?? copy.close} leadingIcon={<X />} onPress={props.onClose} disabled={pending} />
        </div>
      </div>
    )

  const bodyContent = (
    <>
      {props.error ? (
        <InlineNotice tone="danger" urgency="assertive">
          {props.error}
        </InlineNotice>
      ) : null}
      {layout === 'sectioned' && shown ? (
        <section aria-label={shown.label} className="ty-sectioned-modal__section">
          {shown.content ?? props.children}
        </section>
      ) : (
        props.children
      )}
    </>
  )

  const footerContent = props.footer ?? (props.formFooter ? (
    <>
      <Button onPress={props.onClose} disabled={pending}>
        {props.formFooter.cancelLabel ?? copy.cancel}
      </Button>
      <Button type="submit" variant="primary" busy={pending} disabled={props.formFooter.submitDisabled}>
        {props.formFooter.submitLabel ?? copy.save}
      </Button>
    </>
  ) : null)

  const inner = (
    <>
      <div ref={bodyRef} className="ty-sectioned-modal__body">
        {bodyContent}
      </div>
      {footerContent ? <div className="ty-sectioned-modal__foot">{footerContent}</div> : null}
    </>
  )

  const main = props.onSubmit ? (
    <form
      className="ty-sectioned-modal__form"
      noValidate
      onKeyDown={submitShortcut}
      onSubmit={(e) => {
        e.preventDefault()
        props.onSubmit?.(e)
      }}
    >
      {inner}
    </form>
  ) : (
    <div className="ty-sectioned-modal__form">{inner}</div>
  )

  return (
    <ModalOverlay
      isOpen={props.open}
      isDismissable={dismissible && !pending}
      isKeyboardDismissDisabled={!dismissible || pending}
      onOpenChange={(next) => {
        if (!next) props.onClose()
      }}
      className="ty-sectioned-modal__backdrop"
    >
      <Modal className={cx('ty-sectioned-modal', props.className)} data-size={props.size ?? 'lg'} data-layout={layout}>
        <Dialog
          className="ty-sectioned-modal__dialog"
          aria-label={layout === 'bare' ? props.ariaLabel : undefined}
          aria-describedby={props.subtitle && layout !== 'bare' ? subtitleId : undefined}
        >
          {header}
          <div className="ty-sectioned-modal__frame">
            {layout === 'sectioned' ? (
              <SectionRail
                label={props.title ?? props.ariaLabel ?? ''}
                sections={sections}
                active={shown?.id ?? ''}
                onPick={setActive}
                identity={props.identity}
                extras={props.navigationHeader}
                foot={props.navigationFooter}
              />
            ) : null}
            {main}
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
