import { useEffect, useRef, useState } from 'react'
import { cx } from '../../internal/cx'
import { TweenDriver } from '../../internal/data-b/tween'
import { prefersReducedMotion } from '../../internal/media'

/** `--fk-dur-base` of design direction §2.7, in milliseconds. */
export const TWEEN_BASE_MS = 240

export interface TweenedNumberProps {
  value: number
  /** One tween's length; 0 shows every value at once. */
  durationMs?: number
  /** Fixed decimals of the default formatter. */
  decimals?: number
  /** Applied to every intermediate frame (currency, grouping). */
  format?: (n: number) => string
  className?: string
}

function isStill(durationMs: number): boolean {
  return durationMs <= 0 || prefersReducedMotion()
}

/**
 * A figure that eases from what is on screen to a new value (spec:
 * wave-2/tweened-number.md). Not a live region: hosts announce the final
 * value from the surrounding tile when they need to.
 */
export function TweenedNumber({ value, durationMs = TWEEN_BASE_MS, decimals = 0, format, className }: TweenedNumberProps) {
  const [shown, setShown] = useState(() => (isStill(durationMs) ? value : 0))
  const driver = useRef<TweenDriver | null>(null)
  if (driver.current === null) {
    driver.current = new TweenDriver(setShown)
    driver.current.current = shown
  }

  useEffect(() => {
    const d = driver.current!
    if (isStill(durationMs)) d.set(value)
    else d.run(value, durationMs)
  }, [value, durationMs])

  // A hidden tab stops the animation and lands on the target.
  useEffect(() => {
    if (typeof document === 'undefined') return
    const land = () => {
      if (document.visibilityState === 'hidden' && driver.current?.running) driver.current.set(value)
    }
    document.addEventListener('visibilitychange', land)
    return () => document.removeEventListener('visibilitychange', land)
  }, [value])

  useEffect(() => () => driver.current?.stop(), [])

  const settled = shown === value
  const text = format ? format(shown) : shown.toFixed(decimals)
  return (
    <span className={cx('fk-tweened-number', className)} data-settled={settled || undefined}>
      {text}
    </span>
  )
}
