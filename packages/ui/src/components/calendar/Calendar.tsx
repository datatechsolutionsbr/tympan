import {
  CalendarDate,
  endOfMonth,
  getWeeksInMonth,
  startOfMonth,
  startOfWeek,
  today as todayIn,
  getLocalTimeZone,
  type DateValue,
} from '@internationalized/date'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {
  Button as AriaButton,
  Calendar as AriaCalendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  RangeCalendar as AriaRangeCalendar,
  RangeCalendarStateContext,
  I18nProvider,
  useLocale,
} from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import { ListboxSelect } from '../listbox-select/ListboxSelect'

/** A calendar date without time or time zone, exchanged as a local `Date`. */
export type CalendarDay = Date

export interface CalendarRangeValue {
  start: CalendarDay
  end: CalendarDay
}

/** State of one day cell, passed to `renderDay`. */
export interface CalendarDayState {
  isToday: boolean
  isSelected: boolean
  isSelectionStart: boolean
  isSelectionEnd: boolean
  isUnavailable: boolean
  isDisabled: boolean
  isOutsideMonth: boolean
  isFocused: boolean
}

export interface CalendarProps {
  /** Accessible name of the calendar grid group. */
  label: string
  /** Single date or start-to-end range. */
  mode?: 'single' | 'range'
  value: CalendarDay | CalendarRangeValue | null
  defaultValue?: CalendarDay | CalendarRangeValue | null
  onChange: (value: CalendarDay | CalendarRangeValue | null) => void
  minValue?: CalendarDay
  maxValue?: CalendarDay
  /** Days that cannot be chosen (booked, holidays); they stay visible. */
  isDateUnavailable?: (date: CalendarDay) => boolean
  /** Range mode: allow a range spanning unavailable days (they are excluded, not selected). */
  allowsNonContiguousRanges?: boolean
  /** Months shown side by side; paging moves by the whole set. */
  visibleMonths?: 1 | 2 | 3
  /** Paging moves by the visible set or by one month. */
  pageBehavior?: 'visible' | 'single'
  /** Title text, or month and year pickers for far jumps. */
  headerMode?: 'title' | 'pickers'
  /** Adds an ISO week-number column. */
  showWeekNumbers?: boolean
  /** Overrides the first day of the week from the locale. */
  firstDayOfWeek?: 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'
  /** Shows days of neighbouring months (not selectable with several visible months). */
  showOutsideDays?: boolean
  /** Which day holds focus and which month shows. */
  focusedValue?: CalendarDay
  onFocusChange?: (date: CalendarDay) => void
  /** Adds content under the day number (a price, a dot); never replaces it. */
  renderDay?: (date: CalendarDay, state: CalendarDayState) => ReactNode
  /** Footer slot: presets or a note. */
  footer?: ReactNode
  disabled?: boolean
  readOnly?: boolean
  /** Marks the selection invalid (for example a range over unavailable days). */
  isInvalid?: boolean
  /** Error text shown when the selection is invalid. */
  errorMessage?: string
  /** Overrides the locale from the provider. */
  locale?: string
  className?: string
}

const fromDate = (d: Date) => new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
const toDate = (c: CalendarDate) => new Date(c.year, c.month - 1, c.day)

/** ISO-8601 week number: week 1 is the week holding the year's first Thursday. */
function isoWeekNumber(date: CalendarDate): number {
  const target = new Date(Date.UTC(date.year, date.month - 1, date.day))
  const weekday = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - weekday)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

/**
 * Cancels a pending range start on Escape (spec: wave-5-general/calendar.md,
 * keyboard section). Listens on the calendar root so the key bubbles from the
 * focused day cell, and stops propagation so an enclosing popover stays open.
 */
function RangeEscapeCancel() {
  const state = useContext(RangeCalendarStateContext)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const root = ref.current?.parentElement
    if (!root || !state) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !state.anchorDate) return
      e.stopPropagation()
      state.setAnchorDate(null)
    }
    root.addEventListener('keydown', onKey)
    return () => root.removeEventListener('keydown', onKey)
  }, [state])
  return <span ref={ref} aria-hidden="true" hidden />
}

/**
 * A month grid for picking a date or a date range directly on the page
 * (spec: wave-5-general/calendar.md). Single mode rides RAC Calendar, range
 * mode RAC RangeCalendar; both follow the APG Date Picker Dialog grid.
 */
