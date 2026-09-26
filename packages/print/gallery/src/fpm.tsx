// The method spread of the FPM chapter (study estilo-7-jornal): the content of
// the gallery and of the tests. Numbers only from Q46 of
// volumes/v0-guia/roteiro/viabilidade-dados.md (46-fpm-amontoamento.sql and,
// for 2007 and 2010, 46b-...-LOCAL.sql: local lake, not published).
import {
  ComoLer,
  Dupla,
  Fonte,
  GraficoMetodo,
  NaoDaParaAfirmar,
  Numeros,
  Pagina,
  Painel,
  Promessa,
  Rastro,
  TabelaDados,
  Texto,
  Veredito,
  type GraficoSpec,
  type LinhaPar,
  usePrint,
} from '../../src/index.ts'

export const LAKE = '2026-09-25'

/** Only the first cut (10.188 inhabitants): counts within 3 % below and above it. */
export const PRIMEIRO: LinhaPar[] = [
  { rotulo: 'Contagem 2007', a: 18, b: 127, local: true },
  { rotulo: 'Censo 2010', a: 27, b: 140, local: true },
  { rotulo: 'Censo 2022', nota: `lake ${LAKE}`, a: 36, b: 132, destaque: true, marca: '1' },
]

/** The 17 cuts added up. */
export const SOMADOS: LinhaPar[] = [
  { rotulo: 'Censo 2022', nota: `lake ${LAKE}`, a: 293, b: 731, marca: '2' },
  { rotulo: 'Estimativa 2025', nota: `lake ${LAKE}`, a: 43, b: 60, marca: '3' },
]

export type TipoGraficoFpm = 'halteres' | 'barras' | 'contagem'

export function specsFpm(tipo: TipoGraficoFpm): [GraficoSpec, GraficoSpec] {
  const rotuloA = 'até 3% abaixo do corte'
  const rotuloB = 'até 3% acima do corte'
  if (tipo === 'halteres') {
    return [
      {
        tipo: 'halteres',
        titulo: 'Só o primeiro corte (10.188 habitantes)',
        subtitulo: 'Municípios a até 3% do corte, de cada lado',
        escala: [0, 150],
        rotuloA,
        rotuloB,
        linhas: PRIMEIRO,
        anotacoes: [{ linha: 2, texto: 'Em 2022, 132 municípios estão logo acima do corte e 36 logo abaixo. Se o corte não atraísse ninguém, os dois lados seriam parecidos.' }],
      },
      {
        tipo: 'halteres',
        titulo: 'Os 17 cortes somados',
        subtitulo: 'Atenção: escala diferente da de cima (0 a 800)',
        escala: [0, 800],
        rotuloA,
        rotuloB,
        linhas: SOMADOS,
        anotacoes: [{ linha: 1, texto: 'Com a estimativa de 2025, a diferença encolhe: 60 contra 43.' }],
      },
    ]
  }
  const semDestaque = (ls: LinhaPar[]) => ls.map(({ destaque: _d, ...l }) => l)
  if (tipo === 'contagem') {
    return [
      { tipo: 'contagem', titulo: 'O primeiro corte, 10.188 habitantes', unidade: 10, rotuloUnidade: 'municípios', rotuloA, rotuloB, linhas: semDestaque(PRIMEIRO) },
      { tipo: 'contagem', titulo: 'Os 17 cortes somados · mesma chave: 1 ícone = 10', unidade: 10, rotuloUnidade: 'municípios', rotuloA, rotuloB, linhas: semDestaque(SOMADOS) },
    ]
  }
  return [
    { tipo: 'barras', titulo: 'O primeiro corte, 10.188 habitantes', subtitulo: 'escala: 0 a 150 municípios', escala: [0, 150], rotuloA, rotuloB, linhas: semDestaque(PRIMEIRO) },
    { tipo: 'barras', titulo: 'Os 17 cortes somados', subtitulo: 'outra escala: 0 a 800 municípios', escala: [0, 800], rotuloA, rotuloB, linhas: semDestaque(SOMADOS) },
  ]
}

