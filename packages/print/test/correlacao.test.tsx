// Correlation charts: positions come from the data in every renderer, the
// coefficient written on the chart is the one computed from the points drawn,
// a published coefficient that disagrees is flagged, and SSR is deterministic.
import { render } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { RenderizadorGrafico } from '@datatechsolutions/tympan-tokens'
import { MethodChart, PrintBook } from '../src/index.ts'
import type { SpecAntesDepoisControle, SpecDispersao, SpecMatrizCorrelacao, SpecSimpson, PontoMunicipio } from '../src/chart/tipos.ts'
import {
  correlacaoDentro,
  fmtCoef,
  fmtCompacto,
  hexbin,
  marcasLog,
  minimosQuadrados,
  pearson,
  postos,
  spearman,
} from '../src/chart/statistics.ts'
import { intensidadeCelula } from '../src/chart/correlation.tsx'

const RENDERIZADORES: RenderizadorGrafico[] = ['limpo', 'mao', 'isotype', 'gravura', 'prancheta', 'aquarela', 'riso', 'pontos']

/** Deterministic pseudo-random numbers (no Math.random in tests either). */
function lcg(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

function nuvem(n: number, seed = 7, { log = false } = {}): PontoMunicipio[] {
  const r = lcg(seed)
  return Array.from({ length: n }, (_, i) => {
    const x = log ? 10 ** (1 + 4 * r()) : 10 + 90 * r()
    const y = log ? x ** 0.6 * 10 ** (r() - 0.5) : 0.5 * x + 30 * (r() - 0.5)
    return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100, ibge: 1000000 + i, municipio: `M${i}`, uf: 'XX', pop: 1000 + Math.round(r() * 1e5) }
  })
}

function translate(el: Element): [number, number] {
  const m = /translate\(([-\d.e]+)[ ,]+([-\d.e]+)\)/.exec(el.getAttribute('transform') ?? '')
  if (!m) throw new Error(`no translate on ${el.outerHTML.slice(0, 80)}`)
  return [Number(m[1]), Number(m[2])]
}

function area(container: HTMLElement) {
  const a = container.querySelector('g.ty-print-g-area')!
  const num = (k: string) => Number(a.getAttribute(`data-${k}`))
  return { x0: num('x0'), x1: num('x1'), y0: num('y0'), y1: num('y1'), dx0: num('dx0'), dx1: num('dx1'), dy0: num('dy0'), dy1: num('dy1'), logx: a.hasAttribute('data-logx'), logy: a.hasAttribute('data-logy') }
}

const posicao = (A: ReturnType<typeof area>, x: number, y: number) => {
  const t = (v: number, log: boolean) => (log ? Math.log(v) : v)
  return [
    A.x0 + ((t(x, A.logx) - t(A.dx0, A.logx)) / (t(A.dx1, A.logx) - t(A.dx0, A.logx))) * (A.x1 - A.x0),
    A.y1 - ((t(y, A.logy) - t(A.dy0, A.logy)) / (t(A.dy1, A.logy) - t(A.dy0, A.logy))) * (A.y1 - A.y0),
  ] as const
}

const noLivro = (el: React.ReactElement) => render(<PrintBook estilo="jornal">{el}</PrintBook>)

