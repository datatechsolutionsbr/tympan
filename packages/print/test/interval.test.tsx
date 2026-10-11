// @vitest-environment node
// Interval chart (dot and whisker) in GraficoMetodo.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MethodChart, PrintBook } from '../src/index.ts'

const spec = {
  tipo: 'intervalo' as const,
  titulo: 'Acurácia (IC 95%)',
  escala: [0, 100] as [number, number],
  unidade: '%',
  grupos: [
    { titulo: 'Categoria', linhas: [{ rotulo: 'Base', valor: 40, intervalo: [35, 45] as [number, number] }, { rotulo: 'LoRA + RAG', valor: 80, intervalo: [76, 84] as [number, number], destaque: true, amostras: [78, 80, 82] }] },
  ],
}
const r = (estilo: string, pb = false, lang = 'pt-BR') =>
  renderToStaticMarkup(<PrintBook estilo={estilo} pb={pb} lang={lang} incluirCss={false} carregarFontes={false}><MethodChart spec={spec} alt="a" largura={100} /></PrintBook>)

describe('intervalo', () => {
  it('whisker spans the interval on the axis scale; point at the estimate; sample ticks', () => {
    const h = r('jornal')
    const linha = /data-linha="1"[^>]*data-lo="76" data-hi="84" data-valor="80"/.exec(h)
    expect(linha).not.toBeNull()
    expect((h.match(/ty-print-interval-sample/g) ?? []).length).toBe(3)
    expect(h).toContain('>Categoria<')
    expect(h).toContain('76,0–84,0')
  })
  it('only the marked row uses destaque; P&B and the book locale', () => {
    const h = r('dashboard')
    const linhas = h.split('ty-print-interval"').slice(1)
    expect(linhas[0]).not.toContain('--ty-print-destaque)')
    expect(linhas[1]).toContain('--ty-print-destaque)')
    expect(r('jornal', true)).toContain('data-ty-print-pb=""')
    expect(r('jornal', false, 'en')).toContain('>80.0<')
    expect(r('jornal', false, 'en')).toContain('76.0–84.0')
  })
})

describe('intervalo 0.5.2', () => {
  const h = (sp: object, extra: object = {}) => renderToStaticMarkup(<PrintBook estilo="jornal" incluirCss={false} carregarFontes={false}><MethodChart spec={sp as never} largura={100} {...extra} /></PrintBook>)
  it('casas fixes the decimals in labels and axis (51,0; 100,0)', () => {
    const x = h({ tipo: 'intervalo', escala: [0, 100], casas: 1, linhas: [{ rotulo: 'A', valor: 51, intervalo: [50, 52] }] }, { alt: 'a' })
    expect(x).toContain('>51,0<')
    expect(x).toContain('>100,0<')
  })
  it('titulo is optional: no figure head, alt required', () => {
    const x = h({ tipo: 'intervalo', escala: [0, 10], linhas: [{ rotulo: 'A', valor: 5, intervalo: [4, 6] }] }, { alt: 'Achado' })
    expect(x).not.toContain('ty-print-figure-head')
    expect(x).toContain('aria-label="Achado"')
    expect(() => h({ tipo: 'intervalo', escala: [0, 10], linhas: [] })).toThrow(/alt/)
  })
  it('samples-only rows draw one dot per seed and no whisker', () => {
    const x = h({ tipo: 'intervalo', escala: [0, 10], linhas: [{ rotulo: 'A', amostras: [2, 3, 4] }] }, { alt: 'a' })
    expect(x).toContain('data-amostras=""')
    expect((x.match(/class="ty-print-interval-sample" transform/g) ?? []).length).toBe(3)
  })
  it('legend generated from cores, and can be turned off', () => {
    const sp = { tipo: 'intervalo', escala: [0, 10], cores: { PT: '#c4122d', PL: '#1a3a8a' }, linhas: [{ rotulo: 'PT', valor: 5, intervalo: [4, 6] }, { rotulo: 'PL', valor: 3, intervalo: [2, 4] }] }
    expect(h(sp, { alt: 'a' })).toContain('data-legenda-cores=""')
    expect(h({ ...sp, legenda: false }, { alt: 'a' })).not.toContain('data-legenda-cores')
  })
})
