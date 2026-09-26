import { useEffect, useReducer } from 'react'
import { useMessages } from '../../internal/provider'

type Phase = 'idle' | 'waiting' | 'shown' | 'finishing'
type Signal = 'start' | 'reveal' | 'settle' | 'done'

// Transition table of the bar: waiting → shown after the delay; a navigation
// that settles while still waiting never shows anything.
const NEXT: Record<Phase, Partial<Record<Signal, Phase>>> = {
  idle: { start: 'waiting' },
  waiting: { reveal: 'shown', settle: 'idle' },
  shown: { settle: 'finishing' },
  finishing: { done: 'idle', start: 'shown' },
}

function step(phase: Phase, signal: Signal): Phase {
  return NEXT[phase][signal] ?? phase
}

/** How long the completing bar lingers (matches --ty-dur-base). */
const FINISH_MS = 240

export interface RouteProgressProps {
  /** A client-side navigation is in flight. */
  pending: boolean
  /** Navigations shorter than this (ms) show nothing. */
  delay?: number
  label?: string
  className?: string
}

/** Thin top bar for pending client-side navigations (spec: wave-2/route-progress.md). */
export function RouteProgress({ pending, delay = 200, label, className }: RouteProgressProps) {
  const copy = useMessages().routeProgress
  const text = label ?? copy.label
  const [phase, send] = useReducer(step, 'idle')

  useEffect(() => {
    send(pending ? 'start' : 'settle')
  }, [pending])

  useEffect(() => {
    if (phase === 'waiting') {
      const t = setTimeout(() => send('reveal'), delay)
      return () => clearTimeout(t)
    }
    if (phase === 'finishing') {
      const t = setTimeout(() => send('done'), FINISH_MS)
      return () => clearTimeout(t)
    }
    return undefined
  }, [phase, delay])

  const visible = phase === 'shown' || phase === 'finishing'
  return (
    <div className={className ? `ty-route-progress ${className}` : 'ty-route-progress'}>
      {visible ? <div className="ty-route-progress__bar" data-phase={phase} aria-hidden="true" /> : null}
      <span className="ty-visually-hidden" role="status" aria-live="polite">
        {phase === 'shown' ? text : ''}
      </span>
    </div>
  )
}
