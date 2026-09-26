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

/** One option row derived from the labels (which also fix the order). */
type Row = { key: string; text: string; hint?: string; on: boolean }

function rowsOf(props: FlagSetPickerProps): Row[] {
  return Object.entries(props.labels).map(([key, text]) => ({ key, text, hint: props.descriptions?.[key], on: Boolean(props.values[key]) }))
}

/**
 * Reconciles a new checked list with the rows: the single row whose state
 * differs is the edit (a group reports one toggle at a time).
 */
function toggledRow(rows: Row[], checked: readonly string[]): Row | undefined {
  const now = new Set(checked)
  return rows.find((row) => row.on !== now.has(row.key))
}

function PresetChoices({ props, name }: { props: FlagSetPickerProps; name: string }) {
  const list = props.presets ?? []
  if (list.length === 0) return null
  const choose = (id: string) => {
    const preset = list.find((candidate) => candidate.id === id)
    if (!preset) return
    props.onChange({ ...preset.values })
    props.onPresetChange?.(preset.id)
  }
  return (
    <ChoiceCardGroup className="ty-flag-set__presets" label={name} arrangement="inline" value={props.presetId ?? null} onChange={choose}>
      {list.map((preset) => (
        <ChoiceCard key={preset.id} value={preset.id} label={preset.label} description={preset.description} />
      ))}
    </ChoiceCardGroup>
  )
}

/** Named on/off options with optional presets (spec: wave-2/flag-set-picker.md). */
export function FlagSetPicker(props: FlagSetPickerProps) {
  const words = useMessages().flagSetPicker
  const headId = useId()
  const rows = rowsOf(props)

  // A manual edit changes one key and leaves any preset.
  const edit = (checked: string[]) => {
    const row = toggledRow(rows, checked)
    if (!row) return
    props.onChange({ ...props.values, [row.key]: !row.on })
    props.onPresetChange?.(null)
  }

  return (
    <div className={cx('ty-flag-set', props.className)} role="group" aria-labelledby={headId}>
      <span className="ty-flag-set__title" id={headId}>
        {props.label}
      </span>
      <PresetChoices props={props} name={props.presetsLabel ?? words.presets} />
      <CheckboxGroup label={props.optionsLabel ?? words.options} value={rows.filter((r) => r.on).map((r) => r.key)} onChange={edit}>
        {rows.map((row) => (
          <Checkbox key={row.key} value={row.key} label={row.text} description={row.hint} />
        ))}
      </CheckboxGroup>
    </div>
  )
}
