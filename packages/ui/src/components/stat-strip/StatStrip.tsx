import { Link as AriaLink, useLocale } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useLocaleText } from '../../internal/speech'
import { ProofBadge, type ProofState } from '../proof-badge/ProofBadge'

export interface StatStripItem {
  id: string
  value: number | string
  label: string
  detail?: string
  /** Every number links to the view that produces it (§3.5). */
  href?: string
  proof?: ProofState
  format?: Intl.NumberFormatOptions
}

export interface StatStripProps {
  items: StatStripItem[]
  /** Name of the group. */
  label: string
  locale?: string
  className?: string
}

const shown = (value: number | string, locale: string, format?: Intl.NumberFormatOptions) =>
  typeof value === 'number' ? new Intl.NumberFormat(locale, format).format(value) : value

/** Headline numbers separated by hairlines, no cards (spec: wave-4/stat-strip.md). */
export function StatStrip({ items, label, locale, className }: StatStripProps) {
  const fromAdapter = useLocale().locale
  const lang = locale ?? fromAdapter
  const speech = useLocaleText()
  return (
    <div role="group" aria-label={label} className={cx('fk-stat-strip', className)}>
      <dl className="fk-stat-strip__list">
        {items.map((stat) => {
          const text = shown(stat.value, lang, stat.format)
          return (
            <div key={stat.id} className="fk-stat-strip__item" data-linked={stat.href ? '' : undefined}>
              <dt className="fk-stat-strip__label" dir="auto">{stat.label}</dt>
              <dd className="fk-stat-strip__value">
                {stat.href ? (
                  <AriaLink className="fk-stat-strip__link" href={stat.href} aria-label={speech.pair(text, stat.label)}>
                    {text}
                  </AriaLink>
                ) : (
                  text
                )}
              </dd>
              {stat.detail || stat.proof ? (
                <dd className="fk-stat-strip__detail">
                  {stat.proof ? <ProofBadge state={stat.proof} /> : null}
                  {stat.detail ? <span dir="auto">{stat.detail}</span> : null}
                </dd>
              ) : null}
            </div>
          )
        })}
      </dl>
    </div>
  )
}
