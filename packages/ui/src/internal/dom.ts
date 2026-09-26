import { useCallback, useLayoutEffect, type Ref, type RefObject } from 'react'

const useIsoLayoutEffect = typeof window === 'undefined' ? () => {} : useLayoutEffect

/**
 * Sets (or removes) DOM attributes that a React Aria primitive does not
 * forward, such as `aria-busy` on a button.
 */
export function useDomAttributes(ref: RefObject<Element | null>, attrs: Record<string, string | undefined | false>): void {
  const key = JSON.stringify(attrs)
  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    for (const [name, value] of Object.entries(attrs)) {
      if (value === undefined || value === false) el.removeAttribute(name)
      else el.setAttribute(name, value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, key])
}

/** Combines several refs into one callback ref. */
export function useMergedRefs<T>(...refs: Array<Ref<T> | undefined>): (value: T | null) => void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((value: T | null) => {
    for (const r of refs) {
      if (typeof r === 'function') r(value)
      else if (r && typeof r === 'object') (r as { current: T | null }).current = value
    }
  }, refs)
}

/** True for absolute http(s) URLs pointing to another origin. */
export function isExternalHref(href: string | undefined): boolean {
  if (!href || !/^https?:\/\//i.test(href)) return false
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return new URL(href).origin !== origin
  } catch {
    return false
  }
}
