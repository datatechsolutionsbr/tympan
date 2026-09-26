// Book-style presets for @datatechsolutions/tympan-print: fonts, paper and ink,
// data and proof-state colours, texture, stroke and the chart renderer of each
// diagramming style. The first eleven reproduce the visual studies of the
// Brasil Real volume 0 (diagramacao/estilos/); the rest are new
// interpretations of published design traditions (Tufte, Swiss/Müller-
// Brockmann, Brazilian concretism, The Economist, Nigel Holmes, Herbert Bayer,
// Financial Times). Fonts are Google Fonts families under the OFL.
//
// `printStyleToCss` turns a preset (with optional overrides and a black and
// white variant) into `--ty-print-*` custom properties on
// `[data-ty-print-style="<name>"]`.

import { luminance, parseColor, toHex, type Rgba } from './color.ts'

export type RenderizadorGrafico = 'limpo' | 'mao' | 'isotype' | 'gravura' | 'prancheta' | 'aquarela' | 'riso' | 'pontos'
export type MarcaProva = 'pilula' | 'carimbo' | 'circulo' | 'sublinhado' | 'barra' | 'etiqueta'
export type EstadoProva = 'sustentada' | 'refutada' | 'nao-da-para-afirmar' | 'pendente' | 'sem-dado' | 'nao-testada'

export const ESTADOS_PROVA: readonly EstadoProva[] = ['sustentada', 'refutada', 'nao-da-para-afirmar', 'pendente', 'sem-dado', 'nao-testada']

/** The word printed for each proof state (always visible, whatever the mark's shape). */
export const ROTULOS_PROVA: Record<EstadoProva, string> = {
  sustentada: 'Sustentada',
  refutada: 'Refutada',
  'nao-da-para-afirmar': 'Não dá para afirmar',
  pendente: 'Pendente',
  'sem-dado': 'Sem dado',
  'nao-testada': 'Não testada',
}

export interface PrintFontes {
  titulo: string
  corpo: string
  numero: string
  rotulo: string
  anotacao: string
  mono: string
}

export interface PrintCores {
  papel: string
  tinta: string
  tinta2: string
  tinta3: string
  linha: string
  destaque: string
  destaque2: string
  marcaTexto: string
  contexto: string
  prova: Record<EstadoProva, string>
}

/** Partial colours: any role, and any subset of the proof states. */
export type PrintCoresParciais = Partial<Omit<PrintCores, 'prova'>> & { prova?: Partial<Record<EstadoProva, string>> }

export type TexturaPapel = 'nenhuma' | 'grao' | 'pauta' | 'milimetrado' | 'fibra'
export type Hachura = 'nenhuma' | 'simples' | 'cruzada' | 'pontilhada' | 'goiva'

/**
 * Page structure of a style (addition to the contract, see CONTRATO.md):
 * how panels are framed, how the panel letter is drawn, where notes go, how a
 * figure is marked and how panel labels are cased.
 */
export interface PrintEstrutura {
  /** Panel frame: top rule, heavy top rule, box, heavy box, drafting board, soft card, flat title band or none. */
  painel: 'fio' | 'fio-grosso' | 'caixa' | 'caixa-grossa' | 'prancha' | 'cartao' | 'bloco' | 'nenhum'
  /** Panel letter: plain, in a filled square, in a circle, in parentheses. */
  rotulo: 'letra' | 'quadrado' | 'circulo' | 'parenteses'
  /** Casing of panel labels and eyebrows. */
  rotuloCaixa: 'alta' | 'versalete' | 'normal'
  /** Annotations inside the flow, or as notes in the outer margin (Tufte). */
  notas: 'dentro' | 'margem'
  /** Figure mark: none, a short bar and rule on top (The Economist). */
  figura: 'simples' | 'barra-topo'
}

export interface PrintStyle {
  /** Stable id, e.g. 'jornal'. */
  name: string
  /** Human label, e.g. "Editorial de jornal". */
  label: string
  /** What the style reproduces or interprets. */
  referencia: string
  /** CSS font stacks. */
  fontes: PrintFontes
  /** Google Fonts css2 family specs (`Family Name:axes@values`); empty for system fonts only. */
  googleFonts: string[]
  cor: PrintCores
  papel: { textura: TexturaPapel; intensidade: number }
  /** Stroke width in mm, tremor 0..2 (0 = ruled), hatching of the second series. */
  traco: { largura: number; tremor: number; hachura: Hachura }
  grafico: RenderizadorGrafico
  marcaProva: MarcaProva
  /** Corner radius in mm; 0 for square styles. */
  raio: number
  /** Chapter and spread titles in capitals. */
  caixaAlta: boolean
  /** Adjustments for black and white print, applied after the grey conversion. */
  pb: PrintCoresParciais
  estrutura: PrintEstrutura
}

/** Any token of a style may be overridden by the editor (partial, nested). */
export interface PrintStyleOverrides {
  label?: string
  fontes?: Partial<PrintFontes>
  googleFonts?: string[]
  cor?: PrintCoresParciais
  papel?: Partial<PrintStyle['papel']>
  traco?: Partial<PrintStyle['traco']>
  grafico?: RenderizadorGrafico
  marcaProva?: MarcaProva
  raio?: number
  caixaAlta?: boolean
  pb?: PrintCoresParciais
  estrutura?: Partial<PrintEstrutura>
}

// ---------------------------------------------------------------------------
// Font stacks
// ---------------------------------------------------------------------------

