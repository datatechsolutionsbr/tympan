import { ArrowRight, CircleAlert, CircleCheck, Clock, Hourglass, Info } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { Button as AriaButton, Dialog, DialogTrigger, OverlayArrow, Popover, useLocale } from 'react-aria-components'
import { breakpoints, useMediaQuery } from '../../internal/media'
import { useHeldOrOwn } from '../../internal/overlays-nav/state'
import { useMessages } from '../../internal/provider'
import { ActorChip } from '../actor-chip/ActorChip'
import { Drawer } from '../drawer/Drawer'

export type DetailsTone = 'neutral' | 'success' | 'pending' | 'error'

export interface DetailsPopoverProps {
  triggerLabel: string
  title: string
  headerIcon?: ReactNode
  tone?: DetailsTone
  actor?: { kind: 'person' | 'agent' | 'system'; name: string; detail?: string; initials?: string }
  timestamp?: string | Date
  comparison?: { label: string; fromLabel: string; fromValue: string; toLabel: string; toValue: string }
  note?: { label: string; value: string }
  placement?: 'top' | 'bottom' | 'start' | 'end'
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

const toneGlyph = { success: CircleCheck, pending: Hourglass, error: CircleAlert } as const

function formatWhen(value: string | Date, locale: string): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

/** The card body, shared by the popover and the narrow-screen drawer. */
function ChangeCard({ p, titleId, withHeading }: { p: DetailsPopoverProps; titleId: string; withHeading: boolean }) {
  const words = useMessages().detailsPopover.tone
  const { locale } = useLocale()
  const tone = p.tone ?? 'neutral'
  const Glyph = tone === 'neutral' ? null : toneGlyph[tone]
  return (
    <div className="fk-details-popover__card-body" data-tone={tone}>
      {withHeading ? (
        <div className="fk-details-popover__head">
          {p.headerIcon ? <span aria-hidden="true">{p.headerIcon}</span> : null}
          <h2 id={titleId} className="fk-details-popover__title">
            {p.title}
          </h2>
        </div>
      ) : null}
      {Glyph ? (
        <p className="fk-details-popover__tone">
          <Glyph aria-hidden="true" focusable="false" />
          {words[tone as Exclude<DetailsTone, 'neutral'>]}
        </p>
      ) : null}
      {p.actor ? (
        <div className="fk-details-popover__row">
          <ActorChip
            kind={p.actor.kind}
            name={p.actor.name}
            initials={p.actor.initials}
            {...(p.actor.kind === 'person' ? { email: p.actor.detail } : { model: p.actor.detail })}
          />
        </div>
      ) : null}
      {p.timestamp !== undefined ? (
        <p className="fk-details-popover__when">
          <Clock aria-hidden="true" focusable="false" />
          <time dateTime={p.timestamp instanceof Date ? p.timestamp.toISOString() : p.timestamp}>{formatWhen(p.timestamp, locale)}</time>
        </p>
      ) : null}
      {p.comparison ? (
        <p className="fk-details-popover__change">
          <span className="fk-details-popover__label">{p.comparison.label}:</span>{' '}
          <span className="fk-details-popover__side">
            {p.comparison.fromLabel} <strong>{p.comparison.fromValue}</strong>
          </span>{' '}
          <ArrowRight className="fk-details-popover__arrow" aria-hidden="true" focusable="false" />{' '}
          <span className="fk-details-popover__side">
            {p.comparison.toLabel} <strong>{p.comparison.toValue}</strong>
          </span>
        </p>
      ) : null}
      {p.note ? (
        <div className="fk-details-popover__note">
          <p className="fk-details-popover__label">{p.note.label}</p>
          <p className="fk-details-popover__note-text">{p.note.value}</p>
        </div>
      ) : null}
    </div>
  )
}

/** Information button explaining one recorded change (spec: wave-2/details-popover.md). */
export function DetailsPopover(props: DetailsPopoverProps) {
  const titleId = useId()
  const narrow = useMediaQuery(`(max-width: ${breakpoints.sm - 0.02}px)`)
  const [open, setOpen] = useHeldOrOwn(props.open, false, props.onOpenChange)

  const trigger = (
    <AriaButton className="fk-details-popover__trigger" aria-label={props.triggerLabel} aria-haspopup="dialog" aria-expanded={open}>
      <Info aria-hidden="true" focusable="false" />
    </AriaButton>
  )

  if (narrow) {
    return (
      <span className={props.className}>
        <AriaButton
          className="fk-details-popover__trigger"
          aria-label={props.triggerLabel}
          aria-haspopup="dialog"
          aria-expanded={open}
          onPress={() => setOpen(true)}
        >
          <Info aria-hidden="true" focusable="false" />
        </AriaButton>
        <Drawer open={open} onOpenChange={setOpen} title={props.title} placement="bottom">
          <ChangeCard p={props} titleId={titleId} withHeading={false} />
        </Drawer>
      </span>
    )
  }

  return (
    <DialogTrigger isOpen={open} onOpenChange={setOpen}>
      {trigger}
      <Popover className="fk-details-popover" placement={props.placement ?? 'top'} offset={10}>
        <OverlayArrow className="fk-details-popover__arrow-tip">
          <svg width={12} height={12} viewBox="0 0 12 12" aria-hidden="true">
            <path d="M0 0 L6 6 L12 0" />
          </svg>
        </OverlayArrow>
        <Dialog className="fk-details-popover__dialog" aria-labelledby={titleId}>
          <ChangeCard p={props} titleId={titleId} withHeading />
        </Dialog>
      </Popover>
    </DialogTrigger>
  )
}
