// A spread for "one page per territorial unit" books (example values only): the unidade-territorial molde
// with the locator map, a categorical map, proportional circles and a parliament chart.
import { IndicatorTile, PanelGrid, ThemeBlock, DataTable, Numbers, Page, Panel, Parliament, PrintArea, PrintFlag, PrintLocatorMap, PrintMap, PrintSymbolMap, Source, Spread, Text, municipios } from '../../src/index.ts'

const RR = municipios().filter((f) => f.properties.code.startsWith('14'))
const CATS = Object.fromEntries(RR.map((f, i) => [f.properties.code, ['Partido A', 'Partido B', 'Partido C', 'Partido D'][(i * 7) % 4]!]))
const VALS = Object.fromEntries(RR.map((f, i) => [f.properties.code, f.properties.code === '1400100' ? 180000 : 2000 + ((i * 3779) % 15000)]))
const LINHAS = Array.from({ length: 10 }, (_, i) => [i + 1, `Candidatura de exemplo ${i + 1}`, ['A', 'B', 'C', 'D'][i % 4]!, (12000 - i * 900).toLocaleString('pt-BR'), (14.2 - i).toFixed(1).replace('.', ',')])

const SERIE = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023].map((ano, i) => ({ ano, valor: 10 + ((i * 37) % 9) }))
type It = [string, number | null, string | undefined, number, ('mais' | 'menos')?]
const BLOCOS: Array<{ tema: string; titulo: string; sigla: string; span: number; itens: It[]; vazio?: string }> = [
  { tema: 'eleitorado', titulo: 'Eleitorado', sigla: 'EL', span: 4, itens: [['Eleitores', 14230, undefined, 31], ['% mulheres', 49.2, '%', 40], ['16 a 24 anos', 17.1, '%', 77], ['60 anos ou mais', 12.4, '%', 22]] },
  { tema: 'economia', titulo: 'Economia', sigla: 'EC', span: 4, itens: [['PIB per capita', 21450, 'R$', 38], ['VA agropecuária', 31.5, '%', 81], ['Crédito rural per capita', 812, 'R$', 55], ['Produção agrícola', 64.3, 'R$ mi', 47]] },
  { tema: 'social', titulo: 'Proteção social', sigla: 'SO', span: 3, itens: [['% no Bolsa Família', 38.4, '%', 84, 'menos'], ['Famílias em extrema pobreza', 1120, undefined, 79, 'menos']] },
  { tema: 'saneamento', titulo: 'Saneamento', sigla: 'SA', span: 3, itens: [['Água (cobertura)', 61.2, '%', 18], ['Sem coleta de esgoto', null, '%', 0, 'menos']] },
  { tema: 'educacao', titulo: 'Educação', sigla: 'ED', span: 2, itens: [], vazio: 'sem indicador no lake (INEP ausente)' },
]

export function DuplaLivros() {
  return (
    <Spread numero="6-7" parte="Exemplo · unidades" capitulo="Exemplo · unidades" molde="unidade-territorial">
      <Page lado="par">
        <PrintArea nome="titulo">
          <Text eyebrow="RR · código IBGE 1400100" titulo="Boa Vista" nivel={1} />
        </PrintArea>
        <PrintArea nome="bandeira">
          <PrintFlag alt="Bandeira de Boa Vista" />
        </PrintArea>
        <PrintArea nome="a">
          <Panel letra="a" titulo="Onde fica" variante="pilha">
            <PrintLocatorMap codigo="1400704" alt="Uiramutã, na fronteira (exemplo)." quadro={{ largura: 50, altura: 22 }} inset capital escala />
          </Panel>
        </PrintArea>
        <PrintArea nome="b">
          <Panel letra="b" titulo="Números de exemplo">
            <Numbers itens={[{ valor: '312.000', rotulo: 'eleitores (exemplo)', ref: '#b1' }, { valor: '78,4', unidade: '%', rotulo: 'compareceram', ref: '#b2' }, { valor: '6,1', unidade: '%', rotulo: 'brancos e nulos', ref: '#b3' }]} />
          </Panel>
        </PrintArea>
        <PrintArea nome="c">
          <Panel letra="c" titulo="Top 10 (exemplo)">
            <DataTable colunas={['#', 'Candidatura', 'Partido', { rotulo: 'Votos', numerica: true }, { rotulo: '%', numerica: true }]} linhas={LINHAS} />
          </Panel>
        </PrintArea>
        <PrintArea nome="d">
          <Panel letra="d" titulo="Partido mais votado (exemplo)">
            <PrintMap titulo="Categorias sem ordem" alt="Mapa categórico de exemplo em Roraima." recorte={['RR']} escala="categorica" categorias={CATS} />
          </Panel>
        </PrintArea>
        <PrintArea nome="e">
          <Panel letra="e" titulo="Votos absolutos (exemplo)">
            <PrintSymbolMap titulo="Círculos proporcionais" alt="Círculos de exemplo; a capital tem o maior." recorte={['RR']} valores={VALS} destaques={['1400100']} raioMaximo={5} />
          </Panel>
        </PrintArea>
        <PrintArea nome="f">
          <Panel letra="f" titulo="Bancada (exemplo)">
            <Parliament alt="Hemiciclo de exemplo com 81 cadeiras." bancadas={[{ sigla: 'A', assentos: 30 }, { sigla: 'B', assentos: 22 }, { sigla: 'C', assentos: 17 }, { sigla: 'D', assentos: 12 }]} maioria={41} largura={70} />
          </Panel>
        </PrintArea>
        <PrintArea nome="fonte">
          <Source texto="Valores de exemplo (fictícios). Malha: IBGE, Malha Municipal 2024." rodape />
        </PrintArea>
      </Page>
      <Page lado="impar" molde="unidade-territorial-painel">
        <PrintArea nome="titulo">
          <Text eyebrow="RR · Norte · IBGE 1400175" titulo="Cantá" nivel={1} />
        </PrintArea>
        <PrintArea nome="bandeira">
          <PrintFlag alt="Bandeira de Cantá" />
        </PrintArea>
        <PrintArea nome="a">
          <PrintLocatorMap codigo="1400175" alt="Cantá, vizinho da capital (exemplo)." quadro={{ largura: 50, altura: 22 }} inset capital escala />
        </PrintArea>
        <PrintArea nome="painel">
          <PanelGrid>
            {BLOCOS.map((b) => (
              <ThemeBlock key={b.tema} tema={b.tema} titulo={b.titulo} sigla={b.sigla} span={b.span} colunas={b.span >= 4 ? 2 : 1} vazio={b.vazio}>
                {b.itens.map((it, i) => (
                  <IndicatorTile key={i} rotulo={it[0]} valor={it[1]} unidade={it[2]} ano={2024} percentil={it[3]} polaridade={it[4]} ranking={{ posicao: (i % 5) + 1, empates: i === 1 ? 2 : 1, total: 15, onde: 'RR' }} serie={i === 0 ? SERIE : undefined} />
                ))}
              </ThemeBlock>
            ))}
          </PanelGrid>
        </PrintArea>
        <PrintArea nome="fonte">
          <Source texto="Valores de exemplo (fictícios)." rodape />
        </PrintArea>
      </Page>
    </Spread>
  )
}
