// Frame-driven numeric tween used by TweenedNumber. Deliberately tiny: one
// running animation per driver, eased by the design-direction entry curve
// (§2.7, cubic-bezier(.2, 0, 0, 1)), cancellable at any frame.

type Frame = (value: number) => void

/** Solves a CSS cubic-bezier timing curve for progress `t` in [0, 1]. */
export function bezierAt(t: number, x1: number, y1: number, x2: number, y2: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  const coord = (s: number, a: number, b: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3
  // Bisection on x(s) = t, then read y(s): robust and plenty precise for a number display.
  let lo = 0
  let hi = 1
  let s = t
  for (let i = 0; i < 24; i++) {
    s = (lo + hi) / 2
    if (coord(s, x1, x2) < t) lo = s
    else hi = s
  }
  return coord(s, y1, y2)
}

export const enterCurve = (t: number) => bezierAt(t, 0.2, 0, 0, 1)

export class TweenDriver {
  private handle = 0
  private startAt: number | null = null
  current = 0

  constructor(private readonly onFrame: Frame) {}

  /** Jumps straight to `value` (reduced motion, zero duration, hidden tab). */
  set(value: number): void {
    this.stop()
    this.current = value
    this.onFrame(value)
  }

  run(to: number, durationMs: number): void {
    this.stop()
    const from = this.current
    if (durationMs <= 0 || from === to || typeof requestAnimationFrame !== 'function') {
      this.set(to)
      return
    }
    const step = (now: number) => {
      if (this.startAt === null) this.startAt = now
      const progress = Math.min(1, (now - this.startAt) / durationMs)
      this.current = progress >= 1 ? to : from + (to - from) * enterCurve(progress)
      this.onFrame(this.current)
      if (progress < 1) this.handle = requestAnimationFrame(step)
      else this.handle = 0
    }
    this.handle = requestAnimationFrame(step)
  }

  get running(): boolean {
    return this.handle !== 0
  }

  stop(): void {
    if (this.handle && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.handle)
    this.handle = 0
    this.startAt = null
  }
}