/** Chart type of each study (the gallery's default), so the presets can be compared with their PNGs. */
export const GRAFICO_DO_ESTUDO: Record<string, TipoGraficoFpm> = {
  dashboard: 'barras',
  dubois: 'barras',
  deardata: 'barras',
  caderno: 'barras',
  isotype: 'contagem',
  cordel: 'barras',
  riso: 'barras',
  jornal: 'halteres',
  prancheta: 'barras',
  'prancheta-clara': 'barras',
  aquarela: 'barras',
  tufte: 'barras',
  suico: 'barras',
  concretismo: 'barras',
  economist: 'barras',
  holmes: 'barras',
  bayer: 'barras',
  ft: 'barras',
  'dados-br': 'barras',
  minard: 'barras',
  mccandless: 'barras',
  construtivismo: 'barras',
  bauhaus: 'barras',
  brutalista: 'barras',
  divulgacao: 'barras',
  corbusier: 'barras',
  schiphol: 'barras',
  aicher: 'barras',
  vignelli: 'barras',
  'jornal-do-brasil': 'barras',
  'athos-bulcao': 'barras',
  tropicalia: 'barras',
  'atlas-ibge': 'barras',
  crouwel: 'barras',
  'saul-bass': 'barras',
  'pop-art': 'barras',
  cientifico: 'barras',
  'art-nouveau': 'barras',
  memphis: 'barras',
}

export const ACHADOS = [
  'Censo 2022: 132 municípios até 3% acima do primeiro corte do FPM e só 36 até 3% abaixo; em 2007 e 2010, o mesmo desenho (127 contra 18, 140 contra 27).',
  'Nos 17 cortes somados, 731 acima contra 293 abaixo no Censo 2022; com a estimativa de 2025, 60 contra 43.',
]

/** Horizontal styles stack the two figures; column styles set them side by side, as in the studies. */
function FigurasMetodo({ g1, g2 }: { g1: GraficoSpec; g2: GraficoSpec }) {
  const { estilo } = usePrint()
  if (estilo.estrutura.barras === 'vertical' && g1.tipo === 'barras') {
    return (
      <div className="ty-print-figuras">
        <GraficoMetodo spec={g1} alt={ACHADOS[0]} local largura={70} />
        <GraficoMetodo spec={g2} alt={ACHADOS[1]} largura={50} />
      </div>
    )
  }
  return (
    <>
      <GraficoMetodo spec={g1} alt={ACHADOS[0]} local />
      <GraficoMetodo spec={g2} alt={ACHADOS[1]} />
    </>
  )
}

