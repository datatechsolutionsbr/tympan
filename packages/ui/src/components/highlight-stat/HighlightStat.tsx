import { useId } from 'react'
import { useLocale } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { Link } from '../link/Link'
import { RevealNumber } from '../reveal-number/RevealNumber'

export interface HighlightStatSource {
  text: string
  href?: string
}

export interface HighlightStatProps {
  /** The figure; a number may be revealed. */
  value: number | string
  /** What the figure counts. */
  label: string
  /** Count the value up through RevealNumber (numbers only). */
  reveal?: boolean
  /** Formatter for numbers; locale grouping by default. */
  format?: (n: number) => string
  /** Where the figure comes from (§3.5: every number is traceable). */
  source?: HighlightStatSource
  /** `raised` draws an elevation-2 card; `none` sits on the section. */
  surface?: 'none' | 'raised'
  className?: string
}

/**
 * One headline figure with its label on a public page
 * (spec: wave-4/highlight-stat.md). A group named by the label and described
 * by the value and source; only the source link is focusable.
 */
export function HighlightStat(props: HighlightStatProps) {
  const { locale } = useLocale()
  const stem = useId().replace(/:/g, '')
  const ids = { label: `fk-hs-${stem}-l`, value: `fk-hs-${stem}-v`, source: `fk-hs-${stem}-s` }
  const fmt = props.format ?? ((n: number) => new Intl.NumberFormat(locale).format(n))
  const numeric = typeof props.value === 'number'

  let figure
  if (numeric && props.reveal) figure = <RevealNumber to={props.value as number} format={fmt} />
  else figure = numeric ? fmt(props.value as number) : props.value

  const describedBy = props.source ? `${ids.value} ${ids.source}` : ids.value
  return (
    <div
      role="group"
      aria-labelledby={ids.label}
      aria-describedby={describedBy}
      className={cx('fk-highlight-stat', props.className)}
      data-surface={props.surface ?? 'none'}
    >
      <p id={ids.value} className="fk-highlight-stat__value">
        {figure}
      </p>
      <p id={ids.label} className="fk-highlight-stat__label">
        {props.label}
      </p>
      {props.source && (
        <p id={ids.source} className="fk-highlight-stat__source">
          {props.source.href ? <Link href={props.source.href}>{props.source.text}</Link> : props.source.text}
        </p>
      )}
    </div>
  )
}