describe('statistics', () => {
  it('pearson, spearman, ranks and least squares', () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 12)
    expect(pearson([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1, 12)
    expect(pearson([1, 1, 1], [1, 2, 3])).toBeNull()
    expect(postos([10, 20, 20, 30])).toEqual([1, 2.5, 2.5, 4])
    // Monotone but not linear: ρ = 1, r < 1.
    const x = [1, 2, 3, 4, 5, 6]
    const y = x.map((v) => v ** 3)
    expect(spearman(x, y)).toBeCloseTo(1, 12)
    expect(pearson(x, y)!).toBeLessThan(0.99)
    const reta = minimosQuadrados([0, 1, 2, 3], [1, 3, 5, 7])!
    expect(reta.a).toBeCloseTo(1, 12)
    expect(reta.b).toBeCloseTo(2, 12)
  })

  it('within-group correlation can have the opposite sign of the overall one (Simpson)', () => {
    // Three groups: inside each, y rises with x; across groups, higher x sits with lower y.
    const x: number[] = []
    const y: number[] = []
    const g: string[] = []
    ;['A', 'B', 'C'].forEach((nome, k) => {
      for (let i = 0; i < 10; i++) {
        x.push(k * 10 + i)
        y.push(100 - k * 30 + i)
        g.push(nome)
      }
    })
    expect(pearson(x, y)!).toBeLessThan(0)
    expect(correlacaoDentro(x, y, g)!).toBeCloseTo(1, 12)
  })

  it('hexbin assigns every point to the nearest hexagon centre', () => {
    const r = lcg(3)
    const pts = Array.from({ length: 3000 }, () => ({ x: 100 * r(), y: 60 * r() }))
    const R = 1.7
    const hs = hexbin(pts, R)
    expect(hs.reduce((s, h) => s + h.n, 0)).toBe(pts.length)
    for (const h of hs)
      for (const i of h.indices) {
        const d = Math.hypot(pts[i]!.x - h.cx, pts[i]!.y - h.cy)
        expect(d).toBeLessThanOrEqual(R + 1e-6)
        for (const o of hs) expect(d).toBeLessThanOrEqual(Math.hypot(pts[i]!.x - o.cx, pts[i]!.y - o.cy) + 1e-6)
      }
  })

  it('formats', () => {
    expect(fmtCoef(-0.278)).toBe('−0,278')
    expect(fmtCoef(0.056)).toBe('+0,056')
    expect(fmtCoef(0)).toBe('0,000')
    expect(fmtCompacto(12500)).toBe('12,5 mil')
    expect(fmtCompacto(2_000_000)).toBe('2 mi')
    expect(marcasLog([1000, 1_000_000])).toEqual([1000, 3000, 10000, 30000, 100000, 300000, 1000000])
    expect(marcasLog([10, 100])).toEqual([10, 20, 50, 100])
  })
})

