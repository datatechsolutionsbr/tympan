import { ChevronsUpDown } from 'lucide-react'
import { forwardRef, useId, type ReactNode } from 'react'
import { Button as AriaButton, Link as AriaLink } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import { useLocaleText } from '../../internal/speech'
import type { IconComponent } from '../../internal/types'

/*
 * Rail navigation parts for the research shell (spec: wave-4/app-frame-rail.md,
 * design direction §3.2): grouped sections with an eyebrow, items with an
 * icon and an optional count, and a two-level context button.
 */

export interface RailNavSectionProps {
  /** Eyebrow shown above the group; also names the list. Omit for the ungrouped top items. */
  label?: string
  children: ReactNode
  className?: string
}

/** A group of rail items (for example "Coletar"). */
export function RailNavSection({ label, children, className }: RailNavSectionProps) {
  const labelId = useId()
  return (
    <div className={cx('fk-rail-section', className)}>
      {label ? (
        <p className="fk-rail-section__label" id={labelId} dir="auto">
          {label}
        </p>
      ) : null}
      <ul className="fk-rail-section__list" aria-labelledby={label ? labelId : undefined}>
        {children}
      </ul>
    </div>
  )
}

export interface RailNavItemProps {
  label: string
  icon?: IconComponent
  href?: string
  onPress?: () => void
  /** Marks the current page: accent-soft fill, accent text, 3 px inset bar. */
  current?: boolean
  /** Pending count, shown only where there is action for the person (§3.2). */
  count?: number
  /** Count in words; defaults to the catalogue's "n pending". */
  countLabel?: string
}

function ItemBody({ icon: Glyph, label, count }: { icon?: IconComponent; label: string; count?: string }) {
  return (
    <>
      {Glyph ? <Glyph className="fk-icon fk-rail-item__icon" aria-hidden="true" focusable="false" /> : null}
      <span className="fk-rail-item__label" dir="auto">{label}</span>
      {count ? (
        <span className="fk-rail-item__count" aria-hidden="true">
          {count}
        </span>
      ) : null}
    </>
  )
}

/** One rail destination (link) or action (button). */
export function RailNavItem(props: RailNavItemProps) {
  const words = useMessages().rail
  const speech = useLocaleText()
  const name = props.count ? speech.join(props.label, props.countLabel ?? words.count(props.count)) : undefined
  const shown = props.count ? (props.count > 999 ? words.capped(speech.number(999)) : speech.number(props.count)) : undefined
  const body = <ItemBody icon={props.icon} label={props.label} count={shown} />
  const shared = { className: 'fk-rail-item', 'aria-label': name, 'data-current': props.current || undefined }
  return (
    <li className="fk-rail-section__entry">
      {props.href ? (
        <AriaLink {...shared} href={props.href} onPress={props.onPress} aria-current={props.current ? 'page' : undefined}>
          {body}
        </AriaLink>
      ) : (
        <AriaButton {...shared} onPress={props.onPress}>
          {body}
        </AriaButton>
      )}
    </li>
  )
}

export interface RailContextButtonProps {
  /** Upper line (organization). */
  scope: string
  /** Lower line (research project). */
  name: string
  onPress?: () => void
  /** Accessible name; defaults to "scope, name". */
  accessibleLabel?: string
  className?: string
}

/**
 * The context switcher's trigger (organization → project in one button,
 * §3.2). Wrap it in an ActionMenu or Popover trigger to list the choices.
 */
export const RailContextButton = forwardRef<HTMLButtonElement, RailContextButtonProps>(function RailContextButton(
  { scope, name, onPress, accessibleLabel, className },
  ref,
) {
  const speech = useLocaleText()
  return (
    <AriaButton ref={ref} className={cx('fk-rail-context', className)} onPress={onPress} aria-label={accessibleLabel ?? speech.join(scope, name)}>
      <span className="fk-rail-context__lines">
        <span className="fk-rail-context__scope" dir="auto">{scope}</span>
        <span className="fk-rail-context__name" dir="auto">{name}</span>
      </span>
      <ChevronsUpDown className="fk-icon fk-rail-context__glyph" aria-hidden="true" focusable="false" />
    </AriaButton>
  )
})
