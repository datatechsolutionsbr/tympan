import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MOLDES, gradeDoMolde, linhasUsadas } from '../src/livro/moldes.ts'
import { Area, Dupla, LivroPrint, Pagina, Painel, agruparPorArea } from '../src/index.ts'

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
      <LivroPrint estilo="jornal" incluirCss={false} carregarFontes={false}>
        <Dupla numero="28-29" molde="metodo">
          <Pagina lado="par">
            <Area nome="a">
              <Painel letra="a" titulo="A promessa da lei" largura={6} />
            </Area>
            <Area nome="b">
              <Painel letra="b" titulo="Os números" />
            </Area>
          </Pagina>
          <Pagina lado="impar" />
        </Dupla>
      </LivroPrint>,
    )
    expect(html).toContain('grid-template-areas:&quot;a a a b b b&quot;')
    expect(html).toContain('data-area="a"')
    expect(html).toMatch(/data-largura="3"/)
  })

  it('groups content nodes by area, carrying the previous area', () => {
    const g = agruparPorArea([
      { tipo: 'Texto', area: 'titulo', props: {} },
      { tipo: 'Texto', props: {} },
      { tipo: 'Fonte', area: 'fonte', props: {} },
    ])
    expect(g.map((x) => [x.area, x.nos.length])).toEqual([
      ['titulo', 2],
      ['fonte', 1],
    ])
  })
})
