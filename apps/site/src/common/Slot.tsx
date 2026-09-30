// A fixed-size piece of content (a print spread in mm) scaled to the width of its container, times a zoom.
// The natural size is measured once rendered, so any spread template or style works.
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

export interface SlotProps {
  children: ReactNode
  /** 1 = fit to width; above 1 the content overflows and the desk scrolls. */
  zoom?: number
  /** Called with the scale in use (for the zoom readout). */
  onEscala?: (k: number) => void
  className?: string
  /** Largest scale when fitting (a small spread is not blown up past its print size). */
  max?: number
  /** Also fit the container's height (the container needs a definite height, e.g. fullscreen). */
  ajustarAltura?: boolean
}

export function Slot({ children, zoom = 1, onEscala, className, max = 1, ajustarAltura = false }: SlotProps) {
  const caixa = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const [dim, setDim] = useState<{ w: number; h: number; k: number } | null>(null)

  useLayoutEffect(() => {
    const c = caixa.current
    const el = conteudo.current
    if (!c || !el) return
    const medir = () => {
      const w = el.offsetWidth
      const h = el.offsetHeight
      if (!w || !h) return
      const porAltura = ajustarAltura && c.clientHeight ? c.clientHeight / h : Infinity
      const k = Math.min(max, c.clientWidth / w, porAltura) * zoom
      setDim((d) => (d && d.w === w && d.h === h && Math.abs(d.k - k) < 1e-4 ? d : { w, h, k }))
    }
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(c)
    ro.observe(el)
    return () => ro.disconnect()
  }, [zoom, max, ajustarAltura])

  useLayoutEffect(() => {
    if (dim) onEscala?.(dim.k)
  }, [dim, onEscala])

  return (
    <div ref={caixa} className={className ? `ty-site-encaixe ${className}` : 'ty-site-encaixe'} data-altura={ajustarAltura ? '' : undefined}>
      <div
        className="ty-site-encaixe__palco"
        style={dim ? { inlineSize: dim.w * dim.k, blockSize: dim.h * dim.k } : { visibility: 'hidden' }}
      >
        <div ref={conteudo} className="ty-site-encaixe__conteudo" style={dim ? { transform: `scale(${dim.k})` } : undefined}>
          {children}
        </div>
      </div>
    </div>
  )
}
