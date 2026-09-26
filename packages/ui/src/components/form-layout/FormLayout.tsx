import { useId, type FormEvent, type ReactNode } from 'react'
import { Form } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { FormActions } from '../form-actions/FormActions'

type SubmitHandler = (event: FormEvent<HTMLFormElement>) => void
type HeadingLevel = 2 | 3 | 4 | 5 | 6

/** Wraps a submit handler so the browser never navigates when one is given. */
const withoutReload = (handler?: SubmitHandler): SubmitHandler | undefined =>
  handler &&
  ((event) => {
    event.preventDefault()
    handler(event)
  })

export interface FormContainerProps {
  onSubmit?: SubmitHandler
  children: ReactNode
  className?: string
  id?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}

/** A real form with the vertical rhythm between fields (spec: wave-2/form-layout.md). */
export function FormContainer({ children, className, onSubmit, ...aria }: FormContainerProps) {
  return (
    <Form {...aria} className={cx('ty-form-layout', className)} data-part="container" onSubmit={withoutReload(onSubmit)}>
      {children}
    </Form>
  )
}

export interface FieldGridProps {
  /** Maximum columns on wide screens. */
  columns?: 1 | 2
  children: ReactNode
  className?: string
}

/** Two columns from 640 px, one below; children may span both with FieldGridItem. */
export function FieldGrid({ columns = 2, children, className }: FieldGridProps) {
  return (
    <div className={cx('ty-form-layout', className)} data-part="grid" data-columns={columns}>
      {children}
    </div>
  )
}

/** A cell of FieldGrid; `full` spans both columns. */
export function FieldGridItem({ span = 'half', children }: { span?: 'full' | 'half'; children: ReactNode }) {
  return (
    <div className="ty-form-layout__cell" data-span={span}>
      {children}
    </div>
  )
}

/** Fields and a button on one line; wraps on narrow screens. */
export function InlineRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('ty-form-layout', className)} data-part="inline">
      {children}
    </div>
  )
}

export interface FormSectionProps {
  title?: ReactNode
  description?: ReactNode
  headingLevel?: HeadingLevel
  /** Render as fieldset/legend (a set of related choices). */
  asFieldset?: boolean
  children: ReactNode
  className?: string
}

function SectionHead({ level, id, title, description }: { level: HeadingLevel; id: string; title?: ReactNode; description?: ReactNode }) {
  const Tag = `h${level}` as const
  return (
    <>
      {title != null ? (
        <Tag id={id} className="ty-form-layout__title">
          {title}
        </Tag>
      ) : null}
      {description != null ? <p className="ty-form-layout__description">{description}</p> : null}
    </>
  )
}

/** Titled group of fields; sections are separated by dividers. */
export function FormSection({ title, description, headingLevel = 3, asFieldset = false, children, className }: FormSectionProps) {
  const titleId = useId()
  if (asFieldset) {
    return (
      <fieldset className={cx('ty-form-layout', className)} data-part="section">
        {title != null ? <legend className="ty-form-layout__title">{title}</legend> : null}
        {description != null ? <p className="ty-form-layout__description">{description}</p> : null}
        <div className="ty-form-layout__body">{children}</div>
      </fieldset>
    )
  }
  return (
    <div role="group" aria-labelledby={title != null ? titleId : undefined} className={cx('ty-form-layout', className)} data-part="section">
      <SectionHead level={headingLevel} id={titleId} title={title} description={description} />
      <div className="ty-form-layout__body">{children}</div>
    </div>
  )
}

export interface FramedFormProps {
  onSubmit: SubmitHandler
  title?: string
  subtitle?: string
  icon?: ReactNode
  submitLabel: string
  cancelLabel?: string
  onCancel?: () => void
  busy?: boolean
  submitDisabled?: boolean
  showHeader?: boolean
  showFooter?: boolean
  footerExtra?: ReactNode
  children: ReactNode
  className?: string
}

/** A sheet holding a form: header (icon, title, subtitle), body and footer actions. */
export function FramedForm(props: FramedFormProps) {
  const titleId = useId()
  const headerShown = props.showHeader !== false && !!props.title
  const cancelShown = props.cancelLabel != null && props.onCancel != null
  return (
    <Form
      className={cx('ty-form-layout', props.className)}
      data-part="framed"
      aria-labelledby={props.title ? titleId : undefined}
      aria-busy={props.busy || undefined}
      onSubmit={withoutReload(props.onSubmit)}
    >
      {headerShown ? (
        <div className="ty-form-layout__header">
          {props.icon ? (
            <span className="ty-form-layout__icon" aria-hidden="true">
              {props.icon}
            </span>
          ) : null}
          <div>
            <h2 id={titleId} className="ty-form-layout__framed-title">
              {props.title}
            </h2>
            {props.subtitle ? <p className="ty-form-layout__description">{props.subtitle}</p> : null}
          </div>
        </div>
      ) : props.title ? (
        <span id={titleId} className="ty-visually-hidden">
          {props.title}
        </span>
      ) : null}
      <div className="ty-form-layout__framed-body">{props.children}</div>
      {props.showFooter === false ? null : (
        <div className="ty-form-layout__footer">
          {props.footerExtra ? <div className="ty-form-layout__extra">{props.footerExtra}</div> : null}
          <FormActions
            saveLabel={props.submitLabel}
            cancelLabel={cancelShown ? props.cancelLabel : undefined}
            onCancel={props.onCancel}
            saving={props.busy}
            saveDisabled={props.submitDisabled}
          />
        </div>
      )}
    </Form>
  )
}
