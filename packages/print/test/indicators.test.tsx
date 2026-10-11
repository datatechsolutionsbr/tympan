// @vitest-environment node
// Dense indicator panel components and the locator map extras (PLANO §12–13 of the Brasil Real book).
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CAPITAIS, IndicatorTile, MOLDES, PanelGrid, PercentileBar, PrintBook, PrintLocatorMap, Sparkline, ThemeBlock, municipios, textoRanking } from '../src/index.ts'

const html = (el: React.ReactNode, extra: object = {}) => renderToStaticMarkup(<PrintBook estilo="semanario" incluirCss={false} carregarFontes={false} {...extra}>{el}</PrintBook>)

describe('PercentileBar and ranking', () => {
  it('writes the position with polarity and fills to the percentile in the block colour, no arrows', () => {
    const h = html(<PercentileBar percentil={72.4} ranking={{ posicao: 1, total: 15, onde: 'RR' }} />)
    expect(h).toContain('acima de 72% dos municípios')
    expect(h).toContain('1º de 15 em RR')
    expect(h).toContain('inline-size:72%')
    expect(h).toContain('var(--cor, var(--ty-print-tinta-2))')
    expect(h).not.toMatch(/[▲▼○]/)
    expect(html(<PercentileBar percentil={90} polaridade="menos" />)).toContain('maior que em 90% dos municípios')
  })
  it('ties print as a range; English edition', () => {
    expect(html(<PercentileBar percentil={50} ranking={{ posicao: 1, empates: 3, total: 15, onde: 'RR' }} />)).toContain('1º–3º de 15 em RR')
    const en = html(<PercentileBar percentil={50} ranking={{ posicao: 2, total: 15, onde: 'RR' }} />, { lang: 'en' })
    expect(en).toContain('above 50% of municipalities')
    expect(en).toContain('2 of 15 in RR')
    expect(textoRanking({ posicao: 4, total: 9, onde: 'X' })).toBe('4º de 9 em X')
  })
})

describe('Sparkline and IndicatorTile', () => {
  it('sparkline keeps real millimetres (never stretched) and needs three points', () => {
    const pts = [{ ano: 2010, valor: 1 }, { ano: 2015, valor: 3 }, { ano: 2020, valor: 2 }]
    const h = html(<Sparkline pontos={pts} largura={20} altura={4} />)
    expect(h).toContain('viewBox="0 0 20 4"')
    expect(h).toContain('inline-size:20mm')
    expect(h).not.toContain('preserveAspectRatio="none"')
    expect(html(<Sparkline pontos={pts.slice(0, 2)} />)).not.toContain('<svg')
  })
  it('tile formats in the book locale and says [sem dado] honestly', () => {
    const h = html(<IndicatorTile rotulo="PIB per capita" valor={45231.7} prefixo="R$" ano={2023} percentil={80} />)
    expect(h).toContain('45.232')
    expect(h).toContain('>R$<')
    expect(html(<IndicatorTile rotulo="x" valor={null} />)).toContain('[sem dado]')
    expect(html(<IndicatorTile rotulo="x" valor={2.5} sinal />, { lang: 'en' })).toContain('+2.5')
  })
})

describe('ThemeBlock and PanelGrid', () => {
  it('block colour comes from the theme cor.temas; P&B uses the ink; empty block states why', () => {
    const tokens = { cor: { temas: { economia: '#7a5c12' } } }
    const h = html(
      <PanelGrid>
        <ThemeBlock tema="economia" titulo="Economia" sigla="EC" span={5}>
          <IndicatorTile rotulo="a" valor={1} />
        </ThemeBlock>
        <ThemeBlock tema="educacao" titulo="Educação" sigla="ED" span={3} vazio="sem indicador no lake" />
      </PanelGrid>,
      { tokens },
    )
    expect(h).toContain('--ty-print-tema-economia: #7a5c12;')
    expect(h).toContain('--cor:var(--ty-print-tema-economia, var(--ty-print-tinta-2))')
    expect(h).toContain('grid-column:span 5')
    expect(h).toContain('grid-template-columns:repeat(8, minmax(0, 1fr))')
    expect(h).toContain('sem indicador no lake')
    expect(html(<ThemeBlock tema="economia" titulo="E" />, { pb: true })).toContain('--cor:var(--ty-print-tinta)')
    expect(MOLDES['unidade-territorial-painel']!.par.flatMap((l) => l.areas.map(([a]) => a))).toEqual(['titulo', 'bandeira', 'a', 'painel', 'fonte'])
  })
})

describe('PrintLocatorMap extras', () => {
  it('capital table names the 27 capitals of the mesh', () => {
    const nomes = Object.fromEntries(municipios().map((f) => [f.properties.code, f.properties.name]))
    expect(Object.keys(CAPITAIS)).toHaveLength(27)
    expect(nomes[CAPITAIS.SP!]).toBe('São Paulo')
    expect(nomes[CAPITAIS.RR!]).toBe('Boa Vista')
    for (const c of Object.values(CAPITAIS)) expect(nomes[c], c).toBeTruthy()
  })
  it('inset of Brazil with the UF, capital point when in the window, round graphic scale', () => {
    // Cantá (RR) borders Boa Vista, the capital.
    const h = html(<PrintLocatorMap codigo="1400175" alt="Cantá" largura={50} inset capital escala />)
    expect(h).toContain('ty-print-locator-inset')
    expect(h).toContain('ty-print-locator-capital')
    expect(h).toMatch(/data-km="(1|2|5|10|20|25|50|100|200|250|500|1000)"/)
    expect(h).toMatch(/km<\/text>/)
    const semCap = html(<PrintLocatorMap codigo="1400100" alt="Boa Vista" capital />)
    expect(semCap).not.toContain('ty-print-locator-capital') // the unit itself is the capital
  })
})
