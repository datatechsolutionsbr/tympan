// Fullscreen viewer with zoom and pan (after the Estúdio's Viewer): wheel or pinch to zoom around the
// pointer, drag to pan, double-click to toggle fit / 2×, + − 0 keys, ← → to the previous / next item and
// Escape to close. The content is rendered at its natural size and transformed.
import { ChevronLeft, ChevronRight, Minus, Plus, Scan, X } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '@datatechsolutions/tympan'
import { useI18n } from '../i18n/I18n'

export interface ViewerProps {
  titulo: string
  subtitulo?: string
  aoFechar: () => void
  aoAnterior?: () => void
  aoProximo?: () => void
  children: ReactNode
}

interface Vista {
  k: number
  x: number
  y: number
}

const LIMITES = [0.1, 8] as const
const limitar = (k: number) => Math.min(LIMITES[1], Math.max(LIMITES[0], k))

export function Viewer({ titulo, subtitulo, aoFechar, aoAnterior, aoProximo, children }: ViewerProps) {
  const { t, n, dir } = useI18n()
  const palco = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const fechar = useRef<HTMLButtonElement | null>(null)
  const [vista, setVista] = useState<Vista>({ k: 1, x: 0, y: 0 })
  const [ajuste, setAjuste] = useState(1)
  const ponteiros = useRef(new Map<number, { x: number; y: number }>())
  const arraste = useRef<{ x: number; y: number; vx: number; vy: number; dist?: number; k?: number } | null>(null)

  const ajustar = useCallback(() => {
    const p = palco.current
    const c = conteudo.current
    if (!p || !c) return
    const k = Math.min(p.clientWidth / c.offsetWidth, p.clientHeight / c.offsetHeight) * 0.96
    setAjuste(k)
    setVista({ k, x: (p.clientWidth - c.offsetWidth * k) / 2, y: (p.clientHeight - c.offsetHeight * k) / 2 })
  }, [])

  useLayoutEffect(() => {
    ajustar()
    const ro = new ResizeObserver(ajustar)
    if (palco.current) ro.observe(palco.current)
    return () => ro.disconnect()
  }, [ajustar, children])

  /** Zoom by a factor around a point of the stage (keeps that point still). */
  const zoomEm = useCallback((fator: number, px?: number, py?: number) => {
    const p = palco.current
    if (!p) return
    const cx = px ?? p.clientWidth / 2
    const cy = py ?? p.clientHeight / 2
    setVista((v) => {
      const k = limitar(v.k * fator)
      const f = k / v.k
      return { k, x: cx - (cx - v.x) * f, y: cy - (cy - v.y) * f }
    })
  }, [])

  // Focus the close button, lock the page scroll, restore focus on close.
  useEffect(() => {
    const antes = document.activeElement as HTMLElement | null
    fechar.current?.focus()
    const overflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = overflow
      antes?.focus?.()
    }
  }, [])

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        aoFechar()
      } else if (e.key === '+' || e.key === '=') zoomEm(1.25)
      else if (e.key === '-') zoomEm(0.8)
      else if (e.key === '0') ajustar()
      else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const frente = (e.key === 'ArrowRight') !== (dir === 'rtl')
        const f = frente ? aoProximo : aoAnterior
        if (f) {
          e.preventDefault()
          f()
        }
      }
    }
    addEventListener('keydown', on)
    return () => removeEventListener('keydown', on)
  }, [aoFechar, aoAnterior, aoProximo, zoomEm, ajustar, dir])

  const local = (e: { clientX: number; clientY: number }) => {
    const r = palco.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  return (
    <div className="ty-site-visor" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="ty-site-visor__barra">
        <div className="ty-site-visor__titulos">
          <strong>{titulo}</strong>
          {subtitulo ? <span>{subtitulo}</span> : null}
        </div>
        <div className="ty-site-visor__acoes">
          {aoAnterior ? (
            <Button variant="quiet" size="compact" iconOnly accessibleLabel={t('visor.anterior')} leadingIcon={dir === 'rtl' ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />} onPress={aoAnterior} />
          ) : null}
          {aoProximo ? (
            <Button variant="quiet" size="compact" iconOnly accessibleLabel={t('visor.proximo')} leadingIcon={dir === 'rtl' ? <ChevronLeft aria-hidden="true" /> : <ChevronRight aria-hidden="true" />} onPress={aoProximo} />
          ) : null}
          <Button variant="quiet" size="compact" iconOnly accessibleLabel={t('livro.zoomMenos')} leadingIcon={<Minus aria-hidden="true" />} onPress={() => zoomEm(0.8)} />
          <output className="ty-site-zoom__valor" aria-live="polite" aria-label={t('livro.escalaAtual')}>
            {n(vista.k, { style: 'percent', maximumFractionDigits: 0 })}
          </output>
          <Button variant="quiet" size="compact" iconOnly accessibleLabel={t('livro.zoomMais')} leadingIcon={<Plus aria-hidden="true" />} onPress={() => zoomEm(1.25)} />
          <Button variant="quiet" size="compact" iconOnly accessibleLabel={t('visor.ajustar')} leadingIcon={<Scan aria-hidden="true" />} onPress={ajustar} />
          <span ref={(el) => void (fechar.current = el?.querySelector('button') ?? null)}>
            <Button variant="secondary" size="compact" leadingIcon={<X aria-hidden="true" />} onPress={aoFechar}>
              {t('visor.fechar')}
            </Button>
          </span>
        </div>
      </div>
      <div
        ref={palco}
        className="ty-site-visor__palco"
        dir="ltr"
        onWheel={(e) => {
          const { x, y } = local(e)
          zoomEm(Math.exp(-e.deltaY * 0.0015), x, y)
        }}
        onDoubleClick={(e) => {
          const { x, y } = local(e)
          if (vista.k > ajuste * 1.5) ajustar()
          else zoomEm((ajuste * 2) / vista.k, x, y)
        }}
        onPointerDown={(e) => {
          ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
          ponteiros.current.set(e.pointerId, local(e))
          const pts = [...ponteiros.current.values()]
          if (pts.length === 1) arraste.current = { x: pts[0]!.x, y: pts[0]!.y, vx: vista.x, vy: vista.y }
          else if (pts.length === 2) arraste.current = { x: 0, y: 0, vx: vista.x, vy: vista.y, dist: Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y), k: vista.k }
        }}
        onPointerMove={(e) => {
          if (!ponteiros.current.has(e.pointerId) || !arraste.current) return
          ponteiros.current.set(e.pointerId, local(e))
          const pts = [...ponteiros.current.values()]
          const a = arraste.current
          if (pts.length === 1 && a.dist === undefined) {
            setVista((v) => ({ ...v, x: a.vx + pts[0]!.x - a.x, y: a.vy + pts[0]!.y - a.y }))
          } else if (pts.length === 2 && a.dist && a.k) {
            const d = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y)
            const alvo = limitar((a.k * d) / a.dist)
            zoomEm(alvo / vista.k, (pts[0]!.x + pts[1]!.x) / 2, (pts[0]!.y + pts[1]!.y) / 2)
          }
        }}
        onPointerUp={(e) => {
          ponteiros.current.delete(e.pointerId)
          const pts = [...ponteiros.current.values()]
          arraste.current = pts.length === 1 ? { x: pts[0]!.x, y: pts[0]!.y, vx: vista.x, vy: vista.y } : null
        }}
        onPointerCancel={(e) => {
          ponteiros.current.delete(e.pointerId)
          arraste.current = null
        }}
      >
        <div ref={conteudo} className="ty-site-visor__conteudo" dir={dir} style={{ transform: `translate(${vista.x}px, ${vista.y}px) scale(${vista.k})` }}>
          {children}
        </div>
      </div>
      <p className="ty-site-visor__dica">{t('visor.dica')}</p>
    </div>
  )
}
