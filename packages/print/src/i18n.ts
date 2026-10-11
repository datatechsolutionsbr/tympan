// Texts the components print by themselves (labels, accessible names) and number formatting, by the book's
// `lang`. Two dictionaries ship (pt-BR, the default, and en); a theme (`textos`) or a book (`PrintBook
// textos`) overrides any key, and a key with `{n}`/`{a}`/`{b}` placeholders is filled by `formatar`.
// Component and prop names stay in Portuguese: they are the content contract, not reader-facing text.
import { createContext, useContext } from 'react'

export const TEXTOS_PT = {
  'prova.sustentada': 'Sustentada',
  'prova.refutada': 'Refutada',
  'prova.nao-da-para-afirmar': 'Não dá para afirmar',
  'prova.pendente': 'Pendente',
  'prova.sem-dado': 'Sem dado',
  'prova.nao-testada': 'Não testada',
  fonte: 'Fonte:',
  proximoCapitulo: 'Próximo capítulo',
  quandoODadoChegar: 'Quando o dado chegar',
  medicaoMarcada: 'Medição marcada:',
  estadosPropostos: 'Estados propostos, a confirmar pela autora depois do teste formal.',
  estadoProposto: 'estado proposto',
  dadosDeExemplo: 'Dados de exemplo',
  contra: 'contra',
  lakeLocal: 'lake local, não publicado',
  lakeLocalCurto: 'lake local',
  dados: 'Dados: {a}',
  base: 'Base',
  valor: 'valor',
  'rastro.numero': 'Número',
  'rastro.consulta': 'Consulta',
  'rastro.tabela': 'Tabela de origem',
  'rastro.fonteOficial': 'Fonte',
  'rastro.versao': 'Versão',
  'rastro.lake.tabela': 'Tabela do lake',
  'rastro.lake.fonteOficial': 'Fonte oficial',
  'rastro.lake.versao': 'Versão do lake',
  'rastro.licenca': 'licença {a}',
  'rastro.edicao': 'edição {a}',
  capaAberta: 'Capa aberta',
  paginas: 'Páginas {a} e {b}',
  pagina: 'Página {a}',
  paginaPar: 'Página par',
  paginaImpar: 'Página ímpar',
  volume: 'Volume {a}',
  perguntasDoVolume: 'Perguntas deste volume',
  asLeis: 'As leis: ',
  partesDoLivro: 'Partes do livro',
  nestaParte: 'Nesta parte',
  ondeIssoVolta: 'Onde isso volta',
  parte: 'Parte {a} · ',
  linhaDoTempo: 'Linha do tempo, {a} a {b}',
  legenda: 'Legenda',
  linhasDeCorte: '{n} linhas de corte',
  genealogia: 'Genealogia da regra',
  aPreencher: 'a preencher',
  mancheteIlustrativa: 'Manchete ilustrativa',
  leiaAssim: 'Leia assim',
  voceSabia: 'Você sabia?',
  comoLer: 'Como ler',
  oQueOMapaNaoMostra: 'O que o mapa não mostra',
  semDado: 'sem dado',
  classe: 'Classe',
  municipio: 'Município',
  municipios: 'Municípios',
  ufs: 'UFs',
  emDestaque: 'Em destaque',
  semBandeira: 'sem bandeira no acervo',
  naoConstaNoAcervo: '{a}: não consta no acervo',
  assentosPorPartido: 'Assentos por partido',
  partido: 'Partido',
  assentos: 'Assentos',
  'percentil.acima': 'acima de {n}% dos municípios',
  'percentil.maiorPior': 'maior que em {n}% dos municípios',
  'ranking.posicao': '{a} de {n} em {b}',
  ordinal: '{n}º',
  semIndicador: 'sem indicador',
  serie: 'Série {a}–{b}',
  capital: 'capital',
} as const

export type ChaveTexto = keyof typeof TEXTOS_PT
export type Textos = Record<ChaveTexto, string>