describe('dispersao: points on the data and the coefficient drawn in every renderer', () => {
  const pontos = nuvem(150)
  const r = pearson(pontos.map((p) => p.x), pontos.map((p) => p.y))!
  const spec: SpecDispersao = {
    tipo: 'dispersao',
    titulo: 't',
    pontos,
    x: { rotulo: 'x' },
    y: { rotulo: 'y' },
    coeficiente: Math.round(r * 1000) / 1000,
    destaques: [{ ibge: 1000003 }, { municipio: 'M10', rotulo: 'o décimo' }],
  }
  for (const nome of RENDERIZADORES) {
    it(nome, () => {
      const { container, unmount } = noLivro(<MethodChart spec={spec} renderizador={nome} largura={128} />)
      const A = area(container)
      const gs = [...container.querySelectorAll('g.ty-print-point')]
      expect(gs).toHaveLength(pontos.length)
      for (const g of gs) {
        const p = pontos[Number(g.getAttribute('data-i'))]!
        const [X, Y] = translate(g)
        const [ex, ey] = posicao(A, p.x, p.y)
        expect(X).toBeCloseTo(ex, 2)
        expect(Y).toBeCloseTo(ey, 2)
      }
      // The coefficient written is the one of the points drawn.
      const coef = container.querySelector('.ty-print-g-coef')!
      expect(Number(coef.getAttribute('data-coef'))).toBeCloseTo(r, 3)
      expect(coef.textContent).toContain(fmtCoef(r))
      expect(container.querySelector('[data-aviso="coeficiente"]')).toBeNull()
      // The trend line is the least-squares line: its ends map back onto y = a + b·x.
      const t = container.querySelector('g.ty-print-g-trend')!
      const reta = minimosQuadrados(pontos.map((p) => p.x), pontos.map((p) => p.y))!
      for (const k of [1, 2]) {
        const X = Number(t.getAttribute(`data-x${k}`))
        const Y = Number(t.getAttribute(`data-y${k}`))
        const xv = A.dx0 + ((X - A.x0) / (A.x1 - A.x0)) * (A.dx1 - A.dx0)
        const yv = A.dy0 + ((A.y1 - Y) / (A.y1 - A.y0)) * (A.dy1 - A.dy0)
        expect(yv).toBeCloseTo(reta.a + reta.b * xv, 1)
      }
      // Named municipalities sit on their points.
      const d = [...container.querySelectorAll('g.ty-print-g-highlight')]
      expect(d).toHaveLength(2)
      expect(d[1]!.textContent).toBe('o décimo')
      const p3 = pontos[3]!
      const [ex, ey] = posicao(A, p3.x, p3.y)
      expect(Number(d[0]!.getAttribute('data-cx'))).toBeCloseTo(ex, 2)
      expect(Number(d[0]!.getAttribute('data-cy'))).toBeCloseTo(ey, 2)
      // Accessible name states the finding.
      expect(container.querySelector('svg')!.getAttribute('aria-label')).toContain(fmtCoef(r))
      unmount()
    })
  }

  it('flags a published coefficient that the points do not give', () => {
    const { container } = noLivro(<MethodChart spec={{ ...spec, coeficiente: 0.123 }} largura={128} />)
    expect(container.querySelector('[data-aviso="coeficiente"]')!.textContent).toContain('+0,123')
  })

  it('log axes: positions and r are computed on ln', () => {
    const pts = nuvem(300, 11, { log: true })
    const s: SpecDispersao = { tipo: 'dispersao', titulo: 't', pontos: pts, x: { rotulo: 'x', log: true }, y: { rotulo: 'y', log: true } }
    const { container } = noLivro(<MethodChart spec={s} largura={128} />)
    const A = area(container)
    expect(A.logx && A.logy).toBe(true)
    for (const g of container.querySelectorAll('g.ty-print-point')) {
      const p = pts[Number(g.getAttribute('data-i'))]!
      const [X, Y] = translate(g)
      const [ex, ey] = posicao(A, p.x, p.y)
      expect(X).toBeCloseTo(ex, 2)
      expect(Y).toBeCloseTo(ey, 2)
    }
    const rl = pearson(pts.map((p) => Math.log(p.x)), pts.map((p) => Math.log(p.y)))!
    expect(Number(container.querySelector('.ty-print-g-coef')!.getAttribute('data-coef'))).toBeCloseTo(rl, 3)
  })

  it('spearman on all points, zeros of a log axis in their own strip', () => {
    const pts = [...nuvem(80, 5, { log: true }), { x: 0, y: 5000, ibge: 9, municipio: 'Porto', uf: 'PR' }, { x: 0, y: 30, ibge: 10, municipio: 'Sede', uf: 'SP' }]
    const s: SpecDispersao = { tipo: 'dispersao', titulo: 't', pontos: pts, x: { rotulo: 'x', log: true }, y: { rotulo: 'y', log: true }, metodo: 'spearman', rotuloZeroX: 'sem área' }
    const { container } = noLivro(<MethodChart spec={s} largura={128} />)
    const rho = spearman(pts.map((p) => p.x), pts.map((p) => p.y))!
    expect(Number(container.querySelector('.ty-print-g-coef')!.getAttribute('data-coef'))).toBeCloseTo(rho, 3)
    expect(container.querySelector('.ty-print-g-coef')!.textContent).toContain('ρ')
    const A = area(container)
    const zeros = [...container.querySelectorAll('g.ty-print-point')].filter((g) => pts[Number(g.getAttribute('data-i'))]!.x === 0)
    expect(zeros).toHaveLength(2)
    for (const g of zeros) expect(translate(g)[0]).toBeLessThan(A.x0)
    expect(new Set(zeros.map((g) => translate(g)[0])).size).toBe(1)
  })

  it('dense clouds are binned: every point counted once, inside its hexagon', () => {
    const pts = nuvem(2400, 9)
    const s: SpecDispersao = { tipo: 'dispersao', titulo: 't', pontos: pts, x: { rotulo: 'x' }, y: { rotulo: 'y' } }
    for (const nome of RENDERIZADORES) {
      const { container, unmount } = noLivro(<MethodChart spec={s} renderizador={nome} largura={128} />)
      const A = area(container)
      const g = container.querySelector('g.ty-print-g-cloud')!
      expect(g.getAttribute('data-modo')).toBe('hexbin')
      const R = Number(g.getAttribute('data-raio'))
      const hexes = [...container.querySelectorAll('.ty-print-g-cloud .ty-print-hex')].map((h) => ({ n: Number(h.getAttribute('data-n')), cx: Number(h.getAttribute('data-cx')), cy: Number(h.getAttribute('data-cy')) }))
      expect(hexes.reduce((a, h) => a + h.n, 0)).toBe(pts.length)
      // Each point lies within one circumradius of some hexagon centre.
      for (const p of pts.slice(0, 200)) {
        const [X, Y] = posicao(A, p.x, p.y)
        expect(Math.min(...hexes.map((h) => Math.hypot(X - h.cx, Y - h.cy)))).toBeLessThanOrEqual(R + 0.01)
      }
      unmount()
    }
  })
})

