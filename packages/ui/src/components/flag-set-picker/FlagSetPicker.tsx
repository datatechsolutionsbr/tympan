import { useId } from 'react'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import { Checkbox, CheckboxGroup } from '../checkbox/Checkbox'
import { ChoiceCard, ChoiceCardGroup } from '../choice-card/ChoiceCard'

export type FlagSet = Record<string, boolean>

export interface FlagSetPreset {
  id: string
  label: string
  description?: string
  values: FlagSet
}

export interface FlagSetPickerProps {
  values: FlagSet
  onChange: (values: FlagSet) => void
  /** Visible label per key; also the order and the set of keys. */
  labels: Record<string, string>
  descriptions?: Record<string, string>
  presets?: FlagSetPreset[]
  presetId?: string | null
  onPresetChange?: (id: string | null) => void
  label: string
  presetsLabel?: string
  optionsLabel?: string
  className?: string
}

/** Keys that are on, in label order. */
const onKeys = (labels: Record<string, string>, values: FlagSet) => Object.keys(labels).filter((k) => values[k])

/** Named on/off options with optional presets (spec: wave-2/flag-set-picker.md). */
export function FlagSetPicker(props: FlagSetPickerProps) {
  const copy = useMessages().flagSetPicker
  const titleId = useId()
  const presets = props.presets ?? []

  const applyPreset = (id: string) => {
    const preset = presets.find((p) => p.id === id)
    if (!preset) return
    props.onChange({ ...preset.values })
    props.onPresetChange?.(preset.id)
  }

  // A manual edit merges the one change and leaves any preset.
  const applyKeys = (keys: string[]) => {
    const wanted = new Set(keys)
    const changed = Object.keys(props.labels).find((k) => Boolean(props.values[k]) !== wanted.has(k))
    if (changed === undefined) return
    props.onChange({ ...props.values, [changed]: wanted.has(changed) })
    props.onPresetChange?.(null)
  }

  return (
    <div role="group" aria-labelledby={titleId} className={cx('fk-flag-set', props.className)}>
      <span id={titleId} className="fk-flag-set__title">
        {props.label}
      </span>
      {presets.length ? (
        <ChoiceCardGroup
          className="fk-flag-set__presets"
          label={props.presetsLabel ?? copy.presets}
          value={props.presetId ?? null}
          onChange={applyPreset}
          arrangement="inline"
        >
          {presets.map((p) => (
            <ChoiceCard key={p.id} value={p.id} label={p.label} description={p.description} />
          ))}
        </ChoiceCardGroup>
      ) : null}
      <CheckboxGroup label={props.optionsLabel ?? copy.options} value={onKeys(props.labels, props.values)} onChange={applyKeys}>
        {Object.entries(props.labels).map(([key, text]) => (
          <Checkbox key={key} value={key} label={text} description={props.descriptions?.[key]} />
        ))}
      </CheckboxGroup>
    </div>
  )
}
