import { forwardRef, useId, useState, type ReactNode } from 'react'
import { Switch as AriaSwitch, type SwitchProps as AriaSwitchProps } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { devWarning } from '../../internal/dev'

export interface SwitchProps {
  isSelected?: boolean
  defaultSelected?: boolean
  onChange?: (isSelected: boolean) => void
  label?: string
  /** Name when there is no visible label. */
  accessibleLabel?: string
  description?: ReactNode
  /** Row (control then label) or setting tile (text start, control end). */
  layout?: 'inline' | 'tile'
  size?: 'small' | 'regular' | 'large'
  disabled?: boolean
  /** Focusable and announces its state, but cannot change. */
  readOnly?: boolean
  name?: string
  value?: string
  id?: string
  className?: string
}

type KeyEvent = Parameters<NonNullable<AriaSwitchProps['onKeyDown']>>[0]

/** On/off state that may be owned by the host (`isSelected`) or kept here. */
function useOnOff(owned: boolean | undefined, start: boolean, report?: (on: boolean) => void) {
  const [kept, keep] = useState(start)
  const on = owned === undefined ? kept : owned
  function flip(next: boolean) {
    if (owned === undefined) keep(next)
    if (report) report(next)
  }
  return { on, flip }
}

/** Visible text of the switch: label and description, each with its own id. */
function Caption(p: { labelId?: string; label?: string; descId?: string; description?: ReactNode }) {
  if (!p.label && p.description == null) return null
  return (
    <span className="ty-switch__text">
      {p.label && (
        <span id={p.labelId} className="ty-switch__label">
          {p.label}
        </span>
      )}
      {p.description != null && (
        <span id={p.descId} className="ty-switch__description">
          {p.description}
        </span>
      )}
    </span>
  )
}

/** On/off setting with immediate effect (spec: wave-1/switch.md). */
export const Switch = forwardRef<HTMLLabelElement, SwitchProps>(function Switch(props, ref) {
  devWarning(!props.label && !props.accessibleLabel, 'Switch: provide `label` or `accessibleLabel`.')
  const stem = useId()
  const ids = {
    label: props.label ? `${stem}-label` : undefined,
    desc: props.description != null ? `${stem}-desc` : undefined,
  }
  const state = useOnOff(props.isSelected, props.defaultSelected ?? false, props.onChange)
  const locked = props.disabled === true || props.readOnly === true

  // Enter toggles as well as Space (the spec asks for parity with the previous library).
  function onKey(event: KeyEvent) {
    if (event.key !== 'Enter' || locked) {
      event.continuePropagation()
      return
    }
    event.preventDefault()
    state.flip(!state.on)
  }

  return (
    <AriaSwitch
      ref={ref}
      id={props.id}
      name={props.name}
      value={props.value}
      isSelected={state.on}
      isDisabled={props.disabled ?? false}
      isReadOnly={props.readOnly ?? false}
      onChange={state.flip}
      onKeyDown={onKey}
      aria-label={props.label ? undefined : props.accessibleLabel}
      aria-labelledby={ids.label}
      aria-describedby={ids.desc}
      className={cx('ty-switch', props.className)}
      data-layout={props.layout ?? 'inline'}
      data-size={props.size ?? 'regular'}
    >
      <span className="ty-switch__track" aria-hidden="true">
        <span className="ty-switch__thumb" />
      </span>
      <Caption labelId={ids.label} label={props.label} descId={ids.desc} description={props.description} />
    </AriaSwitch>
  )
})

export interface SwitchGroupProps {
  label?: string
  children: ReactNode
  className?: string
}

/** Vertical stack of switch rows with an optional group label. */
export function SwitchGroup(props: SwitchGroupProps) {
  const captionId = useId()
  const named = Boolean(props.label)
  return (
    <div className={cx('ty-switch-group', props.className)} role="group" aria-labelledby={named ? captionId : undefined}>
      {named && (
        <span id={captionId} className="ty-switch-group__label">
          {props.label}
        </span>
      )}
      {props.children}
    </div>
  )
}
