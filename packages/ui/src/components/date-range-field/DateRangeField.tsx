import { CalendarDate, today as todayIn, getLocalTimeZone } from '@internationalized/date'
import { CalendarDays } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { Button as AriaButton, DateInput, DateRangePicker, DateSegment, Group, I18nProvider, useLocale } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { FieldLine, FloatSurface, joinIds, usePhoneWidth } from '../../internal/forms-b/parts'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'
import { Calendar } from '../calendar/Calendar'

/** A start-to-end range of calendar dates without time, exchanged as local `Date`s. */
export interface DateRangeFieldValue {
  start: Date | null
  end: Date | null
}

/** One quick choice in the popover: `{ id, label, range }`. */
export interface DateRangePreset {
  id: string
  label: string
  range: DateRangeFieldValue
}

export interface DateRangeFieldProps {
  label: string
  value: DateRangeFieldValue | null
  defaultValue?: DateRangeFieldValue | null
  onChange: (value: DateRangeFieldValue | null) => void
  minValue?: Date
  maxValue?: Date
  isDateUnavailable?: (date: Date) => boolean
  /** Longest allowed range in days; longer ranges are invalid. */
  maxDays?: number
  /** Quick choices shown beside or above the calendar. */
  presets?: DateRangePreset[]
  /** Immediate: the second pick commits and closes. Apply: picks are a draft until Apply. */
  confirmation?: 'immediate' | 'apply'
  /** Months in the popover (one on narrow screens whatever the value). */
  visibleMonths?: 1 | 2
  /** Form field names; both dates submit in ISO format. */
  startName?: string
  endName?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  errorText?: string
  hint?: ReactNode
  /** Overrides the locale from the provider. */
  locale?: string
  className?: string
}

const fromDate = (d: Date | null) => (d ? new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate()) : null)
const toDate = (c: CalendarDate | null) => (c ? new Date(c.year, c.month - 1, c.day) : null)
const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86400000)

/**
 * Enter a start and end date by typing into segmented date inputs or by
 * picking in a Calendar popover (spec: wave-5-general/date-range-field.md).
 * Built on RAC DateRangePicker; APG Date Picker Dialog.
 */
