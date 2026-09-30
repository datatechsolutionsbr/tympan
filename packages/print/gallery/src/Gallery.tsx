import { useEffect, useState } from 'react'
import { PRINT_PRESET_NAMES, printPresets, resolvePrintStyleName, type PrintPresetName } from '@datatechsolutions/tympan-tokens'
import { PrintBook } from '../../src/index.ts'
import { DuplaEstudo, GRAFICO_DO_ESTUDO, type TipoGraficoEstudo } from './study.tsx'
import { DuplaMapas } from './maps.tsx'

type Grafico = 'study' | 'map' | TipoGraficoEstudo

function lerUrl() {
  const q = new URLSearchParams(window.location.search)
  // Old links with a deprecated style id open the renamed style.
  const estilo: PrintPresetName = resolvePrintStyleName(q.get('estilo') ?? 'jornal') ?? 'jornal'
  return {
    estilo,
    pb: q.get('pb') === '1',
    grafico: (q.get('chart') ?? 'study') as Grafico,
    foto: q.get('foto') === '1',
  }
}

/**
 * The method spread of the example study (or, with `?grafico=mapa`, the map spread) in each
 * of the book styles, with P&B. `?foto=1`
 * renders only the spread (used by scripts/gallery-shots.mjs).
 */
export function Gallery() {
  const inicial = lerUrl()
  const [estilo, setEstilo] = useState<PrintPresetName>(inicial.estilo)
  const [pb, setPb] = useState(inicial.pb)
  const [grafico, setGrafico] = useState<Grafico>(inicial.grafico)

  useEffect(() => {
    const q = new URLSearchParams({ estilo, grafico, ...(pb ? { pb: '1' } : {}), ...(inicial.foto ? { foto: '1' } : {}) })
    window.history.replaceState(null, '', `?${q.toString()}`)
  }, [estilo, pb, grafico, inicial.foto])

  const tipo: TipoGraficoEstudo = grafico === 'study' || grafico === 'map' ? (GRAFICO_DO_ESTUDO[estilo] ?? 'halteres') : grafico
  const livro = (
    <PrintBook estilo={estilo} pb={pb}>
      {grafico === 'map' ? <DuplaMapas /> : <DuplaEstudo grafico={tipo} />}
    </PrintBook>
  )
  if (inicial.foto) return <main className="ty-print-galeria-foto">{livro}</main>

  return (
    <div className="ty-print-galeria">
      <header className="ty-print-galeria-barra">
        <h1>Tympan print · styles de livro</h1>
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
            <option value="study">o do estudo</option>
            <option value="halteres">halteres</option>
            <option value="barras">barras</option>
            <option value="contagem">contagem</option>
            <option value="map">maps (example values)</option>
          </select>
        </label>
        <label>
          <input type="checkbox" checked={pb} onChange={(e) => setPb(e.target.checked)} /> P&amp;B
        </label>
      </header>
      <main>{livro}</main>
    </div>
  )
}
