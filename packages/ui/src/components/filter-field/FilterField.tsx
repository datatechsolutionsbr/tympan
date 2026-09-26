import { useId } from 'react'
import { cx } from '../../internal/cx'
import { devWarning } from '../../internal/dev'
import { LiveNote } from '../../internal/forms-a/LiveNote'
import { SearchInput } from '../../internal/forms-a/SearchInput'
import { useMessages } from '../../internal/provider'

export interface FilterFieldProps {
  value: string
  onChange: (value: string) => void
  label?: string
  /** Name when there is no visible label; the placeholder is never the name. */
  ariaLabel?: string
  placeholder?: string
  clearLabel?: string
  /** For example "12 results"; announced politely once typing pauses. */
  resultCountText?: string
  disabled?: boolean
  readOnly?: boolean
  className?: string
}

/** Narrows a list on the same page while typing (spec: wave-2/filter-field.md). */
export function FilterField(props: FilterFieldProps) {
  const clear = props.clearLabel ?? useMessages().filterField.clear
  const noteId = useId()
  devWarning(!props.label && !props.ariaLabel, 'FilterField: provide `label` or `ariaLabel`; the placeholder is not a name.')
  return (
    <div className={cx('ty-filter-field', props.className)}>
      <SearchInput
        value={props.value}
        onChange={props.onChange}
        label={props.label}
        ariaLabel={props.ariaLabel}
        placeholder={props.placeholder}
        clearLabel={clear}
        disabled={props.disabled}
        readOnly={props.readOnly}
      />
      {props.resultCountText !== undefined ? <LiveNote id={noteId} text={props.resultCountText} /> : null}
    </div>
  )
}
