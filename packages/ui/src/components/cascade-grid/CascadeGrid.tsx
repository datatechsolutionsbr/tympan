// CascadeGrid (spec: wave-4/cascade-grid.md).
//
// A grid whose first children fade in one after another, once, on first
// mount. Three switches must all agree: the instance's `cascade`, the global
// `decorativeMotion` flag, and no reduced-motion preference. Otherwise the
// component is a plain grid. Public pages only (§2.7).
import { Children, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { prefersReducedMotion } from '../../internal/media'
import { duration, useDecorativeMotion } from '../../utilities/motion-foundation/motion'

const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect

export interface CascadeGridProps {
  children: ReactNode
  /** Per-instance opt-in; also needs the global decorativeMotion switch. */
  cascade?: boolean
  stepMs?: number
  maxTotalMs?: number
  distance?: 'none' | 'small'
  role?: string
  'aria-label'?: string
  'data-testid'?: string
  className?: string
  style?: CSSProperties
}

/**
 * Start offsets (ms) for `count` entrants: evenly spaced by `gap`, but
 * squeezed so the last one starts no later than `limit`.
 */
export function entranceSchedule(count: number, gap: number, limit: number): number[] {
  const offsets: number[] = []
  const spacing = count < 2 ? 0 : Math.min(gap, limit / (count - 1))
  for (let n = 0; n < count; n += 1) offsets.push(Math.round(n * spacing))
  return offsets
}

/**
 * Decides, once, whether this mount plays the entrance. Returns the schedule
 * while it plays and `null` otherwise. The entrant count is frozen at mount,
 * so children added later never replay it.
 */
function useEntrance(enabled: boolean, count: number, gap: number, limit: number): number[] | null {
  const frozen = useRef<number[] | null>(null)
  const [playing, setPlaying] = useState(false)
  useBeforePaint(() => {
    if (!enabled || frozen.current) return
    frozen.current = entranceSchedule(count, gap, limit)
    if (prefersReducedMotion()) return
    setPlaying(true)
    const lastStart = frozen.current[frozen.current.length - 1] ?? 0
    const timer = window.setTimeout(() => setPlaying(false), lastStart + duration.ms.base * 2)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return playing ? frozen.current : null
}

function Entrant({ offset, children }: { offset: number | undefined; children: ReactNode }) {
  const moving = offset !== undefined
  return (
    <div
      role="none"
      className="fk-cascade-grid__cell"
      data-entering={moving || undefined}
      style={moving ? ({ '--fk-cascade-delay': `${offset}ms` } as CSSProperties) : undefined}
    >
      {children}
    </div>
  )
}

export function CascadeGrid(props: CascadeGridProps) {
  const decorativeOn = useDecorativeMotion()
  const enabled = Boolean(props.cascade) && decorativeOn
  const kids = Children.toArray(props.children)
  const schedule = useEntrance(enabled, kids.length, props.stepMs ?? duration.ms.instant, props.maxTotalMs ?? duration.ms.base)

  const host = {
    role: props.role,
    'aria-label': props['aria-label'],
    'data-testid': props['data-testid'],
    className: cx('fk-cascade-grid', props.className),
    style: props.style,
  }
  if (!enabled) return <div {...host}>{props.children}</div>

  return (
    <div {...host} data-distance={props.distance ?? 'small'} data-cascading={schedule ? true : undefined}>
      {kids.map((kid, place) => (
        <Entrant key={(kid as { key?: string | null }).key ?? place} offset={schedule?.[place]}>
          {kid}
        </Entrant>
      ))}
    </div>
  )
}
