import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocale } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { prefersReducedMotion } from '../../internal/media'

export interface RevealNumberProps {
  /** Value shown before the element is seen. */
  from?: number
  /** Final value. */
  to: number
  /** Fixed decimals of the default formatter (Intl, in the provider's locale and numbering system). */
  decimals?: number
  /** Formatter for every intermediate value. */
  format?: (n: number) => string
  /** Portion of the element that must be in view to start (0 to 1). */
  visibleFraction?: number
  /** When false, the number resets on leaving the view and counts again on return. */
  once?: boolean
  /** Length of the count; defaults to the `--fk-dur-base` token. */
  durationMs?: number
  className?: string
}

const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect

/** Reads a duration token (`240ms` or `0.24s`) from the element; falls back to 240 ms. */
function tokenDuration(el: Element | null): number {
  if (!el || typeof getComputedStyle !== 'function') return 240
  const raw = getComputedStyle(el).getPropertyValue('--fk-dur-base').trim()
  const n = parseFloat(raw)
  if (!raw || Number.isNaN(n)) return 240
  return raw.endsWith('ms') ? n : raw.endsWith('s') ? n * 1000 : n
}

/** Decelerating curve, close to the `enter` easing of §2.7. */
const decelerate = (t: number) => 1 - (1 - t) ** 3

/**
 * A figure that counts to its final value the first time it scrolls into
 * view (spec: wave-4/reveal-number.md). Assistive technology only ever reads
 * the final value; server markup holds the final value too.
 */
export function RevealNumber(props: RevealNumberProps) {
  const start = props.from ?? 0
  const end = props.to
  const places = props.decimals ?? 0
  const { locale } = useLocale()
  const localeDigits = useMemo(() => new Intl.NumberFormat(locale, { minimumFractionDigits: places, maximumFractionDigits: places, useGrouping: false }), [locale, places])
  const show = props.format ?? ((n: number) => localeDigits.format(n))
  const repeat = props.once === false
  const host = useRef<HTMLSpanElement>(null)
  // null = not yet on the client: render the final value (server output, no-script pages).
  const [current, setCurrent] = useState<number | null>(null)

  useBeforePaint(() => {
    const el = host.current
    const canObserve = typeof IntersectionObserver === 'function'
    if (!el || !canObserve || prefersReducedMotion()) {
      setCurrent(end)
      return
    }
    setCurrent(start)
    let frame = 0
    let done = false
    const run = () => {
      const length = props.durationMs ?? tokenDuration(el)
      if (length <= 0) {
        setCurrent(end)
        return
      }
      const began = performance.now()
      const step = (now: number) => {
        const t = Math.min(1, (now - began) / length)
        setCurrent(t >= 1 ? end : start + (end - start) * decelerate(t))
        frame = t < 1 ? requestAnimationFrame(step) : 0
      }
      frame = requestAnimationFrame(step)
    }
    const watcher = new IntersectionObserver(
      (entries) => {
        const seen = entries.some((e) => e.isIntersecting)
        if (seen && !done) {
          done = true
          run()
          if (!repeat) watcher.disconnect()
        } else if (!seen && done && repeat) {
          cancelAnimationFrame(frame)
          done = false
          setCurrent(start)
        }
      },
      { threshold: props.visibleFraction ?? 0.5 },
    )
    watcher.observe(el)
    return () => {
      watcher.disconnect()
      cancelAnimationFrame(frame)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end, repeat, props.visibleFraction, props.durationMs])

  const finalText = show(end)
  return (
    <span ref={host} className={cx('fk-reveal-number', props.className)}>
      {/* Reserves the width of the final value so the digits never jitter. */}
      <span className="fk-reveal-number__ghost" aria-hidden="true">
        {finalText}
      </span>
      <span className="fk-reveal-number__run" aria-hidden="true">
        {show(current ?? end)}
      </span>
      <span className="fk-visually-hidden">{finalText}</span>
    </span>
  )
}
