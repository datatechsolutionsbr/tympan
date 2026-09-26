// CascadeGrid (spec: wave-4/cascade-grid.md). A grid whose first children
// fade in one after another on first mount, only when three switches agree:
// the per-instance `cascade`, the global `decorativeMotion` flag and the
// absence of reduced motion. Otherwise it is a plain grid. Not for use inside
// the authenticated app (§2.7).
import { Children, useLayoutEffect, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cx } from '../../internal/cx'
import { prefersReducedMotion } from '../../internal/media'
import { duration, useDecorativeMotion } from '../../utilities/motion-foundation/motion'

const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

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

/** Start offsets (ms) for `count` items so the last one starts within `ceiling`. */
export function cascadeDelays(count: number, stepMs: number, ceiling: number): number[] {
  if (count <= 0) return []
  const step = count > 1 ? Math.min(stepMs, ceiling / (count - 1)) : 0
  return Array.from({ length: count }, (_, i) => Math.round(i * step))
}

export function CascadeGrid(props: CascadeGridProps) {
  const { children, cascade = false, stepMs = duration.ms.instant, maxTotalMs = duration.ms.base, distance = 'small', className, style } = props
  const decorative = useDecorativeMotion()
  const passthrough = { role: props.role, 'aria-label': props['aria-label'], 'data-testid': props['data-testid'] }
  const wanted = cascade && decorative

  const items = Children.toArray(children)
  // Frozen at first mount: how many items join the entrance, and their delays.
  const firstCount = useRef<number | null>(null)
  const [armed, setArmed] = useState(false)

  useClientLayoutEffect(() => {
    if (!wanted || firstCount.current !== null) return
    firstCount.current = items.length
    if (prefersReducedMotion()) return
    setArmed(true)
    const total = cascadeDelays(items.length, stepMs, maxTotalMs).at(-1) ?? 0
    const settle = window.setTimeout(() => setArmed(false), total + duration.ms.base * 2)
    return () => window.clearTimeout(settle)
    // First mount only: later children never replay the cascade.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!wanted) {
    return (
      <div {...passthrough} className={cx('fk-cascade-grid', className)} style={style}>
        {children}
      </div>
    )
  }

  const delays = cascadeDelays(firstCount.current ?? items.length, stepMs, maxTotalMs)
  return (
    <div {...passthrough} className={cx('fk-cascade-grid', className)} style={style} data-distance={distance} data-cascading={armed || undefined}>
      {items.map((child, index) => {
        const joins = armed && index < delays.length
        return (
          <div
            key={(child as { key?: string | null }).key ?? index}
            className="fk-cascade-grid__cell"
            role="none"
            data-entering={joins || undefined}
            style={joins ? ({ '--fk-cascade-delay': `${delays[index]}ms` } as CSSProperties) : undefined}
          >
            {child}
          </div>
        )
      })}
    </div>
  )
}
