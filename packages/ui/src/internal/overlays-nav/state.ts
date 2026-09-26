import { useCallback, useRef, useState } from 'react'

/**
 * Value that is either owned by the host (`held` defined) or kept here.
 * Returns a tuple of the effective value and a setter that informs the host.
 */
export function useHeldOrOwn<V>(held: V | undefined, seed: V, notify?: (next: V) => void): readonly [V, (next: V) => void] {
  const [own, setOwn] = useState<V>(seed)
  const notifyRef = useRef(notify)
  notifyRef.current = notify
  const isHeld = held !== undefined
  const put = useCallback(
    (next: V) => {
      if (!isHeld) setOwn(next)
      notifyRef.current?.(next)
    },
    [isHeld],
  )
  return [isHeld ? (held as V) : own, put] as const
}

/**
 * Location matching shared by the navigation pieces: the home path ("/")
 * only matches itself; any other href matches itself and its sub-paths.
 */
export function pathIsWithin(pathname: string | undefined, href: string): boolean {
  if (pathname === undefined || !href.startsWith('/')) return false
  const clean = (p: string) => (p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p)
  const here = clean(pathname.split(/[?#]/)[0] ?? '')
  const target = clean(href.split(/[?#]/)[0] ?? '')
  if (target === '/') return here === '/'
  return here === target || here.startsWith(`${target}/`)
}

/** Best (longest) href among `hrefs` that contains `pathname`, so nested entries win over parents. */
export function bestMatch(pathname: string | undefined, hrefs: readonly string[]): string | undefined {
  let found: string | undefined
  for (const h of hrefs) {
    if (pathIsWithin(pathname, h) && (found === undefined || h.length > found.length)) found = h
  }
  return found
}

/** Browser path, or undefined during server rendering. */
export function browserPath(): string | undefined {
  return typeof window === 'undefined' ? undefined : window.location.pathname
}

/** Caps a count for a corner badge: 150 → "99+". */
export function cappedCount(n: number, cap = 99): string {
  return n > cap ? `${cap}+` : String(n)
}
