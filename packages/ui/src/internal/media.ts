import { useSyncExternalStore } from 'react'

/** Breakpoints of design direction §2.8 (px). */
export const breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280, xxl: 1536 } as const

function subscribe(query: string) {
  return (onChange: () => void) => {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {}
    const mql = window.matchMedia(query)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }
}

/** Live result of a media query; `serverValue` is used without a window. */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    subscribe(query),
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : serverValue),
    () => serverValue,
  )
}

/** True when the viewport is at least `px` wide (desktop-first layouts). */
export function useMinWidth(px: number, serverValue = true): boolean {
  return useMediaQuery(`(min-width: ${px}px)`, serverValue)
}

export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
