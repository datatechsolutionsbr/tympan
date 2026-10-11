// @vitest-environment node
// The highlight colour means one thing: the row(s) the author marked. Series colours are constant.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MethodChart, PrintBook } from '../src/index.ts'
import { COR_SERIE, coresLinha, corUnica } from '../src/chart/parts.tsx'

const barras = (destaque: boolean) => ({
  tipo: 'barras' as const, titulo: 'T', escala: [0, 10] as [number, number], rotuloA: '2010', rotuloB: '2020',
  linhas: [{ rotulo: 'A', a: 2, b: 5, destaque }, { rotulo: 'B', a: 3, b: 4 }],
})
const coresDasBarras = (h: string) => [...h.matchAll(/data-linha="(\d)" data-serie="([ab])"[^>]*>(.*?)<\/g>/g)].map((m) => `${m[1]}${m[2]}:${/--ty-print-([a-z0-9-]+)\)/.exec(m[3]!)?.[1]}`)

describe('highlight semantics', () => {
  it('series colours never change with or without a highlighted row', () => {
    expect(coresLinha(false)).toMatchObject({ a: 'contexto', b: 'destaque-2' })
    expect(coresLinha(true)).toMatchObject({ a: 'contexto', b: 'destaque' })
    expect(corUnica(false)).toBe('tinta-2')
    expect(COR_SERIE).toEqual({ a: 'contexto', b: 'destaque-2' })
  })
  it('in the chart: without a marked row nothing is in destaque; with one, only that row', () => {
    const r = (d: boolean) => renderToStaticMarkup(<PrintBook estilo="dashboard" incluirCss={false} carregarFontes={false}><MethodChart spec={barras(d) as never} alt="a" /></PrintBook>)
    const sem = coresDasBarras(r(false))
    expect(sem.length).toBeGreaterThan(0)
    expect(sem.some((c) => c.endsWith(':destaque'))).toBe(false)
    const com = coresDasBarras(r(true))
    expect(com.filter((c) => c.endsWith(':destaque')).every((c) => c.startsWith('0'))).toBe(true)
    expect(com).toContain('1b:destaque-2')
  })
})

describe('series colours too close', () => {
  it('two-series bars hatch the first series when contexto and destaque-2 are within ΔE2000 10', () => {
    const r = (tokens?: object) => renderToStaticMarkup(<PrintBook estilo="dashboard" tokens={tokens} incluirCss={false} carregarFontes={false}><MethodChart spec={barras(false) as never} alt="a" /></PrintBook>)
    expect(r({ traco: { hachura: 'nenhuma' }, cor: { contexto: '#8f877a', destaque2: '#c4b8a8' } })).not.toMatch(/data-serie="a"[^>]*><[^>]*style="fill:url\(#/)
    const h = r({ traco: { hachura: 'nenhuma' }, cor: { contexto: '#b0a89a', destaque2: '#b4ab9c' } })
    expect(h).toMatch(/data-serie="a"[^>]*><[^>]*style="fill:url\(#/)
  })
})
