import { useEffect, useState, type RefObject } from 'react'
import type { Size } from '../model/types'

/** Size used when layout is unavailable (tests, first paint on the server). */
export const UNMEASURED_CONTAINER: Readonly<Size> = Object.freeze({ width: 960, height: 640 })

function read(el: HTMLElement | null): Size {
  if (!el) return UNMEASURED_CONTAINER
  const width = el.clientWidth
  const height = el.clientHeight
  return width > 0 && height > 0 ? { width, height } : UNMEASURED_CONTAINER
}

/** Content-box size of an element, updated by ResizeObserver when present. */
export function useElementSize(ref: RefObject<HTMLElement | null>): Size {
  const [size, setSize] = useState<Size>(UNMEASURED_CONTAINER)
  useEffect(() => {
    const el = ref.current
    setSize(read(el))
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => {
      const next = read(el)
      setSize((prev) => (prev.width === next.width && prev.height === next.height ? prev : next))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}
