import { CircleAlert } from 'lucide-react'
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FieldsetHTMLAttributes,
  type HTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
} from 'react'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/** Wiring a Field shares with the control inside it. */
export interface FieldContextValue {
  /** Id the label targets (the registered explicit id wins over the generated one). */
  controlId: string
  labelId: string | undefined
  hintId: string | undefined
  errorId: string | undefined
  /** Hint then error ids, space separated, or undefined. */
  describedBy: string | undefined
  invalid: boolean
  required: boolean
  disabled: boolean
  /** Lets a control with an explicit id tell the label to target it. */
  registerControlId: (id: string | undefined) => void
}

const FieldContext = createContext<FieldContextValue | null>(null)
const FieldsetDisabledContext = createContext(false)

/** The surrounding Field's wiring, or null outside a Field. */
export function useField(): FieldContextValue | null {
  return useContext(FieldContext)
}

export interface FieldControlWiring {
  id: string
  labelledBy: string | undefined
  describedBy: string | undefined
  invalid: boolean
  required: boolean
  disabled: boolean
  inField: boolean
}

/**
 * Resolves a control's id, description and state from its own props and the
 * surrounding Field (if any). An explicit id on the control wins.
 */
export function useFieldControl(own: {
  id?: string | undefined
  describedBy?: string | undefined
  invalid?: boolean | undefined
  required?: boolean | undefined
  disabled?: boolean | undefined
}): FieldControlWiring {
  const field = useContext(FieldContext)
  const fieldsetDisabled = useContext(FieldsetDisabledContext)
  const generated = useId()
  const register = field?.registerControlId
  useIsoLayoutEffect(() => {
    if (!register) return
    register(own.id)
    return () => register(undefined)
  }, [register, own.id])
  const id = own.id ?? field?.controlId ?? generated
  const describedBy = [field?.describedBy, own.describedBy].filter(Boolean).join(' ') || undefined
  return {
    id,
    labelledBy: field?.labelId,
    describedBy,
    invalid: !!own.invalid || !!field?.invalid,
    required: !!own.required || !!field?.required,
    disabled: !!own.disabled || !!field?.disabled || fieldsetDisabled,
    inField: !!field,
  }
}

/** Tracks whether an error message appeared after the first render (announce once). */
export function useAppearedAfterMount(present: boolean): boolean {
  const mounted = useRef(false)
  const [appeared, setAppeared] = useState(false)
  useEffect(() => {
    if (mounted.current) setAppeared(present)
    mounted.current = true
  }, [present])
  return present && appeared
}

export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label?: ReactNode
  hint?: ReactNode
  /** When set, the control is invalid and the hint is hidden in favour of the error. */
  errorMessage?: string | null
  required?: boolean
  /** Overrides the generated control id. */
  controlId?: string
  disabled?: boolean
  children: ReactNode
}

/** Label, hint, required marker and error wiring around one control (spec: wave-1/field.md). */
export function Field({ label, hint, errorMessage, required = false, controlId, disabled = false, className, children, ...rest }: FieldProps) {
  const base = useId()
  const [registered, setRegistered] = useState<string | undefined>(undefined)
  const fieldsetDisabled = useContext(FieldsetDisabledContext)
  const hasError = !!errorMessage
  const hasHint = hint != null && hint !== false && !hasError
  const labelId = label != null ? `${base}-label` : undefined
  const hintId = hasHint ? `${base}-hint` : undefined
  const errorId = hasError ? `${base}-error` : undefined
  const value = useMemo<FieldContextValue>(
    () => ({
      controlId: registered ?? controlId ?? `${base}-control`,
      labelId,
      hintId,
      errorId,
      describedBy: [hintId, errorId].filter(Boolean).join(' ') || undefined,
      invalid: hasError,
      required,
      disabled: disabled || fieldsetDisabled,
      registerControlId: setRegistered,
    }),
    [registered, controlId, base, labelId, hintId, errorId, hasError, required, disabled, fieldsetDisabled],
  )
  return (
    <FieldContext.Provider value={value}>
      <div {...rest} className={cx('fk-field', className)} data-invalid={hasError || undefined} data-disabled={value.disabled || undefined}>
        {label != null ? <FieldLabel>{label}</FieldLabel> : null}
        {hasHint ? <FieldHint>{hint}</FieldHint> : null}
        {children}
        {hasError ? <FieldError>{errorMessage}</FieldError> : null}
      </div>
    </FieldContext.Provider>
  )
}

export interface FieldLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode
}

/** The label part: targets the Field's control unless an explicit `htmlFor` is given. */
export function FieldLabel({ htmlFor, className, children, ...rest }: FieldLabelProps) {
  const field = useContext(FieldContext)
  const messages = useMessages()
  return (
    <label {...rest} id={rest.id ?? field?.labelId} htmlFor={htmlFor ?? field?.controlId} className={cx('fk-field__label', className)}>
      {children}
      {field?.required ? (
        <span className="fk-field__required">
          {' '}
          ({messages.required})
        </span>
      ) : null}
    </label>
  )
}

/** Help text below the label. */
export function FieldHint({ className, children, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  const field = useContext(FieldContext)
  return (
    <p {...rest} id={rest.id ?? field?.hintId} className={cx('fk-field__hint', className)}>
      {children}
    </p>
  )
}

/** Error below the control, with an icon; announced politely only when it first appears. */
export function FieldError({ className, children, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  const field = useContext(FieldContext)
  const appeared = useAppearedAfterMount(true)
  return (
    <p {...rest} id={rest.id ?? field?.errorId} className={cx('fk-field__error', className)} aria-live={appeared ? 'polite' : undefined}>
      <CircleAlert className="fk-icon fk-field__error-icon" aria-hidden="true" focusable="false" />
      <span>{children}</span>
    </p>
  )
}

export interface FieldsetProps extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'children'> {
  legend: ReactNode
  description?: ReactNode
  disabled?: boolean
  children: ReactNode
}

/** Groups several Fields under a legend; `disabled` disables every nested control. */
export function Fieldset({ legend, description, disabled = false, className, children, ...rest }: FieldsetProps) {
  const descId = useId()
  const parentDisabled = useContext(FieldsetDisabledContext)
  return (
    <FieldsetDisabledContext.Provider value={disabled || parentDisabled}>
      <fieldset
        {...rest}
        disabled={disabled || undefined}
        aria-describedby={description != null ? descId : rest['aria-describedby']}
        className={cx('fk-fieldset', className)}
      >
        <legend className="fk-fieldset__legend">{legend}</legend>
        {description != null ? (
          <p id={descId} className="fk-fieldset__description">
            {description}
          </p>
        ) : null}
        <div className="fk-fieldset__body">{children}</div>
      </fieldset>
    </FieldsetDisabledContext.Provider>
  )
}

/** Vertical rhythm container for several Fields (§2.1 "between form fields"). */
export function FieldStack({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={cx('fk-field-stack', className)}>
      {children}
    </div>
  )
}