const SERIF = 'Georgia, "Times New Roman", serif'
const SANS = 'system-ui, "Helvetica Neue", Arial, sans-serif'
const MONO = 'ui-monospace, "SFMono-Regular", Menlo, monospace'
const HAND = '"Comic Neue", "Segoe Print", cursive'
const f = (family: string, fallback: string) => `"${family}", ${fallback}`

const PLEX_MONO = 'IBM Plex Mono:wght@400;500'

// ---------------------------------------------------------------------------
// The presets
// ---------------------------------------------------------------------------

const dashboard: PrintStyle = {
  name: 'dashboard',
  label: 'Dashboard editorial',
  referencia: 'Painéis de pesquisa da plataforma Fakhir: cartões, estado de prova em pílula, gráfico sóbrio',
  fontes: {
    titulo: f('Source Serif 4', SERIF),
    corpo: f('IBM Plex Sans', SANS),
    numero: f('IBM Plex Sans', SANS),
    rotulo: f('IBM Plex Sans', SANS),
    anotacao: f('Source Serif 4', SERIF),
    mono: f('IBM Plex Mono', MONO),
  },
  googleFonts: [
    'Source Serif 4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400',
    'IBM Plex Sans:ital,wght@0,400;0,500;0,600;0,700;1,400',
    PLEX_MONO,
  ],
  cor: {
    papel: '#f7f4ee',
    tinta: '#1c1a17',
    tinta2: '#3d3933',
    tinta3: '#5f594f',
    linha: '#d6cfc2',
    destaque: '#1c1a17',
    destaque2: '#9a4f2a',
    marcaTexto: '#f3e6cf',
    contexto: '#8f877a',
    prova: {
      sustentada: '#3d6b1f',
      refutada: '#a3302a',
      'nao-da-para-afirmar': '#8a5a0f',
      pendente: '#8a5a0f',
      'sem-dado': '#5f594f',
      'nao-testada': '#5f594f',
    },
  },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.25, tremor: 0, hachura: 'simples' },
  grafico: 'limpo',
  marcaProva: 'pilula',
  raio: 1.6,
  caixaAlta: false,
  pb: {},
  estrutura: { painel: 'nenhum', rotulo: 'letra', rotuloCaixa: 'alta', notas: 'dentro', figura: 'simples' },
}

const dubois: PrintStyle = {
  name: 'dubois',
  label: 'Du Bois',
  referencia: 'Pranchas de W. E. B. Du Bois para a Exposição de Paris de 1900: letreiro à mão, cores chapadas, papel pardo',
  fontes: {
    titulo: f('Rubik Mono One', SANS),
    corpo: f('Literata', SERIF),
    numero: f('Rubik Mono One', SANS),
    rotulo: f('Patrick Hand SC', HAND),
    anotacao: f('Patrick Hand SC', HAND),
    mono: f('IBM Plex Mono', MONO),
  },
  googleFonts: ['Rubik Mono One', 'Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400', 'Patrick Hand SC', PLEX_MONO],
  cor: {
    papel: '#eadfc8',
    tinta: '#1d1a16',
    tinta2: '#342e27',
    tinta3: '#564a3d',
    linha: '#1d1a16',
    destaque: '#c23b2e',
    destaque2: '#c98a2b',
    marcaTexto: '#e3c989',
    contexto: '#7a5a3e',
    prova: {
      sustentada: '#3e6a48',
      refutada: '#a8342a',
      'nao-da-para-afirmar': '#6f4a2e',
      pendente: '#6f4a2e',
      'sem-dado': '#1d1a16',
      'nao-testada': '#1d1a16',
    },
  },
  papel: { textura: 'fibra', intensidade: 0.55 },
  traco: { largura: 0.45, tremor: 0.7, hachura: 'nenhuma' },
  grafico: 'mao',
  marcaProva: 'carimbo',
  raio: 0,
  caixaAlta: true,
  pb: { destaque: '#3a3a3a', destaque2: '#9a9a9a' },
  estrutura: { painel: 'caixa-grossa', rotulo: 'letra', rotuloCaixa: 'versalete', notas: 'dentro', figura: 'simples' },
}

