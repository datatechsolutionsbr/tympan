import { Search, X } from 'lucide-react'
import type { FocusEvent, ReactNode } from 'react'
import { Button as AriaButton, Input, Label, SearchField } from 'react-aria-components'

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  /** Visible label above the well (design direction §2.10). */
  label?: string
  ariaLabel?: string
  placeholder?: string
  clearLabel: string
  disabled?: boolean
  readOnly?: boolean
  /** Extra content at the end of the well, before the clear control. */
  end?: ReactNode
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void
  describedBy?: string
  className?: string
}

/**
 * The search well shared by FilterField and SearchBar: leading glyph, input,
 * clear control only while there is text. RAC SearchField gives Escape to clear
 * (and lets a second Escape through to an enclosing overlay).
 */
export function SearchInput(p: SearchInputProps) {
  const filled = p.value.length > 0
  return (
    <SearchField
      className={p.className ?? 'fk-search-input'}
      value={p.value}
      onChange={p.onChange}
      isDisabled={p.disabled}
      isReadOnly={p.readOnly}
      aria-label={p.label ? undefined : p.ariaLabel}
      aria-describedby={p.describedBy}
    >
      {p.label ? <Label className="fk-search-input__label">{p.label}</Label> : null}
      <div className="fk-search-input__well" data-filled={filled || undefined}>
        <Search className="fk-search-input__glyph" aria-hidden="true" focusable="false" />
        <Input className="fk-search-input__input" placeholder={p.placeholder} onFocus={p.onFocus} />
        {p.end}
        {filled && !p.readOnly ? (
          <AriaButton className="fk-search-input__clear" aria-label={p.clearLabel}>
            <X aria-hidden="true" focusable="false" />
          </AriaButton>
        ) : null}
      </div>
    </SearchField>
  )
}