export function DateRangeField(props: DateRangeFieldProps) {
  const t = useMessages().dateRangeField
  const { locale: contextLocale } = useLocale()
  const now = todayIn(getLocalTimeZone())

  const [innerValue, setInnerValue] = useState<DateRangeFieldValue | null>(() => props.value ?? props.defaultValue ?? null)
  const value = props.value !== undefined ? props.value : innerValue
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRangeFieldValue | null>(null)
  const phone = usePhoneWidth()
  const months: 1 | 2 = phone ? 1 : (props.visibleMonths ?? 2)
  const confirmation = props.confirmation ?? 'immediate'

  const commit = (next: DateRangeFieldValue | null) => {
    if (props.value === undefined) setInnerValue(next)
    props.onChange(next)
  }

  const shown = open && confirmation === 'apply' ? draft : value
  const shownRange = shown && (shown.start || shown.end) ? { start: fromDate(shown.start), end: fromDate(shown.end) } : null
  const racValue = shownRange && shownRange.start && shownRange.end ? { start: shownRange.start, end: shownRange.end } : null

  // Validation: the host text wins, then the computed reasons.
  const computedInvalid = (() => {
    const start = value?.start
    const end = value?.end
    if (!start || !end) return null
    if (end.getTime() < start.getTime()) return t.endBeforeStart
    if (props.maxDays != null && daysBetween(start, end) + 1 > props.maxDays) return t.tooManyDays(props.maxDays)
    if (props.minValue && start.getTime() < props.minValue.getTime()) return t.outOfBounds
    if (props.maxValue && end.getTime() > props.maxValue.getTime()) return t.outOfBounds
    if (props.isDateUnavailable) {
      const cursor = new Date(start.getTime())
      while (cursor.getTime() <= end.getTime()) {
        if (props.isDateUnavailable(cursor)) return t.unavailableDay
        cursor.setDate(cursor.getDate() + 1)
      }
    }
    return null
  })()
  const errorMessage = props.errorText ?? computedInvalid ?? undefined
  const invalid = !!errorMessage

  const base = useId()
  const labelId = `${base}-label`
  const hintId = props.hint != null && !errorMessage ? `${base}-hint` : undefined
  const errorId = errorMessage ? `${base}-error` : undefined

  const openChange = (next: boolean) => {
    if (next) setDraft(value ? { ...value } : null)
    setOpen(next)
  }

  const pickFromCalendar = (range: { start: Date; end: Date } | null) => {
    if (confirmation === 'apply') {
      setDraft(range)
      return
    }
    commit(range)
    setOpen(false)
  }

  const typed = (range: { start: CalendarDate | null; end: CalendarDate | null } | null) => {
    const next: DateRangeFieldValue | null = range && (range.start || range.end) ? { start: toDate(range.start), end: toDate(range.end) } : null
    if (open && confirmation === 'apply') setDraft(next)
    else commit(next)
  }

  const applyPreset = (preset: DateRangePreset) => {
    if (confirmation === 'apply') {
      setDraft({ ...preset.range })
      return
    }
    commit({ ...preset.range })
    setOpen(false)
  }

  const calendar = (
    <Calendar
      label={props.label}
      mode="range"
      value={draft && draft.start && draft.end ? { start: draft.start, end: draft.end } : null}
      onChange={(next) => pickFromCalendar(next as { start: Date; end: Date } | null)}
      minValue={props.minValue}
      maxValue={props.maxValue}
      isDateUnavailable={props.isDateUnavailable}
      visibleMonths={months}
      focusedValue={draft?.start ?? (value?.start ?? new Date(now.year, now.month - 1, now.day))}
      isInvalid={invalid}
    />
  )

  return (
    <I18nProvider locale={props.locale ?? contextLocale}>
      <div className={cx('ty-date-range-field', props.className)} data-invalid={invalid || undefined}>
        <FieldLine kind="label" id={labelId}>
          <span>{props.label}</span>
        </FieldLine>
        {hintId ? (
          <FieldLine kind="hint" id={hintId}>
            {props.hint}
          </FieldLine>
        ) : null}
        <DateRangePicker
          className="ty-date-range-field__picker"
          value={racValue}
          onChange={typed}
          isOpen={open}
          onOpenChange={openChange}
          shouldCloseOnSelect={false}
          startName={props.startName}
          endName={props.endName}
          minValue={fromDate(props.minValue ?? null) ?? undefined}
          maxValue={fromDate(props.maxValue ?? null) ?? undefined}
          isDateUnavailable={(d) => (props.isDateUnavailable ? props.isDateUnavailable(toDate(d as CalendarDate)!) : false)}
          isDisabled={props.disabled}
          isReadOnly={props.readOnly}
          isRequired={props.required}
          isInvalid={invalid || undefined}
          aria-labelledby={labelId}
          aria-describedby={joinIds(hintId, errorId)}
        >
          <Group className="ty-date-range-field__group">
            <DateInput slot="start" className="ty-date-range-field__input" aria-label={`${props.label}: ${t.start}`}>
              {(segment) => <DateSegment segment={segment} className="ty-date-range-field__segment" />}
            </DateInput>
            <span className="ty-date-range-field__dash" aria-hidden="true">
              –
            </span>
            <DateInput slot="end" className="ty-date-range-field__input" aria-label={`${props.label}: ${t.end}`}>
              {(segment) => <DateSegment segment={segment} className="ty-date-range-field__segment" />}
            </DateInput>
            <AriaButton className="ty-date-range-field__trigger" aria-label={props.label}>
              <CalendarDays className="ty-icon" aria-hidden="true" focusable="false" />
            </AriaButton>
          </Group>
          <FloatSurface labelledBy={labelId} className="ty-date-range-field__surface">
            <div className="ty-date-range-field__panel">
              {props.presets?.length ? (
                <div className="ty-date-range-field__presets" role="group" aria-label={t.presets}>
                  {props.presets.map((preset) => (
                    <Button key={preset.id} variant="quiet" size="compact" onPress={() => applyPreset(preset)}>
                      {preset.label}
                    </Button>
                  ))}
                </div>
              ) : null}
              {calendar}
              {confirmation === 'apply' ? (
                <div className="ty-date-range-field__actions">
                  <Button variant="quiet" size="compact" onPress={() => openChange(false)}>
                    {t.cancel}
                  </Button>
                  <Button variant="primary" size="compact" onPress={() => { commit(draft); setOpen(false) }}>
                    {t.apply}
                  </Button>
                </div>
              ) : null}
            </div>
          </FloatSurface>
        </DateRangePicker>
        {errorId ? (
          <FieldLine kind="error" id={errorId}>
            {errorMessage}
          </FieldLine>
        ) : null}
      </div>
    </I18nProvider>
  )
}
