// A spread for "one page per territorial unit" books (example values only): the unidade-territorial molde
// with the locator map, a categorical map, proportional circles and a parliament chart.
import { DataTable, Numbers, Page, Panel, Parliament, PrintArea, PrintFlag, PrintLocatorMap, PrintMap, PrintSymbolMap, Source, Spread, Text, municipios } from '../../src/index.ts'

const RR = municipios().filter((f) => f.properties.code.startsWith('14'))
const CATS = Object.fromEntries(RR.map((f, i) => [f.properties.code, ['Partido A', 'Partido B', 'Partido C', 'Partido D'][(i * 7) % 4]!]))
const VALS = Object.fromEntries(RR.map((f, i) => [f.properties.code, f.properties.code === '1400100' ? 180000 : 2000 + ((i * 3779) % 15000)]))
const LINHAS = Array.from({ length: 10 }, (_, i) => [i + 1, `Candidatura de exemplo ${i + 1}`, ['A', 'B', 'C', 'D'][i % 4]!, (12000 - i * 900).toLocaleString('pt-BR'), (14.2 - i).toFixed(1).replace('.', ',')])

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
            <PrintLocatorMap codigo="1400100" alt="Boa Vista e os municípios vizinhos (exemplo)." altura={34} />
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
      <Page lado="impar">
        <PrintArea nome="titulo">
          <Text eyebrow="RR · código IBGE 1400704" titulo="Uiramutã" nivel={1} />
        </PrintArea>
        <PrintArea nome="a">
          <Panel letra="a" titulo="Onde fica" variante="pilha">
            <PrintLocatorMap codigo="1400704" alt="Uiramutã e vizinhos (exemplo)." altura={34} chamada={{ texto: 'Extremo norte' }} />
          </Panel>
        </PrintArea>
      </Page>
    </Spread>
  )
}
