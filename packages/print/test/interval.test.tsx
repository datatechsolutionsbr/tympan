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
    expect(h).toContain('76–84')
  })
  it('only the marked row uses destaque; P&B and the book locale', () => {
    const h = r('dashboard')
    const linhas = h.split('ty-print-interval"').slice(1)
    expect(linhas[0]).not.toContain('--ty-print-destaque)')
    expect(linhas[1]).toContain('--ty-print-destaque)')
    expect(r('jornal', true)).toContain('data-ty-print-pb=""')
    expect(r('jornal', false, 'en')).toContain('>80<')
    expect(r('jornal', false, 'en')).toContain('76–84')
  })
})
