// Shared pieces of the pickers and fields in the "forms-b" group: field text
// lines, a floating surface that becomes a bottom tray on phones, a year
// stepper and a twelve-month grid (used by DateField and MonthField).
import { ChevronLeft, ChevronRight, CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button as AriaButton, Dialog, GridList, GridListItem, Popover, type Key } from 'react-aria-components'
import { cx } from '../cx'
import { useMediaQuery } from '../media'

/** Space-separated id list without empty entries (or undefined). */
export const joinIds = (...ids: Array<string | false | null | undefined>): string | undefined => ids.filter(Boolean).join(' ') || undefined

/** True below 640 px, where floating pickers become a bottom tray. */
export function usePhoneWidth(): boolean {
  return useMediaQuery('(max-width: 639.98px)')
}

type LineKind = 'label' | 'hint' | 'error'

/** One text line of a field: label (above), hint (below the label) or error (below the control). */
export function FieldLine({ kind, id, htmlFor, children }: { kind: LineKind; id?: string; htmlFor?: string; children: ReactNode }) {
  if (kind === 'label') {
    return htmlFor ? (
      <label className="fk-fb-line" data-line="label" id={id} htmlFor={htmlFor}>
        {children}
      </label>
    ) : (
      <span className="fk-fb-line" data-line="label" id={id}>
        {children}
      </span>
    )
  }
  return (
    <p className="fk-fb-line" data-line={kind} id={id}>
      {kind === 'error' ? <CircleAlert className="fk-icon" aria-hidden="true" focusable="false" /> : null}
      <span>{children}</span>
    </p>
  )
}

export type FloatSide = 'top' | 'bottom' | 'left' | 'right'

/** Non-modal floating dialog; below 640 px the same popover is laid out as a bottom tray. */
export function FloatSurface(props: {
  label?: string
  labelledBy?: string
  side?: FloatSide
  className?: string
  children: ReactNode
}) {
  const phone = usePhoneWidth()
  return (
    <Popover
      className={cx('fk-fb-float', props.className)}
      placement={props.side ?? 'bottom'}
      offset={6}
      data-presentation={phone ? 'tray' : 'popover'}
    >
      <Dialog className="fk-fb-float__dialog" aria-label={props.labelledBy ? undefined : props.label} aria-labelledby={props.labelledBy}>
        {props.children}
      </Dialog>
    </Popover>
  )
}

/** Previous / heading / next row; the heading is a polite live region. */
export function StepperHeader(props: {
  heading: ReactNode
  previousLabel: string
  nextLabel: string
  onPrevious: () => void
  onNext: () => void
  previousDisabled?: boolean
  nextDisabled?: boolean
  headingId?: string
}) {
  return (
    <div className="fk-fb-stepper">
      <AriaButton className="fk-fb-nav" aria-label={props.previousLabel} isDisabled={props.previousDisabled} onPress={props.onPrevious}>
        <ChevronLeft className="fk-icon" aria-hidden="true" focusable="false" />
      </AriaButton>
      <span className="fk-fb-stepper__heading" id={props.headingId} aria-live="polite">
        {props.heading}
      </span>
      <AriaButton className="fk-fb-nav" aria-label={props.nextLabel} isDisabled={props.nextDisabled} onPress={props.onNext}>
        <ChevronRight className="fk-icon" aria-hidden="true" focusable="false" />
      </AriaButton>
    </div>
  )
}

/** Localised month names, January first. */
export function monthNames(locale: string, width: 'long' | 'short' = 'long'): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { month: width, timeZone: 'UTC' })
  return Array.from({ length: 12 }, (_, m) => fmt.format(Date.UTC(2020, m, 15)))
}

/** "YYYY-MM" key of a year and a zero-based month. */
export const monthKey = (year: number, monthIndex: number) => `${year}-${String(monthIndex + 1).padStart(2, '0')}`

/**
 * Twelve months of one year as a grid list (APG grid-like navigation);
 * unavailable months stay visible but disabled. PageUp/PageDown step years.
 */
export function MonthGrid(props: {
  year: number
  locale: string
  label: string
  isAvailable: (key: string) => boolean
  selected?: string | null
  onChoose: (key: string) => void
  onYearStep?: (delta: number) => void
}) {
  const names = monthNames(props.locale, 'short')
  const longNames = monthNames(props.locale, 'long')
  const cells = names.map((short, m) => ({ key: monthKey(props.year, m), short, long: longNames[m]! }))
  const disabled = cells.filter((c) => !props.isAvailable(c.key)).map((c) => c.key)
  const pick = (keys: 'all' | Set<Key>) => {
    if (keys === 'all') return
    const [first] = [...keys]
    if (first != null) props.onChoose(String(first))
  }
  return (
    <div
      className="fk-fb-months"
      onKeyDown={(e) => {
        if (!props.onYearStep || (e.key !== 'PageUp' && e.key !== 'PageDown')) return
        e.preventDefault()
        props.onYearStep(e.key === 'PageUp' ? -1 : 1)
      }}
    >
      <GridList
        aria-label={props.label}
        layout="grid"
        className="fk-fb-months__grid"
        items={cells}
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={props.selected ? [props.selected] : []}
        disabledKeys={disabled}
        onSelectionChange={pick}
      >
        {(cell) => (
          <GridListItem id={cell.key} textValue={`${cell.long} ${props.year}`} className="fk-fb-months__cell">
            {cell.short}
          </GridListItem>
        )}
      </GridList>
    </div>
  )
}
