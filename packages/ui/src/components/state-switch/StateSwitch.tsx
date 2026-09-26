import { Check, X } from 'lucide-react'
import { useId, useRef, type ReactNode, type SyntheticEvent } from 'react'
import { Switch as AriaSwitch } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useDomAttributes } from '../../internal/dom'
import { useMessages } from '../../internal/provider'
import type { IconComponent } from '../../internal/types'

export interface StateSwitchProps {
  /** True is the "on" state. */
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  /** What is switched, e.g. "Agent status"; the stable accessible name. */
  label: string
  offLabel?: string
  onLabel?: string
  offIcon?: IconComponent
  onIcon?: IconComponent
  disabled?: boolean
  /** The host is saving: disabled and busy. */
  pending?: boolean
  className?: string
}

type Side = { key: 'off' | 'on'; text: string; Icon: IconComponent }

function SideLabel({ side, current, id }: { side: Side; current: boolean; id: string }): ReactNode {
  const { Icon } = side
  return (
    <span id={id} className="ty-state-switch__side" data-side={side.key} data-current={current || undefined}>
      <Icon className="ty-state-switch__side-icon" aria-hidden="true" focusable="false" />
      {side.text}
    </span>
  )
}

/** Keeps activation inside the control (e.g. a clickable table row around it). */
const contain = (e: SyntheticEvent) => e.stopPropagation()

/** Switch framed by the names of its two states (spec: wave-2/state-switch.md). */
export function StateSwitch(props: StateSwitchProps) {
  const copy = useMessages().stateSwitch
  const base = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const blocked = Boolean(props.disabled || props.pending)
  const sides: [Side, Side] = [
    { key: 'off', text: props.offLabel ?? copy.off, Icon: props.offIcon ?? X },
    { key: 'on', text: props.onLabel ?? copy.on, Icon: props.onIcon ?? Check },
  ]
  const currentId = `${base}-${props.checked ? 'on' : 'off'}`
  useDomAttributes(inputRef, { 'aria-busy': props.pending ? 'true' : undefined })

  return (
    <span className={cx('ty-state-switch', props.className)} onClick={contain} onKeyDown={contain} onPointerDown={contain}>
      <AriaSwitch
        inputRef={inputRef}
        className="ty-state-switch__control"
        isSelected={props.checked}
        isDisabled={blocked}
        onChange={props.onCheckedChange}
        aria-label={props.label}
        aria-describedby={currentId}
        data-pending={props.pending || undefined}
      >
        <SideLabel side={sides[0]} current={!props.checked} id={`${base}-off`} />
        <span className="ty-state-switch__track" aria-hidden="true">
          <span className="ty-state-switch__thumb" />
        </span>
        <SideLabel side={sides[1]} current={props.checked} id={`${base}-on`} />
      </AriaSwitch>
    </span>
  )
}
