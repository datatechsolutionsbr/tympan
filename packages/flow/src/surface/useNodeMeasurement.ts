import { useCallback, useEffect, useRef, useState } from 'react'
import type { Size } from '../model/types'

/**
 * Measures node wrappers with one shared ResizeObserver. Returns the sizes and
 * a stable ref callback per node id. The node box is untransformed (the zoom
 * is applied to the plane), so border-box sizes are canvas units.
 */
export function useNodeMeasurement(onMeasured?: (id: string, size: Size) => void) {
  const [measured, setMeasured] = useState<ReadonlyMap<string, Size>>(() => new Map())
  const callbacks = useRef(new Map<string, (el: HTMLElement | null) => void>())
  const elements = useRef(new Map<Element, string>())
  const observer = useRef<ResizeObserver | null>(null)
  const report = useRef(onMeasured)
  report.current = onMeasured

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const changes: Array<[string, Size]> = []
      for (const entry of entries) {
        const id = elements.current.get(entry.target)
        if (!id) continue
        const box = entry.borderBoxSize?.[0]
        const el = entry.target as HTMLElement
        const size = box ? { width: box.inlineSize, height: box.blockSize } : { width: el.offsetWidth, height: el.offsetHeight }
        if (size.width > 0 && size.height > 0) changes.push([id, size])
      }
      if (!changes.length) return
      setMeasured((prev) => {
        let next: Map<string, Size> | null = null
        for (const [id, size] of changes) {
          const old = prev.get(id)
          if (old && Math.abs(old.width - size.width) < 0.5 && Math.abs(old.height - size.height) < 0.5) continue
          next ??= new Map(prev)
          next.set(id, size)
          report.current?.(id, size)
        }
        return next ?? prev
      })
    })
    observer.current = ro
    for (const el of elements.current.keys()) ro.observe(el)
    return () => {
      ro.disconnect()
      observer.current = null
    }
  }, [])

  const refFor = useCallback((id: string) => {
    let cb = callbacks.current.get(id)
    if (!cb) {
      let current: HTMLElement | null = null
      cb = (el) => {
        if (current && current !== el) {
          observer.current?.unobserve(current)
          elements.current.delete(current)
        }
        current = el
        if (el) {
          elements.current.set(el, id)
          observer.current?.observe(el)
        }
      }
      callbacks.current.set(id, cb)
    }
    return cb
  }, [])

  return { measured, refFor }
}
