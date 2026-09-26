import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'
import { useLocale } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { directionOf, signedFigure, type ChangeUnit } from '../../internal/data-b/signed'
import { useMessages } from '../../internal/provider'
import type { IconComponent } from '../../internal/types'

export type DeltaPolarity = 'higher-is-better' | 'lower-is-better' | 'neutral'
export type DeltaAppearance = 'inline' | 'pill'
export type DeltaSize = 'small' | 'medium'
export type DeltaSentiment = 'positive' | 'negative' | 'neutral'

export interface DeltaIndicatorProps {
  /** The change; `null` renders nothing. */
  value: number | null | undefined
  unit?: ChangeUnit
  /** Custom text for the value (the sign and glyph are still added by direction). */
  format?: (value: number, unit: ChangeUnit) => string
  showValue?: boolean
  /** With `showValue` false, a zero change renders nothing. */
  hideWhenZero?: boolean
  appearance?: DeltaAppearance
  size?: DeltaSize
  polarity?: DeltaPolarity
  className?: string
}

type Direction = -1 | 0 | 1

const GLYPH: Record<Direction, IconComponent> = { [-1]: ArrowDownRight, 0: ArrowRight, 1: ArrowUpRight }
const TREND: Record<Direction, 'down' | 'flat' | 'up'> = { [-1]: 'down', 0: 'flat', 1: 'up' }

/** Maps a direction to a sentiment under a polarity; zero is always neutral. */
export function deltaSentiment(direction: Direction, polarity: DeltaPolarity): DeltaSentiment {
  if (direction === 0 || polarity === 'neutral') return 'neutral'
  const good = polarity === 'higher-is-better' ? direction > 0 : direction < 0
  return good ? 'positive' : 'negative'
}

/** Presentational part shared with cards that already know direction and sentiment. */
export function DeltaMark(props: {
  trend: 'up' | 'down' | 'flat'
  sentiment: DeltaSentiment
  text?: string
  appearance?: DeltaAppearance
  size?: DeltaSize
  className?: string
}) {
  const words = useMessages().delta
  const dir: Direction = props.trend === 'up' ? 1 : props.trend === 'down' ? -1 : 0
  const Glyph = GLYPH[dir]
  return (
    <span
      className={cx('fk-delta', props.className)}
      data-trend={props.trend}
      data-sentiment={props.sentiment}
      data-appearance={props.appearance ?? 'inline'}
      data-size={props.size ?? 'small'}
    >
      {/* Diagonal and flat arrows point along the reading direction: mirrored in RTL (up stays up). */}
      <Glyph className="fk-delta__glyph fk-mirror-rtl" aria-hidden="true" focusable="false" />
      <span className="fk-visually-hidden">{words[props.trend]} </span>
      {props.text ? <span className="fk-delta__value">{props.text}</span> : null}
    </span>
  )
}

/** Direction and size of a change (spec: wave-2/delta-indicator.md). */
export function DeltaIndicator(props: DeltaIndicatorProps) {
  const { locale } = useLocale()
  const value = props.value
  if (value === null || value === undefined || Number.isNaN(value)) return null
  const shown = props.showValue ?? true
  const dir = directionOf(value)
  if (dir === 0 && !shown && props.hideWhenZero) return null
  const unit = props.unit ?? 'percent'
  const text = shown ? (props.format ? props.format(value, unit) : signedFigure(value, unit, locale)) : undefined
  return (
    <DeltaMark
      trend={TREND[dir]}
      sentiment={deltaSentiment(dir, props.polarity ?? 'higher-is-better')}
      text={text}
      appearance={props.appearance}
      size={props.size}
      className={props.className}
    />
  )
}
