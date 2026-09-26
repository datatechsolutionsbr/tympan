import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'
import { StepList } from '../step-list/StepList'

export interface WizardStep {
  id: string
  title: string
  description?: string
  icon?: ReactNode
}

export interface WizardPageProps {
  /** Flow title; also names the StepList. */
  title: string
  subtitle?: string
  eyebrow: string
  icon: ReactNode
  steps: WizardStep[]
  currentIndex: number
  onStepChange: (index: number) => void
  onSubmit: () => void
  onCancel: () => void
  canAdvance?: boolean
  submitting?: boolean
  submitLabel?: string
  aside?: ReactNode
  /** When the step body is a form, the primary submits it (`form` = its id). */
  form?: string
  children?: ReactNode
  className?: string
}

/** Moves focus to the heading whenever the step index changes after mount. */
function useAnnounceStep(index: number, heading: React.RefObject<HTMLHeadingElement | null>) {
  const shown = useRef(index)
  useEffect(() => {
    if (shown.current === index) return
    shown.current = index
    heading.current?.focus()
  }, [index, heading])
}

/** Keeps the document title in step with the flow; restores it on unmount. */
function useStepDocumentTitle(text: string) {
  useEffect(() => {
    if (typeof document === 'undefined') return
    const before = document.title
    document.title = text
    return () => {
      document.title = before
    }
  }, [text])
}

/** Full-page frame for a multi-step creation flow (spec: wave-2/wizard-page.md). */
export function WizardPage(props: WizardPageProps) {
  const copy = useMessages().wizardPage
  const heading = useRef<HTMLHeadingElement>(null)
  const last = props.steps.length - 1
  const at = Math.min(Math.max(0, props.currentIndex), Math.max(0, last))
  const step = props.steps[at]
  const busy = props.submitting ?? false
  const onFinal = at === last

  useAnnounceStep(at, heading)
  useStepDocumentTitle(step ? copy.documentTitle(step.title, props.title) : props.title)

  const goBack = () => (at === 0 ? props.onCancel() : props.onStepChange(at - 1))
  const goOn = () => (onFinal ? props.onSubmit() : props.onStepChange(at + 1))
  const primaryText = onFinal ? (props.submitLabel ?? copy.submit) : copy.next

  return (
    <div className={cx('ty-wizard-page', props.className)} aria-busy={busy || undefined}>
      <div className="ty-wizard-page__head">
        <div className="ty-wizard-page__top">
          <p className="ty-wizard-page__eyebrow">
            <span aria-hidden="true" className="ty-wizard-page__eyebrow-icon">
              {props.icon}
            </span>
            {props.eyebrow}
          </p>
          <Button variant="quiet" iconOnly shape="circle" accessibleLabel={copy.close} leadingIcon={<X />} onPress={props.onCancel} />
        </div>
        <h1 ref={heading} tabIndex={-1} className="ty-wizard-page__title">
          {step?.title ?? props.title}
        </h1>
        {(step?.description ?? props.subtitle) ? <p className="ty-wizard-page__lead">{step?.description ?? props.subtitle}</p> : null}
        {props.aside ? <div className="ty-wizard-page__aside">{props.aside}</div> : null}
        <StepList
          label={props.title}
          currentIndex={at}
          steps={props.steps.map((s) => ({ id: s.id, name: s.title, icon: s.icon }))}
          onStepSelect={busy ? undefined : props.onStepChange}
        />
      </div>
      <div className="ty-wizard-page__body" key={step?.id}>
        {props.children}
      </div>
      <div className="ty-wizard-page__nav" role="group" aria-label={copy.actions}>
        <Button onPress={goBack} disabled={busy}>
          {at === 0 ? copy.cancel : copy.previous}
        </Button>
        <Button
          variant="primary"
          type={props.form ? 'submit' : 'button'}
          form={props.form}
          onPress={props.form ? undefined : goOn}
          disabled={!(props.canAdvance ?? true) && !busy}
          busy={busy}
          busyLabel={copy.submitting}
        >
          {primaryText}
        </Button>
      </div>
      <span role="status" className="ty-visually-hidden">
        {busy ? copy.submitting : ''}
      </span>
    </div>
  )
}
