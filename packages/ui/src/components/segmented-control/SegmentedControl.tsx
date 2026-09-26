import { useState } from 'react'
import { Radio, RadioGroup } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { requestHaptic } from '../../internal/haptics'
import type { IconComponent } from '../../internal/types'

export type SegmentedOption = string | { value: string; label: string; icon?: IconComponent }

export interface SegmentedControlProps {
  /** Two to five segments; a string is both value and label. */
  options: SegmentedOption[]
  value?: string
  defaultValue?: string
  /** Called only when the value actually changes. */
  onChange: (value: string) => void
  /** Accessible name of the group. */
  label: string
  size?: 'compact' | 'regular' | 'large'
  fullWidth?: boolean
  disabled?: boolean
  /** Hide labels visually; labels remain the accessible names. */
  iconOnly?: boolean
  className?: string
}

interface Segment {
  value: string
  label: string
  icon?: IconComponent
}

const asSegment = (o: SegmentedOption): Segment => (typeof o === 'string' ? { value: o, label: o } : o)

/**
 * Selection that may be controlled (`value`) or local. `commit` ignores a
 * re-selection of the current value, so hosts only hear real changes.
 */
function useSelection(controlled: string | undefined, initial: string, notify: (v: string) => void) {
  const [local, setLocal] = useState(initial)
  const active = controlled === undefined ? local : controlled
  const commit = (next: string) => {
    if (next === active) return
    if (controlled === undefined) setLocal(next)
    requestHaptic('light')
    notify(next)
  }
  return [active, commit] as const
}

function SegmentButton({ segment, hideText, hint }: { segment: Segment; hideText: boolean; hint: boolean }) {
  const Glyph = segment.icon
  return (
    <Radio value={segment.value} className="ty-segmented-control__segment" aria-label={hideText ? segment.label : undefined}>
      {Glyph && <Glyph className="ty-icon" aria-hidden="true" focusable="false" />}
      <span className={hideText ? 'ty-visually-hidden' : 'ty-segmented-control__label'} title={hint ? segment.label : undefined}>
        {segment.label}
      </span>
    </Radio>
  )
}

/** Exactly one of a small set of options, changed in place (spec: wave-1/segmented-control.md). */
export function SegmentedControl(props: SegmentedControlProps) {
  const segments = props.options.map(asSegment)
  const [active, commit] = useSelection(props.value, props.defaultValue ?? segments[0]?.value ?? '', props.onChange)
  const stretched = props.fullWidth === true
  const iconOnly = props.iconOnly === true
  return (
    <RadioGroup
      className={cx('ty-segmented-control', props.className)}
      aria-label={props.label}
      orientation="horizontal"
      isDisabled={props.disabled ?? false}
      value={active}
      onChange={commit}
      data-size={props.size ?? 'regular'}
      data-full-width={stretched || undefined}
      data-icon-only={iconOnly || undefined}
    >
      {segments.map((s) => (
        <SegmentButton key={s.value} segment={s} hideText={iconOnly} hint={stretched} />
      ))}
    </RadioGroup>
  )
}
