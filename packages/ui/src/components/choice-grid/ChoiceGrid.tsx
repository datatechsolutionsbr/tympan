import { Check } from 'lucide-react'
import { useId, useRef, type CSSProperties, type ReactNode } from 'react'
import { Radio, RadioGroup, type RadioRenderProps } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useDomAttributes } from '../../internal/dom'
import type { IconComponent } from '../../internal/types'

export interface ChoiceGridOption {
  value: string
  /** Flag, emoji or glyph; decorative (the label carries the meaning). */
  symbol?: string
  label: string
}

export interface ChoiceGridProps {
  title: string
  icon?: IconComponent
  options: ChoiceGridOption[]
  value: string
  onChange: (value: string) => void
  columns?: 2 | 3 | 4
  arrangement?: 'inline' | 'stacked'
  busy?: boolean
  className?: string
}

/** Body of one tile, as a function of the radio's render state. */
const tileBody =
  (option: ChoiceGridOption) =>
  (state: RadioRenderProps): ReactNode => [
    option.symbol ? (
      <span key="s" className="ty-choice-grid__symbol" aria-hidden="true">
        {option.symbol}
      </span>
    ) : null,
    <span key="l" className="ty-choice-grid__label">
      {option.label}
    </span>,
    state.isSelected ? <Check key="c" className="ty-choice-grid__check" aria-hidden="true" focusable="false" /> : null,
  ]

function Heading({ id, title, Icon }: { id: string; title: string; Icon?: IconComponent }) {
  return (
    <div className="ty-choice-grid__header">
      {Icon && <Icon className="ty-choice-grid__icon" aria-hidden="true" focusable="false" />}
      <span id={id} className="ty-choice-grid__title">
        {title}
      </span>
    </div>
  )
}

/** Titled grid of mutually exclusive short options (spec: wave-2/choice-grid.md). */
export function ChoiceGrid(props: ChoiceGridProps) {
  const headingId = useId()
  const host = useRef<HTMLDivElement>(null)
  const locked = props.busy === true
  useDomAttributes(host, { 'aria-busy': locked ? 'true' : undefined })
  // Only real changes reach the host, and none while busy.
  const pick = (next: string) => void (!locked && next !== props.value && props.onChange(next))
  const layout = { '--ty-choice-grid-columns': String(props.columns ?? 2) } as CSSProperties

  return (
    <RadioGroup
      ref={host}
      className={cx('ty-choice-grid', props.className)}
      aria-labelledby={headingId}
      orientation="horizontal"
      value={props.value}
      onChange={pick}
      isDisabled={locked}
      data-arrangement={props.arrangement ?? 'inline'}
      style={layout}
    >
      <Heading id={headingId} title={props.title} Icon={props.icon} />
      <div className="ty-choice-grid__cells">
        {props.options.map((option) => (
          <Radio key={option.value} value={option.value} className="ty-choice-grid__cell">
            {tileBody(option)}
          </Radio>
        ))}
      </div>
    </RadioGroup>
  )
}
