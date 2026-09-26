import { Check, CircleAlert, Filter } from 'lucide-react'
import type { ReactNode } from 'react'
import { ToggleButton } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import { Popover } from '../popover/Popover'

export type StatTileTone = 'neutral' | 'attention'

export interface StatTileExplanation {
  title?: string
  body?: string
  /** Rendered in mono (query, source identifiers). */
  blocks?: { label: string; text: string }[]
}

export interface StatTileProps {
  /** Already formatted figure. */
  value: string | number
  label: string
  icon?: ReactNode
  /** Period or scope pill. */
  qualifier?: string
  explanation?: StatTileExplanation
  tone?: StatTileTone
  filtered?: boolean
  /** Pressed state when the tile toggles a filter. */
  selected?: boolean
  /** Turns the tile into a toggle button. */
  onPress?: () => void
  /** Announce value changes politely. */
  live?: boolean
  className?: string
}

function Figure({ value, live }: { value: string | number; live: boolean }) {
  return (
    <span className="ty-stat-tile__value" {...(live ? { 'aria-live': 'polite' as const, 'aria-atomic': true } : {})}>
      {value}
    </span>
  )
}

function Explain({ label, explanation }: { label: string; explanation: StatTileExplanation }) {
  const m = useMessages().statTile
  return (
    <Popover triggerLabel={m.explain(label)} title={explanation.title} placement="bottom" align="end">
      {explanation.body ? <p className="ty-stat-tile__explain-body">{explanation.body}</p> : null}
      {explanation.blocks?.length ? (
        <dl className="ty-stat-tile__blocks">
          {explanation.blocks.map((b, i) => (
            <div key={`${b.label}-${i}`} className="ty-stat-tile__block">
              <dt>{b.label}</dt>
              <dd>
                <code>{b.text}</code>
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </Popover>
  )
}

/**
 * One headline figure with its label; optionally a filter toggle (spec:
 * wave-2/stat-tile.md). The explain trigger sits beside the toggle, never
 * inside it.
 */
export function StatTile(props: StatTileProps) {
  const m = useMessages().statTile
  const { value, label, tone = 'neutral', filtered = false, selected = false, live = false } = props
  const toggles = typeof props.onPress === 'function'

  const face = (
    <>
      <span className="ty-stat-tile__top">
        {props.icon ? (
          <span className="ty-stat-tile__icon" aria-hidden="true">
            {props.icon}
          </span>
        ) : null}
        {props.qualifier ? <span className="ty-stat-tile__qualifier">{props.qualifier}</span> : null}
        {toggles && selected ? <Check className="ty-stat-tile__check" aria-hidden="true" focusable="false" /> : null}
      </span>
      <Figure value={value} live={live} />
      <span className="ty-stat-tile__label">{label}</span>
      {tone === 'attention' || filtered ? (
        <span className="ty-stat-tile__marks">
          {tone === 'attention' ? (
            <span className="ty-stat-tile__mark" data-mark="attention">
              <CircleAlert aria-hidden="true" focusable="false" />
              {m.attention}
            </span>
          ) : null}
          {filtered ? (
            <span className="ty-stat-tile__mark" data-mark="filtered">
              <Filter aria-hidden="true" focusable="false" />
              {m.filtered}
            </span>
          ) : null}
        </span>
      ) : null}
    </>
  )

  const name = [label, String(value), props.qualifier, tone === 'attention' ? m.attention : undefined, filtered ? m.filtered : undefined]
    .filter(Boolean)
    .join(', ')

  return (
    <div className={cx('ty-stat-tile', props.className)} data-tone={tone} data-interactive={toggles || undefined}>
      {toggles ? (
        <ToggleButton className="ty-stat-tile__face" isSelected={selected} onChange={() => props.onPress?.()} aria-label={name}>
          {face}
        </ToggleButton>
      ) : (
        <div className="ty-stat-tile__face" role="group" aria-label={name}>
          {face}
        </div>
      )}
      {props.explanation ? (
        <span className="ty-stat-tile__explain">
          <Explain label={label} explanation={props.explanation} />
        </span>
      ) : null}
    </div>
  )
}
