// Positions and lengths come from the data in every renderer: the renderer
// only draws the mark at the origin of a group placed by the chart.
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { RenderizadorGrafico } from '@datatechsolutions/tympan-tokens'
import { MethodChart, PrintBook, layoutBarras, layoutColunas, layoutHalteres, marcasEixo, type SpecBarras, type SpecHalteres } from '../src/index.ts'
import { PRIMEIRO, SOMADOS, specsEstudo } from '../gallery/src/estudo.tsx'

const RENDERIZADORES: RenderizadorGrafico[] = ['limpo', 'mao', 'isotype', 'gravura', 'prancheta', 'aquarela', 'riso', 'pontos']

function translate(el: Element): [number, number] {
  const m = /translate\(([-\d.e]+)[ ,]+([-\d.e]+)\)/.exec(el.getAttribute('transform') ?? '')
  if (!m) throw new Error(`no translate on ${el.outerHTML.slice(0, 80)}`)
  return [Number(m[1]), Number(m[2])]
}

describe('halteres: points sit on the data in every renderer', () => {
  const specs = specsEstudo('halteres') as [SpecHalteres, SpecHalteres]
  for (const r of RENDERIZADORES) {
    it(r, () => {
      for (const spec of specs) {
        const { container, unmount } = render(
          <PrintBook estilo="jornal">
            <MethodChart spec={spec} renderizador={r} largura={130} />
          </PrintBook>,
        )
        const svg = container.querySelector('svg.ty-print-chart')!
        const x0 = Number(svg.getAttribute('data-x0'))
        const x1 = Number(svg.getAttribute('data-x1'))
        const [d0, d1] = spec.escala
        expect(Number(svg.getAttribute('data-d0'))).toBe(d0)
        expect(Number(svg.getAttribute('data-d1'))).toBe(d1)
        const pontos = [...container.querySelectorAll('g.ty-print-point')]
        expect(pontos).toHaveLength(spec.linhas.length * 2)
        const ys = new Map<number, number>()
        for (const p of pontos) {
          const linha = Number(p.getAttribute('data-linha'))
          const serie = p.getAttribute('data-serie') as 'a' | 'b'
          const valor = spec.linhas[linha]![serie]
          expect(Number(p.getAttribute('data-valor'))).toBe(valor)
          const [x, y] = translate(p)
          const esperado = x0 + ((valor - d0) / (d1 - d0)) * (x1 - x0)
          expect(x).toBeCloseTo(esperado, 2)
          if (ys.has(linha)) expect(y).toBe(ys.get(linha))
          ys.set(linha, y)
        }
        // Rows keep their order, evenly spaced.
        const ordem = [...ys.entries()].sort((a, b) => a[0] - b[0]).map(([, y]) => y)
        for (let i = 1; i < ordem.length; i++) expect(ordem[i]! - ordem[i - 1]!).toBeCloseTo(ordem[1]! - ordem[0]!, 5)
        // The distance between the two points of a row is proportional to b − a.
        for (const [i, l] of spec.linhas.entries()) {
          const [xa] = translate(container.querySelector(`g.ty-print-point[data-linha="${i}"][data-serie="a"]`)!)
          const [xb] = translate(container.querySelector(`g.ty-print-point[data-linha="${i}"][data-serie="b"]`)!)
          expect(xb - xa).toBeCloseTo(((l.b - l.a) / (d1 - d0)) * (x1 - x0), 2)
        }
        unmount()
      }
    })
  }

  it('the layout agrees with the linear scale', () => {
    const spec = specsEstudo('halteres')[1] as SpecHalteres
    const L = layoutHalteres(spec, 130)
    const k = (L.eixo.x1 - L.eixo.x0) / (spec.escala[1] - spec.escala[0])
    SOMADOS.forEach((l, i) => {
      expect(L.linhas[i]!.xa).toBeCloseTo(L.eixo.x0 + l.a * k, 2)
      expect(L.linhas[i]!.xb).toBeCloseTo(L.eixo.x0 + l.b * k, 2)
    })
    expect(L.eixo.marcas.map((m) => m.v)).toEqual([0, 200, 400, 600, 800])
    expect(marcasEixo([0, 150], 6)).toEqual([0, 25, 50, 75, 100, 125, 150])
  })
})

describe('barras: bar lengths come from the data in every renderer', () => {
  const spec = specsEstudo('barras')[0] as SpecBarras
  for (const r of RENDERIZADORES) {
    it(r, () => {
      const { container } = render(
        <PrintBook estilo="jornal">
          <MethodChart spec={spec} renderizador={r} largura={130} />
        </PrintBook>,
      )
      const L = layoutBarras(spec, 130)
      const barras = [...container.querySelectorAll('g.ty-print-bar')]
      expect(barras).toHaveLength(PRIMEIRO.length * 2)
      for (const b of barras) {
        const valor = Number(b.getAttribute('data-valor'))
        const [x] = translate(b)
        expect(x).toBeCloseTo(L.eixo.x0, 3)
        expect(Number(b.getAttribute('data-w'))).toBeCloseTo(valor * L.mmPorUnidade, 1)
      }
    })
  }
})

describe('colunas (vertical bars): heights come from the data in every renderer', () => {
  const spec = specsEstudo('barras')[1] as SpecBarras
  for (const r of RENDERIZADORES) {
    it(r, () => {
      const { container } = render(
        <PrintBook estilo="cientifico">
          <MethodChart spec={spec} renderizador={r} largura={120} />
        </PrintBook>,
      )
      const L = layoutColunas(spec, 120)
      const svg = container.querySelector('svg.ty-print-chart')!
      expect(svg.getAttribute('data-orientacao')).toBe('vertical')
      const colunas = [...container.querySelectorAll('g.ty-print-bar')]
      expect(colunas).toHaveLength(SOMADOS.length * 2)
      const xs = new Set<number>()
      for (const b of colunas) {
        const valor = Number(b.getAttribute('data-valor'))
        const [x, y] = translate(b)
        expect(y).toBeCloseTo(L.area.y1, 3)
        expect(b.getAttribute('transform')).toContain('rotate(-90)')
        expect(Number(b.getAttribute('data-h'))).toBeCloseTo((valor * (L.area.y1 - L.area.y0)) / (spec.escala[1] - spec.escala[0]), 2)
        xs.add(x)
      }
      expect(xs.size).toBe(colunas.length)
    })
  }
})

describe('accessible figure', () => {
  it('names the finding, keeps a data table and tags local-lake numbers', () => {
    const spec = specsEstudo('halteres')[0]
    const { container, getByRole } = render(
      <PrintBook estilo="semanario">
        <MethodChart spec={spec} alt="Inverno 2022: 127 fora, 54 dentro." local />
      </PrintBook>,
    )
    expect(getByRole('img', { name: 'Inverno 2022: 127 fora, 54 dentro.' })).toBeInTheDocument()
    const tabela = container.querySelector('.ty-print-sr table')!
    expect(tabela.textContent).toContain('127')
    expect(tabela.textContent).toContain('Inverno 2016')
    expect(container.textContent).toContain('lake local, não publicado')
  })
})
