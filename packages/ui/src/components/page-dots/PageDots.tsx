import { useRef, type KeyboardEvent } from 'react'
import { Button as AriaButton, useLocale } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'

export type PageDotsAppearance = 'dot' | 'pill'
export type PageDotsSize = 'small' | 'medium' | 'large'
export type PageDotsContrast = 'onSurface' | 'onLight' | 'onDark'

export interface PageDotsProps {
  count: number
  /** Zero-based visible page. */
  currentIndex: number
  /** Makes the dots a picker (APG Carousel picker: buttons, `aria-current`). */
  onSelect?: (index: number) => void
  appearance?: PageDotsAppearance
  size?: PageDotsSize
  contrast?: PageDotsContrast
  label?: string
  dotLabel?: (n: number, total: number) => string
  /** Above this number of pages a counter replaces the dots. */
  maxDots?: number
  className?: string
}

const ROVE: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }

/** Dots showing (and optionally choosing) the visible page (spec: wave-2/page-dots.md). */
export function PageDots(props: PageDotsProps) {
  const copy = useMessages().pageDots
  const { direction } = useLocale()
  const { count, currentIndex, onSelect } = props
  const total = Math.max(0, count)
  const current = Math.min(Math.max(0, currentIndex), Math.max(0, total - 1))
  const groupName = props.label ?? copy.label
  const nameOf = props.dotLabel ?? copy.dot
  const shell = {
    className: cx('ty-page-dots', props.className),
    'data-appearance': props.appearance ?? 'dot',
    'data-size': props.size ?? 'medium',
    'data-contrast': props.contrast ?? 'onSurface',
  }
  const row = useRef<HTMLDivElement>(null)

  if (total > (props.maxDots ?? 9)) {
    return (
      <p {...shell} data-mode="counter" aria-label={groupName}>
        <span className="ty-page-dots__counter">{copy.counter(current + 1, total)}</span>
      </p>
    )
  }

  const pips = Array.from({ length: total }, (_, i) => i)

  if (!onSelect) {
    return (
      <div {...shell} data-mode="static">
        <span className="ty-visually-hidden">{nameOf(current + 1, total)}</span>
        {pips.map((i) => (
          <span key={i} className="ty-page-dots__pip" data-on={i === current || undefined} aria-hidden="true" />
        ))}
      </div>
    )
  }

  // Roving focus: only the current dot is in the tab order; arrows move.
  const move = (e: KeyboardEvent<HTMLDivElement>) => {
    // Left and Right follow the reading direction (dots run from the inline start).
    const inline = direction === 'rtl' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') ? -1 : 1
    const step = (ROVE[e.key] ?? 0) * inline || (e.key === 'Home' ? -Infinity : e.key === 'End' ? Infinity : 0)
    if (!step) return
    const buttons = Array.from(row.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])
    const from = buttons.indexOf(document.activeElement as HTMLButtonElement)
    const to = Number.isFinite(step) ? (from + step + buttons.length) % buttons.length : step < 0 ? 0 : buttons.length - 1
    e.preventDefault()
    buttons[to]?.focus()
  }

  return (
    <div {...shell} data-mode="picker" role="group" aria-label={groupName} ref={row} onKeyDown={move}>
      {pips.map((i) => (
        <AriaButton
          key={i}
          className="ty-page-dots__hit"
          aria-label={nameOf(i + 1, total)}
          aria-current={i === current ? 'true' : undefined}
          excludeFromTabOrder={i !== current}
          onPress={() => onSelect(i)}
        >
          <span className="ty-page-dots__pip" data-on={i === current || undefined} aria-hidden="true" />
        </AriaButton>
      ))}
    </div>
  )
}
