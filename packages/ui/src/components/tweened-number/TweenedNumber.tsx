import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocale } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { TweenDriver } from '../../internal/data-b/tween'
import { prefersReducedMotion } from '../../internal/media'

/** `--ty-dur-base` of design direction §2.7, in milliseconds. */
export const TWEEN_BASE_MS = 240

export interface TweenedNumberProps {
  value: number
  /** One tween's length; 0 shows every value at once. */
  durationMs?: number
  /** Fixed decimals of the default formatter (Intl, in the provider's locale and numbering system). */
  decimals?: number
  /** Applied to every intermediate frame (currency, grouping). */
  format?: (n: number) => string
  className?: string
}

/** No movement for zero-length tweens or under reduced motion. */
const jumps = (ms: number) => ms <= 0 || prefersReducedMotion()

/**
 * The figure on screen, easing towards `target`. One driver lives for the
 * component's life; a hidden document lands it on the target at once.
 */
function useEasedFigure(target: number, ms: number): number {
  const [figure, setFigure] = useState(() => (jumps(ms) ? target : 0))
  const engine = useRef<TweenDriver>(null as unknown as TweenDriver)
  if (!engine.current) {
    engine.current = new TweenDriver(setFigure)
    engine.current.current = figure
  }

  useEffect(() => {
    const drive = engine.current
    jumps(ms) ? drive.set(target) : drive.run(target, ms)
    const onVisibility = () => {
      if (document.visibilityState === 'hidden' && drive.running) drive.set(target)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [target, ms])

  useEffect(() => () => engine.current.stop(), [])
  return figure
}

/**
 * A figure that eases from what is on screen to a new value (spec:
 * wave-2/tweened-number.md). Not a live region: hosts announce the final
 * value from the surrounding tile when they need to.
 */
export function TweenedNumber(props: TweenedNumberProps) {
  const places = props.decimals ?? 0
  const { locale } = useLocale()
  const figure = useEasedFigure(props.value, props.durationMs ?? TWEEN_BASE_MS)
  const writer = useMemo(() => {
    if (props.format) return props.format
    const nf = new Intl.NumberFormat(locale, { minimumFractionDigits: places, maximumFractionDigits: places })
    return (n: number) => nf.format(Number(n.toFixed(places)))
  }, [props.format, locale, places])

  return (
    <span className={cx('ty-tweened-number', props.className)} data-settled={figure === props.value || undefined}>
      {writer(figure)}
    </span>
  )
}
