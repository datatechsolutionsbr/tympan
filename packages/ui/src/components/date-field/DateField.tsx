import { CalendarDate, getLocalTimeZone, today as todayIn } from '@internationalized/date'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import {
  Button as AriaButton,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DialogTrigger,
  useLocale,
} from 'react-aria-components'
import { cx } from '../../internal/cx'
import { FieldLine, FloatSurface, MonthGrid, StepperHeader, joinIds, monthKey } from '../../internal/forms-b/parts'
import { useMessages } from '../../internal/provider'
import { Button } from '../button/Button'

export interface DateFieldProps {
  value: Date | null
  onChange: (date: Date | null) => void
  label: string
  /** Hides the visible label (it stays the accessible name). */
  hideLabel?: boolean
  placeholder?: string
  minValue?: Date
  maxValue?: Date
  disallowFuture?: boolean
  yearRange?: { from: number; to: number }
  locale?: string
  isInvalid?: boolean
  errorText?: string
  hint?: ReactNode
  disabled?: boolean
  className?: string
}

type View = 'days' | 'months'

const fromDate = (d: Date) => new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
const toDate = (c: CalendarDate) => new Date(c.year, c.month - 1, c.day)
const earlier = (a?: CalendarDate, b?: CalendarDate) => (!a ? b : !b ? a : a.compare(b) <= 0 ? a : b)

/** The allowed range as calendar dates (disallowFuture tightens the upper bound to today). */
function useBounds(p: DateFieldProps) {
  const now = todayIn(getLocalTimeZone())
  const min = p.minValue ? fromDate(p.minValue) : undefined
  const max = earlier(p.maxValue ? fromDate(p.maxValue) : undefined, p.disallowFuture ? now : undefined)
  const within = (d: CalendarDate) => (!min || d.compare(min) >= 0) && (!max || d.compare(max) <= 0)
  return { now, min, max, within }
}

/**
 * A calendar date chosen from a trigger that opens a day grid, with a
 * month-and-year view for distant dates (spec: wave-2/date-field.md).
 */