const deardata: PrintStyle = {
  name: 'deardata',
  label: 'Dear Data',
  referencia: 'Cartões-postais de Giorgia Lupi e Stefanie Posavec (Dear Data, 2016): um ponto por registro, legenda à mão',
  fontes: {
    titulo: f('Newsreader', SERIF),
    corpo: f('Newsreader', SERIF),
    numero: f('Caveat', HAND),
    rotulo: f('Caveat', HAND),
    anotacao: f('Caveat', HAND),
    mono: f('IBM Plex Mono', MONO),
  },
  googleFonts: [
    'Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,600;1,6..72,300;1,6..72,400',
    'Caveat:wght@400;600',
    PLEX_MONO,
  ],
  cor: {
    papel: '#fbf9f3',
    tinta: '#24211e',
    tinta2: '#45413c',
    tinta3: '#625e58',
    linha: '#3a3632',
    destaque: '#3d3fa0',
    destaque2: '#c9462b',
    marcaTexto: '#f1e7c4',
    contexto: '#9a958c',
    prova: {
      sustentada: '#3d3fa0',
      refutada: '#b53d25',
      'nao-da-para-afirmar': '#24211e',
      pendente: '#45413c',
      'sem-dado': '#24211e',
      'nao-testada': '#24211e',
    },
  },
  papel: { textura: 'grao', intensidade: 0.35 },
  traco: { largura: 0.3, tremor: 1, hachura: 'nenhuma' },
  grafico: 'pontos',
  marcaProva: 'circulo',
  raio: 0,
  caixaAlta: false,
  pb: { destaque: '#1a1a1a', destaque2: '#8a8a8a' },
  estrutura: { painel: 'caixa', rotulo: 'parenteses', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples' },
}

const caderno: PrintStyle = {
  name: 'caderno',
  label: 'Caderno de campo',
  referencia: 'Caderno pautado de pesquisa: lápis, hachura cruzada, caneta vermelha e marca-texto',
  fontes: {
    titulo: f('Source Serif 4', SERIF),
    corpo: f('Source Serif 4', SERIF),
    numero: f('Kalam', HAND),
    rotulo: f('Kalam', HAND),
    anotacao: f('Gochi Hand', HAND),
    mono: f('Courier Prime', MONO),
  },
  googleFonts: [
    'Source Serif 4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400',
    'Kalam:wght@400;700',
    'Gochi Hand',
    'Courier Prime:wght@400;700',
  ],
  cor: {
    papel: '#f7f2e4',
    tinta: '#2b2b2b',
    tinta2: '#454545',
    tinta3: '#625d54',
    linha: '#474747',
    destaque: '#2b2b2b',
    destaque2: '#b8322a',
    marcaTexto: '#ffe45c',
    contexto: '#6b665c',
    prova: {
      sustentada: '#2b2b2b',
      refutada: '#b0302a',
      'nao-da-para-afirmar': '#2b2b2b',
      pendente: '#625d54',
      'sem-dado': '#454545',
      'nao-testada': '#454545',
    },
  },
  papel: { textura: 'pauta', intensidade: 0.6 },
  traco: { largura: 0.3, tremor: 1.2, hachura: 'cruzada' },
  grafico: 'mao',
  marcaProva: 'circulo',
  raio: 0,
  caixaAlta: false,
  pb: { destaque2: '#3a3a3a', marcaTexto: '#dddddd' },
  estrutura: { painel: 'caixa', rotulo: 'parenteses', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples' },
}

const isotype: PrintStyle = {
  name: 'isotype',
  label: 'Isotype',
  referencia: 'Isotype de Otto e Marie Neurath e Gerd Arntz (Viena, 1925-1934): um ícone = uma quantidade fixa',
  fontes: {
    titulo: f('Jost', SANS),
    corpo: f('Jost', SANS),
    numero: f('Jost', SANS),
    rotulo: f('Jost', SANS),
    anotacao: f('Jost', SANS),
    mono: f('Jost', SANS),
  },
  googleFonts: ['Jost:ital,wght@0,400;0,500;0,600;0,700;1,400'],
  cor: {
    papel: '#f3eee2',
    tinta: '#1c1b19',
    tinta2: '#383632',
    tinta3: '#5f5a50',
    linha: '#1c1b19',
    destaque: '#1c1b19',
    destaque2: '#c73a2c',
    marcaTexto: '#e4dcc8',
    contexto: '#8a8577',
    prova: {
      sustentada: '#1c1b19',
      refutada: '#b3342a',
      'nao-da-para-afirmar': '#1c1b19',
      pendente: '#383632',
      'sem-dado': '#5f5a50',
      'nao-testada': '#1c1b19',
    },
  },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.5, tremor: 0, hachura: 'simples' },
  grafico: 'isotype',
  marcaProva: 'barra',
  raio: 0,
  caixaAlta: false,
  pb: { destaque2: '#8c8c8c' },
  estrutura: { painel: 'fio-grosso', rotulo: 'quadrado', rotuloCaixa: 'alta', notas: 'dentro', figura: 'simples' },
}

const cordel: PrintStyle = {
  name: 'cordel',
  label: 'Cordel',
  referencia: 'Xilogravura de cordel (J. Borges, Gilvan Samico): papel pardo, goiva, letreiro em laje',
  fontes: {
    titulo: f('Alfa Slab One', SERIF),
    corpo: f('Alegreya', SERIF),
    numero: f('Alfa Slab One', SERIF),
    rotulo: f('Alegreya SC', SERIF),
    anotacao: f('Alegreya', SERIF),
    mono: f('Courier Prime', MONO),
  },
  googleFonts: ['Alfa Slab One', 'Alegreya:ital,wght@0,400;0,500;0,700;1,400', 'Alegreya SC:wght@500;700', 'Courier Prime'],
  cor: {
    papel: '#dcc79c',
    tinta: '#15110d',
    tinta2: '#2c2219',
    tinta3: '#4a3a29',
    linha: '#15110d',
    destaque: '#15110d',
    destaque2: '#15110d',
    marcaTexto: '#c9ae78',
    contexto: '#5a4632',
    prova: {
      sustentada: '#15110d',
      refutada: '#15110d',
      'nao-da-para-afirmar': '#15110d',
      pendente: '#2c2219',
      'sem-dado': '#15110d',
      'nao-testada': '#15110d',
    },
  },
  papel: { textura: 'fibra', intensidade: 0.8 },
  traco: { largura: 0.6, tremor: 0.9, hachura: 'goiva' },
  grafico: 'gravura',
  marcaProva: 'carimbo',
  raio: 0,
  caixaAlta: false,
  pb: {},
  estrutura: { painel: 'caixa-grossa', rotulo: 'quadrado', rotuloCaixa: 'versalete', notas: 'dentro', figura: 'simples' },
}

const riso: PrintStyle = {
  name: 'riso',
  label: 'Risografia',
  referencia: 'Impressão em risógrafo a duas tintas (azul e rosa fluorescente): grão, meio-tom e registro solto',
  fontes: {
    titulo: f('Bricolage Grotesque', SANS),
    corpo: f('Archivo', SANS),
    numero: f('Bricolage Grotesque', SANS),
    rotulo: f('Archivo', SANS),
    anotacao: f('Space Mono', MONO),
    mono: f('Space Mono', MONO),
  },
  googleFonts: [
    'Bricolage Grotesque:opsz,wdth,wght@12..96,75..100,400..800',
    'Archivo:ital,wdth,wght@0,62..125,400;0,62..125,600;1,62..125,400',
    'Space Mono',
  ],
  cor: {
    papel: '#f5f1e8',
    tinta: '#3d3fa0',
    tinta2: '#3d3fa0',
    tinta3: '#4f51a3',
    linha: '#3d3fa0',
    destaque: '#3d3fa0',
    destaque2: '#ff48b0',
    marcaTexto: '#ffd3ea',
    contexto: '#8f8fc4',
    prova: {
      sustentada: '#3d3fa0',
      refutada: '#c8187a',
      'nao-da-para-afirmar': '#3d3fa0',
      pendente: '#3d3fa0',
      'sem-dado': '#3d3fa0',
      'nao-testada': '#3d3fa0',
    },
  },
  papel: { textura: 'grao', intensidade: 0.6 },
  traco: { largura: 0.5, tremor: 0, hachura: 'pontilhada' },
  grafico: 'riso',
  marcaProva: 'barra',
  raio: 0,
  caixaAlta: false,
  pb: { tinta: '#1a1a1a', tinta2: '#1a1a1a', tinta3: '#3a3a3a', linha: '#1a1a1a', destaque: '#1a1a1a', destaque2: '#8a8a8a' },
  estrutura: { painel: 'caixa', rotulo: 'circulo', rotuloCaixa: 'alta', notas: 'dentro', figura: 'simples' },
}

const jornal: PrintStyle = {
  name: 'jornal',
  label: 'Editorial de jornal',
  referencia: 'Gráficos editoriais do NYT The Upshot (Amanda Cox, Kevin Quealy), The Pudding e da Folha de S.Paulo',
  fontes: {
    titulo: f('Newsreader', SERIF),
    corpo: f('Newsreader', SERIF),
    numero: f('Libre Franklin', SANS),
    rotulo: f('Libre Franklin', SANS),
    anotacao: f('Newsreader', SERIF),
    mono: f('IBM Plex Mono', MONO),
  },
  googleFonts: [
    'Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,500',
    'Libre Franklin:ital,wght@0,400;0,500;0,600;0,700;1,400',
    PLEX_MONO,
  ],
  cor: {
    papel: '#fdfcfa',
    tinta: '#121212',
    tinta2: '#3d3d3d',
    tinta3: '#636363',
    linha: '#cfcfcf',
    destaque: '#c8431f',
    destaque2: '#121212',
    marcaTexto: '#f7e4db',
    contexto: '#b0b0b0',
    prova: {
      sustentada: '#121212',
      refutada: '#b83c1b',
      'nao-da-para-afirmar': '#121212',
      pendente: '#636363',
      'sem-dado': '#636363',
      'nao-testada': '#636363',
    },
  },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.25, tremor: 0, hachura: 'nenhuma' },
  grafico: 'limpo',
  marcaProva: 'pilula',
  raio: 3,
  caixaAlta: false,
  pb: { destaque: '#121212' },
  estrutura: { painel: 'fio', rotulo: 'letra', rotuloCaixa: 'alta', notas: 'dentro', figura: 'simples' },
}

