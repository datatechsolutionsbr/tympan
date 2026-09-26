// Style shapes of the comparison chart (estrutura.forma) and in-chart callouts
// (estrutura.chamadas): whatever the shape, one scale per figure turns every
// value into a length, height or thickness, in every renderer.
import { render } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { FormaGrafico, PrintStyleOverrides, RenderizadorGrafico } from '@datatechsolutions/tympan-tokens'
import { GraficoMetodo, LivroPrint, type SpecBarras, type SpecHalteres } from '../src/index.ts'
import { PRIMEIRO, SOMADOS, specsFpm } from '../gallery/src/fpm.tsx'

const RENDERIZADORES: RenderizadorGrafico[] = ['limpo', 'mao', 'isotype', 'gravura', 'prancheta', 'aquarela', 'riso', 'pontos']
const FORMAS: FormaGrafico[] = ['barras', 'colunas', 'eixo-central', 'ziguezague', 'fluxo', 'predios', 'cartoes']

const [PRIM, SOMA] = specsFpm('barras') as [SpecBarras, SpecBarras]

function desenhar(spec: SpecBarras, forma: FormaGrafico, renderizador: RenderizadorGrafico, extra: PrintStyleOverrides['estrutura'] = {}) {
  return render(
    <LivroPrint estilo="jornal" tokens={{ estrutura: { forma, ...extra } }}>
      <GraficoMetodo spec={spec} renderizador={renderizador} largura={124} />
    </LivroPrint>,
  )
}

const num = (el: Element, k: string) => Number(el.getAttribute(`data-${k}`))

/** mm per unit of every mark, from its size attribute: one value per figure. */
function escalaUnica(marcas: Element[], tamanho: (el: Element) => number, valor: (el: Element) => number) {
  const ks = marcas.filter((m) => valor(m) > 0).map((m) => tamanho(m) / valor(m))
  expect(ks.length).toBeGreaterThan(0)
  for (const k of ks) expect(k).toBeCloseTo(ks[0]!, 2)
  return ks[0]!
}

describe('every shape draws every value in every renderer', () => {
  for (const forma of FORMAS)
    for (const r of RENDERIZADORES)
      it(`${forma} · ${r}`, () => {
        for (const spec of [PRIM, SOMA]) {
          const { container, unmount } = desenhar(spec, forma, r)
          const fig = container.querySelector('figure')!
          expect(fig.getAttribute('data-forma')).toBe(forma)
          const barras = [...container.querySelectorAll('g.ty-print-barra')]
          const linhas = spec.linhas!
          // Every (row, series) is drawn and carries its value.
          for (const i of linhas.keys())
            for (const serie of ['a', 'b'] as const) {
              const marcas = barras.filter((b) => num(b, 'linha') === i && b.getAttribute('data-serie') === serie)
              expect(marcas.length, `${forma} linha ${i} ${serie}`).toBeGreaterThan(0)
            }
          if (forma === 'barras') {
            escalaUnica(barras, (b) => num(b, 'w'), (b) => num(b, 'valor'))
          } else if (forma === 'colunas' || forma === 'predios' || forma === 'cartoes') {
            escalaUnica(barras, (b) => num(b, 'h'), (b) => num(b, 'valor'))
          } else if (forma === 'eixo-central') {
            escalaUnica(barras, (b) => num(b, 'w'), (b) => num(b, 'valor'))
            // Both sides start at the axis: a ends there, b starts there.
            const eixo = barras.filter((b) => b.getAttribute('data-serie') === 'b').map((b) => num(b, 'x'))
            for (const x of eixo) expect(x).toBeCloseTo(eixo[0]!, 3)
            for (const b of barras.filter((b) => b.getAttribute('data-serie') === 'a')) expect(num(b, 'x') + num(b, 'w')).toBeCloseTo(eixo[0]!, 2)
          } else if (forma === 'ziguezague') {
            const k = escalaUnica(barras, (b) => num(b, 'w'), (b) => num(b, 'valor'))
            const D = spec.dobra!
            for (const [i, l] of linhas.entries())
              for (const [s, total] of [['a', l.a], ['b', l.b]] as const) {
                const segs = barras.filter((b) => num(b, 'linha') === i && b.getAttribute('data-serie') === s).sort((p, q) => num(p, 'dobra') - num(q, 'dobra'))
                // Total length = value; every line but the last is a full line of D units.
                expect(segs.reduce((acc, b) => acc + num(b, 'w'), 0)).toBeCloseTo(total * k, 2)
                segs.slice(0, -1).forEach((b) => expect(num(b, 'w')).toBeCloseTo(D * k, 2))
                expect(segs.length).toBe(Math.max(1, Math.ceil(total / D - 1e-9)))
              }
          } else if (forma === 'fluxo') {
            escalaUnica(barras, (b) => num(b, 'espessura'), (b) => num(b, 'valor'))
            for (const b of barras) expect(num(b, 'h')).toBeCloseTo(num(b, 'espessura'), 3)
          }
          expect(container.innerHTML).not.toMatch(/NaN|Infinity/)
          unmount()
        }
      })
})