export function Calendar(props: CalendarProps) {
  const t = useMessages().calendar
  const { locale: contextLocale } = useLocale()
  const locale = props.locale ?? contextLocale
  const mode = props.mode ?? 'single'
  const months = props.visibleMonths ?? 1
  const now = todayIn(getLocalTimeZone())

  const [innerValue, setInnerValue] = useState<CalendarDay | CalendarRangeValue | null>(
    () => props.value ?? props.defaultValue ?? null,
  )
  const value = props.value !== undefined ? props.value : innerValue
  const valueStart = value && 'start' in value ? value.start : (value as CalendarDay | null)
  const [innerFocused, setInnerFocused] = useState<CalendarDate>(() => (valueStart ? fromDate(valueStart) : now))
  const focused = props.focusedValue ? fromDate(props.focusedValue) : innerFocused
  const setFocused = (d: CalendarDate) => {
    if (!props.focusedValue) setInnerFocused(d)
    props.onFocusChange?.(toDate(d))
  }
  const report = (next: CalendarDay | CalendarRangeValue | null) => {
    if (props.value === undefined) setInnerValue(next)
    props.onChange(next)
  }

  const min = props.minValue ? fromDate(props.minValue) : undefined
  const max = props.maxValue ? fromDate(props.maxValue) : undefined
  const baseUnavailable = (d: DateValue) => (props.isDateUnavailable ? props.isDateUnavailable(toDate(d as CalendarDate)) : false)

  const monthYearFmt = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
  const monthFmt = new Intl.DateTimeFormat(locale, { month: 'long' })
  const headings = Array.from({ length: months }, (_, i) => toDate(startOfMonth(focused).add({ months: i })))
  const heading = headings
    .map((d, i) => (i === 0 || d.getFullYear() !== headings[i - 1]!.getFullYear() ? monthYearFmt.format(d) : monthFmt.format(d)))
    .join(' – ')

  const step = props.pageBehavior === 'single' ? 1 : months
  const prevTarget = startOfMonth(focused).subtract({ months: step })
  const nextTarget = startOfMonth(focused).add({ months: step })
  const baseId = useId()
  const headingId = `${baseId}-heading`

  const pickerYears = (() => {
    const from = Math.max(focused.year - 30, min?.year ?? focused.year - 30)
    const to = Math.min(focused.year + 30, max?.year ?? focused.year + 30)
    const list: number[] = []
    for (let y = from; y <= to; y++) list.push(y)
    return list
  })()
  const monthAllowed = (monthIndex: number) => {
    const first = new CalendarDate(focused.year, monthIndex + 1, 1)
    const last = endOfMonth(first)
    return (!max || first.compare(max) <= 0) && (!min || last.compare(min) >= 0)
  }

  const invalid = !!props.isInvalid || !!props.errorMessage
  const errorId = invalid && props.errorMessage ? `${baseId}-error` : undefined

  const renderGrid = (offsetMonths: number) => {
    const anchor = startOfMonth(focused).add({ months: offsetMonths })
    const weeks = getWeeksInMonth(anchor, locale)
    const weekStarts = Array.from({ length: weeks }, (_, w) => startOfWeek(anchor.add({ weeks: w }), locale))
    return (
      <div className="ty-calendar__month">
        {props.showWeekNumbers ? (
          <div className="ty-calendar__weeks" aria-hidden="true">
            {weekStarts.map((week) => (
              <span key={week.toString()} className="ty-calendar__week">
                {isoWeekNumber(week)}
              </span>
            ))}
          </div>
        ) : null}
        <CalendarGrid className="ty-calendar__grid" weekdayStyle="short" offset={offsetMonths ? { months: offsetMonths } : undefined}>
          <CalendarGridHeader>
            {(day) => <CalendarHeaderCell className="ty-calendar__weekday">{day}</CalendarHeaderCell>}
          </CalendarGridHeader>
          <CalendarGridBody>
            {(date) => (
              <CalendarCell date={date} className="ty-calendar__day">
                {({ formattedDate, isToday, isSelected, isSelectionStart, isSelectionEnd, isUnavailable, isDisabled, isOutsideMonth, isFocused }) => (
                  <span className="ty-calendar__day-box" data-today={isToday || undefined}>
                    <span className="ty-calendar__day-number">{formattedDate}</span>
                    {props.renderDay
                      ? props.renderDay(toDate(date), {
                          isToday,
                          isSelected,
                          isSelectionStart,
                          isSelectionEnd,
                          isUnavailable,
                          isDisabled,
                          isOutsideMonth,
                          isFocused,
                        })
                      : null}
                  </span>
                )}
              </CalendarCell>
            )}
          </CalendarGridBody>
        </CalendarGrid>
      </div>
    )
  }

  const header =
    props.headerMode === 'pickers' ? (
      <div className="ty-calendar__pickers">
        <ListboxSelect
          accessibleLabel={t.monthPicker}
          className="ty-calendar__picker"
          value={String(focused.month)}
          onChange={(key) => setFocused(focused.set({ month: Number(key) }))}
          options={Array.from({ length: 12 }, (_, m) => ({
            value: String(m + 1),
            label: monthFmt.format(new Date(2020, m, 15)),
            disabled: !monthAllowed(m),
          }))}
        />
        <ListboxSelect
          accessibleLabel={t.yearPicker}
          className="ty-calendar__picker"
          value={String(focused.year)}
          onChange={(key) => setFocused(focused.set({ year: Number(key), day: 1 }))}
          options={pickerYears.map((y) => ({ value: String(y), label: String(y) }))}
        />
      </div>
    ) : (
      <span className="ty-calendar__heading" id={headingId} aria-live="polite">
        {heading}
      </span>
    )

  const stepper = (
    // Lives inside the AriaCalendar/AriaRangeCalendar: the slot="previous" and
    // slot="next" buttons only receive their wiring from the calendar context.
    <div className="ty-calendar__stepper">
      <AriaButton slot="previous" className="ty-calendar__nav" aria-label={t.previousMonth(monthYearFmt.format(toDate(prevTarget)))}>
        <ChevronLeft className="ty-icon ty-mirror-rtl" aria-hidden="true" focusable="false" />
      </AriaButton>
      {header}
      <AriaButton slot="next" className="ty-calendar__nav" aria-label={t.nextMonth(monthYearFmt.format(toDate(nextTarget)))}>
        <ChevronRight className="ty-icon ty-mirror-rtl" aria-hidden="true" focusable="false" />
      </AriaButton>
    </div>
  )

  const shared = {
    'aria-label': props.label,
    minValue: min,
    maxValue: max,
    isDisabled: props.disabled,
    isReadOnly: props.readOnly,
    pageBehavior: props.pageBehavior ?? 'visible',
    firstDayOfWeek: props.firstDayOfWeek,
    visibleDuration: { months },
    focusedValue: focused,
    onFocusChange: setFocused,
    isInvalid: invalid || undefined,
  } as const

  return (
    <I18nProvider locale={locale}>
      <div
        className={cx('ty-calendar', props.className)}
        data-mode={mode}
        data-months={months}
        data-outside-days={props.showOutsideDays === false ? undefined : ''}
        data-invalid={invalid || undefined}
      >
        <div className="ty-calendar__body">
          {mode === 'range' ? (
            <AriaRangeCalendar
              {...shared}
              className="ty-calendar__rac"
              value={value && 'start' in value ? { start: fromDate(value.start), end: fromDate(value.end) } : null}
              onChange={(range) => {
                if (!range) return report(null)
                report({ start: toDate(range.start as CalendarDate), end: toDate(range.end as CalendarDate) })
              }}
              isDateUnavailable={baseUnavailable}
              allowsNonContiguousRanges={props.allowsNonContiguousRanges}
            >
              <RangeEscapeCancel />
              {stepper}
              {Array.from({ length: months }, (_, i) => renderGrid(i))}
            </AriaRangeCalendar>
          ) : (
            <AriaCalendar
              {...shared}
              className="ty-calendar__rac"
              value={value && 'start' in value ? null : (value ? fromDate(value as CalendarDay) : null)}
              onChange={(d) => report(d ? toDate(d as CalendarDate) : null)}
              isDateUnavailable={baseUnavailable}
            >
              {stepper}
              {Array.from({ length: months }, (_, i) => renderGrid(i))}
            </AriaCalendar>
          )}
        </div>
        {errorId ? (
          <p className="ty-calendar__error" id={errorId} role="alert">
            {props.errorMessage}
          </p>
        ) : null}
        {props.footer ? <div className="ty-calendar__footer">{props.footer}</div> : null}
      </div>
    </I18nProvider>
  )
}
