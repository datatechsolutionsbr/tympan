// A spread of example maps for the gallery and the tests. The Map component
// draws the bundled mesh; every value on these maps is example data (either
// the component's own `exemplo` data or the deterministic values below), so no
// dataset ships with the gallery and no map states a finding.
import { Spread, Source, PrintMap, Page, Panel, Text, ufs } from '../../src/index.ts'

let cacheUf: Record<string, number> | null = null
/**
 * Example values by UF: as if the Laboratório Exemplo repeated the Vila Aurora
 * air-quality count in each UF. Invented, deterministic (UF order only).
 */
export function exampleValuesByUf(): Record<string, number> {
  cacheUf ??= Object.fromEntries(ufs().map((f, i) => [f.properties.code, 8 + ((i * 37) % 91)]))
  return cacheUf
}

export function DuplaMapas() {
  return (
    <Spread numero="M" capitulo="Mapas" parte="Gallery">
      <Page lado="par">
        <Text eyebrow="Map example" titulo="Choropleth maps with example values" nivel={2} />
        <Panel letra="a" titulo="Map example coroplético na malha fina, em quintis">
          <PrintMap
            titulo="Example values on fine mesh, quintiles"
            alt="Map of Brazil on the finest mesh, with example values in five classes; does not represent any real data."
            exemplo
            legenda={['muito baixo', 'baixo', 'médio', 'alto', 'muito alto']}
            destaques={['Brasília/DF']}
            comoLer="Each area is a mesh unit, in Albers equal-area conic projection. The darker, the higher the example value."
            naoMostra="Nenhum dado real: os valores existem só para mostrar o mapa."
          />
        </Panel>
        <Source rodape texto="Example values (fictional). Mesh: IBGE, Municipal Mesh 2022, simplified (tympan-print)." />
      </Page>
      <Page lado="impar">
        <Panel letra="b" titulo="Example by UF, with fixed boundaries" largura={3}>
          <PrintMap
            nivel="uf"
            titulo="Map example coroplético: valores de exemplo por UF"
            alt="Map by UF with example values in five classes of days above the limit; values are fictional."
            valores={exampleValuesByUf()}
            unidade="dias"
            limites={[20, 40, 60, 80]}
            legenda={['under 20 days', '20 to 39', '40 to 59', '60 to 79', '80 or more']}
          />
        </Panel>
        <Panel letra="c" titulo="Recorte Sudeste" largura={3}>
          <PrintMap titulo="Southeast, example data" alt="Southeast cutout with example data and areas without data." recorte="Sudeste" exemplo legenda={['low', 'medium-low', 'medium', 'medium-high', 'high']} destaques={['São Paulo/SP']} />
        </Panel>
        <Panel letra="d" titulo="Pequenos múltiplos: as cinco regiões, escala divergente">
          <PrintMap
            titulo="Distance to a limit, by region (example)"
            alt="Six small maps with example data: Brazil and the five regions, with a single legend."
            exemplo
            escala="divergente"
            legenda={['muito abaixo', 'abaixo', 'perto do limite', 'acima', 'muito acima']}
            multiplos={[
              { titulo: 'Brasil' },
              { titulo: 'Norte', recorte: 'Norte' },
              { titulo: 'Nordeste', recorte: 'Nordeste' },
              { titulo: 'Sudeste', recorte: 'Sudeste' },
              { titulo: 'Sul', recorte: 'Sul' },
              { titulo: 'Centro-Oeste', recorte: 'Centro-Oeste' },
            ]}
            colunas={3}
            altura={92}
          />
        </Panel>
      </Page>
    </Spread>
  )
}