export function DuplaFpm({ grafico = 'halteres' }: { grafico?: TipoGraficoFpm }) {
  const [g1, g2] = specsFpm(grafico)
  return (
    <Dupla numero="22-23" parte="Parte I · Dinheiro e regra" capitulo="Capítulo [n] · As faixas do FPM" abreCapitulo>
      <Pagina lado="par">
        <Texto eyebrow="Capítulo [n] · As faixas do FPM · o método" titulo="Antes do salto, o teste da linha" nivel={1} />
        <Painel letra="a" titulo="A promessa da lei" largura={3}>
          <Promessa
            citacao="Mais habitantes, mais FPM, e o dinheiro a mais vira gasto com a população."
            norma="Decreto-Lei nº 1.881, de 27 de agosto de 1981 (nova redação do art. 91 do CTN)"
            resumo="Coeficiente 0,6 até 10.188 habitantes, em degraus até 4,0 acima de 156.216: são 17 cortes."
          />
        </Painel>
        <Painel letra="b" titulo="Os números" largura={3}>
          <Numeros
            itens={[
              { valor: 132, comparado: 36, rotulo: 'logo acima × logo abaixo do 1º corte (10.188 hab.), Censo 2022', ref: '#k5' },
              { valor: 731, comparado: 293, rotulo: 'acima × abaixo nos 17 cortes somados, Censo 2022', ref: '[#k7]' },
              { valor: 60, comparado: 43, rotulo: 'acima × abaixo nos 17 cortes, estimativa 2025', ref: '#k6' },
            ]}
          />
        </Painel>
        <Texto
          variante="lead"
          paragrafos={['A descontinuidade compara quem está logo acima com quem está logo abaixo do corte, e só vale se os dois lados forem parecidos. Antes de medir o dinheiro, contam-se os municípios de cada lado.']}
        />
        <Painel letra="d" titulo="O gráfico do método: quantos municípios de cada lado do corte">
          <FigurasMetodo g1={g1} g2={g2} />
          <TabelaDados
            colunas={['Base', 'Cortes', { rotulo: 'Até 3% abaixo', numerica: true }, { rotulo: 'Até 3% acima', numerica: true }, 'Lake']}
            linhas={[
              ['Contagem 2007', '1º (10.188)', 18, 127, 'local, não publicado'],
              ['Censo 2010', '1º (10.188)', 27, 140, 'local, não publicado'],
              ['Censo 2022', '1º (10.188)', 36, 132, `lake ${LAKE}`],
              ['Censo 2022', '17 somados', 293, 731, `lake ${LAKE}`],
              ['Estimativa 2025', '17 somados', 43, 60, `lake ${LAKE}`],
            ]}
          />
        </Painel>
        <Fonte
          rodape
          texto="IBGE: Contagem 2007, Censos 2010 e 2022, estimativa 2025. Cortes: DL 1.881/1981. Consultas roteiro/sql/46-fpm-amontoamento.sql (2022, 2025; municipios) e 46b-…-LOCAL.sql (2007, 2010; lake local, não publicado). O selo vale para 2022 e 2025."
          versaoLake={LAKE}
        />
      </Pagina>
      <Pagina lado="impar">
        <Painel letra="d′" titulo="Como ler o gráfico ao lado">
          <ComoLer
            itens={[
              'No primeiro corte, 132 municípios logo acima e 36 logo abaixo (Censo 2022). Em 2007 e 2010, o mesmo desenho.',
              'Nos 17 cortes somados, 731 contra 293: o padrão não é de um corte só.',
              'Com a estimativa de 2025, 60 contra 43. A régua que distribui o FPM é a estimativa [conferir com o TCU].',
              'Contagem não é teste: falta a densidade em faixas finas [teste a rodar].',
            ]}
          />
        </Painel>
        <Texto eyebrow="O veredito" titulo="O que o dado permite dizer, por enquanto" nivel={2} />
        <Painel letra="e" titulo="Veredito com estado de prova">
          <Veredito
            promessa="Mais habitantes, mais FPM, e o dinheiro a mais vira gasto com a população."
            estado="nao-da-para-afirmar"
            texto="O FPM sobe no corte, como a lei manda. Que isso vire gasto, o dado de hoje não mostra, e os dois lados do corte nem são comparáveis no Censo 2022."
            itens={[
              { afirmacao: 'Quem passa do corte recebe mais FPM por habitante.', base: 'placar da dupla 1, #k3', estado: 'sustentada' },
              { afirmacao: 'Os dois lados do corte são comparáveis.', base: 'amontoamento no Censo 2022, #k5', estado: 'refutada' },
              { afirmacao: 'Quem passa do corte gasta mais por habitante.', base: 'um ano de despesa só, #k4', estado: 'nao-da-para-afirmar' },
              { afirmacao: 'O dinheiro a mais virou serviço.', base: 'sem desfecho de serviço no lake', estado: 'sem-dado' },
              { afirmacao: 'Alguém contou moradores a mais de propósito.', base: 'a contagem não diz quem nem como', estado: 'nao-testada' },
            ]}
            proposto
          />
        </Painel>
        <Painel letra="f" titulo="O que não dá para afirmar" largura={3}>
          <NaoDaParaAfirmar
            itens={[
              { titulo: 'Que prefeituras fraudaram o censo.', texto: 'O amontoamento aparece em contagens e censos (2007, 2010, 2022) e não diz quem nem como.' },
              { titulo: 'Que a estimativa de 2025 encerra o assunto.', texto: '60 contra 43 é contagem, não teste de densidade [teste a rodar].' },
              { titulo: 'O efeito longe do corte.', texto: 'A comparação só vale para os quase gêmeos dos dois lados da linha.' },
            ]}
          />
        </Painel>
        <Painel letra="g" titulo="Rastro do número #k5" largura={3}>
          <Rastro
            referencia="#k5"
            numero="132"
            descricao="municípios até 3% acima de 10.188 hab."
            consulta="roteiro/sql/46-fpm-amontoamento.sql"
            sha256="d6e9215232af7991e752270d123ab97487a1a9c4e620581de2868848f8055e9d"
            tabela="municipios.populacao_2022"
            cobertura="5.570 municípios"
            fonteOficial="IBGE, Censo 2022 (SIDRA 4709)"
            licenca="[conferir]"
            versao={`lake ${LAKE}`}
            edicao="[AAAA-MM-DD]"
          />
        </Painel>
      </Pagina>
    </Dupla>
  )
}