export const TEXTOS_EN: Textos = {
  'prova.sustentada': 'Supported',
  'prova.refutada': 'Refuted',
  'prova.nao-da-para-afirmar': 'Cannot claim',
  'prova.pendente': 'Pending',
  'prova.sem-dado': 'No data',
  'prova.nao-testada': 'Not tested',
  fonte: 'Source:',
  proximoCapitulo: 'Next chapter',
  quandoODadoChegar: 'When the data arrives',
  medicaoMarcada: 'Scheduled measurement:',
  estadosPropostos: 'Proposed states, to be confirmed by the author after the formal test.',
  estadoProposto: 'proposed state',
  dadosDeExemplo: 'Example data',
  contra: 'versus',
  lakeLocal: 'local lake, unpublished',
  lakeLocalCurto: 'local lake',
  dados: 'Data: {a}',
  base: 'Base',
  valor: 'value',
  'rastro.numero': 'Number',
  'rastro.consulta': 'Query',
  'rastro.tabela': 'Source table',
  'rastro.fonteOficial': 'Source',
  'rastro.versao': 'Version',
  'rastro.lake.tabela': 'Lake table',
  'rastro.lake.fonteOficial': 'Official source',
  'rastro.lake.versao': 'Lake version',
  'rastro.licenca': 'licence {a}',
  'rastro.edicao': 'edition {a}',
  capaAberta: 'Open cover',
  paginas: 'Pages {a} and {b}',
  pagina: 'Page {a}',
  paginaPar: 'Left page',
  paginaImpar: 'Right page',
  volume: 'Volume {a}',
  perguntasDoVolume: 'Questions in this volume',
  asLeis: 'The laws: ',
  partesDoLivro: 'Parts of the book',
  nestaParte: 'In this part',
  ondeIssoVolta: 'Where this comes back',
  parte: 'Part {a} · ',
  linhaDoTempo: 'Timeline, {a} to {b}',
  legenda: 'Legend',
  linhasDeCorte: '{n} cut-off lines',
  genealogia: 'Genealogy of the rule',
  aPreencher: 'to be filled in',
  mancheteIlustrativa: 'Illustrative headline',
  leiaAssim: 'Read it like this',
  voceSabia: 'Did you know?',
  comoLer: 'How to read',
  oQueOMapaNaoMostra: 'What the map does not show',
  semDado: 'no data',
  classe: 'Class',
  municipio: 'Municipality',
  municipios: 'Municipalities',
  ufs: 'States',
  emDestaque: 'Highlighted',
  semBandeira: 'no flag on file',
  naoConstaNoAcervo: '{a}: not on file',
  assentosPorPartido: 'Seats by party',
  partido: 'Party',
  assentos: 'Seats',
  'percentil.acima': 'above {n}% of municipalities',
  'percentil.maiorPior': 'higher than in {n}% of municipalities',
  'ranking.posicao': '{a} of {n} in {b}',
  ordinal: '{n}',
  semIndicador: 'no indicator',
  serie: 'Series {a}–{b}',
  capital: 'capital',
}

/** The dictionary of a BCP 47 tag: English for `en*`, Portuguese otherwise. */
export function textosDe(lang: string): Textos {
  return /^en\b/i.test(lang) ? TEXTOS_EN : TEXTOS_PT
}

/** Number locale of a book tag ('pt-BR' → 'pt-BR', 'en' → 'en-US'). */
export function localeNumeros(lang: string): string {
  return /^en$/i.test(lang) ? 'en-US' : lang || 'pt-BR'
}

/** Fills `{a}`, `{b}`, `{n}` in a text. */
export function preencher(t: string, v: { a?: string | number; b?: string | number; n?: string | number } = {}): string {
  return t.replace(/\{([abn])\}/g, (_, k: 'a' | 'b' | 'n') => String(v[k] ?? ''))
}

export interface Idioma {
  lang: string
  locale: string
  textos: Textos
  /** Text of a key, placeholders filled. */
  t: (chave: ChaveTexto, v?: { a?: string | number; b?: string | number; n?: string | number }) => string
  /** A number in the book's locale (up to 2 decimals; strings pass through). */
  num: (v: number | string, casas?: number) => string
}

export function criarIdioma(lang: string, extras?: Partial<Record<string, string>>): Idioma {
  const textos = { ...textosDe(lang), ...(extras as Partial<Textos>) } as Textos
  const locale = localeNumeros(lang)
  const fmts = new Map<number, Intl.NumberFormat>()
  const fmt = (casas: number) => {
    let f = fmts.get(casas)
    if (!f) fmts.set(casas, (f = new Intl.NumberFormat(locale, { maximumFractionDigits: casas })))
    return f
  }
  return {
    lang,
    locale,
    textos,
    t: (chave, v) => preencher(textos[chave] ?? TEXTOS_PT[chave], v),
    num: (v, casas = 2) => (typeof v === 'number' ? fmt(casas).format(Object.is(v, -0) ? 0 : v) : v),
  }
}

const IdiomaCtx = createContext<Idioma>(criarIdioma('pt-BR'))
export const IdiomaProvider = IdiomaCtx.Provider

/** The book's language: texts and number formatting (pt-BR outside a book). */
export function useIdioma(): Idioma {
  return useContext(IdiomaCtx)
}

// Number locale for the pure layout functions (chart geometry measures label widths with the same text it
// prints). PrintBook sets it before its subtree renders and a closing marker restores the outer one, which
// is exact for the synchronous server render (depth-first, in order).
let localeAtual = 'pt-BR'
const FMT = new Map<string, Intl.NumberFormat>()

export function definirLocaleNumeros(locale: string): string {
  const antes = localeAtual
  localeAtual = locale
  return antes
}

export function localeNumerosAtual(): string {
  return localeAtual
}

/** A number in the current book locale with up to `casas` decimals. */
export function numeroLocal(v: number, casas = 2): string {
  const k = `${localeAtual}|${casas}`
  let f = FMT.get(k)
  if (!f) FMT.set(k, (f = new Intl.NumberFormat(localeAtual, { maximumFractionDigits: casas })))
  return f.format(Object.is(v, -0) ? 0 : v)
}

let idiomaAtual: Idioma | null = null

/** Sets the language of the pure render helpers (with the number locale); returns the previous one. */
export function definirIdiomaAtual(i: Idioma | null): Idioma | null {
  const antes = idiomaAtual
  idiomaAtual = i
  if (i) definirLocaleNumeros(i.locale)
  return antes
}

export function idiomaAtualOuPadrao(): Idioma {
  return idiomaAtual ?? PADRAO
}

const PADRAO = criarIdioma('pt-BR')

/** Text of a key in the language of the book being rendered (pt-BR outside a book). */
export function tx(chave: ChaveTexto, v?: { a?: string | number; b?: string | number; n?: string | number }): string {
  return (idiomaAtual ?? PADRAO).t(chave, v)
}