describe('simpson: overall and within-group lines', () => {
  const r = lcg(21)
  const pontos: PontoMunicipio[] = []
  ;['AA', 'BB', 'CC', 'DD'].forEach((uf, k) => {
    for (let i = 0; i < 40; i++) {
      const x = 1000 * (k + 1) + 800 * r()
      pontos.push({ x: Math.round(x), y: Math.round((8 - 1.2 * k + 0.0015 * (x - 1000 * (k + 1)) + 0.4 * (r() - 0.5)) * 100) / 100, grupo: uf, uf, ibge: k * 100 + i })
    }
  })
  const xs = pontos.map((p) => p.x)
  const ys = pontos.map((p) => p.y)
  const g = pontos.map((p) => p.grupo!)
  const geral = pearson(xs, ys)!
  const dentro = correlacaoDentro(xs, ys, g)!
  const spec: SpecSimpson = {
    tipo: 'simpson',
    titulo: 't',
    pontos,
    x: { rotulo: 'gasto' },
    y: { rotulo: 'nota' },
    rotuloGeral: 'Brasil',
    rotuloDentro: 'dentro das UFs',
    rotuloGrupo: 'UF',
    medias: true,
    destaquesGrupo: ['BB'],
    coeficienteGeral: Math.round(geral * 1000) / 1000,
    coeficienteDentro: Math.round(dentro * 1000) / 1000,
  }
  it('the sign flips and both coefficients are the recomputed ones', () => {
    expect(geral).toBeLessThan(0)
    expect(dentro).toBeGreaterThan(0)
  })
  for (const nome of RENDERIZADORES) {
    it(nome, () => {
      const { container, unmount } = noLivro(<MethodChart spec={spec} renderizador={nome} largura={128} />)
      const a = container.querySelector('g.ty-print-g-area')!
      expect(Number(a.getAttribute('data-r-geral'))).toBeCloseTo(geral, 6)
      expect(Number(a.getAttribute('data-r-dentro'))).toBeCloseTo(dentro, 6)
      expect(container.textContent).toContain(`Brasil: r = ${fmtCoef(geral)}`)
      expect(container.textContent).toContain(`dentro das UFs: r = ${fmtCoef(dentro)}`)
      expect(container.textContent).toContain('o sinal se inverte')
      expect(container.querySelector('[data-aviso="coeficiente"]')).toBeNull()
      const A = area(container)
      // Each group's line is that group's least-squares line.
      const linhas = [...container.querySelectorAll('g.ty-print-g-line-group')]
      expect(linhas).toHaveLength(4)
      for (const l of linhas) {
        const grupo = l.getAttribute('data-grupo')!
        const gp = pontos.filter((p) => p.grupo === grupo)
        const reta = minimosQuadrados(gp.map((p) => p.x), gp.map((p) => p.y))!
        expect(reta.b).toBeGreaterThan(0)
        for (const k of [1, 2]) {
          const X = Number(l.getAttribute(`data-x${k}`))
          const Y = Number(l.getAttribute(`data-y${k}`))
          const xv = A.dx0 + ((X - A.x0) / (A.x1 - A.x0)) * (A.dx1 - A.dx0)
          const yv = A.dy0 + ((A.y1 - Y) / (A.y1 - A.y0)) * (A.dy1 - A.dy0)
          expect(yv).toBeCloseTo(reta.a + reta.b * xv, 1)
        }
      }
      // Group means sit on the means.
      for (const m of container.querySelectorAll('g.ty-print-g-mean')) {
        const gp = pontos.filter((p) => p.grupo === m.getAttribute('data-grupo'))
        const [ex, ey] = posicao(A, gp.reduce((s, p) => s + p.x, 0) / gp.length, gp.reduce((s, p) => s + p.y, 0) / gp.length)
        expect(Number(m.getAttribute('data-cx'))).toBeCloseTo(ex, 1)
        expect(Number(m.getAttribute('data-cy'))).toBeCloseTo(ey, 1)
      }
      unmount()
    })
  }
})

describe('matriz-correlacao', () => {
  const spec: SpecMatrizCorrelacao = {
    tipo: 'matriz-correlacao',
    titulo: 'm',
    indicadores: ['A', 'B', 'C', 'D'],
    valores: [
      [1, 0.5, -0.8, 0],
      [0.5, 1, 0.1, -0.3],
      [-0.8, 0.1, 1, 0.9],
      [0, -0.3, 0.9, 1],
    ],
  }
  for (const nome of RENDERIZADORES) {
    it(nome, () => {
      const { container, unmount } = noLivro(<MethodChart spec={spec} renderizador={nome} largura={120} />)
      const cel = [...container.querySelectorAll('g.ty-print-g-cell')]
      expect(cel).toHaveLength(6)
      for (const c of cel) {
        const i = Number(c.getAttribute('data-linha'))
        const j = Number(c.getAttribute('data-coluna'))
        expect(i).toBeGreaterThan(j)
        const r = spec.valores[i]![j]!
        expect(c.textContent).toBe(fmtCoef(r, 2))
        expect(Number(c.querySelector('[data-intensidade]')!.getAttribute('data-intensidade'))).toBe(intensidadeCelula(r))
      }
      // Cells on a regular grid: position = row and column.
      const xs = new Set(cel.map((c) => Math.round((Number(c.getAttribute('data-x')) - Number(c.getAttribute('data-coluna')) * Number(c.getAttribute('data-w'))) * 50) / 50))
      expect(xs.size).toBe(1)
      unmount()
    })
  }
  it('neutral at zero, full at |r| = 1', () => {
    expect(intensidadeCelula(0)).toBe(0)
    expect(intensidadeCelula(-1)).toBe(1)
    expect(intensidadeCelula(0.5)).toBe(intensidadeCelula(-0.5))
  })
})