const prancheta: PrintStyle = {
  name: 'prancheta',
  label: 'Prancheta (cianotipia)',
  referencia: 'Desenho técnico em cópia heliográfica: papel azul, milimetrado, cotas e letreiro normógrafo',
  fontes: {
    titulo: f('Share Tech Mono', MONO),
    corpo: f('IBM Plex Sans Condensed', SANS),
    numero: f('Share Tech Mono', MONO),
    rotulo: f('Share Tech Mono', MONO),
    anotacao: f('IBM Plex Sans Condensed', SANS),
    mono: f('IBM Plex Mono', MONO),
  },
  googleFonts: ['Share Tech Mono', 'IBM Plex Sans Condensed:ital,wght@0,400;0,500;1,400', PLEX_MONO],
  cor: {
    papel: '#1d4b8f',
    tinta: '#eef4ff',
    tinta2: '#d6e1f3',
    tinta3: '#bccbe4',
    linha: '#eef4ff',
    destaque: '#eef4ff',
    destaque2: '#dce6f7',
    marcaTexto: '#2c5aa0',
    contexto: '#b9c6e2',
    prova: {
      sustentada: '#eef4ff',
      refutada: '#eef4ff',
      'nao-da-para-afirmar': '#eef4ff',
      pendente: '#d6e1f3',
      'sem-dado': '#d6e1f3',
      'nao-testada': '#d6e1f3',
    },
  },
  papel: { textura: 'milimetrado', intensidade: 0.7 },
  traco: { largura: 0.25, tremor: 0, hachura: 'simples' },
  grafico: 'prancheta',
  marcaProva: 'barra',
  raio: 0,
  caixaAlta: true,
  // In black and white the blueprint becomes a white sheet with black ink.
  pb: {
    papel: '#ffffff',
    tinta: '#111111',
    tinta2: '#333333',
    tinta3: '#555555',
    linha: '#111111',
    destaque: '#111111',
    destaque2: '#444444',
    marcaTexto: '#e6e6e6',
    contexto: '#9a9a9a',
    prova: { sustentada: '#111111', refutada: '#111111', 'nao-da-para-afirmar': '#111111', pendente: '#333333', 'sem-dado': '#333333', 'nao-testada': '#333333' },
  },
  estrutura: { painel: 'prancha', rotulo: 'circulo', rotuloCaixa: 'alta', notas: 'dentro', figura: 'simples' },
}

