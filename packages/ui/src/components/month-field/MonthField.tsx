import { CalendarDays } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Button as AriaButton, DialogTrigger, useLocale } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { FloatSurface, MonthGrid, StepperHeader, type FloatSide } from '../../internal/forms-b/parts'
import { useMessages } from '../../internal/provider'

export interface MonthFieldProps {
  /** "YYYY-MM", or "" for none. */
  value: string
  onChange: (value: string) => void
  /** Months with data, "YYYY-MM". */
  availableMonths: string[]
  label: string
  placeholder?: string
  /** Replaces the trigger content; the accessible name stays label plus value. */
  triggerContent?: ReactNode
  /** Borderless trigger for a composite bar. */
  embedded?: boolean
  placement?: FloatSide
  locale?: string
  disabled?: boolean
  className?: string
}

/** A "YYYY-MM" key split into numbers. */
const parts = (key: string) => ({ y: Number(key.slice(0, 4)), m: Number(key.slice(5, 7)) })

/** What the month data allows: the years with data (newest first), their bounds and the lookup set. */
function calendarOf(months: string[]) {
  const years = [...new Set(months.map((k) => parts(k).y))].filter(Number.isFinite).sort((a, b) => b - a)
  return {
    years,
    newest: years[0] as number | undefined,
    oldest: years.at(-1),
    has: new Set(months),
  }
}

/** Keeps a year inside the data years (free when there is no data). */
const clampYear = (year: number, low?: number, high?: number) => (low === undefined || high === undefined ? year : Math.min(high, Math.max(low, year)))

function YearChips({ years, shown, label, onPick }: { years: number[]; shown: number; label: string; onPick: (y: number) => void }) {
  if (years.length < 2) return null
  return (
    <div className="fk-fb-chips" role="group" aria-label={label}>
      {years.map((y) => (
        <AriaButton key={y} className="fk-fb-chip" aria-pressed={y === shown} onPress={() => onPick(y)}>
          {y}
        </AriaButton>
      ))}
    </div>
  )
}

/** One month with data, chosen from a year grid (spec: wave-2/month-field.md). */
export function MonthField(props: MonthFieldProps) {
  const copy = useMessages().monthField
  const ambient = useLocale().locale
  const lang = props.locale ?? ambient
  const cal = useMemo(() => calendarOf(props.availableMonths), [props.availableMonths])
  const home = props.value ? parts(props.value).y : (cal.newest ?? new Date().getFullYear())
  const [open, setOpen] = useState(false)
  const [shownYear, setShownYear] = useState(home)

  const caption = (() => {
    if (!props.value) return props.placeholder ?? copy.placeholder
    const { y, m } = parts(props.value)
    return new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(Date.UTC(y, m - 1, 15))
  })()
  const move = (by: number) => setShownYear((y) => clampYear(y + by, cal.oldest, cal.newest))
  const toggle = (next: boolean) => {
    if (next) setShownYear(home) // every opening starts on the value's year
    setOpen(next)
  }

  const face = props.triggerContent ?? (
    <>
      <span className="fk-fb-trigger__glyph" aria-hidden="true">
        <CalendarDays />
      </span>
      <span className="fk-fb-trigger__text" data-placeholder={props.value ? undefined : true}>
        {caption}
      </span>
    </>
  )

  return (
    <DialogTrigger isOpen={open} onOpenChange={toggle}>
      <AriaButton
        className={cx('fk-fb-trigger', 'fk-month-field', props.className)}
        aria-label={`${props.label}, ${caption}`}
        isDisabled={props.disabled}
        data-embedded={props.embedded || undefined}
      >
        {face}
      </AriaButton>
      <FloatSurface label={props.label} side={props.placement ?? 'bottom'}>
        <StepperHeader
          heading={shownYear}
          previousLabel={copy.previousYear}
          nextLabel={copy.nextYear}
          previousDisabled={cal.oldest === undefined || shownYear <= cal.oldest}
          nextDisabled={cal.newest === undefined || shownYear >= cal.newest}
          onPrevious={() => move(-1)}
          onNext={() => move(1)}
        />
        <MonthGrid
          year={shownYear}
          locale={lang}
          label={copy.months}
          selected={props.value || null}
          isAvailable={(key) => cal.has.has(key)}
          onYearStep={move}
          onChoose={(key) => {
            props.onChange(key)
            setOpen(false)
          }}
        />
        <YearChips years={cal.years} shown={shownYear} label={copy.years} onPick={setShownYear} />
      </FloatSurface>
    </DialogTrigger>
  )
}
