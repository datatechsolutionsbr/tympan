// The method spread of a fictional example study: "Estudo de qualidade do ar
// Vila Aurora urban", by the "Example Lab". It is the content of
// the gallery and of the tests. Every name and number here is invented.
import {
  HowToRead,
  Spread,
  Source,
  MethodChart,
  CannotClaim,
  Numbers,
  Page,
  Panel,
  PromiseText,
  Trace,
  DataTable,
  Text,
  Verdict,
  type GraficoSpec,
  type LinhaPar,
  usePrint,
} from '../../src/index.ts'

/** Edition of the (fictional) monitoring dataset. */
export const EDICAO = 'edição 2026-09'

/** Only the north segment of the boundary: days above the PM2.5 limit at the stations just inside and just outside the zone. */
export const PRIMEIRO: LinhaPar[] = [
  { rotulo: 'Inverno 2016', a: 118, b: 124, local: true },
  { rotulo: 'Inverno 2019', a: 112, b: 131, local: true },
  { rotulo: 'Inverno 2022', nota: EDICAO, a: 54, b: 127, destaque: true, marca: '1' },
]

/** The 12 boundary segments added up. */
export const SOMADOS: LinhaPar[] = [
  { rotulo: 'Inverno 2022', nota: EDICAO, a: 286, b: 702, marca: '2' },
  { rotulo: 'Estimativa 2025', nota: EDICAO, a: 241, b: 318, marca: '3' },
]

export type TipoGraficoEstudo = 'halteres' | 'barras' | 'contagem'

export function specsEstudo(tipo: TipoGraficoEstudo): [GraficoSpec, GraficoSpec] {
  const rotuloA = 'logo dentro da zona (até 500 m)'
  const rotuloB = 'logo fora da zona (até 500 m)'
  if (tipo === 'halteres') {
    return [
      {
        tipo: 'halteres',
        titulo: 'Só o trecho norte da fronteira',
        subtitulo: 'Dias acima do limite de PM2,5, estações a até 500 m da fronteira, de cada lado',
        escala: [0, 150],
        rotuloA,
        rotuloB,
        linhas: PRIMEIRO,
        anotacoes: [{ linha: 2, texto: 'No inverno de 2022, 127 dias acima do limite logo fora da zona e 54 logo dentro. Antes da zona, os dois lados eram parecidos.' }],
      },
      {
        tipo: 'halteres',
        titulo: 'Os 12 trechos da fronteira somados',
        subtitulo: 'Atenção: escala diferente da de cima (0 a 800)',
        escala: [0, 800],
        rotuloA,
        rotuloB,
        linhas: SOMADOS,
        anotacoes: [{ linha: 1, texto: 'Com a estimativa de 2025, a diferença encolhe: 318 contra 241.' }],
      },
    ]
  }
  const semDestaque = (ls: LinhaPar[]) => ls.map(({ destaque: _d, ...l }) => l)
  if (tipo === 'contagem') {
    return [
      { tipo: 'contagem', titulo: 'O trecho norte da fronteira', unidade: 10, rotuloUnidade: 'dias', rotuloA, rotuloB, linhas: semDestaque(PRIMEIRO) },
      { tipo: 'contagem', titulo: 'Os 12 trechos somados · mesma chave: 1 ícone = 10', unidade: 10, rotuloUnidade: 'dias', rotuloA, rotuloB, linhas: semDestaque(SOMADOS) },
    ]
  }
  return [
    // dobra: in the folding shape (graficos-1900) both charts share one line = 200 days.
    { tipo: 'barras', titulo: 'O trecho norte da fronteira', subtitulo: 'escala: 0 a 150 dias', escala: [0, 150], rotuloA, rotuloB, linhas: semDestaque(PRIMEIRO), dobra: 200, anotacoes: [{ linha: 2, texto: 'Em 2022, 127 logo fora e só 54 logo dentro' }] },
    { tipo: 'barras', titulo: 'Os 12 trechos somados', subtitulo: 'outra escala: 0 a 800 dias', escala: [0, 800], rotuloA, rotuloB, linhas: semDestaque(SOMADOS), dobra: 200, anotacoes: [{ linha: 1, texto: 'Com a estimativa de 2025, a diferença encolhe' }] },
  ]
}