const pranchetaClara: PrintStyle = {
  ...prancheta,
  name: 'prancheta-clara',
  label: 'Prancheta clara',
  referencia: 'Desenho técnico em papel vegetal claro: tinta azul, milimetrado, cotas e letreiro normógrafo',
  cor: {
    papel: '#f6f7f4',
    tinta: '#1f4787',
    tinta2: '#2f5390',
    tinta3: '#4a669a',
    linha: '#1f4787',
    destaque: '#2e3192',
    destaque2: '#2e3192',
    marcaTexto: '#dfe5ef',
    contexto: '#9aa3c4',
    prova: {
      sustentada: '#2e3192',
      refutada: '#2e3192',
      'nao-da-para-afirmar': '#2e3192',
      pendente: '#2e3192',
      'sem-dado': '#2e3192',
      'nao-testada': '#2e3192',
    },
  },
  papel: { textura: 'milimetrado', intensidade: 0.6 },
  pb: { destaque: '#1a1a1a', destaque2: '#1a1a1a' },
}

const aquarela: PrintStyle = {
  name: 'aquarela',
  label: 'Aquarela',
  referencia: 'Caderno de aquarela: papel de algodão, lavagens de índigo e siena com borda de pigmento, legenda à mão',
  fontes: {
    titulo: f('Cormorant Garamond', SERIF),
    corpo: f('Crimson Pro', SERIF),
    numero: f('Caveat', HAND),
    rotulo: f('Caveat', HAND),
    anotacao: f('Caveat', HAND),
    mono: f('IBM Plex Mono', MONO),
  },
  googleFonts: [
    'Cormorant Garamond:ital,wght@0,500;0,600;1,500;1,600',
    'Crimson Pro:ital,wght@0,400;0,500;0,600;1,400',
    'Caveat:wght@500;700',
    PLEX_MONO,
  ],
  cor: {
    papel: '#fbf7ee',
    tinta: '#2e2520',
    tinta2: '#4a3d33',
    tinta3: '#635446',
    linha: '#2e2520',
    destaque: '#5b5fa8',
    destaque2: '#cf8448',
    marcaTexto: '#efe0b0',
    contexto: '#b8ab98',
    prova: {
      sustentada: '#3e6a48',
      refutada: '#a4442a',
      'nao-da-para-afirmar': '#7a5a1c',
      pendente: '#7a5a1c',
      'sem-dado': '#635446',
      'nao-testada': '#635446',
    },
  },
  papel: { textura: 'fibra', intensidade: 0.6 },
  traco: { largura: 0.35, tremor: 0.8, hachura: 'nenhuma' },
  grafico: 'aquarela',
  marcaProva: 'barra',
  raio: 0,
  caixaAlta: false,
  pb: { destaque: '#5a5a5a', destaque2: '#b0b0b0' },
  estrutura: { painel: 'caixa', rotulo: 'parenteses', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples' },
}

const tufte: PrintStyle = {
  name: 'tufte',
  label: 'Tufte',
  referencia: 'Edward Tufte (The Visual Display of Quantitative Information, Beautiful Evidence): pouca tinta, notas na margem, pequenos múltiplos, moldura de amplitude',
  fontes: {
    titulo: f('EB Garamond', SERIF),
    corpo: f('EB Garamond', SERIF),
    numero: f('EB Garamond', SERIF),
    rotulo: f('EB Garamond', SERIF),
    anotacao: f('EB Garamond', SERIF),
    mono: f('IBM Plex Mono', MONO),
  },
  googleFonts: ['EB Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500', PLEX_MONO],
  cor: {
    papel: '#fffff8',
    tinta: '#111111',
    tinta2: '#333333',
    tinta3: '#575757',
    linha: '#bdbdb5',
    destaque: '#a3261c',
    destaque2: '#111111',
    marcaTexto: '#f3efd6',
    contexto: '#a6a6a0',
    prova: {
      sustentada: '#111111',
      refutada: '#a3261c',
      'nao-da-para-afirmar': '#333333',
      pendente: '#575757',
      'sem-dado': '#575757',
      'nao-testada': '#575757',
    },
  },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.15, tremor: 0, hachura: 'nenhuma' },
  grafico: 'limpo',
  marcaProva: 'sublinhado',
  raio: 0,
  caixaAlta: false,
  pb: { destaque: '#111111' },
  estrutura: { painel: 'nenhum', rotulo: 'letra', rotuloCaixa: 'versalete', notas: 'margem', figura: 'simples' },
}

const suico: PrintStyle = {
  name: 'suico',
  label: 'Estilo Suíço',
  referencia: 'Estilo tipográfico internacional (Josef Müller-Brockmann, Grid Systems, 1981): grade rígida, grotesca, assimetria, um vermelho',
  fontes: {
    titulo: f('Inter Tight', SANS),
    corpo: f('Inter', SANS),
    numero: f('Inter Tight', SANS),
    rotulo: f('Inter', SANS),
    anotacao: f('Inter', SANS),
    mono: f('JetBrains Mono', MONO),
  },
  googleFonts: ['Inter Tight:wght@500;600;700;800', 'Inter:ital,wght@0,400;0,500;0,600;0,700;1,400', 'JetBrains Mono:wght@400;500'],
  cor: {
    papel: '#f4f3ef',
    tinta: '#111111',
    tinta2: '#2e2e2e',
    tinta3: '#555555',
    linha: '#111111',
    destaque: '#e30613',
    destaque2: '#111111',
    marcaTexto: '#f9d7d2',
    contexto: '#b0afa9',
    prova: {
      sustentada: '#111111',
      refutada: '#c8050f',
      'nao-da-para-afirmar': '#111111',
      pendente: '#555555',
      'sem-dado': '#555555',
      'nao-testada': '#555555',
    },
  },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.35, tremor: 0, hachura: 'simples' },
  grafico: 'limpo',
  marcaProva: 'barra',
  raio: 0,
  caixaAlta: false,
  pb: { destaque: '#111111' },
  estrutura: { painel: 'fio-grosso', rotulo: 'letra', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples' },
}

