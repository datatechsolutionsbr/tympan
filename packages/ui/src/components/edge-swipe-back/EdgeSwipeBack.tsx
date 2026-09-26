// EdgeSwipeBack (spec: wave-2/edge-swipe-back.md). On touch screens, a swipe
// that starts at the start edge goes back. Enhancement only: it adds no
// focusable element, and the app keeps a visible back control. The host turns
// it off while a modal, drawer or canvas owns the gesture.
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocale } from 'react-aria-components'
import { advanceTrack, beginTrack, firstTouch, type Track } from '../../internal/platform/touchTrack'
import { playHaptic } from '../../utilities/haptics/haptics'
import { useRouting } from '../../utilities/router-adapter/Routing'

/** Default width (CSS px) of the start-edge zone: one 24 px spacing step. */
export const EDGE_ZONE = 24
/** Default horizontal distance (CSS px) that commits the back navigation. */
export const EDGE_COMMIT = 96

export interface EdgeSwipeBackProps {
  enabled?: boolean
  onBack?: () => void
  edgeZone?: number
  commitDistance?: number
  children?: ReactNode
}

type Cue = { progress: number } | null

function readRtl(ariaDirection: string): boolean {
  if (typeof document !== 'undefined' && document.documentElement.dir) return document.documentElement.dir === 'rtl'
  return ariaDirection === 'rtl'
}

export function EdgeSwipeBack({ enabled = true, onBack, edgeZone = EDGE_ZONE, commitDistance = EDGE_COMMIT, children }: EdgeSwipeBackProps) {
  const router = useRouting()
  const rtl = readRtl(useLocale().direction)
  const [cue, setCue] = useState<Cue>(null)
  const back = useRef<() => void>(() => {})
  back.current = onBack ?? router.goBack

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return
    let track: Track | null = null
    let progress = 0

    const inZone = (x: number) => (rtl ? x >= window.innerWidth - edgeZone : x <= edgeZone)
    const start = (e: TouchEvent) => {
      const t = firstTouch(e.touches)
      track = t && e.touches.length === 1 && inZone(t.clientX) ? beginTrack(t) : null
      progress = 0
    }
    const move = (e: TouchEvent) => {
      const t = firstTouch(e.touches)
      if (!track || !t) return
      track = advanceTrack(track, t)
      if (track.axis === 'y') {
        track = null
        setCue(null)
        return
      }
      if (track.axis !== 'x') return
      const inward = rtl ? -track.dx : track.dx
      progress = Math.max(0, Math.min(1, inward / commitDistance))
      setCue({ progress })
    }
    const end = () => {
      const commit = track !== null && progress >= 1
      track = null
      progress = 0
      setCue(null)
      if (commit) {
        playHaptic('impact')
        back.current()
      }
    }

    window.addEventListener('touchstart', start, { passive: true })
    window.addEventListener('touchmove', move, { passive: true })
    window.addEventListener('touchend', end)
    window.addEventListener('touchcancel', end)
    return () => {
      window.removeEventListener('touchstart', start)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', end)
      window.removeEventListener('touchcancel', end)
    }
  }, [enabled, edgeZone, commitDistance, rtl])

  const Arrow = rtl ? ArrowRight : ArrowLeft
  return (
    <>
      {children}
      {cue ? (
        <div
          className="ty-edge-back"
          aria-hidden="true"
          data-side={rtl ? 'right' : 'left'}
          data-ready={cue.progress >= 1 || undefined}
          style={{ '--ty-edge-progress': String(cue.progress) } as React.CSSProperties}
        >
          <Arrow className="ty-edge-back__arrow" focusable="false" />
        </div>
      ) : null}
    </>
  )
}
