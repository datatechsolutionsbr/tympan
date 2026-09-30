import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MOLDES, gradeDoMolde, linhasUsadas } from '../src/livro/moldes.ts'
import { PrintArea, Spread, PrintBook, Page, Panel, agruparPorArea } from '../src/index.ts'

describe('moldes', () => {
  it('every row of every molde spans the six columns', () => {
    for (const [nome, m] of Object.entries(MOLDES)) {
      for (const lado of ['par', 'impar'] as const) {
        expect(() => gradeDoMolde(m[lado]), `${nome}:${lado}`).not.toThrow()
      }
    }
  })

  it('drops unused rows and gives an unused cell to its neighbour', () => {
    const linhas = linhasUsadas(MOLDES.metodo!.impar, new Set(['d2', 'e', 'f']))
    expect(linhas.map((l) => l.areas.map(([a, n]) => `${a}:${n}`).join(' '))).toEqual(['d2:6', 'e:6', 'f:6'])
    expect(linhas.some((l) => l.cresce)).toBe(true)
  })

  it('places areas on the named grid and panels take the area width', () => {
    const html = renderToStaticMarkup(
      <PrintBook estilo="jornal" incluirCss={false} carregarFontes={false}>
        <Spread numero="28-29" molde="metodo">
          <Page lado="par">
            <PrintArea nome="a">
              <Panel letra="a" titulo="A promessa da lei" largura={6} />
            </PrintArea>
            <PrintArea nome="b">
              <Panel letra="b" titulo="Os números" />
            </PrintArea>
          </Page>
          <Page lado="impar" />
        </Spread>
      </PrintBook>,
    )
    expect(html).toContain('grid-template-areas:&quot;a a a b b b&quot;')
    expect(html).toContain('data-area="a"')
    expect(html).toMatch(/data-largura="3"/)
  })

  it('groups content nodes by area, carrying the previous area', () => {
    const g = agruparPorArea([
      { tipo: 'Text', area: 'titulo', props: {} },
      { tipo: 'Text', props: {} },
      { tipo: 'Source', area: 'fonte', props: {} },
    ])
    expect(g.map((x) => [x.area, x.nos.length])).toEqual([
      ['titulo', 2],
      ['fonte', 1],
    ])
  })
})
