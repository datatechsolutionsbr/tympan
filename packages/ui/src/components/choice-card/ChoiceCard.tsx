import { createContext, useContext, useId, useRef, type ReactNode } from 'react'
import { Label, Radio, RadioGroup, ToggleButton } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useDomAttributes } from '../../internal/dom'
import { SelectedMark } from '../../internal/forms-a/marks'

export type ChoiceCardArrangement = 'stacked' | 'inline'

export interface ChoiceCardProps {
  /** Standalone or multi-choice use; inside a ChoiceCardGroup the group decides. */
  selected?: boolean
  onSelect?: () => void
  /** Key of the card inside a ChoiceCardGroup. */
  value?: string
  label: string
  description?: string
  icon?: ReactNode
  arrangement?: ChoiceCardArrangement
  available?: boolean
  unavailableReason?: string
  /** Small tag next to the name (e.g. "recommended"). */
  trailing?: ReactNode
  className?: string
}

interface GroupShape {
  arrangement: ChoiceCardArrangement
}
const InGroup = createContext<GroupShape | null>(null)

interface Parts {
  props: ChoiceCardProps
  checked: boolean
  labelId: string
  descId: string
}

/** Inner layout shared by the radio and toggle renderings. */
function Face({ props, checked, labelId, descId }: Parts) {
  const blocked = props.available === false
  const text = blocked ? (props.unavailableReason ?? props.description) : props.description
  const arrangement = props.arrangement ?? 'stacked'
  return (
    <>
      {props.icon ? (
        <span className="fk-choice-card__well" aria-hidden="true">
          {props.icon}
        </span>
      ) : null}
      <span className="fk-choice-card__body">
        <span className="fk-choice-card__title">
          <span id={labelId} className="fk-choice-card__name">
            {props.label}
          </span>
          {props.trailing ? <span className="fk-choice-card__trailing">{props.trailing}</span> : null}
        </span>
        {text ? (
          <span id={descId} className={arrangement === 'inline' || blocked ? 'fk-choice-card__description' : 'fk-visually-hidden'}>
            {text}
          </span>
        ) : null}
      </span>
      <SelectedMark shown={checked} />
    </>
  )
}

/** Selectable card for pickers (spec: wave-2/choice-card.md). */
export function ChoiceCard(props: ChoiceCardProps) {
  const group = useContext(InGroup)
  const ids = useId()
  const labelId = `${ids}-l`
  const descId = `${ids}-d`
  const blocked = props.available === false
  const hasText = Boolean(blocked ? (props.unavailableReason ?? props.description) : props.description)
  const arrangement = props.arrangement ?? group?.arrangement ?? 'stacked'
  const common = {
    className: cx('fk-choice-card', props.className),
    'data-arrangement': arrangement,
    'data-unavailable': blocked || undefined,
    'aria-labelledby': labelId,
    'aria-describedby': hasText ? descId : undefined,
  }
  const faceProps = { ...props, arrangement }
  // Tooltip with the reason (RAC does not forward `title`).
  const buttonRef = useRef<HTMLButtonElement>(null)
  useDomAttributes(buttonRef, { title: !group && blocked ? props.unavailableReason : undefined })

  if (group) {
    return (
      <Radio {...common} value={props.value ?? props.label} isDisabled={blocked}>
        {({ isSelected }) => <Face props={faceProps} checked={isSelected} labelId={labelId} descId={descId} />}
      </Radio>
    )
  }

  const checked = Boolean(props.selected)
  return (
    <ToggleButton
      {...common}
      isSelected={checked}
      aria-disabled={blocked || undefined}
      ref={buttonRef}
      onChange={() => {
        if (!blocked) props.onSelect?.()
      }}
    >
      <Face props={faceProps} checked={checked} labelId={labelId} descId={descId} />
    </ToggleButton>
  )
}

export interface ChoiceCardGroupProps {
  label: string
  value: string | null
  onChange: (value: string) => void
  arrangement?: ChoiceCardArrangement
  orientation?: 'horizontal' | 'vertical'
  children: ReactNode
  className?: string
}

/** Single-choice set of ChoiceCards (APG Radio Group). */
export function ChoiceCardGroup({ label, value, onChange, arrangement = 'stacked', orientation = 'vertical', children, className }: ChoiceCardGroupProps) {
  return (
    <RadioGroup
      className={cx('fk-choice-card-group', className)}
      value={value}
      onChange={onChange}
      orientation={orientation}
      data-arrangement={arrangement}
    >
      <Label className="fk-choice-card-group__label">{label}</Label>
      <div className="fk-choice-card-group__cards">
        <InGroup.Provider value={{ arrangement }}>{children}</InGroup.Provider>
      </div>
    </RadioGroup>
  )
}
