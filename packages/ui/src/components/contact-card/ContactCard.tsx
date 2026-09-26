import { useId, type ReactNode } from 'react'
import { Heading } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'

export type ContactHeadingLevel = 2 | 3 | 4 | 5

/** The tel: target dials digits and a leading plus only. */
const telTarget = (shown: string) => `tel:${shown.replace(/[^\d+]/g, '')}`

/** Frame shared by both card kinds: a heading, then a body. */
function CardFrame(props: { kind: 'channel' | 'office'; level: ContactHeadingLevel; heading: string; extra?: string; children: ReactNode }) {
  return (
    <div className={cx('ty-contact-card', props.extra)} data-kind={props.kind}>
      <Heading level={props.level} className="ty-contact-card__title">
        {props.heading}
      </Heading>
      {props.children}
    </div>
  )
}

export interface ContactChannelCardProps {
  /** Heading, translated by the host (press, partnerships, support…). */
  purposeLabel: string
  email: string
  phone?: string
  headingLevel?: ContactHeadingLevel
  className?: string
}

/** One contact channel: purpose, e-mail and phone (spec: wave-2/contact-card.md). */
export function ContactChannelCard(props: ContactChannelCardProps) {
  const words = useMessages().contact
  // Each way to reach the channel: [term, target, visible text].
  const ways: Array<[string, string, string]> = [[words.email, `mailto:${props.email}`, props.email]]
  if (props.phone) ways.push([words.phone, telTarget(props.phone), props.phone])
  return (
    <CardFrame kind="channel" level={props.headingLevel ?? 3} heading={props.purposeLabel} extra={props.className}>
      <dl className="ty-contact-card__pairs">
        {ways.map(([term, target, text]) => (
          <div key={term} className="ty-contact-card__pair">
            <dt>{term}</dt>
            <dd>
              {/* Native anchors keep mailto: and tel: away from the router adapter. */}
              <a className="ty-contact-card__link" href={target}>
                {text}
              </a>
            </dd>
          </div>
        ))}
      </dl>
    </CardFrame>
  )
}

export interface ContactOfficeCardProps {
  city: string
  addressLines: string[]
  headingLevel?: ContactHeadingLevel
  className?: string
}

/** An office: city heading and postal address. */
export function ContactOfficeCard(props: ContactOfficeCardProps) {
  return (
    <CardFrame kind="office" level={props.headingLevel ?? 3} heading={props.city} extra={props.className}>
      <address className="ty-contact-card__address">
        {props.addressLines.map((text, row) => (
          <span key={row} className="ty-contact-card__line">
            {text}
          </span>
        ))}
      </address>
    </CardFrame>
  )
}

export interface ContactSectionProps {
  title: string
  subtitle: string
  headingLevel?: ContactHeadingLevel
  children: ReactNode
  className?: string
}

/** Section of contact cards with a heading and lead. */
export function ContactSection(props: ContactSectionProps) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className={cx('ty-contact-section', props.className)}>
      <Heading level={props.headingLevel ?? 2} id={headingId} className="ty-contact-section__title">
        {props.title}
      </Heading>
      <p className="ty-contact-section__lead">{props.subtitle}</p>
      <div className="ty-contact-section__grid">{props.children}</div>
    </section>
  )
}