const concretismo: PrintStyle = {
  name: 'concretismo',
  label: 'Concretismo',
  referencia: 'Design concreto brasileiro (Alexandre Wollner, Aloísio Magalhães, ESDI, anos 1950-60): geometria, grotesca, preto, vermelhão e ultramar',
  fontes: {
    titulo: f('Archivo', SANS),
    corpo: f('Archivo', SANS),
    numero: f('Archivo', SANS),
    rotulo: f('Archivo', SANS),
    anotacao: f('Archivo', SANS),
    mono: f('Space Mono', MONO),
  },
  googleFonts: ['Archivo:ital,wdth,wght@0,62..125,400;0,62..125,500;0,62..125,700;0,62..125,800;1,62..125,400', 'Space Mono'],
  cor: {
    papel: '#f6f4ee',
    tinta: '#141414',
    tinta2: '#2b2b2b',
    tinta3: '#525252',
    linha: '#141414',
    destaque: '#e2401c',
    destaque2: '#3d3fa0',
    marcaTexto: '#f8d8cd',
    contexto: '#c4bfb3',
    prova: {
      sustentada: '#141414',
      refutada: '#c2360f',
      'nao-da-para-afirmar': '#3d3fa0',
      pendente: '#525252',
      'sem-dado': '#525252',
      'nao-testada': '#525252',
    },
  },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.8, tremor: 0, hachura: 'simples' },
  grafico: 'limpo',
  marcaProva: 'circulo',
  raio: 0,
  caixaAlta: false,
  pb: { destaque: '#141414', destaque2: '#7a7a7a' },
  estrutura: { painel: 'fio-grosso', rotulo: 'circulo', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples' },
}

const economist: PrintStyle = {
  name: 'economist',
  label: 'The Economist',
  referencia: 'Gráficos da revista The Economist: barra vermelha no topo, título curto, grotesca condensada, grade só horizontal',
  fontes: {
    titulo: f('Roboto Condensed', SANS),
    corpo: f('Source Serif 4', SERIF),
    numero: f('Roboto Condensed', SANS),
    rotulo: f('Roboto Condensed', SANS),
    anotacao: f('Roboto Condensed', SANS),
    mono: f('Roboto Mono', MONO),
  },
  googleFonts: [
    'Roboto Condensed:ital,wght@0,400;0,500;0,700;1,400',
    'Source Serif 4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400',
    'Roboto Mono:wght@400;500',
  ],
  cor: {
    papel: '#fbfbf9',
    tinta: '#121212',
    tinta2: '#333333',
    tinta3: '#575757',
    linha: '#b7c6cf',
    destaque: '#e3120b',
    destaque2: '#0d6f74',
    marcaTexto: '#fbdcd8',
    contexto: '#b7c6cf',
    prova: {
      sustentada: '#121212',
      refutada: '#c50f09',
      'nao-da-para-afirmar': '#0d6f74',
      pendente: '#575757',
      'sem-dado': '#575757',
      'nao-testada': '#575757',
    },
  },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.3, tremor: 0, hachura: 'nenhuma' },
  grafico: 'limpo',
  marcaProva: 'etiqueta',
  raio: 0,
  caixaAlta: false,
  pb: { destaque: '#121212', destaque2: '#777777' },
  estrutura: { painel: 'fio', rotulo: 'letra', rotuloCaixa: 'normal', notas: 'dentro', figura: 'barra-topo' },
}

