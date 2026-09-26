// MotionFoundation (spec: wave-2/motion-foundation.md; design direction §2.7).
// The token values mirror the --fk-dur-* and --fk-ease* custom properties of
// @fakhir/tokens; a test keeps both in step. There are deliberately no spring
// and no stagger tokens.
import { createContext, useContext, type ReactNode } from 'react'
import { prefersReducedMotion as queryReducedMotion } from '../../internal/media'

type Bezier = readonly [number, number, number, number]

const MS = { instant: 90, quick: 150, base: 240 } as const
const CURVES: { enter: Bezier; exit: Bezier } = { enter: [0.2, 0, 0, 1], exit: [0.4, 0, 1, 1] }

export type DurationStep = keyof typeof MS
export type EaseStep = keyof typeof CURVES

const bezierCss = (b: Bezier) => `cubic-bezier(${b.join(', ')})`

/** Durations of §2.7 in milliseconds, seconds and as the CSS custom property. */
export const duration = {
  ms: MS,
  s: { instant: MS.instant / 1000, quick: MS.quick / 1000, base: MS.base / 1000 },
  cssVar: { instant: 'var(--fk-dur-instant)', quick: 'var(--fk-dur-quick)', base: 'var(--fk-dur-base)' },
} as const

/** Easing curves of §2.7 as control points, CSS strings and custom properties. */
export const ease = {
  points: CURVES,
  css: { enter: bezierCss(CURVES.enter), exit: bezierCss(CURVES.exit) },
  cssVar: { enter: 'var(--fk-ease)', exit: 'var(--fk-ease-out)' },
} as const

/** Transition description understood by the presets and `resolveTransition`. */
export interface MotionTransition {
  durationMs: number
  ease: Bezier
  delayMs?: number
}

/** A preset: start and end styles limited to opacity and translate. */
export interface MotionPreset {
  from: { opacity?: number; translate?: string }
  to: { opacity?: number; translate?: string }
  transition: MotionTransition
}

/** Safe on the server (returns false). */
export function prefersReducedMotion(): boolean {
  try {
    return queryReducedMotion()
  } catch {
    return false
  }
}

/** Collapses a transition to zero duration (and no delay) under reduced motion. */
export function resolveTransition<T extends MotionTransition>(transition: T, reduced: boolean = prefersReducedMotion()): T {
  return reduced ? { ...transition, durationMs: 0, delayMs: 0 } : transition
}

function preset(from: MotionPreset['from'], step: DurationStep, curve: EaseStep = 'enter'): MotionPreset {
  return { from, to: { opacity: 1, translate: from.translate ? '0 0' : undefined }, transition: { durationMs: MS[step], ease: CURVES[curve] } }
}

const opacityOnly = (p: MotionPreset): MotionPreset => ({
  from: { opacity: p.from.opacity ?? 1 },
  to: { opacity: p.to.opacity ?? 1 },
  transition: { ...p.transition, durationMs: 0 },
})

const fadeIn = preset({ opacity: 0 }, 'quick')
const slideFromBottom = preset({ opacity: 0, translate: '0 16px' }, 'base')
const slideFromEnd = preset({ opacity: 0, translate: 'var(--fk-motion-end-offset, 16px) 0' }, 'base')
const press: MotionPreset = { from: { opacity: 1 }, to: { opacity: 0.85 }, transition: { durationMs: MS.instant, ease: CURVES.enter } }

/** Named presets; each `reduced` twin is opacity-only and instant. */
export const motionPresets = {
  fadeIn: { normal: fadeIn, reduced: opacityOnly(fadeIn) },
  slideFromBottom: { normal: slideFromBottom, reduced: opacityOnly(slideFromBottom) },
  slideFromEnd: { normal: slideFromEnd, reduced: opacityOnly(slideFromEnd) },
  press: { normal: press, reduced: { ...press, transition: { ...press.transition, durationMs: 0 } } },
} as const

export type MotionPresetName = keyof typeof motionPresets

/** The same preset seen from a right-to-left page: offsets along the inline axis change sign. */
function mirrorInline(p: MotionPreset): MotionPreset {
  const flip = (t?: string) => {
    if (!t) return t
    const [inline, ...rest] = t.trim().split(/\s+(?![^(]*\))/)
    return inline === '0' ? t : [`calc(-1 * ${inline})`, ...rest].join(' ')
  }
  return { ...p, from: { ...p.from, translate: flip(p.from.translate) }, to: { ...p.to, translate: flip(p.to.translate) } }
}

/**
 * Picks the preset variant for the current (or given) reduced-motion state and
 * reading direction: `slideFromEnd` slides in from the inline end in both
 * left-to-right and right-to-left pages.
 */
export function getPreset(name: MotionPresetName, reduced: boolean = prefersReducedMotion(), direction: 'ltr' | 'rtl' = 'ltr'): MotionPreset {
  const entry = motionPresets[name]
  const chosen = reduced ? entry.reduced : entry.normal
  return direction === 'rtl' ? mirrorInline(chosen) : chosen
}

/* The decorativeMotion switch (wave 4): off unless a host opts in. */
const DecorativeMotionContext = createContext(false)

/** Library default of the `decorativeMotion` flag. */
export const DECORATIVE_MOTION_DEFAULT = false

/** Opts a subtree in (or out) of decorative motion such as CascadeGrid. */
export function DecorativeMotion({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  return <DecorativeMotionContext.Provider value={enabled}>{children}</DecorativeMotionContext.Provider>
}

export function useDecorativeMotion(): boolean {
  return useContext(DecorativeMotionContext)
}
