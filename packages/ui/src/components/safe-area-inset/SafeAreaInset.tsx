// SafeAreaInset (spec: wave-2/safe-area-inset.md). Pads chosen edges by the
// environment's safe-area insets. Logical edges (start/end) are resolved to
// the physical side here, because env() insets are physical.
import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react'
import { useLocale } from 'react-aria-components'
import { cx } from '../../internal/cx'

export type SafeEdge = 'top' | 'bottom' | 'start' | 'end'
type Physical = 'top' | 'bottom' | 'left' | 'right'

function useIsRtl(): boolean {
  const aria = useLocale().direction === 'rtl'
  const doc = typeof document !== 'undefined' && (document.documentElement.dir || document.dir) === 'rtl'
  return aria || doc
}

function physicalSides(edges: readonly SafeEdge[], rtl: boolean): Set<Physical> {
  const side = new Set<Physical>()
  for (const e of edges) {
    if (e === 'top' || e === 'bottom') side.add(e)
    else side.add((e === 'start') !== rtl ? 'left' : 'right')
  }
  return side
}

function padAttributes(sides: Set<Physical>) {
  const attrs: Record<string, true | undefined> = {}
  for (const s of ['top', 'bottom', 'left', 'right'] as const) attrs[`data-pad-${s}`] = sides.has(s) || undefined
  return attrs
}

export interface SafeAreaInsetProps extends HTMLAttributes<HTMLDivElement> {
  edges?: SafeEdge[]
  layout?: 'block' | 'flex-column'
  children?: ReactNode
}

/** Wrapper that pads the selected edges by the device inset. */
export function SafeAreaInset({ edges = ['top', 'bottom'], layout = 'block', className, children, ...rest }: SafeAreaInsetProps) {
  const rtl = useIsRtl()
  return (
    <div {...rest} className={cx('ty-safe-area', className)} data-layout={layout} {...padAttributes(physicalSides(edges, rtl))}>
      {children}
    </div>
  )
}

/** Full-screen view: all four edges padded. */
export function SafeAreaScreen(props: Omit<SafeAreaInsetProps, 'edges'>) {
  return <SafeAreaInset {...props} edges={['top', 'bottom', 'start', 'end']} />
}

/** Empty block as tall as the top or bottom inset. */
export function SafeAreaSpacer({ position }: { position: 'top' | 'bottom' }) {
  return <div className="ty-safe-area-spacer" data-position={position} aria-hidden="true" />
}

export interface SafeAreaBottomBarProps extends HTMLAttributes<HTMLDivElement> {
  surface?: 'glass' | 'none'
  children?: ReactNode
}

const BAR_SIZE = '--ty-safe-bottom-bar-size'

/**
 * Fixed bar at the bottom, padded by the bottom inset. While mounted it
 * publishes its height so the page keeps focused elements above it (§2.6).
 */
export function SafeAreaBottomBar({ surface = 'glass', className, children, ...rest }: SafeAreaBottomBarProps) {
  const bar = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = bar.current
    if (!node || typeof document === 'undefined') return
    const root = document.documentElement
    const publish = () => root.style.setProperty(BAR_SIZE, `${node.offsetHeight}px`)
    publish()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(publish)
    observer?.observe(node)

    const keepVisible = (event: FocusEvent) => {
      const target = event.target
      if (!(target instanceof Element) || node.contains(target)) return
      const barTop = node.getBoundingClientRect().top
      const overlap = target.getBoundingClientRect().bottom - barTop
      if (barTop > 0 && overlap > 0) window.scrollBy({ top: overlap + 8, behavior: 'auto' })
    }
    document.addEventListener('focusin', keepVisible)
    return () => {
      observer?.disconnect()
      document.removeEventListener('focusin', keepVisible)
      root.style.removeProperty(BAR_SIZE)
    }
  }, [])

  return (
    <div {...rest} ref={bar} className={cx('ty-safe-bottom-bar', className)} data-surface={surface}>
      {children}
    </div>
  )
}
