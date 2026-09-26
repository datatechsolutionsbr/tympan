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

const yearOf = (key: string) => Number(key.slice(0, 4))

/** The data years, newest first, and the year a fresh opening should show. */
function useYears(value: string, available: string[]) {
  return useMemo(() => {
    const years = [...new Set(available.map(yearOf))].filter(Number.isFinite).sort((a, b) => b - a)
    const start = value ? yearOf(value) : (years[0] ?? new Date().getFullYear())
    return { years, start }
  }, [value, available])
}

/** One month with data, chosen from a year grid (spec: wave-2/month-field.md). */
export function MonthField(props: MonthFieldProps) {
  const t = useMessages().monthField
  const { locale: contextLocale } = useLocale()
  const locale = props.locale ?? contextLocale
  const { years, start } = useYears(props.value, props.availableMonths)
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(start)
  const available = useMemo(() => new Set(props.availableMonths), [props.availableMonths])

  const text = props.value
    ? new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(Date.UTC(yearOf(props.value), Number(props.value.slice(5)) - 1, 15))
    : (props.placeholder ?? t.placeholder)
  const oldest = years[years.length - 1]
  const newest = years[0]
  const step = (delta: number) =>
    setYear((y) => {
      const next = y + delta
      return oldest != null && newest != null ? Math.min(newest, Math.max(oldest, next)) : next
    })

  return (
    <DialogTrigger
      isOpen={open}
      onOpenChange={(next) => {
        if (next) setYear(start)
        setOpen(next)
      }}
    >
      <AriaButton
        className={cx('fk-fb-trigger', 'fk-month-field', props.className)}
        data-embedded={props.embedded || undefined}
        isDisabled={props.disabled}
        aria-label={`${props.label}, ${text}`}
      >
        {props.triggerContent ?? (
          <>
            <span className="fk-fb-trigger__glyph" aria-hidden="true">
              <CalendarDays />
            </span>
            <span className="fk-fb-trigger__text" data-placeholder={props.value ? undefined : true}>
              {text}
            </span>
          </>
        )}
      </AriaButton>
      <FloatSurface label={props.label} side={props.placement ?? 'bottom'}>
        <StepperHeader
          heading={year}
          previousLabel={t.previousYear}
          nextLabel={t.nextYear}
          previousDisabled={oldest == null || year <= oldest}
          nextDisabled={newest == null || year >= newest}
          onPrevious={() => step(-1)}
          onNext={() => step(1)}
        />
        <MonthGrid
          year={year}
          locale={locale}
          label={t.months}
          isAvailable={(key) => available.has(key)}
          selected={props.value || null}
          onChoose={(key) => {
            props.onChange(key)
            setOpen(false)
          }}
          onYearStep={step}
        />
        {years.length > 1 ? (
          <div className="fk-fb-chips" role="group" aria-label={t.years}>
            {years.map((y) => (
              <AriaButton key={y} className="fk-fb-chip" aria-pressed={y === year} onPress={() => setYear(y)}>
                {y}
              </AriaButton>
            ))}
          </div>
        ) : null}
      </FloatSurface>
    </DialogTrigger>
  )
}