describe('the folding bar keeps one line = dobra in both figures (same scale, as in the Du Bois study)', () => {
  it('mm per unit is the same for the first cut and the 17 cuts', () => {
    const ks = [PRIM, SOMA].map((spec) => {
      const { container, unmount } = desenhar(spec, 'ziguezague', 'limpo')
      const b = [...container.querySelectorAll('g.ty-print-barra')].find((x) => num(x, 'valor') > 0)!
      const k = num(b, 'w') / num(b, 'valor')
      unmount()
      return k
    })
    expect(ks[0]).toBeCloseTo(ks[1]!, 3)
    expect(SOMADOS[0]!.b).toBeGreaterThan(PRIM.dobra! * 3)
    expect(PRIMEIRO.every((l) => l.b < PRIM.dobra!)).toBe(true)
  })
})

describe('the line of the cut and the column marker', () => {
  it('one cut line per pair; a circle on each column', () => {
    const { container } = desenhar(PRIM, 'colunas', 'limpo', { linhaCorte: 'cheia', marcador: 'circulo' })
    expect(container.querySelectorAll('g.ty-print-g-corte')).toHaveLength(PRIM.linhas!.length)
    expect(container.querySelectorAll('g.ty-print-g-marcador')).toHaveLength(PRIM.linhas!.length * 2)
    // The cut line sits between the two columns of its group.
    const cols = [...container.querySelectorAll('g.ty-print-barra')]
    const linhas = [...container.querySelectorAll('g.ty-print-g-corte line')]
    linhas.forEach((ln, i) => {
      const [a, b] = cols.filter((c) => num(c, 'linha') === i)
      const x = Number(ln.getAttribute('x1'))
      expect(x).toBeGreaterThan(num(a!, 'x') + 0.5)
      expect(x).toBeLessThan(num(b!, 'x'))
    })
  })
})

describe('callouts inside the chart point at their value and stay in the figure', () => {
  for (const chamadas of ['manuscritas', 'baloes', 'guia'] as const)
    for (const r of RENDERIZADORES)
      it(`${chamadas} · ${r}`, () => {
        for (const spec of [PRIM, SOMA]) {
          const { container, unmount } = desenhar(spec, 'colunas', r, { chamadas })
          const svg = container.querySelector('svg')!
          const [, , W, H] = svg.getAttribute('viewBox')!.split(' ').map(Number)
          const notas = [...container.querySelectorAll('g.ty-print-g-chamada-nota')]
          expect(notas).toHaveLength(spec.anotacoes!.length)
          for (const [k, nt] of notas.entries()) {
            expect(num(nt, 'x')).toBeGreaterThanOrEqual(-0.01)
            expect(num(nt, 'x') + num(nt, 'w')).toBeLessThanOrEqual(W! + 0.01)
            expect(num(nt, 'y')).toBeGreaterThanOrEqual(0)
            expect(num(nt, 'y') + num(nt, 'h')).toBeLessThan(H!)
            // The target is the top of the last column of the annotated row.
            const linha = spec.anotacoes![k]!.linha
            const col = [...container.querySelectorAll(`g.ty-print-barra[data-linha="${linha}"]`)].at(-1)!
            expect(num(nt, 'alvo-x')).toBeGreaterThan(num(col, 'x'))
            expect(num(nt, 'alvo-x')).toBeLessThan(num(col, 'x') + 8)
            expect(num(nt, 'alvo-y')).toBeLessThan(num(col, 'base') - num(col, 'h'))
            // Notes sit above the plot, never over the columns.
            expect(num(nt, 'y') + num(nt, 'h')).toBeLessThan(num(col, 'base') - num(col, 'h'))
          }
          // No numbered list under the plot when the notes are drawn in it.
          expect(container.querySelectorAll('g.ty-print-g-anotacao')).toHaveLength(0)
          unmount()
        }
      })
})

describe('a dumbbell takes the style shape only when nothing is lost', () => {
  const halteres = specsFpm('halteres')[0] as SpecHalteres
  it('converted when the style declares a shape and the axis starts at zero', () => {
    const { container } = render(
      <LivroPrint estilo="jornal" tokens={{ estrutura: { forma: 'colunas' } }}>
        <GraficoMetodo spec={halteres} largura={120} />
      </LivroPrint>,
    )
    expect(container.querySelector('figure')!.getAttribute('data-tipo')).toBe('halteres')
    expect(container.querySelector('figure')!.getAttribute('data-forma')).toBe('colunas')
  })
  it('kept when it has reference lines, or when the style has no shape', () => {
    const casos: Array<[PrintStyleOverrides, SpecHalteres]> = [
      [{ estrutura: { forma: 'colunas' } }, { ...halteres, referencias: [{ valor: 50, rotulo: 'metade' }] }],
      [{}, halteres],
    ]
    for (const [tokens, spec] of casos) {
      const { container, unmount } = render(
        <LivroPrint estilo="jornal" tokens={tokens}>
          <GraficoMetodo spec={spec} largura={120} />
        </LivroPrint>,
      )
      expect(container.querySelector('figure')!.getAttribute('data-forma')).toBeNull()
      expect(container.querySelectorAll('g.ty-print-ponto').length).toBeGreaterThan(0)
      unmount()
    }
  })
})

describe('shapes render deterministically on the server', () => {
  for (const forma of FORMAS)
    it(forma, () => {
      for (const r of RENDERIZADORES) {
        const html = () => renderToStaticMarkup(<LivroPrint estilo="caderno" tokens={{ estrutura: { forma, chamadas: 'manuscritas' } }}>{[PRIM, SOMA].map((s, k) => <GraficoMetodo key={k} spec={s} renderizador={r} largura={120} />)}</LivroPrint>)
        const a = html()
        expect(a).toBe(html())
        expect(a).not.toMatch(/NaN|undefined|Infinity/)
      }
    })
})