export function DateField(props: DateFieldProps) {
  const m = useMessages()
  const { locale: contextLocale } = useLocale()
  const locale = props.locale ?? contextLocale
  const t = m.dateField
  const { now, min, max, within } = useBounds(props)
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('days')
  const [focused, setFocused] = useState<CalendarDate>(() => (props.value ? fromDate(props.value) : now))
  const base = useId()
  const labelId = `${base}-label`
  const textId = `${base}-text`
  const hintId = props.hint != null && !props.errorText ? `${base}-hint` : undefined
  const errorId = props.errorText ? `${base}-error` : undefined
  const invalid = !!props.isInvalid || !!props.errorText

  const openChange = (next: boolean) => {
    if (next) {
      // Every opening starts on the value's (or today's) month, in day view.
      setFocused(props.value ? fromDate(props.value) : now)
      setView('days')
    }
    setOpen(next)
  }
  const choose = (d: CalendarDate | null) => {
    props.onChange(d ? toDate(d) : null)
    setOpen(false)
  }

  const longDate = new Intl.DateTimeFormat(locale, { dateStyle: 'long' })
  const monthYear = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
  const heading = monthYear.format(toDate(focused))

  const years = (() => {
    const from = Math.max(props.yearRange?.from ?? now.year - 10, min?.year ?? -Infinity)
    const to = Math.min(props.yearRange?.to ?? now.year + 3, max?.year ?? Infinity)
    const list: number[] = []
    for (let y = to; y >= from; y--) list.push(y)
    return list
  })()
  const monthAllowed = (key: string) => {
    const [y, mo] = key.split('-').map(Number) as [number, number]
    const first = new CalendarDate(y, mo, 1)
    const last = first.add({ months: 1 }).subtract({ days: 1 })
    return (!max || first.compare(max) <= 0) && (!min || last.compare(min) >= 0)
  }
  const setYear = (year: number) => setFocused((f) => f.set({ year }))

  const calendar = (
    <Calendar
      className="ty-date-field__calendar"
      aria-label={props.label}
      value={props.value ? fromDate(props.value) : null}
      onChange={(d) => choose(d as CalendarDate)}
      focusedValue={focused}
      onFocusChange={(d) => setFocused(d as CalendarDate)}
      minValue={min}
      maxValue={max}
      autoFocus
    >
      <div className="ty-fb-stepper">
        <AriaButton slot="previous" className="ty-fb-nav" aria-label={t.previousMonth}>
          <ChevronLeft className="ty-icon ty-mirror-rtl" aria-hidden="true" focusable="false" />
        </AriaButton>
        <AriaButton slot={null} className="ty-date-field__heading" onPress={() => setView('months')} aria-label={t.chooseMonth(heading)}>
          <span aria-live="polite">{heading}</span>
        </AriaButton>
        <AriaButton slot="next" className="ty-fb-nav" aria-label={t.nextMonth}>
          <ChevronRight className="ty-icon ty-mirror-rtl" aria-hidden="true" focusable="false" />
        </AriaButton>
      </div>
      <CalendarGrid className="ty-date-field__grid" weekdayStyle="short">
        <CalendarGridHeader>{(day) => <CalendarHeaderCell className="ty-date-field__weekday">{day}</CalendarHeaderCell>}</CalendarGridHeader>
        <CalendarGridBody>
          {(date) => (
            <CalendarCell date={date} className="ty-date-field__day">
              {({ formattedDate, isToday }) => (
                <span className="ty-date-field__day-number" data-today={isToday || undefined}>
                  {formattedDate}
                </span>
              )}
            </CalendarCell>
          )}
        </CalendarGridBody>
      </CalendarGrid>
    </Calendar>
  )
  const todayRow = (
    <div className="ty-date-field__footer">
      <Button variant="quiet" size="compact" disabled={!within(now)} onPress={() => choose(now)}>
        {t.today}
      </Button>
    </div>
  )

  const monthView = (
    <div className="ty-date-field__months">
      <StepperHeader
        heading={focused.year}
        previousLabel={t.previousYear}
        nextLabel={t.nextYear}
        previousDisabled={!!min && focused.year <= min.year}
        nextDisabled={!!max && focused.year >= max.year}
        onPrevious={() => setYear(focused.year - 1)}
        onNext={() => setYear(focused.year + 1)}
      />
      <MonthGrid
        year={focused.year}
        locale={locale}
        label={t.months}
        isAvailable={monthAllowed}
        selected={props.value ? monthKey(props.value.getFullYear(), props.value.getMonth()) : null}
        onChoose={(key) => {
          const mo = Number(key.slice(5))
          setFocused((f) => f.set({ month: mo, day: 1 }))
          setView('days')
        }}
        onYearStep={(d) => setYear(focused.year + d)}
      />
      {years.length > 1 ? (
        <div className="ty-fb-chips" role="group" aria-label={t.years}>
          {years.map((y) => (
            <AriaButton key={y} className="ty-fb-chip" aria-pressed={y === focused.year} onPress={() => setYear(y)}>
              {y}
            </AriaButton>
          ))}
        </div>
      ) : null}
      <Button variant="quiet" size="compact" onPress={() => setView('days')}>
        {t.backToDays}
      </Button>
    </div>
  )

  return (
    <div className={cx('ty-date-field', props.className)} data-invalid={invalid || undefined}>
      <FieldLine kind="label" id={labelId}>
        <span className={props.hideLabel ? 'ty-visually-hidden' : undefined}>{props.label}</span>
      </FieldLine>
      {hintId ? (
        <FieldLine kind="hint" id={hintId}>
          {props.hint}
        </FieldLine>
      ) : null}
      <DialogTrigger isOpen={open} onOpenChange={openChange}>
        <AriaButton
          className="ty-fb-trigger"
          isDisabled={props.disabled}
          aria-labelledby={`${labelId} ${textId}`}
          aria-describedby={joinIds(hintId, errorId)}
          data-invalid={invalid || undefined}
        >
          <span className="ty-fb-trigger__glyph" aria-hidden="true">
            <CalendarDays />
          </span>
          <span id={textId} className="ty-fb-trigger__text" data-placeholder={props.value ? undefined : true}>
            {props.value ? longDate.format(props.value) : (props.placeholder ?? t.placeholder)}
          </span>
        </AriaButton>
        <FloatSurface labelledBy={labelId} className="ty-date-field__surface">
          {view === 'days' ? (
            <>
              {calendar}
              {todayRow}
            </>
          ) : (
            monthView
          )}
        </FloatSurface>
      </DialogTrigger>
      {errorId ? (
        <FieldLine kind="error" id={errorId}>
          {props.errorText}
        </FieldLine>
      ) : null}
    </div>
  )
}
