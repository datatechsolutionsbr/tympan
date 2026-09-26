import { Check } from 'lucide-react'
import { useId, useRef, type CSSProperties } from 'react'
import { Radio, RadioGroup } from 'react-aria-components'
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

function Cell({ option }: { option: ChoiceGridOption }) {
  return (
    <Radio className="fk-choice-grid__cell" value={option.value}>
      {({ isSelected }) => (
        <>
          {option.symbol ? (
            <span className="fk-choice-grid__symbol" aria-hidden="true">
              {option.symbol}
            </span>
          ) : null}
          <span className="fk-choice-grid__label">{option.label}</span>
          {isSelected ? <Check className="fk-choice-grid__check" aria-hidden="true" focusable="false" /> : null}
        </>
      )}
    </Radio>
  )
}

/** Titled grid of mutually exclusive short options (spec: wave-2/choice-grid.md). */
export function ChoiceGrid({ title, icon: Icon, options, value, onChange, columns = 2, arrangement = 'inline', busy = false, className }: ChoiceGridProps) {
  const titleId = useId()
  const groupRef = useRef<HTMLDivElement>(null)
  useDomAttributes(groupRef, { 'aria-busy': busy ? 'true' : undefined })
  return (
    <RadioGroup
      ref={groupRef}
      className={cx('fk-choice-grid', className)}
      aria-labelledby={titleId}
      value={value}
      onChange={(next) => {
        if (!busy && next !== value) onChange(next)
      }}
      isDisabled={busy}
      orientation="horizontal"
      data-arrangement={arrangement}
      style={{ '--fk-choice-grid-columns': String(columns) } as CSSProperties}
    >
      <div className="fk-choice-grid__header">
        {Icon ? <Icon className="fk-choice-grid__icon" aria-hidden="true" focusable="false" /> : null}
        <span id={titleId} className="fk-choice-grid__title">
          {title}
        </span>
      </div>
      <div className="fk-choice-grid__cells">
        {options.map((o) => (
          <Cell key={o.value} option={o} />
        ))}
      </div>
    </RadioGroup>
  )
}
