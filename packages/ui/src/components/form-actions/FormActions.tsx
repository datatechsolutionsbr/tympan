import { TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'

export type FormActionsAlign = 'end' | 'between' | 'start'
export type FormActionsEmphasis = 'default' | 'destructive'

export interface FormActionsProps {
  cancelLabel?: string
  saveLabel?: string
  onCancel?: () => void
  /** Without it the primary button submits the enclosing form. */
  onSave?: () => void
  saveDisabled?: boolean
  saving?: boolean
  emphasis?: FormActionsEmphasis
  align?: FormActionsAlign
  /** Optional name of the group. */
  label?: string
  /** Free row: replaces the preset buttons. */
  children?: ReactNode
  className?: string
}

interface PresetSlots {
  secondary: ReactNode
  primary: ReactNode
}

function usePresetSlots(p: FormActionsProps): PresetSlots | null {
  const m = useMessages()
  if (p.children != null) return null
  const destructive = p.emphasis === 'destructive'
  const busy = !!p.saving
  return {
    secondary:
      p.cancelLabel != null ? (
        <Button variant="secondary" disabled={busy} onPress={() => p.onCancel?.()}>
          {p.cancelLabel}
        </Button>
      ) : null,
    primary:
      p.saveLabel != null ? (
        <Button
          variant={destructive ? 'danger' : 'primary'}
          type={p.onSave ? 'button' : 'submit'}
          disabled={!!p.saveDisabled}
          busy={busy}
          busyLabel={m.formActions.saving}
          leadingIcon={destructive ? <TriangleAlert /> : undefined}
          onPress={p.onSave ? () => p.onSave?.() : undefined}
          className="ty-form-actions__primary"
        >
          {p.saveLabel}
        </Button>
      ) : null,
  }
}

/** The closing row of a form or dialog (spec: wave-2/form-actions.md). DOM order: secondary, then primary. */
export function FormActions(props: FormActionsProps) {
  const slots = usePresetSlots(props)
  return (
    <div
      role="group"
      aria-label={props.label}
      className={cx('ty-form-actions', props.className)}
      data-align={props.align ?? 'end'}
      data-emphasis={props.emphasis ?? 'default'}
    >
      {slots ? (
        <>
          {slots.secondary}
          {slots.primary}
        </>
      ) : (
        props.children
      )}
    </div>
  )
}
