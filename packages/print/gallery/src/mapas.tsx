// A spread of real maps for the gallery and the tests. The values come from
// the mesh itself (area of each municipality, municipalities per UF), so no
// dataset ships with the gallery; the recortes use example data.
import { geoArea } from 'd3-geo'
import { Dupla, Fonte, Mapa, municipios, Pagina, Painel, Texto } from '../../src/index.ts'

/** Earth radius (km) of the authalic sphere of GRS 80. */
const R = 6371.007

let cacheArea: Record<string, number> | null = null
/** Area of each municipality on the simplified mesh (km²), rounded. */
export function areasKm2(): Record<string, number> {
  cacheArea ??= Object.fromEntries(municipios().map((f) => [f.properties.code, Math.round(geoArea(f) * R * R)]))
  return cacheArea
}

export function municipiosPorUf(): Record<string, number> {
  const out: Record<string, number> = {}
  for (const f of municipios()) {
    const k = f.properties.code.slice(0, 2)
    out[k] = (out[k] ?? 0) + 1
  }
  return out
}

export function DuplaMapas() {
  return (
    <Dupla numero="M" capitulo="Mapas" parte="Galeria">
      <Pagina lado="par">
        <Texto eyebrow="Malha IBGE 2022" titulo="O tamanho dos municípios" nivel={2} />
        <Painel letra="a" titulo="Área de cada município, em quintis">
          <Mapa
            titulo="Área territorial dos 5.570 municípios (km²), quintis"
            alt="Os municípios grandes se concentram no Norte e no Centro-Oeste; os pequenos, no Sul, no Sudeste e no litoral do Nordeste."
            valores={areasKm2()}
            unidade="km²"
            destaques={['3550308', 'Brasília/DF', 'Altamira/PA']}
            comoLer="Cada área é um município, na projeção cônica equivalente de Albers usada pelo IBGE. Quanto mais escuro, maior o município."
            naoMostra="Quantas pessoas moram em cada um: área não é população."
          />
        </Painel>
        <Fonte rodape texto="IBGE, Malha Municipal 2022, simplificada (tympan-print). Área calculada sobre a malha simplificada." />
      </Pagina>
      <Pagina lado="impar">
        <Painel letra="b" titulo="Municípios por UF" largura={3}>
          <Mapa
            nivel="uf"
            titulo="Quantos municípios cada UF tem"
            alt="Minas Gerais tem mais municípios que qualquer outra UF; Roraima e o Amapá, os menos."
            valores={municipiosPorUf()}
            limites={[50, 150, 300, 500]}
            legenda={['menos de 50', '50 a 149', '150 a 299', '300 a 499', '500 ou mais']}
          />
        </Painel>
        <Painel letra="c" titulo="Recorte Sudeste" largura={3}>
          <Mapa titulo="Sudeste, dados de exemplo" alt="Recorte Sudeste com dados de exemplo e municípios sem dado." recorte="Sudeste" exemplo legenda={['baixa', 'média-baixa', 'média', 'média-alta', 'alta']} destaques={['São Paulo/SP']} />
        </Painel>
        <Painel letra="d" titulo="Pequenos múltiplos: as cinco regiões, escala divergente">
          <Mapa
            titulo="Distância a um corte, por região (exemplo)"
            alt="Seis mapas pequenos com dados de exemplo: Brasil e as cinco regiões, com legenda única."
            exemplo
            escala="divergente"
            legenda={['muito abaixo', 'abaixo', 'perto do corte', 'acima', 'muito acima']}
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
        </Painel>
      </Pagina>
    </Dupla>
  )
}
