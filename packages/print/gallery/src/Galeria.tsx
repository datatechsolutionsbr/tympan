import { useEffect, useState } from 'react'
import { PRINT_PRESET_NAMES, printPresets, type PrintPresetName } from '@datatechsolutions/tympan-tokens'
import { LivroPrint } from '../../src/index.ts'
import { DuplaFpm, GRAFICO_DO_ESTUDO, type TipoGraficoFpm } from './fpm.tsx'

type Grafico = 'estudo' | TipoGraficoFpm

function lerUrl() {
  const q = new URLSearchParams(window.location.search)
  const estilo = (q.get('estilo') ?? 'jornal') as PrintPresetName
  return {
    estilo: PRINT_PRESET_NAMES.includes(estilo) ? estilo : 'jornal',
    pb: q.get('pb') === '1',
    grafico: (q.get('grafico') ?? 'estudo') as Grafico,
    foto: q.get('foto') === '1',
  }
}

/**
 * The FPM method spread in each of the book styles, with P&B. `?foto=1`
 * renders only the spread (used by scripts/gallery-shots.mjs).
 */
export function Galeria() {
  const inicial = lerUrl()
  const [estilo, setEstilo] = useState<PrintPresetName>(inicial.estilo)
  const [pb, setPb] = useState(inicial.pb)
  const [grafico, setGrafico] = useState<Grafico>(inicial.grafico)

  useEffect(() => {
    const q = new URLSearchParams({ estilo, grafico, ...(pb ? { pb: '1' } : {}), ...(inicial.foto ? { foto: '1' } : {}) })
    window.history.replaceState(null, '', `?${q.toString()}`)
  }, [estilo, pb, grafico, inicial.foto])

  const tipo: TipoGraficoFpm = grafico === 'estudo' ? (GRAFICO_DO_ESTUDO[estilo] ?? 'halteres') : grafico
  const livro = (
    <LivroPrint estilo={estilo} pb={pb}>
      <DuplaFpm grafico={tipo} />
    </LivroPrint>
  )
  if (inicial.foto) return <main className="ty-print-galeria-foto">{livro}</main>

  return (
    <div className="ty-print-galeria">
      <header className="ty-print-galeria-barra">
        <h1>Tympan print · estilos de livro</h1>
        <label>
          Estilo
          <select value={estilo} onChange={(e) => setEstilo(e.target.value as PrintPresetName)}>
            {PRINT_PRESET_NAMES.map((n) => (
              <option key={n} value={n}>
                {printPresets[n].label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Gráfico
          <select value={grafico} onChange={(e) => setGrafico(e.target.value as Grafico)}>
            <option value="estudo">o do estudo</option>
            <option value="halteres">halteres</option>
            <option value="barras">barras</option>
            <option value="contagem">contagem</option>
          </select>
        </label>
        <label>
          <input type="checkbox" checked={pb} onChange={(e) => setPb(e.target.checked)} /> P&amp;B
        </label>
        <p className="ty-print-galeria-ref">{printPresets[estilo].referencia}</p>
      </header>
      <main>{livro}</main>
    </div>
  )
}