const holmes: PrintStyle = {
  name: 'holmes',
  label: 'Nigel Holmes',
  referencia: 'Infografia explicativa de Nigel Holmes (Time, Wordless Diagrams): pictogramas, cantos redondos, legenda amigável à mão',
  fontes: {
    titulo: f('Fredoka', SANS),
    corpo: f('Source Sans 3', SANS),
    numero: f('Fredoka', SANS),
    rotulo: f('Fredoka', SANS),
    anotacao: f('Patrick Hand', HAND),
    mono: f('Source Code Pro', MONO),
  },
  googleFonts: ['Fredoka:wght@400;500;600;700', 'Source Sans 3:ital,wght@0,400;0,600;0,700;1,400', 'Patrick Hand', 'Source Code Pro:wght@400;500'],
  cor: {
    papel: '#fbf5e6',
    tinta: '#1f1b16',
    tinta2: '#3b342c',
    tinta3: '#5a5147',
    linha: '#1f1b16',
    destaque: '#e05a2b',
    destaque2: '#2f7f86',
    marcaTexto: '#ffe6a3',
    contexto: '#c9bca3',
    prova: {
      sustentada: '#2f6b3a',
      refutada: '#b8401a',
      'nao-da-para-afirmar': '#6b4e8a',
      pendente: '#5a5147',
      'sem-dado': '#5a5147',
      'nao-testada': '#5a5147',
    },
  },
  papel: { textura: 'grao', intensidade: 0.2 },
  traco: { largura: 0.5, tremor: 0.3, hachura: 'simples' },
  grafico: 'isotype',
  marcaProva: 'pilula',
  raio: 2.4,
  caixaAlta: false,
  pb: { destaque: '#2a2a2a', destaque2: '#8a8a8a' },
  estrutura: { painel: 'cartao', rotulo: 'circulo', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples' },
}

const bayer: PrintStyle = {
  name: 'bayer',
  label: 'Herbert Bayer',
  referencia: 'World Geo-Graphic Atlas de Herbert Bayer (1953): atlas modernista, cores chapadas, sans geométrica, pictogramas de escala',
  fontes: {
    titulo: f('Josefin Sans', SANS),
    corpo: f('Work Sans', SANS),
    numero: f('Josefin Sans', SANS),
    rotulo: f('Josefin Sans', SANS),
    anotacao: f('Work Sans', SANS),
    mono: f('Space Mono', MONO),
  },
  googleFonts: ['Josefin Sans:ital,wght@0,400;0,600;0,700;1,400', 'Work Sans:ital,wght@0,400;0,500;0,600;1,400', 'Space Mono'],
  cor: {
    papel: '#f1ebdd',
    tinta: '#1a1a1a',
    tinta2: '#36342f',
    tinta3: '#57534a',
    linha: '#1a1a1a',
    destaque: '#b8452c',
    destaque2: '#5a5f93',
    marcaTexto: '#e6d9b8',
    contexto: '#cdbf9c',
    prova: {
      sustentada: '#3e6a48',
      refutada: '#a63d26',
      'nao-da-para-afirmar': '#4f548a',
      pendente: '#57534a',
      'sem-dado': '#57534a',
      'nao-testada': '#57534a',
    },
  },
  papel: { textura: 'grao', intensidade: 0.25 },
  traco: { largura: 0.4, tremor: 0, hachura: 'nenhuma' },
  grafico: 'limpo',
  marcaProva: 'etiqueta',
  raio: 0,
  caixaAlta: false,
  pb: { destaque: '#2a2a2a', destaque2: '#8a8a8a' },
  estrutura: { painel: 'bloco', rotulo: 'circulo', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples' },
}

const ft: PrintStyle = {
  name: 'ft',
  label: 'Financial Times',
  referencia: 'Gráficos do Financial Times: papel salmão, serifa editorial no título, grotesca nos rótulos, clarete e azul-petróleo',
  fontes: {
    titulo: f('Libre Caslon Text', SERIF),
    corpo: f('Libre Caslon Text', SERIF),
    numero: f('Source Sans 3', SANS),
    rotulo: f('Source Sans 3', SANS),
    anotacao: f('Source Sans 3', SANS),
    mono: f('Source Code Pro', MONO),
  },
  googleFonts: ['Libre Caslon Text:ital,wght@0,400;0,700;1,400', 'Source Sans 3:ital,wght@0,400;0,600;0,700;1,400', 'Source Code Pro:wght@400;500'],
  cor: {
    papel: '#fff1e5',
    tinta: '#33302e',
    tinta2: '#4a4543',
    tinta3: '#625c58',
    linha: '#ccc1b7',
    destaque: '#990f3d',
    destaque2: '#0d7680',
    marcaTexto: '#f2dfce',
    contexto: '#b7aba1',
    prova: {
      sustentada: '#33302e',
      refutada: '#990f3d',
      'nao-da-para-afirmar': '#0d6770',
      pendente: '#625c58',
      'sem-dado': '#625c58',
      'nao-testada': '#625c58',
    },
  },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.3, tremor: 0, hachura: 'nenhuma' },
  grafico: 'limpo',
  marcaProva: 'etiqueta',
  raio: 0,
  caixaAlta: false,
  pb: { papel: '#ffffff', destaque: '#1a1a1a', destaque2: '#7a7a7a' },
  estrutura: { painel: 'fio', rotulo: 'letra', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples' },
}

/** The 18 book styles, by name. */
export const printPresets = {
  dashboard,
  dubois,
  deardata,
  caderno,
  isotype,
  cordel,
  riso,
  jornal,
  prancheta,
  'prancheta-clara': pranchetaClara,
  aquarela,
  tufte,
  suico,
  concretismo,
  economist,
  holmes,
  bayer,
  ft,
} satisfies Record<string, PrintStyle>

export type PrintPresetName = keyof typeof printPresets
export const PRINT_PRESET_NAMES = Object.keys(printPresets) as PrintPresetName[]
export const DEFAULT_PRINT_STYLE: PrintPresetName = 'jornal'

// ---------------------------------------------------------------------------
// Resolution: overrides, black and white
// ---------------------------------------------------------------------------

function mergeCores(base: PrintCores, over?: PrintCoresParciais): PrintCores {
  if (!over) return base
  const { prova, ...rest } = over
  const clean = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)) as Partial<PrintCores>
  return { ...base, ...clean, prova: { ...base.prova, ...(prova ?? {}) } }
}

/** A style with the editor's overrides applied (nested, partial). */
export function mergePrintStyle(style: PrintStyle, overrides?: PrintStyleOverrides): PrintStyle {
  if (!overrides) return style
  return {
    ...style,
    label: overrides.label ?? style.label,
    fontes: { ...style.fontes, ...overrides.fontes },
    googleFonts: overrides.googleFonts ?? style.googleFonts,
    cor: mergeCores(style.cor, overrides.cor),
    papel: { ...style.papel, ...overrides.papel },
    traco: { ...style.traco, ...overrides.traco },
    grafico: overrides.grafico ?? style.grafico,
    marcaProva: overrides.marcaProva ?? style.marcaProva,
    raio: overrides.raio ?? style.raio,
    caixaAlta: overrides.caixaAlta ?? style.caixaAlta,
    pb: overrides.pb ? mergeCores({ ...style.cor, ...style.pb, prova: { ...style.cor.prova, ...style.pb.prova } }, overrides.pb) : style.pb,
    estrutura: { ...style.estrutura, ...overrides.estrutura },
  }
}

