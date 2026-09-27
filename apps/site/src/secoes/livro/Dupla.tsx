// One spread of the sample chapter (the print gallery's content) in a book style, memoised: the rough.js and
// map renderers are the slow part of the page, so a spread only re-renders when its style, P&B or chart change.
import { memo, useEffect, useRef, useState } from 'react'
import { LivroPrint } from '@datatechsolutions/tympan-print'
import type { PrintPresetName } from '../../tokens'
import { DuplaEstudo, DuplaMapas, GRAFICO_DO_ESTUDO, type TipoGraficoEstudo } from '../../galerias'
import type { Grafico } from '../../rotas'

export const tipoDoGrafico = (estilo: string, grafico: Grafico): TipoGraficoEstudo =>
  grafico === 'estudo' || grafico === 'mapa' ? (GRAFICO_DO_ESTUDO[estilo] ?? 'halteres') : grafico

export interface DuplaEstiloProps {
  estilo: PrintPresetName
  grafico: Grafico
  pb: boolean
}

export const DuplaEstilo = memo(function DuplaEstilo({ estilo, grafico, pb }: DuplaEstiloProps) {
  return (
    // The component CSS is imported once (main.tsx); each spread adds only its style's custom properties.
    <LivroPrint estilo={estilo} pb={pb} incluirCss={false} className="ty-site-livro">
      {grafico === 'mapa' ? <DuplaMapas /> : <DuplaEstudo grafico={tipoDoGrafico(estilo, grafico)} />}
    </LivroPrint>
  )
})

/** Renders its children only once scrolled near the viewport (the gallery has 39 spreads). */
export function QuandoVisivel({ children, reserva }: { children: React.ReactNode; reserva: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visto, setVisto] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || visto) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisto(true)
      return
    }
    const io = new IntersectionObserver((r) => r.some((x) => x.isIntersecting) && setVisto(true), { rootMargin: '400px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [visto])
  return <div ref={ref}>{visto ? children : reserva}</div>
}
