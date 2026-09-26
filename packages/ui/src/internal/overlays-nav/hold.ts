import { useEffect, useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'

/** Hold time before a press counts as long (the common platform value). */
export const LONG_PRESS_DELAY = 500

/**
 * Handlers for a wrapper element that asks for a secondary menu: a press held
 * past the delay, a right click, Shift+F10 or the context-menu key. Uses
 * capture-phase pointer handlers because press primitives stop bubbling. The
 * click that ends a long press is swallowed so the primary action stays quiet.
 */
export function useMenuRequest(open: () => void, options: { touchOnly?: boolean } = {}) {
  const state = useRef<{ timer?: ReturnType<typeof setTimeout>; fired: boolean }>({ fired: false })
  const openRef = useRef(open)
  openRef.current = open
  const clear = () => clearTimeout(state.current.timer)
  useEffect(() => clear, [])

  return {
    /** True while the current press already opened the menu. */
    consumed: () => state.current.fired,
    props: {
      onPointerDownCapture: (e: PointerEvent) => {
        if (e.button !== 0 || (options.touchOnly && e.pointerType !== 'touch')) return
        state.current.fired = false
        clear()
        state.current.timer = setTimeout(() => {
          state.current.fired = true
          openRef.current()
        }, LONG_PRESS_DELAY)
      },
      onPointerUpCapture: clear,
      onPointerCancelCapture: clear,
      onPointerLeave: clear,
      onClickCapture: (e: MouseEvent) => {
        if (!state.current.fired) return
        state.current.fired = false
        e.preventDefault()
        e.stopPropagation()
      },
      onContextMenu: (e: MouseEvent) => {
        e.preventDefault()
        openRef.current()
      },
      onKeyDown: (e: KeyboardEvent) => {
        if (e.key === 'ContextMenu' || (e.key === 'F10' && e.shiftKey)) {
          e.preventDefault()
          openRef.current()
        }
      },
    },
  }
}