/** Chart type of each study (the gallery's default), so the presets can be compared with their PNGs. */
export const GRAFICO_DO_ESTUDO: Record<string, TipoGraficoEstudo> = {
  dashboard: 'barras',
  'graficos-1900': 'barras',
  'cartao-postal': 'barras',
  caderno: 'barras',
  isotype: 'contagem',
  cordel: 'barras',
  riso: 'barras',
  jornal: 'halteres',
  prancheta: 'barras',
  'prancheta-clara': 'barras',
  aquarela: 'barras',
  'minimo-de-tinta': 'barras',
  suico: 'barras',
  concretismo: 'barras',
  semanario: 'barras',
  'infografico-ilustrado': 'barras',
  'diagrama-modernista': 'barras',
  'papel-salmao': 'barras',
  'dados-br': 'barras',
  'fluxo-historico': 'barras',
  'blocos-coloridos': 'barras',
  construtivismo: 'barras',
  bauhaus: 'barras',
  brutalista: 'barras',
  divulgacao: 'barras',
  'proporcao-modular': 'barras',
  sinalizacao: 'barras',
  pictogramas: 'barras',
  'mapa-de-metro': 'barras',
  'jornal-1959': 'barras',
  'azulejo-modernista': 'barras',
  tropicalia: 'barras',
  'atlas-oficial': 'barras',
  'grade-holandesa': 'barras',
  'papel-recortado': 'barras',
  'pop-art': 'barras',
  cientifico: 'barras',
  'art-nouveau': 'barras',
  memphis: 'barras',
}

export const ACHADOS = [
  'Inverno 2022: 127 dias acima do limite de PM2,5 logo fora da zona de baixa emissão e 54 logo dentro, no trecho norte; em 2016 e 2019, antes da zona, os dois lados eram parecidos (124 contra 118, 131 contra 112).',
  'Nos 12 trechos somados, 702 dias fora contra 286 dentro no inverno de 2022; com a estimativa de 2025, 318 contra 241.',
]

/** Figures stacked, or side by side as small multiples when the style says so (estrutura.multiplos), as in the studies. */
function FigurasMetodo({ g1, g2 }: { g1: GraficoSpec; g2: GraficoSpec }) {
  const { estilo } = usePrint()
  const e = estilo.estrutura
  if ((e.multiplos === 'lado-a-lado' || e.barras === 'vertical') && g1.tipo === 'barras') {
    const letras = e.letraMultiplo ? ['A', 'B'] : [undefined, undefined]
    return (
      <div className="ty-print-figures">
        <MethodChart spec={g1} alt={ACHADOS[0]} local largura={e.forma === 'cartoes' ? 76 : 70} letra={letras[0]} />
        <MethodChart spec={g2} alt={ACHADOS[1]} largura={e.forma === 'cartoes' ? 50 : 54} letra={letras[1]} />
      </div>
    )
  }
  return (
    <>
      <MethodChart spec={g1} alt={ACHADOS[0]} local />
      <MethodChart spec={g2} alt={ACHADOS[1]} />
    </>
  )
}