const fromLinear = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

/** The grey with the same WCAG relative luminance, so every contrast ratio survives the conversion. */
export function toGrey(color: string): string {
  const c: Rgba = parseColor(color)
  const y = luminance(c)
  const v = fromLinear(y)
  return toHex({ r: v, g: v, b: v, a: 1 })
}

/** Colours for black and white print: every role in grey, then the style's own `pb` adjustments. */
export function printStyleCoresPb(style: PrintStyle): PrintCores {
  const g = style.cor
  const grey: PrintCores = {
    papel: toGrey(g.papel),
    tinta: toGrey(g.tinta),
    tinta2: toGrey(g.tinta2),
    tinta3: toGrey(g.tinta3),
    linha: toGrey(g.linha),
    destaque: toGrey(g.destaque),
    destaque2: toGrey(g.destaque2),
    marcaTexto: toGrey(g.marcaTexto),
    contexto: toGrey(g.contexto),
    prova: Object.fromEntries(ESTADOS_PROVA.map((e) => [e, toGrey(g.prova[e])])) as Record<EstadoProva, string>,
  }
  return mergeCores(grey, style.pb)
}

export interface PrintCssOptions {
  /** Black and white variant. */
  pb?: boolean
  /** Editor overrides of any token. */
  overrides?: PrintStyleOverrides
  /** Selector to scope the properties to; defaults to `[data-ty-print-style="<name>"]`. */
  seletor?: string
}

/** The style as it will print: overrides applied, then (for `pb`) the grey conversion. */
export function resolvePrintStyle(style: PrintStyle, options: Omit<PrintCssOptions, 'seletor'> = {}): PrintStyle {
  const merged = mergePrintStyle(style, options.overrides)
  if (!options.pb) return merged
  return { ...merged, cor: printStyleCoresPb(merged) }
}

const kebab: Record<Exclude<keyof PrintCores, 'prova'>, string> = {
  papel: 'papel',
  tinta: 'tinta',
  tinta2: 'tinta-2',
  tinta3: 'tinta-3',
  linha: 'linha',
  destaque: 'destaque',
  destaque2: 'destaque-2',
  marcaTexto: 'marca-texto',
  contexto: 'contexto',
}

const num = (n: number) => String(Math.round(n * 1000) / 1000)

/** Custom properties of a resolved style, in a stable order. */
export function printStyleVariables(style: PrintStyle): Array<[string, string]> {
  const vars: Array<[string, string]> = []
  for (const k of ['titulo', 'corpo', 'numero', 'rotulo', 'anotacao', 'mono'] as const) vars.push([`--ty-print-fonte-${k}`, style.fontes[k]])
  for (const [k, name] of Object.entries(kebab) as Array<[keyof typeof kebab, string]>) vars.push([`--ty-print-${name}`, style.cor[k]])
  for (const e of ESTADOS_PROVA) vars.push([`--ty-print-prova-${e}`, style.cor.prova[e]])
  vars.push(['--ty-print-textura-intensidade', num(style.papel.intensidade)])
  vars.push(['--ty-print-traco', `${num(style.traco.largura)}mm`])
  vars.push(['--ty-print-tremor', num(style.traco.tremor)])
  vars.push(['--ty-print-raio', `${num(style.raio)}mm`])
  vars.push(['--ty-print-titulo-caixa', style.caixaAlta ? 'uppercase' : 'none'])
  vars.push(['--ty-print-titulo-espaco', style.caixaAlta ? '0.04em' : 'normal'])
  const rc = style.estrutura.rotuloCaixa
  vars.push(['--ty-print-rotulo-caixa', rc === 'alta' ? 'uppercase' : 'none'])
  vars.push(['--ty-print-rotulo-variante', rc === 'versalete' ? 'small-caps' : 'normal'])
  vars.push(['--ty-print-rotulo-espaco', rc === 'normal' ? 'normal' : '0.07em'])
  return vars
}

/**
 * CSS custom properties (`--ty-print-*`) of a style on
 * `[data-ty-print-style="<name>"]`, with the editor's overrides and, when
 * `pb` is set, the black and white colours.
 */
export function printStyleToCss(style: PrintStyle, options: PrintCssOptions = {}): string {
  const resolved = resolvePrintStyle(style, options)
  const selector = options.seletor ?? `[data-ty-print-style="${style.name}"]`
  const body = printStyleVariables(resolved)
    .map(([n, v]) => `  ${n}: ${v};`)
    .join('\n')
  return `${selector} {\n${body}\n}\n`
}

/** Google Fonts css2 URL for a style's families (null when it uses system fonts only). */
export function googleFontsUrl(style: Pick<PrintStyle, 'googleFonts'>): string | null {
  if (!style.googleFonts.length) return null
  const families = style.googleFonts.map((spec) => `family=${encodeURIComponent(spec).replace(/%20/g, '+').replace(/%3A/g, ':').replace(/%40/g, '@').replace(/%3B/g, ';').replace(/%2C/g, ',')}`)
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`
}

/** True when the paper is dark (the brand seal and logo then use the light mono version). */
export function papelEscuro(style: Pick<PrintStyle, 'cor'>): boolean {
  return luminance(parseColor(style.cor.papel)) < 0.2
}
