import { createElement, useId, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'

export type ContactHeadingLevel = 2 | 3 | 4 | 5

function Title({ level, id, className, children }: { level: ContactHeadingLevel; id?: string; className: string; children: ReactNode }) {
  return createElement(`h${level}`, { id, className }, children)
}

/** Strips presentation characters so the tel: target dials the digits. */
function dialable(phone: string): string {
  return phone.replace(/[^\d+]/g, '')
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
export function ContactChannelCard({ purposeLabel, email, phone, headingLevel = 3, className }: ContactChannelCardProps) {
  const terms = useMessages().contact
  const pairs: Array<{ term: string; href: string; text: string }> = [{ term: terms.email, href: `mailto:${email}`, text: email }]
  if (phone) pairs.push({ term: terms.phone, href: `tel:${dialable(phone)}`, text: phone })
  return (
    <div className={cx('fk-contact-card', className)} data-kind="channel">
      <Title level={headingLevel} className="fk-contact-card__title">
        {purposeLabel}
      </Title>
      <dl className="fk-contact-card__pairs">
        {pairs.map((p) => (
          <div key={p.term} className="fk-contact-card__pair">
            <dt>{p.term}</dt>
            <dd>
              <a className="fk-contact-card__link" href={p.href}>
                {p.text}
              </a>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export interface ContactOfficeCardProps {
  city: string
  addressLines: string[]
  headingLevel?: ContactHeadingLevel
  className?: string
}

/** An office: city heading and postal address. */
export function ContactOfficeCard({ city, addressLines, headingLevel = 3, className }: ContactOfficeCardProps) {
  return (
    <div className={cx('fk-contact-card', className)} data-kind="office">
      <Title level={headingLevel} className="fk-contact-card__title">
        {city}
      </Title>
      <address className="fk-contact-card__address">
        {addressLines.map((line, i) => (
          <span key={i} className="fk-contact-card__line">
            {line}
          </span>
        ))}
      </address>
    </div>
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
export function ContactSection({ title, subtitle, headingLevel = 2, children, className }: ContactSectionProps) {
  const id = useId()
  return (
    <section className={cx('fk-contact-section', className)} aria-labelledby={id}>
      <Title level={headingLevel} id={id} className="fk-contact-section__title">
        {title}
      </Title>
      <p className="fk-contact-section__lead">{subtitle}</p>
      <div className="fk-contact-section__grid">{children}</div>
    </section>
  )
}
