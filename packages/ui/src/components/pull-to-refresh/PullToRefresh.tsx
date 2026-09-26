// PullToRefresh (spec: wave-2/pull-to-refresh.md). A scroll container that
// refreshes when pulled down from the very top on touch screens. The gesture
// is an enhancement: the host must also offer a Refresh control, which calls
// the same `refresh()` (exposed by the hook and by the component's ref).
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type ReactNode, type RefObject } from 'react'
import { ProgressBar } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useReducedMotion } from '../../internal/media'
import { advanceTrack, beginTrack, firstTouch, resist, type Track } from '../../internal/platform/touchTrack'
import { useMessages } from '../../internal/provider'
import { playHaptic } from '../../utilities/haptics/haptics'

/** Pull distance (CSS px, 16 × 4 px steps) that arms a refresh. */
export const PULL_THRESHOLD = 64
/** Resistance cap (CSS px). */
export const PULL_MAX = 120

export interface PullState {
  distance: number
  /** 0–1 towards the threshold. */
  progress: number
  armed: boolean
  refreshing: boolean
}

export interface PullToRefreshOptions {
  onRefresh: () => Promise<void>
  enabled?: boolean
  threshold?: number
  maxPull?: number
}

export interface PullToRefreshApi extends PullState {
  containerRef: RefObject<HTMLDivElement | null>
  refresh: () => Promise<void>
}

export function usePullToRefresh({ onRefresh, enabled = true, threshold = PULL_THRESHOLD, maxPull = PULL_MAX }: PullToRefreshOptions): PullToRefreshApi {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [state, setState] = useState<PullState>({ distance: 0, progress: 0, armed: false, refreshing: false })
  const busy = useRef(false)
  const job = useRef(onRefresh)
  job.current = onRefresh

  const refresh = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    setState({ distance: 0, progress: 1, armed: false, refreshing: true })
    try {
      await job.current()
    } catch {
      /* the host shows its own notice; the busy state still clears */
    } finally {
      busy.current = false
      setState({ distance: 0, progress: 0, armed: false, refreshing: false })
    }
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el || !enabled) return
    let track: Track | null = null
    let pulled = 0
    let armed = false

    const start = (e: TouchEvent) => {
      const t = firstTouch(e.touches)
      track = t && !busy.current && el.scrollTop <= 0 ? beginTrack(t) : null
      pulled = 0
      armed = false
    }
    const move = (e: TouchEvent) => {
      const t = firstTouch(e.touches)
      if (!track || !t) return
      track = advanceTrack(track, t)
      if (track.axis === 'x' || (track.axis === 'y' && track.dy < 0 && pulled === 0)) {
        track = null
        return
      }
      if (track.axis !== 'y') return
      if (e.cancelable) e.preventDefault()
      pulled = resist(track.dy, threshold, maxPull)
      const nowArmed = pulled >= threshold
      if (nowArmed && !armed) playHaptic('impact')
      armed = nowArmed
      setState({ distance: pulled, progress: Math.min(1, pulled / threshold), armed, refreshing: false })
    }
    const end = () => {
      const fire = track !== null && armed
      track = null
      pulled = 0
      armed = false
      if (fire) void refresh()
      else if (!busy.current) setState({ distance: 0, progress: 0, armed: false, refreshing: false })
    }

    el.addEventListener('touchstart', start, { passive: true })
    el.addEventListener('touchmove', move, { passive: false })
    el.addEventListener('touchend', end)
    el.addEventListener('touchcancel', end)
    return () => {
      el.removeEventListener('touchstart', start)
      el.removeEventListener('touchmove', move)
      el.removeEventListener('touchend', end)
      el.removeEventListener('touchcancel', end)
    }
  }, [enabled, threshold, maxPull, refresh])

  return { ...state, containerRef, refresh }
}

export type PullIndicator = 'ring' | 'dots' | ((state: PullState) => ReactNode)

export interface PullToRefreshProps extends PullToRefreshOptions {
  indicator?: PullIndicator
  /** Announced while refreshing (defaults to the catalogue word). */
  label?: string
  children: ReactNode
  className?: string
}

export interface PullToRefreshHandle {
  refresh: () => Promise<void>
}

function Ring({ state, label }: { state: PullState; label: string }) {
  return (
    <ProgressBar
      className="ty-pull__ring"
      aria-label={label}
      isIndeterminate={state.refreshing}
      value={state.refreshing ? undefined : Math.round(state.progress * 100)}
      style={{ '--ty-pull-progress': String(state.progress) } as React.CSSProperties}
    >
      <span className="ty-pull__ring-track" aria-hidden="true" />
    </ProgressBar>
  )
}

export const PullToRefresh = forwardRef<PullToRefreshHandle, PullToRefreshProps>(function PullToRefresh(props, handle) {
  const { indicator = 'ring', children, className, ...options } = props
  const words = useMessages().pullToRefresh
  const label = props.label ?? words.refreshing
  const pull = usePullToRefresh(options)
  const reduced = useReducedMotion()
  useImperativeHandle(handle, () => ({ refresh: pull.refresh }), [pull.refresh])

  const visible = pull.refreshing || pull.distance > 0
  const look =
    typeof indicator === 'function' ? (
      indicator(pull)
    ) : indicator === 'dots' ? (
      <span className="ty-pull__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    ) : (
      <Ring state={pull} label={label} />
    )

  return (
    <div
      ref={pull.containerRef}
      className={cx('ty-pull', className)}
      aria-busy={pull.refreshing || undefined}
      data-refreshing={pull.refreshing || undefined}
      data-armed={pull.armed || undefined}
      data-reduced={reduced || undefined}
      style={{ '--ty-pull-distance': `${reduced ? 0 : pull.distance}px` } as React.CSSProperties}
    >
      <div className="ty-pull__indicator" data-visible={visible || undefined}>
        {visible ? look : null}
      </div>
      <span className="ty-visually-hidden" role="status">
        {pull.refreshing ? label : ''}
      </span>
      <div className="ty-pull__content">{children}</div>
    </div>
  )
})