describe('antes-depois-controle', () => {
  const spec: SpecAntesDepoisControle = {
    tipo: 'antes-depois-controle',
    titulo: 'c',
    rotuloBruto: 'sem controle',
    rotuloControlado: 'com controle',
    linhas: [
      { rotulo: 'FUNDEB × IDEB', bruto: -0.278, controlado: 0.056 },
      { rotulo: 'IDHM × IDEB', bruto: 0.536, controlado: 0.236 },
    ],
  }
  for (const nome of RENDERIZADORES) {
    it(nome, () => {
      const { container, unmount } = noLivro(<MethodChart spec={spec} renderizador={nome} largura={120} />)
      const svg = container.querySelector('svg')!
      const x0 = Number(svg.getAttribute('data-x0'))
      const x1 = Number(svg.getAttribute('data-x1'))
      for (const p of container.querySelectorAll('g.ty-print-point')) {
        const v = Number(p.getAttribute('data-valor'))
        expect(translate(p)[0]).toBeCloseTo(x0 + ((v + 1) / 2) * (x1 - x0), 2)
      }
      expect(container.querySelectorAll('g.ty-print-g-line')[0]!.textContent).toContain('o sinal se inverte')
      expect(container.querySelectorAll('g.ty-print-g-line')[1]!.textContent).not.toContain('o sinal se inverte')
      expect(svg.getAttribute('aria-label')).toContain('+0,056')
      unmount()
    })
  }
})

describe('correlation charts render deterministically on the server', () => {
  const specs = [
    { tipo: 'dispersao', titulo: 'd', pontos: nuvem(200), x: { rotulo: 'x' }, y: { rotulo: 'y' } } as SpecDispersao,
    { tipo: 'dispersao', titulo: 'h', pontos: nuvem(2000, 4), x: { rotulo: 'x' }, y: { rotulo: 'y' } } as SpecDispersao,
    { tipo: 'simpson', titulo: 's', pontos: nuvem(300).map((p, i) => ({ ...p, grupo: `G${i % 5}` })), x: { rotulo: 'x' }, y: { rotulo: 'y' }, medias: true } as SpecSimpson,
    { tipo: 'matriz-correlacao', titulo: 'm', indicadores: ['A', 'B', 'C'], valores: [[1, 0.2, -0.4], [0.2, 1, 0.7], [-0.4, 0.7, 1]] } as SpecMatrizCorrelacao,
    { tipo: 'antes-depois-controle', titulo: 'a', rotuloBruto: 'b', rotuloControlado: 'c', linhas: [{ rotulo: 'x', bruto: 0.5, controlado: 0.2 }] } as SpecAntesDepoisControle,
  ]
  for (const nome of RENDERIZADORES)
    it(nome, () => {
      for (const pb of [false, true]) {
        const html = () => renderToStaticMarkup(<PrintBook estilo="caderno" pb={pb}>{specs.map((s, k) => <MethodChart key={k} spec={s} renderizador={nome} largura={120} />)}</PrintBook>)
        const a = html()
        expect(a).toBe(html())
        expect(a).not.toMatch(/NaN|undefined|Infinity/)
      }
    })
})

describe('a chart whose data was not loaded says so', () => {
  it('dispersao, simpson and matriz without points', () => {
    for (const spec of [
      { tipo: 'dispersao', titulo: 'd', dados: 'figuras/dados/q36.json', x: { rotulo: 'x' }, y: { rotulo: 'y' } },
      { tipo: 'simpson', titulo: 's', dados: 'figuras/dados/q36.json', x: { rotulo: 'x' }, y: { rotulo: 'y' } },
      { tipo: 'matriz-correlacao', titulo: 'm', dados: 'figuras/dados/m.json' },
    ] as unknown as SpecDispersao[]) {
      const html = renderToStaticMarkup(<PrintBook estilo="jornal"><MethodChart spec={spec} largura={100} /></PrintBook>)
      expect(html).toContain('dados não carregados: figuras/dados/')
      expect(html).not.toMatch(/NaN|Infinity/)
    }
  })
})
