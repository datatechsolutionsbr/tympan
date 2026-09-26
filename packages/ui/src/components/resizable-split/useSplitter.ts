import { useRef, type KeyboardEvent, type PointerEvent } from 'react'

/*
 * APG Window Splitter behaviour shared by ResizableSplit and the docked
 * EvidencePanel: the value is the size (px) of the pane the splitter sizes.
 * `grows` says which pointer/arrow direction makes that pane larger.
 */

export interface SplitterOptions {
  size: number
  min: number
  max: number
  step: number
  /** Direction (in screen terms) that enlarges the sized pane. */
  grows: 'left' | 'right'
  onSize: (px: number) => void
}

export const clampSize = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(value)))

export function useSplitter({ size, min, max, step, grows, onSize }: SplitterOptions) {
  const drag = useRef<{ x: number; from: number } | null>(null)
  const restore = useRef<number | null>(null)
  const sign = grows === 'left' ? -1 : 1
  const set = (px: number) => onSize(clampSize(px, min, max))

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const table: Record<string, () => void> = {
      ArrowLeft: () => set(size - sign * step),
      ArrowRight: () => set(size + sign * step),
      Home: () => set(min),
      End: () => set(max),
      Enter: () => {
        if (size > min) {
          restore.current = size
          set(min)
        } else set(restore.current ?? max)
      },
    }
    const run = table[event.key]
    if (!run) return
    event.preventDefault()
    run()
  }

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button > 0) return
    drag.current = { x: event.clientX, from: size }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!drag.current) return
    set(drag.current.from + sign * (event.clientX - drag.current.x))
  }
  const finish = () => {
    drag.current = null
  }

  return {
    role: 'separator' as const,
    tabIndex: 0,
    'aria-orientation': 'vertical' as const,
    'aria-valuenow': size,
    'aria-valuemin': min,
    'aria-valuemax': max,
    onKeyDown,
    onPointerDown,
    onPointerMove,
    onPointerUp: finish,
    onPointerCancel: finish,
  }
}
