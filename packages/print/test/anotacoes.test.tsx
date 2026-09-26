// Notes, units and reference labels stay inside the figure's viewBox. jsdom
// cannot measure text, so the check uses the layout's own width estimate
// widened by the safety margin the layout reserves (FOLGA_ANOTACAO): if the
// real font runs up to that much wider than the estimate, it still fits.
import { describe, expect, it } from 'vitest'
import {
  layoutBarras,
  layoutColunas,
  layoutContagem,
  layoutHalteres,
  layoutSerie,
  type GraficoSpec,
  type SpecBarras,
  type SpecContagem,
  type SpecHalteres,
  type SpecSerie,
} from '../src/index.ts'
import { FOLGA_ANOTACAO, TEXTO, larguraTexto, type AnotacaoPosta } from '../src/grafico/geometria.ts'
import { specsFpm } from '../gallery/src/fpm.tsx'

const LONGA =
  'Com a estimativa de 2025, 60 contra 43. A régua que distribui o FPM é a estimativa [conferir com o TCU], e uma nota longa o bastante para quebrar em várias linhas.'

function dentro(postas: AnotacaoPosta[], largura: number, altura: number) {
  for (const a of postas) {
    a.linhas.forEach((l, i) => {
      const w = larguraTexto(l, TEXTO * 1.05) / FOLGA_ANOTACAO
      if (a.guia) expect(a.x - w, `"${l}" passa da borda esquerda`).toBeGreaterThanOrEqual(-0.01)
      else expect(a.x + w, `"${l}" passa da borda direita`).toBeLessThanOrEqual(largura + 0.01)
      const y = a.y + i * TEXTO * 1.4
      expect(y + 0.8, `"${l}" passa do pé do gráfico`).toBeLessThanOrEqual(altura)
    })
  }
}

const comNotas = <T extends GraficoSpec>(s: T, k: number): T => ({ ...s, anotacoes: Array.from({ length: k }, (_, i) => ({ linha: 0, texto: i ? `${LONGA} (${i})` : LONGA })) })

describe('annotations never leave the viewBox', () => {
  for (const largura of [60, 92, 100, 130]) {
    for (const k of [1, 3]) {
      it(`halteres ${largura} mm, ${k} nota(s)`, () => {
        for (const base of specsFpm('halteres') as SpecHalteres[]) {
          const spec = comNotas({ ...base, unidade: 'municípios', referencias: [{ valor: 50, rotulo: 'metade' }] }, k)
          const L = layoutHalteres(spec, largura)
          dentro(L.anotacoes, largura, L.altura)
          // Unit label under the axis (baseline at eixo.y + 5.6).
          expect(L.eixo.y + 5.6 + 0.8).toBeLessThanOrEqual(L.altura)
          // Reference labels sit in their own band, above the first row.
          if (L.referencias.length) expect(L.eixo.topo - 1).toBeLessThan(L.linhas[0]!.y - 1.2)
          // Notes start below the unit line.
          for (const a of L.anotacoes) expect(a.y - TEXTO).toBeGreaterThan(L.eixo.y + 5.6 - 0.1)
        }
      })
      it(`barras e colunas ${largura} mm, ${k} nota(s)`, () => {
        const spec = comNotas(specsFpm('barras')[0] as SpecBarras, k)
        const L = layoutBarras(spec, largura)
        dentro(L.anotacoes, largura, L.altura)
        const C = layoutColunas(spec, largura)
        dentro(C.anotacoes, largura, C.altura)
      })
      it(`contagem ${largura} mm, ${k} nota(s)`, () => {
        const spec = comNotas(specsFpm('contagem')[0] as SpecContagem, k)
        const L = layoutContagem(spec, largura)
        dentro(L.anotacoes, largura, L.altura)
      })
      it(`serie ${largura} mm, ${k} nota(s)`, () => {
        const spec: SpecSerie = comNotas(
          {
            tipo: 'serie',
            titulo: 't',
            escala: [0, 12500],
            eixoX: [2008, 2025],
            unidade: 'km²',
            pontos: [
              { x: 2008, y: 12374 },
              { x: 2011, y: 5393 },
            ],
            faixas: [{ de: 2008, ate: 2011, rotulo: 'antes da lei' }],
          },
          k,
        )
        const L = layoutSerie(spec, largura)
        dentro(L.anotacoes, largura, L.altura)
        // Unit above the plot: baseline y0 − 4.6 with shaded periods, minus the glyph height, stays ≥ 0.
        expect(L.area.y0 - 4.6 - 1.8).toBeGreaterThanOrEqual(0)
      })
    }
  }
})