export function DuplaEstudo({ grafico = 'halteres' }: { grafico?: TipoGraficoEstudo }) {
  const [g1, g2] = specsEstudo(grafico)
  return (
    <Spread numero="22-23" parte="Parte I · Ar e cidade" capitulo="Capítulo [n] · A zona de baixa emissão" abreCapitulo>
      <Page lado="par">
        <Text eyebrow="Capítulo [n] · A zona de baixa emissão · o método" titulo="Antes do efeito, o teste da fronteira" nivel={1} />
        <Panel letra="a" titulo="A promessa da regra" largura={3}>
          <PromiseText
            citacao="Menos carros poluentes no centro, menos dias de ar ruim para quem mora lá."
            norma="Decreto municipal nº 1.234, de 3 de março de 2020, de Vila Aurora (fictício), que cria a zona de baixa emissão"
            resumo="Veículos acima do limite de emissão pagam multa ao entrar na zona. O limite diário de PM2,5 é 25 µg/m³, e a fronteira tem 12 trechos."
          />
        </Panel>
        <Panel letra="b" titulo="Os números" largura={3}>
          <Numbers
            itens={[
              { valor: 127, comparado: 54, rotulo: 'dias acima do limite logo fora × logo dentro da zona, trecho norte, inverno 2022', ref: '#k5' },
              { valor: 702, comparado: 286, rotulo: 'fora × dentro nos 12 trechos somados, inverno 2022', ref: '[#k7]' },
              { valor: 318, comparado: 241, rotulo: 'fora × dentro nos 12 trechos, estimativa do inverno 2025', ref: '#k6' },
            ]}
          />
        </Panel>
        <Text
          variante="lead"
          paragrafos={['A comparação de fronteira põe lado a lado as estações logo dentro e logo fora da zona, e só vale se os dois lados eram parecidos antes dela. Antes de medir o efeito, contam-se os dias acima do limite de cada lado.']}
        />
        <Panel letra="d" titulo="O gráfico do método: dias acima do limite de cada lado da fronteira">
          <FigurasMetodo g1={g1} g2={g2} />
          <DataTable
            colunas={['Inverno', 'Trechos', { rotulo: 'Logo dentro', numerica: true }, { rotulo: 'Logo fora', numerica: true }, 'Edição']}
            linhas={[
              ['2016', 'norte', 118, 124, 'preliminar, não publicado'],
              ['2019', 'norte', 112, 131, 'preliminar, não publicado'],
              ['2022', 'norte', 54, 127, EDICAO],
              ['2022', '12 somados', 286, 702, EDICAO],
              ['2025 (estimativa)', '12 somados', 241, 318, EDICAO],
            ]}
          />
        </Panel>
        <Source
          rodape
          texto="Rede de monitoramento de Vila Aurora (dados fictícios): invernos de 2016, 2019 e 2022 e estimativa de 2025. Fronteira: decreto municipal de 2020 (fictício). Consultas consultas/ar/pm25-fronteira.sql (2022, 2025) e consultas/ar/pm25-fronteira-preliminar.sql (2016, 2019; dados preliminares, não publicados)."
        />
      </Page>
      <Page lado="impar">
        <Panel letra="d′" titulo="Como ler o gráfico ao lado">
          <HowToRead
            itens={[
              'No trecho norte, 127 dias acima do limite logo fora da zona e 54 logo dentro (inverno 2022). Em 2016 e 2019, antes da zona, os dois lados eram parecidos.',
              'Nos 12 trechos somados, 702 contra 286: o padrão não é de um trecho só.',
              'Com a estimativa do inverno de 2025, 318 contra 241. A estimativa usa menos estações [conferir com a rede].',
              'Contagem não é teste: falta separar os dias de vento fraco [teste a rodar].',
            ]}
          />
        </Panel>
        <Text eyebrow="O veredito" titulo="O que o dado permite dizer, por enquanto" nivel={2} />
        <Panel letra="e" titulo="Verdict com estado de prova">
          <Verdict
            promessa="Menos carros poluentes no centro, menos dias de ar ruim para quem mora lá."
            estado="nao-da-para-afirmar"
            texto="Os dias acima do limite caíram logo dentro da zona, e os dois lados eram parecidos antes dela. Que a melhora valha o ano todo para quem mora lá, o dado de hoje não mostra."
            itens={[
              { afirmacao: 'A zona de baixa emissão reduziu os dias acima do limite.', base: 'fronteira no inverno de 2022, #k5', estado: 'sustentada' },
              { afirmacao: 'As multas explicam a queda.', base: 'a queda começou antes da primeira multa, #k3', estado: 'refutada' },
              { afirmacao: 'O efeito continua fora do inverno.', base: 'um verão de medição só, #k4', estado: 'nao-da-para-afirmar' },
              { afirmacao: 'O ar melhor reduziu as internações.', base: 'sem dado de saúde na rede de monitoramento', estado: 'sem-dado' },
              { afirmacao: 'O trânsito migrou para os bairros vizinhos.', base: 'a contagem de veículos não foi cruzada', estado: 'nao-testada' },
            ]}
            proposto
          />
        </Panel>
        <Panel letra="f" titulo="O que não dá para afirmar" largura={3}>
          <CannotClaim
            itens={[
              { titulo: 'Que a zona limpou o ar da cidade inteira.', texto: 'A comparação usa só as estações perto da fronteira (2016, 2019, 2022).' },
              { titulo: 'Que a estimativa de 2025 encerra o assunto.', texto: '318 contra 241 é contagem, não teste [teste a rodar].' },
              { titulo: 'O efeito longe da fronteira.', texto: 'A comparação só vale para as estações quase gêmeas dos dois lados da linha.' },
            ]}
          />
        </Panel>
        <Panel letra="g" titulo="Trace do número #k5" largura={3}>
          <Trace
            referencia="#k5"
            numero="127"
            descricao="dias acima do limite logo fora da zona, trecho norte"
            consulta="consultas/ar/pm25-fronteira.sql"
            sha256="3f1c0a9b7e2d4c6a8b0e1f2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e"
            tabela="medicoes.pm25_diario"
            cobertura="12 estações"
            fonteOficial="Rede de monitoramento de Vila Aurora (dados fictícios)"
            licenca="[conferir]"
            versao={EDICAO}
            edicao="[AAAA-MM]"
            assinatura={false}
          />
        </Panel>
      </Page>
    </Spread>
  )
}
