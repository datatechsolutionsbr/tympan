// A spread of example maps for the gallery and the tests. The Mapa component
// draws the bundled mesh; every value on these maps is example data (either
// the component's own `exemplo` data or the deterministic values below), so no
// dataset ships with the gallery and no map states a finding.
import { Dupla, Fonte, Mapa, Pagina, Painel, Texto, ufs } from '../../src/index.ts'

let cacheUf: Record<string, number> | null = null
/**
 * Example values by UF: as if the Laboratório Exemplo repeated the Vila Aurora
 * air-quality count in each UF. Invented, deterministic (UF order only).
 */
export function valoresExemploPorUf(): Record<string, number> {
  cacheUf ??= Object.fromEntries(ufs().map((f, i) => [f.properties.code, 8 + ((i * 37) % 91)]))
  return cacheUf
}

export function DuplaMapas() {
  return (
    <Dupla numero="M" capitulo="Mapas" parte="Galeria">
      <Pagina lado="par">
        <Texto eyebrow="Exemplo de mapa" titulo="Mapas coropléticos com valores de exemplo" nivel={2} />
        <Painel letra="a" titulo="Exemplo de mapa coroplético na malha fina, em quintis">
          <Mapa
            titulo="Valores de exemplo na malha fina, quintis"
            alt="Mapa do Brasil na malha mais fina, com valores de exemplo em cinco classes; não representa nenhum dado real."
            exemplo
            legenda={['muito baixo', 'baixo', 'médio', 'alto', 'muito alto']}
            destaques={['Brasília/DF']}
            comoLer="Cada área é uma unidade da malha, na projeção cônica equivalente de Albers. Quanto mais escuro, maior o valor de exemplo."
            naoMostra="Nenhum dado real: os valores existem só para mostrar o mapa."
          />
        </Painel>
        <Fonte rodape texto="Valores de exemplo (fictícios). Malha: IBGE, Malha Municipal 2022, simplificada (tympan-print)." />
      </Pagina>
      <Pagina lado="impar">
        <Painel letra="b" titulo="Exemplo por UF, com limites fixos" largura={3}>
          <Mapa
            nivel="uf"
            titulo="Exemplo de mapa coroplético: valores de exemplo por UF"
            alt="Mapa por UF com valores de exemplo em cinco classes de dias acima do limite; os valores são fictícios."
            valores={valoresExemploPorUf()}
            unidade="dias"
            limites={[20, 40, 60, 80]}
            legenda={['menos de 20 dias', '20 a 39', '40 a 59', '60 a 79', '80 ou mais']}
          />
        </Painel>
        <Painel letra="c" titulo="Recorte Sudeste" largura={3}>
          <Mapa titulo="Sudeste, dados de exemplo" alt="Recorte Sudeste com dados de exemplo e áreas sem dado." recorte="Sudeste" exemplo legenda={['baixa', 'média-baixa', 'média', 'média-alta', 'alta']} destaques={['São Paulo/SP']} />
        </Painel>
        <Painel letra="d" titulo="Pequenos múltiplos: as cinco regiões, escala divergente">
          <Mapa
            titulo="Distância a um limite, por região (exemplo)"
            alt="Seis mapas pequenos com dados de exemplo: Brasil e as cinco regiões, com legenda única."
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
        </Painel>
      </Pagina>
    </Dupla>
  )
}
