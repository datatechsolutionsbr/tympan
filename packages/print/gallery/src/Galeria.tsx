import { useEffect, useState } from 'react'
import { PRINT_PRESET_NAMES, printPresets, resolvePrintStyleName, type PrintPresetName } from '@datatechsolutions/tympan-tokens'
import { LivroPrint } from '../../src/index.ts'
import { DuplaEstudo, GRAFICO_DO_ESTUDO, type TipoGraficoEstudo } from './estudo.tsx'
import { DuplaMapas } from './mapas.tsx'

type Grafico = 'estudo' | 'mapa' | TipoGraficoEstudo

function lerUrl() {
  const q = new URLSearchParams(window.location.search)
  // Old links with a deprecated style id open the renamed style.
  const estilo: PrintPresetName = resolvePrintStyleName(q.get('estilo') ?? 'jornal') ?? 'jornal'
  return {
    estilo,
    pb: q.get('pb') === '1',
    grafico: (q.get('grafico') ?? 'estudo') as Grafico,
    foto: q.get('foto') === '1',
  }
}

/**
 * The method spread of the example study (or, with `?grafico=mapa`, the map spread) in each
 * of the book styles, with P&B. `?foto=1`
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

  const tipo: TipoGraficoEstudo = grafico === 'estudo' || grafico === 'mapa' ? (GRAFICO_DO_ESTUDO[estilo] ?? 'halteres') : grafico
  const livro = (
    <LivroPrint estilo={estilo} pb={pb}>
      {grafico === 'mapa' ? <DuplaMapas /> : <DuplaEstudo grafico={tipo} />}
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
            <option value="mapa">mapas (valores de exemplo)</option>
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
