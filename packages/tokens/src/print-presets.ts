// Book-style presets for @datatechsolutions/tympan-print: fonts, paper and ink,
// data and proof-state colours, texture, stroke and the chart renderer of each
// diagramming style. The first eleven reproduce the visual studies of the
// Brasil Real volume 0 (diagramacao/estilos/); the rest are new
// interpretations of published design traditions. Style ids and labels are
// neutral, descriptive names; the tradition a style draws on is named only in
// its `referencia` ("inspirado em …"). Renamed ids stay accepted as deprecated
// aliases (PRINT_STYLE_ALIASES). Fonts are Google Fonts families under the OFL.
//
// `printStyleToCss` turns a preset (with optional overrides and a black and
// white variant) into `--ty-print-*` custom properties on
// `[data-ty-print-style="<name>"]`.

import { luminance, parseColor, toHex, type Rgba } from './color.ts'

export type RenderizadorGrafico = 'limpo' | 'mao' | 'isotype' | 'gravura' | 'prancheta' | 'aquarela' | 'riso' | 'pontos'
export type MarcaProva = 'pilula' | 'carimbo' | 'circulo' | 'sublinhado' | 'barra' | 'etiqueta' | 'formas' | 'ponto'
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
  /** Colours of page ornaments only (frames, tiles, waves); never data. Up to four. */
  ornamento?: string[]
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
  painel: 'fio' | 'fio-grosso' | 'caixa' | 'caixa-grossa' | 'prancha' | 'cartao' | 'bloco' | 'nenhum' | 'dossie' | 'placa'
  /** Panel letter: plain, in a filled square, in a circle, in parentheses. */
  rotulo: 'letra' | 'quadrado' | 'circulo' | 'parenteses'
  /** Casing of panel labels and eyebrows. */
  rotuloCaixa: 'alta' | 'versalete' | 'normal'
  /** Annotations inside the flow, or as notes in the outer margin (minimo-de-tinta). */
  notas: 'dentro' | 'margem'
  /** Figure mark: none; a short bar and rule on top (semanario); range frame, no grid (minimo-de-tinta). */
  figura: 'simples' | 'barra-topo' | 'amplitude'
  /** Titles and labels in lower case (diagrama-modernista, concrete design). */
  minusculas: boolean
  /** Bar charts drawn as horizontal bars (default) or vertical columns. Lengths come from the data either way. */
  barras?: 'horizontal' | 'vertical'
  /** Page ornament drawn in the margins, outside the type area (never over data). */
  moldura?: Moldura
  /** Running head: plain text (default), a full-width band (mapa-de-metro, constructivism) or a tag with an arrow (signage). */
  cabeco?: 'texto' | 'faixa' | 'etiqueta'
  /**
   * Title treatment: cut-paper word blocks, a band with a hard shadow, an offset colour shadow, the ornament colours;
   * italic (minimo-de-tinta), centred capitals with wide spacing (graficos-1900), centred italic (fluxo-historico), heavier and larger
   * (constructivism), set from the third column (Swiss grid), or underlined by hand (caderno).
   */
  tituloEstilo?: 'normal' | 'recorte' | 'faixa' | 'sombra' | 'arcoiris' | 'italico' | 'centro' | 'centro-italico' | 'pesado' | 'coluna3' | 'sublinhado'
  /** Fill of the square or round panel letter. */
  corRotulo?: 'destaque' | 'destaque2' | 'tinta' | 'marcaTexto' | 'sustentada' | 'refutada'
  /** Bars get an ink outline (Memphis, pop art). */
  contornoBarra?: boolean
  /**
   * Signature shape of the comparison chart (G1 of the style audit). Default: 'barras' ('colunas' when
   * `barras` is 'vertical'). Every shape keeps position and size from the data; see FormaGrafico.
   */
  forma?: FormaGrafico
  /** A line at the cut between the two columns of each group: dashed (minimo-de-tinta, infografico-ilustrado) or solid (diagrama-modernista). */
  linhaCorte?: 'tracejada' | 'cheia'
  /** A marker on the end of each column (diagrama-modernista: a circle). */
  marcador?: 'circulo'
  /** Thin columns (minimo-de-tinta). */
  colunasFinas?: boolean
  /**
   * Callouts drawn inside the chart (G3): numbered list under the plot (default), handwritten notes with an
   * arrow and the value circled (caderno), speech balloons (divulgação, infografico-ilustrado) or text with a leader line (papel-salmao).
   */
  chamadas?: 'numeradas' | 'manuscritas' | 'baloes' | 'guia'
  /** Two figures of one panel stacked (default) or side by side as small multiples. */
  multiplos?: 'empilhados' | 'lado-a-lado'
  /** A letter (A, B…) on each small multiple (scientific figure). */
  letraMultiplo?: boolean
  // Page composition (G2, G4–G8 of the style audit, drawn by tympan-print's page and panel components).
  /** Emblem beside the spread title: decoration in ornament or ink colours, never data. */
  emblema?: Emblema
  /** Panel fills: a pale tint (pictogramas), alternating tints (diagrama-modernista, proporcao-modular, blocos-coloridos, divulgação) or halftone dots (riso). */
  fundoPainel?: 'claro' | 'alternado' | 'pontilhado'
  /** The verdict panel (e): a dark block (mapa-de-metro, sinalizacao, concretism, blocos-coloridos) or a block in the highlighter tint (riso). */
  veredito?: 'bloco-escuro' | 'bloco-cor'
  /** The linking paragraph under a and b: a highlight band (bauhaus), a dark block (constructivism), a thick bar (concretism, proporcao-modular) or a "você sabia?" tag (divulgação). */
  costura?: 'faixa' | 'bloco-escuro' | 'barra' | 'selo'
  /** Headline of the method figures: plain, on a band, on a tilted band (constructivism), with a magnifier (divulgação). */
  manchete?: 'texto' | 'faixa' | 'diagonal' | 'lupa'
  /** The trace of a number (g): a list (default), a metro line with stations (mapa-de-metro) or signage plates (sinalizacao). */
  rastro?: 'lista' | 'metro' | 'placa'
  /** Notes of a figure under it (default) or in a column beside it headed "Leia assim" (Dados BR). */
  notasFigura?: 'dentro' | 'coluna'
  /** The key numbers (b) marked with the highlighter (caderno). */
  numerosMarcados?: boolean
}

/**
 * Emblems drawn beside a spread title (tympan-print Emblema). `'modulor'` is
 * the deprecated name of `'figura-modular'`, still drawn the same; it will be
 * removed with the style aliases (see PRINT_STYLE_ALIASES).
 */
export type Emblema = 'pictogramas' | 'formas' | 'circulo-bicolor' | 'figura-modular' | 'casa' | 'lupa' | 'predios' | 'modulor'

/**
 * Shapes of the comparison chart. Lengths, heights and thicknesses always come from the data through one
 * linear scale per figure; the shape only decides how the two series are laid out.
 * - 'barras': horizontal bars from zero. 'colunas': vertical columns.
 * - 'eixo-central': the cut is the axis; the series below the cut grows to the left, the one above to the right.
 * - 'ziguezague': a bar longer than one line folds back and forth (graficos-1900); total length = value.
 * - 'fluxo': bands whose thickness is the value, splitting at the cut (fluxo-historico).
 * - 'predios': columns drawn as buildings (height = value; windows are texture only).
 * - 'cartoes': one card per row with the numbers written large and mini columns on a shared scale.
 */
export type FormaGrafico = 'barras' | 'colunas' | 'eixo-central' | 'ziguezague' | 'fluxo' | 'predios' | 'cartoes'

/** Page ornaments (optional, CONTRATO §1). */
export type Moldura =
  | 'nenhuma'
  | 'dupla' // double rule frame (fluxo-historico)
  | 'regua' // cartographic neatline with alternating segments (atlas)
  | 'azulejo' // column of modernist tiles (azulejo-modernista)
  | 'ondas' // wavy stripes (tropicalia)
  | 'ramos' // vine with leaves and a rounded frame (art nouveau)
  | 'recortes' // torn paper strips (papel-recortado)
  | 'reticula' // halftone dot columns (pop art)
  | 'memphis' // zigzags, triangles, circles and confetti
  | 'diagonais' // header wedges and a diagonal bar (constructivism)
  | 'formas' // triangle, square and circle (Bauhaus)
  | 'quartos' // quarter circles in the page corners (diagrama-modernista)

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
  /**
   * Brand marks in colour (default) or in their official one-ink version,
   * for styles whose technique is one or two inks (woodcut, risograph,
   * cyanotype). The lakebrasil mark is never recoloured; the Datatech mark
   * has approved variations (ink, duotone, per style), see LogoDatatech.
   */
  logo?: 'cor' | 'mono'
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
  logo?: 'cor' | 'mono'
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
  referencia: 'Painéis de pesquisa: cartões, estado de prova em pílula, gráfico sóbrio; inspirado em painéis da plataforma Fakhir',
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
  estrutura: { painel: 'nenhum', rotulo: 'letra', rotuloCaixa: 'alta', notas: 'dentro', figura: 'simples', minusculas: false },
}

const graficos1900: PrintStyle = {
  name: 'graficos-1900',
  label: 'Gráficos de exposição (1900)',
  referencia: 'Pranchas estatísticas de exposição universal: letreiro à mão, cores chapadas, papel pardo; inspirado em W. E. B. Du Bois (pranchas para a Exposição de Paris de 1900)',
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
    marcaTexto: '#dcc690',
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
  estrutura: { painel: 'caixa-grossa', rotulo: 'letra', rotuloCaixa: 'versalete', notas: 'dentro', figura: 'simples', minusculas: false, forma: 'ziguezague', tituloEstilo: 'centro' },
}

const cartaoPostal: PrintStyle = {
  name: 'cartao-postal',
  label: 'Cartão-postal desenhado à mão',
  referencia: 'Cartões-postais de dados desenhados à mão: um ponto por registro, legenda à mão; inspirado em Dear Data (Giorgia Lupi e Stefanie Posavec, 2016)',
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
  estrutura: { painel: 'caixa', rotulo: 'parenteses', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples', minusculas: false, forma: 'eixo-central' },
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
    marcaTexto: '#fff45c',
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
  estrutura: { painel: 'caixa', rotulo: 'parenteses', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples', minusculas: false, forma: 'colunas', chamadas: 'manuscritas', multiplos: 'lado-a-lado', tituloEstilo: 'sublinhado', numerosMarcados: true },
}

const isotype: PrintStyle = {
  name: 'isotype',
  label: 'Isotype',
  referencia: 'Estatística em pictogramas (Viena, 1925-1934): um ícone = uma quantidade fixa; inspirado em Otto e Marie Neurath e Gerd Arntz',
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
  estrutura: { painel: 'fio-grosso', rotulo: 'quadrado', rotuloCaixa: 'alta', notas: 'dentro', figura: 'simples', minusculas: false },
}

const cordel: PrintStyle = {
  name: 'cordel',
  label: 'Cordel',
  referencia: 'Xilogravura de cordel: papel pardo, goiva, letreiro em laje; inspirado em J. Borges e Gilvan Samico',
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
  estrutura: { painel: 'caixa-grossa', rotulo: 'quadrado', rotuloCaixa: 'versalete', notas: 'dentro', figura: 'simples', minusculas: false, emblema: 'casa' },
  logo: 'mono',
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
    contexto: '#9a8fc4',
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
  estrutura: { painel: 'caixa', rotulo: 'circulo', rotuloCaixa: 'alta', notas: 'dentro', figura: 'simples', minusculas: false, fundoPainel: 'pontilhado', veredito: 'bloco-cor' },
  logo: 'mono',
}

const jornal: PrintStyle = {
  name: 'jornal',
  label: 'Editorial de jornal',
  referencia: 'Gráficos editoriais de jornal: serifa no texto, grotesca nos números, um acento; inspirado em gráficos do NYT The Upshot (Amanda Cox, Kevin Quealy), do The Pudding e da Folha de S.Paulo',
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
  estrutura: { painel: 'fio', rotulo: 'letra', rotuloCaixa: 'alta', notas: 'dentro', figura: 'simples', minusculas: false },
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
    tinta: '#f6f4ea',
    tinta2: '#e2dfd3',
    tinta3: '#d9d6c8',
    linha: '#f6f4ea',
    destaque: '#f6f4ea',
    destaque2: '#ece9dc',
    marcaTexto: '#4d5d78',
    contexto: '#c9c5b5',
    prova: {
      sustentada: '#f6f4ea',
      refutada: '#f6f4ea',
      'nao-da-para-afirmar': '#f6f4ea',
      pendente: '#e2dfd3',
      'sem-dado': '#e2dfd3',
      'nao-testada': '#e2dfd3',
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
    marcaTexto: '#eeeeee',
    contexto: '#9a9a9a',
    prova: { sustentada: '#111111', refutada: '#111111', 'nao-da-para-afirmar': '#111111', pendente: '#333333', 'sem-dado': '#333333', 'nao-testada': '#333333' },
  },
  estrutura: { painel: 'prancha', rotulo: 'circulo', rotuloCaixa: 'alta', notas: 'dentro', figura: 'simples', minusculas: false },
  logo: 'mono',
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
    marcaTexto: '#e2dfd3',
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
  estrutura: { painel: 'caixa', rotulo: 'parenteses', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples', minusculas: false, forma: 'colunas', multiplos: 'lado-a-lado', tituloEstilo: 'italico' },
}

const minimoDeTinta: PrintStyle = {
  name: 'minimo-de-tinta',
  label: 'Mínimo de tinta',
  referencia: 'Pouca tinta, notas na margem, pequenos múltiplos, moldura de amplitude; inspirado em Edward Tufte (The Visual Display of Quantitative Information, Beautiful Evidence)',
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
  marcaProva: 'etiqueta',
  raio: 0,
  caixaAlta: false,
  pb: { destaque: '#111111' },
  estrutura: { painel: 'nenhum', rotulo: 'letra', rotuloCaixa: 'versalete', notas: 'margem', figura: 'amplitude', minusculas: false, forma: 'colunas', colunasFinas: true, linhaCorte: 'tracejada', tituloEstilo: 'italico' },
}

const suico: PrintStyle = {
  name: 'suico',
  label: 'Estilo Suíço',
  referencia: 'Estilo tipográfico internacional: grade rígida, grotesca, assimetria, um vermelho; inspirado em Josef Müller-Brockmann (Grid Systems, 1981)',
  fontes: {
    titulo: f('Archivo', SANS),
    corpo: f('Archivo', SANS),
    numero: f('Archivo', SANS),
    rotulo: f('Archivo', SANS),
    anotacao: f('Archivo', SANS),
    mono: f('IBM Plex Mono', MONO),
  },
  googleFonts: ['Archivo:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400', PLEX_MONO],
  cor: {
    papel: '#fbfbf9',
    tinta: '#0d0d0d',
    tinta2: '#2e2e2e',
    tinta3: '#595959',
    linha: '#0d0d0d',
    destaque: '#0d0d0d',
    destaque2: '#e0261b',
    marcaTexto: '#f9d7d2',
    contexto: '#b5b5b0',
    prova: {
      sustentada: '#0d0d0d',
      refutada: '#c8150b',
      'nao-da-para-afirmar': '#0d0d0d',
      pendente: '#595959',
      'sem-dado': '#595959',
      'nao-testada': '#595959',
    },
  },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.35, tremor: 0, hachura: 'nenhuma' },
  grafico: 'limpo',
  marcaProva: 'barra',
  raio: 0,
  caixaAlta: false,
  pb: { destaque2: '#8a8a8a' },
  estrutura: { painel: 'fio-grosso', rotulo: 'letra', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples', minusculas: false, tituloEstilo: 'coluna3' },
}

const concretismo: PrintStyle = {
  name: 'concretismo',
  label: 'Concretismo',
  referencia: 'Design concreto brasileiro (anos 1950-60): geometria, grotesca em caixa-baixa, preto, vermelho e ultramar; inspirado em Alexandre Wollner, Aloísio Magalhães e na ESDI',
  fontes: {
    titulo: f('Barlow', SANS),
    corpo: f('Barlow', SANS),
    numero: f('Barlow', SANS),
    rotulo: f('Barlow Condensed', SANS),
    anotacao: f('Barlow', SANS),
    mono: f('Barlow Condensed', SANS),
  },
  googleFonts: ['Barlow:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400', 'Barlow Condensed:wght@500;600'],
  cor: {
    papel: '#f3efe6',
    tinta: '#141414',
    tinta2: '#2b2b2b',
    tinta3: '#57534c',
    linha: '#141414',
    destaque: '#d7372a',
    destaque2: '#3d3fa0',
    marcaTexto: '#f3d3cc',
    contexto: '#c9c3b6',
    prova: {
      sustentada: '#141414',
      refutada: '#b82e22',
      'nao-da-para-afirmar': '#3d3fa0',
      pendente: '#57534c',
      'sem-dado': '#57534c',
      'nao-testada': '#57534c',
    },
  },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.7, tremor: 0, hachura: 'nenhuma' },
  grafico: 'limpo',
  marcaProva: 'etiqueta',
  raio: 0,
  caixaAlta: false,
  pb: { destaque: '#141414', destaque2: '#8a8a8a' },
  estrutura: { painel: 'fio-grosso', rotulo: 'quadrado', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples', minusculas: true, forma: 'eixo-central', emblema: 'circulo-bicolor', veredito: 'bloco-escuro', costura: 'barra' },
}

const semanario: PrintStyle = {
  name: 'semanario',
  label: 'Semanário de economia',
  referencia: 'Gráficos de revista semanal de economia: barra vermelha no topo, título curto, grotesca condensada, grade só horizontal; inspirado em gráficos da revista The Economist',
  fontes: {
    titulo: f('Source Serif 4', SERIF),
    corpo: f('Source Serif 4', SERIF),
    numero: f('Fira Sans Condensed', SANS),
    rotulo: f('Fira Sans Condensed', SANS),
    anotacao: f('Fira Sans Condensed', SANS),
    mono: f('Fira Sans Condensed', SANS),
  },
  googleFonts: [
    'Fira Sans Condensed:ital,wght@0,400;0,500;0,600;0,700;1,400',
    'Source Serif 4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400',
  ],
  cor: {
    papel: '#ffffff',
    tinta: '#121212',
    tinta2: '#333333',
    tinta3: '#595959',
    linha: '#b7c6cf',
    destaque: '#3a4aa0',
    destaque2: '#b0bee0',
    marcaTexto: '#fbdcd8',
    contexto: '#b7c6cf',
    prova: {
      sustentada: '#3a4aa0',
      refutada: '#d7110a',
      'nao-da-para-afirmar': '#3a4aa0',
      pendente: '#595959',
      'sem-dado': '#595959',
      'nao-testada': '#595959',
    },
  },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.3, tremor: 0, hachura: 'nenhuma' },
  grafico: 'limpo',
  marcaProva: 'barra',
  raio: 0,
  caixaAlta: false,
  pb: { destaque: '#121212', destaque2: '#9a9a9a' },
  estrutura: { painel: 'fio', rotulo: 'quadrado', rotuloCaixa: 'normal', notas: 'dentro', figura: 'barra-topo', minusculas: false, multiplos: 'lado-a-lado' },
}

const infograficoIlustrado: PrintStyle = {
  name: 'infografico-ilustrado',
  label: 'Infográfico ilustrado',
  referencia: 'Infografia explicativa: pictogramas, cantos redondos, balão de fala, cores amigáveis; inspirado em Nigel Holmes (Time, Wordless Diagrams)',
  fontes: {
    titulo: f('Rubik', SANS),
    corpo: f('Nunito Sans', SANS),
    numero: f('Rubik', SANS),
    rotulo: f('Rubik', SANS),
    anotacao: f('Nunito Sans', SANS),
    mono: f('Nunito Sans', SANS),
  },
  googleFonts: ['Rubik:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400', 'Nunito Sans:ital,opsz,wght@0,6..12,400;0,6..12,600;0,6..12,700;1,6..12,400'],
  cor: {
    papel: '#fbf6ea',
    tinta: '#22303c',
    tinta2: '#34424e',
    tinta3: '#56606a',
    linha: '#22303c',
    destaque: '#e0603f',
    destaque2: '#2b8a86',
    marcaTexto: '#f6e1ad',
    contexto: '#d9cfbb',
    prova: {
      sustentada: '#1f6f6b',
      refutada: '#b8401f',
      'nao-da-para-afirmar': '#22303c',
      pendente: '#56606a',
      'sem-dado': '#56606a',
      'nao-testada': '#56606a',
    },
  },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.5, tremor: 0, hachura: 'nenhuma' },
  grafico: 'isotype',
  marcaProva: 'pilula',
  raio: 2.4,
  caixaAlta: false,
  pb: { destaque: '#2a2a2a', destaque2: '#8a8a8a' },
  estrutura: { painel: 'cartao', rotulo: 'circulo', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples', minusculas: false, forma: 'predios', linhaCorte: 'tracejada', chamadas: 'baloes', multiplos: 'lado-a-lado', emblema: 'predios' },
}

const diagramaModernista: PrintStyle = {
  name: 'diagrama-modernista',
  label: 'Diagrama modernista',
  referencia: 'Atlas modernista: blocos de cor chapada, sans geométrica em caixa-baixa; inspirado em Herbert Bayer (World Geo-Graphic Atlas, 1953)',
  fontes: {
    titulo: f('League Spartan', SANS),
    corpo: f('Jost', SANS),
    numero: f('League Spartan', SANS),
    rotulo: f('League Spartan', SANS),
    anotacao: f('Jost', SANS),
    mono: f('Jost', SANS),
  },
  googleFonts: ['League Spartan:wght@400;500;600;700', 'Jost:ital,wght@0,400;0,500;0,600;1,400'],
  cor: {
    papel: '#f1ece0',
    tinta: '#1b1a17',
    tinta2: '#36342f',
    tinta3: '#5c574d',
    linha: '#1b1a17',
    destaque: '#c0512d',
    destaque2: '#5a5f93',
    marcaTexto: '#ecd8a8',
    contexto: '#cbc2ae',
    prova: {
      sustentada: '#56602a',
      refutada: '#a8401f',
      'nao-da-para-afirmar': '#1b1a17',
      pendente: '#5c574d',
      'sem-dado': '#5c574d',
      'nao-testada': '#5c574d',
    },
  },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.4, tremor: 0, hachura: 'nenhuma' },
  grafico: 'limpo',
  marcaProva: 'ponto',
  raio: 0,
  caixaAlta: false,
  pb: { destaque: '#2a2a2a', destaque2: '#8a8a8a' },
  estrutura: { painel: 'bloco', rotulo: 'circulo', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples', minusculas: true, forma: 'colunas', linhaCorte: 'cheia', marcador: 'circulo', multiplos: 'lado-a-lado', fundoPainel: 'alternado', moldura: 'quartos', manchete: 'texto' },
}

const papelSalmao: PrintStyle = {
  name: 'papel-salmao',
  label: 'Papel salmão',
  referencia: 'Gráficos de jornal financeiro em papel salmão: serifa editorial no título, grotesca nos rótulos, clarete e azul; inspirado em gráficos do Financial Times',
  fontes: {
    titulo: f('DM Serif Display', SERIF),
    corpo: f('Gelasio', SERIF),
    numero: f('Hanken Grotesk', SANS),
    rotulo: f('Hanken Grotesk', SANS),
    anotacao: f('Hanken Grotesk', SANS),
    mono: f('Hanken Grotesk', SANS),
  },
  googleFonts: ['DM Serif Display:ital@0;1', 'Gelasio:ital,wght@0,400;0,500;0,600;1,400', 'Hanken Grotesk:ital,wght@0,400;0,500;0,600;0,700;1,400'],
  cor: {
    papel: '#fff1e5',
    tinta: '#33302e',
    tinta2: '#4a4543',
    tinta3: '#625c58',
    linha: '#e3d2c3',
    destaque: '#3a4aa0',
    destaque2: '#b0bee0',
    marcaTexto: '#f2dfce',
    contexto: '#c9bcb0',
    prova: {
      sustentada: '#3a4aa0',
      refutada: '#990f3d',
      'nao-da-para-afirmar': '#33302e',
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
  pb: { papel: '#ffffff', destaque: '#1a1a1a', destaque2: '#a0a0a0' },
  estrutura: { painel: 'fio', rotulo: 'letra', rotuloCaixa: 'alta', notas: 'dentro', figura: 'simples', minusculas: false, forma: 'colunas', chamadas: 'guia', multiplos: 'lado-a-lado' },
}


// ---------------------------------------------------------------------------
// Studies 17–41 (diagramacao/estilos/estilo-17 … estilo-41; the archived ones excluded)
// ---------------------------------------------------------------------------

const cinzas = (a: string, b = a) => ({ pendente: a, 'sem-dado': b, 'nao-testada': b })

const dadosBr: PrintStyle = {
  name: 'dados-br',
  label: 'Dados à brasileira',
  referencia: 'Jornalismo de dados brasileiro: grotesca pesada, serifa no texto, vermelho só no lado que importa; inspirado em Núcleo, Folha, Estadão e Agência Pública',
  fontes: { titulo: f('Libre Franklin', SANS), corpo: f('Source Serif 4', SERIF), numero: f('Libre Franklin', SANS), rotulo: f('Libre Franklin', SANS), anotacao: f('Source Serif 4', SERIF), mono: f('IBM Plex Mono', MONO) },
  googleFonts: ['Libre Franklin:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400', 'Source Serif 4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400', PLEX_MONO],
  cor: { papel: '#fbfaf6', tinta: '#1f1e1c', tinta2: '#3d3a36', tinta3: '#625d56', linha: '#dcd8cf', destaque: '#c4553a', destaque2: '#b5afa4', marcaTexto: '#f3efe6', contexto: '#b5afa4', prova: { sustentada: '#1f1e1c', refutada: '#b24a31', 'nao-da-para-afirmar': '#1f1e1c', ...cinzas('#625d56') } },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.3, tremor: 0, hachura: 'nenhuma' },
  grafico: 'limpo',
  marcaProva: 'barra',
  raio: 0.8,
  caixaAlta: false,
  pb: { destaque: '#1f1e1c' },
  estrutura: { painel: 'fio', rotulo: 'letra', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples', minusculas: false, notasFigura: 'coluna', manchete: 'texto' },
}

const fluxoHistorico: PrintStyle = {
  name: 'fluxo-historico',
  label: 'Fluxo histórico (séc. XIX)',
  referencia: 'Cartas figurativas do século XIX: papel envelhecido, tinta sépia, filete duplo, versaletes; inspirado em Charles Joseph Minard e Florence Nightingale',
  fontes: { titulo: f('IM Fell English', SERIF), corpo: f('Old Standard TT', SERIF), numero: f('Old Standard TT', SERIF), rotulo: f('IM Fell English SC', SERIF), anotacao: f('IM Fell English', SERIF), mono: f('Old Standard TT', SERIF) },
  googleFonts: ['IM Fell English:ital@0;1', 'IM Fell English SC', 'Old Standard TT:ital,wght@0,400;0,700;1,400'],
  cor: { papel: '#efe3c6', tinta: '#3b2a1a', tinta2: '#4f3d2a', tinta3: '#5e4a36', linha: '#b89d78', destaque: '#caa472', destaque2: '#3b2a1a', marcaTexto: '#e6d5ae', contexto: '#b89d78', prova: { sustentada: '#3b2a1a', refutada: '#8f4431', 'nao-da-para-afirmar': '#3b2a1a', ...cinzas('#5e4a36') } },
  papel: { textura: 'fibra', intensidade: 0.35 },
  traco: { largura: 0.25, tremor: 0, hachura: 'pontilhada' },
  grafico: 'limpo',
  marcaProva: 'etiqueta',
  raio: 0,
  caixaAlta: false,
  pb: { destaque: '#8a8a8a' },
  estrutura: { painel: 'fio', rotulo: 'letra', rotuloCaixa: 'versalete', notas: 'dentro', figura: 'simples', minusculas: false, moldura: 'dupla', forma: 'fluxo', tituloEstilo: 'centro-italico' },
}

const blocosColoridos: PrintStyle = {
  name: 'blocos-coloridos',
  label: 'Blocos coloridos',
  referencia: 'Infografia em cartões de cores claras: colunas, números grandes, grotesca geométrica; inspirado em David McCandless (Information is Beautiful)',
  fontes: { titulo: f('Montserrat', SANS), corpo: f('Lato', SANS), numero: f('Montserrat', SANS), rotulo: f('Montserrat', SANS), anotacao: f('Lato', SANS), mono: f('Lato', SANS) },
  googleFonts: ['Montserrat:ital,wght@0,500;0,600;0,700;0,800;0,900;1,500', 'Lato:ital,wght@0,400;0,700;1,400'],
  cor: { papel: '#ffffff', tinta: '#2b2b2b', tinta2: '#444444', tinta3: '#6b6b76', linha: '#e4e4ea', destaque: '#f0506e', destaque2: '#7b5ea7', marcaTexto: '#ffe9cf', contexto: '#d3d3cf', prova: { sustentada: '#2b2b2b', refutada: '#c93a58', 'nao-da-para-afirmar': '#b8561a', ...cinzas('#6b6b76') } },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.3, tremor: 0, hachura: 'nenhuma' },
  grafico: 'limpo',
  marcaProva: 'barra',
  raio: 1.6,
  caixaAlta: false,
  pb: { destaque: '#2b2b2b', destaque2: '#9a9a9a' },
  estrutura: { painel: 'cartao', rotulo: 'quadrado', rotuloCaixa: 'alta', notas: 'dentro', figura: 'simples', minusculas: false, barras: 'vertical', corRotulo: 'tinta', forma: 'cartoes', multiplos: 'lado-a-lado', veredito: 'bloco-escuro', fundoPainel: 'alternado', manchete: 'texto' },
}

const construtivismo: PrintStyle = {
  name: 'construtivismo',
  label: 'Construtivismo russo',
  referencia: 'Construtivismo soviético: vermelho e preto, diagonais, grotesca condensada em caixa-alta; inspirado em El Lissitzky, Rodchenko e os irmãos Stenberg',
  fontes: { titulo: f('Oswald', SANS), corpo: f('PT Sans', SANS), numero: f('Oswald', SANS), rotulo: f('Oswald', SANS), anotacao: f('PT Sans Narrow', SANS), mono: f('PT Sans Narrow', SANS) },
  googleFonts: ['Oswald:wght@400;500;600;700', 'PT Sans:ital,wght@0,400;0,700;1,400', 'PT Sans Narrow:wght@400;700'],
  cor: { papel: '#efe6d2', tinta: '#1a1714', tinta2: '#2e2a25', tinta3: '#5e564c', linha: '#1a1714', destaque: '#c8201e', destaque2: '#1a1714', marcaTexto: '#e3d6bb', contexto: '#b9ad97', prova: { sustentada: '#1a1714', refutada: '#b01c1a', 'nao-da-para-afirmar': '#1a1714', ...cinzas('#5e564c') }, ornamento: ['#c8201e', '#1a1714'] },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.4, tremor: 0, hachura: 'nenhuma' },
  grafico: 'limpo',
  marcaProva: 'barra',
  raio: 0,
  caixaAlta: true,
  pb: { destaque: '#6a6a6a' },
  estrutura: { painel: 'fio-grosso', rotulo: 'quadrado', rotuloCaixa: 'alta', notas: 'dentro', figura: 'simples', minusculas: false, moldura: 'diagonais', corRotulo: 'refutada', tituloEstilo: 'pesado', costura: 'bloco-escuro', manchete: 'diagonal' },
}

const bauhaus: PrintStyle = {
  name: 'bauhaus',
  label: 'Bauhaus',
  referencia: 'Escola Bauhaus (1923–1930): triângulo, quadrado e círculo nas três primárias, sans geométrica em caixa-baixa; inspirado em Herbert Bayer e Joost Schmidt',
  fontes: { titulo: f('Jost', SANS), corpo: f('Jost', SANS), numero: f('Jost', SANS), rotulo: f('Jost', SANS), anotacao: f('Jost', SANS), mono: f('Jost', SANS) },
  googleFonts: ['Jost:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400'],
  cor: { papel: '#f6f2e9', tinta: '#141414', tinta2: '#2e2d2b', tinta3: '#5d5a55', linha: '#141414', destaque: '#d4372c', destaque2: '#3a3f9e', marcaTexto: '#ece21c', contexto: '#cfc9bd', prova: { sustentada: '#141414', refutada: '#b52d24', 'nao-da-para-afirmar': '#141414', ...cinzas('#5d5a55') }, ornamento: ['#ece21c', '#d4372c', '#3a3f9e'] },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.4, tremor: 0, hachura: 'nenhuma' },
  grafico: 'limpo',
  marcaProva: 'formas',
  raio: 0,
  caixaAlta: false,
  pb: { destaque: '#5a5a5a', destaque2: '#a0a0a0', marcaTexto: '#e0e0e0' },
  estrutura: { painel: 'fio-grosso', rotulo: 'circulo', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples', minusculas: true, barras: 'vertical', moldura: 'formas', corRotulo: 'marcaTexto', multiplos: 'lado-a-lado', costura: 'faixa', manchete: 'texto' },
}

const brutalista: PrintStyle = {
  name: 'brutalista',
  label: 'Brutalista (dossiê)',
  referencia: 'Design brutalista de dossiê e formulário: mono em caixa-alta, campos numerados, faixas pretas, hachura, carimbo',
  fontes: { titulo: f('Space Mono', MONO), corpo: f('IBM Plex Mono', MONO), numero: f('Space Mono', MONO), rotulo: f('Space Mono', MONO), anotacao: f('IBM Plex Mono', MONO), mono: f('IBM Plex Mono', MONO) },
  googleFonts: ['Space Mono:ital,wght@0,400;0,700;1,400', 'IBM Plex Mono:ital,wght@0,400;0,500;0,600;0,700;1,400'],
  cor: { papel: '#ebeae5', tinta: '#0d0d0d', tinta2: '#2e2e2c', tinta3: '#4d4d4a', linha: '#0d0d0d', destaque: '#0d0d0d', destaque2: '#0d0d0d', marcaTexto: '#d6d5cf', contexto: '#9a9994', prova: { sustentada: '#0d0d0d', refutada: '#0d0d0d', 'nao-da-para-afirmar': '#0d0d0d', ...cinzas('#2e2e2c', '#4d4d4a') } },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.35, tremor: 0, hachura: 'simples' },
  grafico: 'limpo',
  marcaProva: 'carimbo',
  raio: 0,
  caixaAlta: true,
  pb: {},
  estrutura: { painel: 'dossie', rotulo: 'letra', rotuloCaixa: 'alta', notas: 'dentro', figura: 'simples', minusculas: false },
}

const divulgacao: PrintStyle = {
  name: 'divulgacao',
  label: 'Revista de divulgação',
  referencia: 'Revistas de divulgação científica para jovens: cores vivas, cartões arredondados, balões, títulos pesados; inspirado em Ciência Hoje das Crianças e Superinteressante',
  fontes: { titulo: f('Archivo Black', SANS), corpo: f('Nunito', SANS), numero: f('Archivo Black', SANS), rotulo: f('Nunito', SANS), anotacao: f('Nunito', SANS), mono: f('Nunito', SANS) },
  googleFonts: ['Archivo Black', 'Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400'],
  cor: { papel: '#fffdf7', tinta: '#1b1446', tinta2: '#2a1d5c', tinta3: '#5f5a7a', linha: '#6a2c91', destaque: '#f58220', destaque2: '#6a2c91', marcaTexto: '#fff4c2', contexto: '#dcd3c4', prova: { sustentada: '#3d6b1f', refutada: '#c4006a', 'nao-da-para-afirmar': '#b35a00', ...cinzas('#5f5a7a') }, ornamento: ['#e6007e', '#f58220', '#8cc63f', '#6a2c91'] },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.35, tremor: 0, hachura: 'nenhuma' },
  grafico: 'limpo',
  marcaProva: 'pilula',
  raio: 3,
  caixaAlta: false,
  pb: { destaque: '#8a8a8a', destaque2: '#2a2a2a' },
  estrutura: { painel: 'cartao', rotulo: 'circulo', rotuloCaixa: 'alta', notas: 'dentro', figura: 'simples', minusculas: false, barras: 'vertical', corRotulo: 'destaque', contornoBarra: true, tituloEstilo: 'normal', forma: 'colunas', chamadas: 'baloes', multiplos: 'lado-a-lado', emblema: 'lupa', fundoPainel: 'alternado', costura: 'selo', manchete: 'lupa' },
}

const proporcaoModular: PrintStyle = {
  name: 'proporcao-modular',
  label: 'Proporção modular',
  referencia: 'Proporções modulares e policromia arquitetônica: letras em estêncil, siena e verde, paredes de cor chapada; inspirado em Le Corbusier (policromia de 1931 e 1959)',
  fontes: { titulo: f('Stardos Stencil', SERIF), corpo: f('Work Sans', SANS), numero: f('Work Sans', SANS), rotulo: f('Work Sans', SANS), anotacao: f('Work Sans', SANS), mono: f('Allerta Stencil', SANS) },
  googleFonts: ['Stardos Stencil:wght@400;700', 'Work Sans:ital,wght@0,400;0,500;0,600;1,400', 'Allerta Stencil'],
  cor: { papel: '#f7f2e8', tinta: '#26221d', tinta2: '#3c3630', tinta3: '#6a6259', linha: '#26221d', destaque: '#9a4b33', destaque2: '#2f5f45', marcaTexto: '#e9dcc3', contexto: '#d6cbb8', prova: { sustentada: '#2a5a40', refutada: '#9a4b33', 'nao-da-para-afirmar': '#26221d', ...cinzas('#6a6259') } },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.3, tremor: 0, hachura: 'nenhuma' },
  grafico: 'limpo',
  marcaProva: 'etiqueta',
  raio: 0,
  caixaAlta: true,
  pb: { destaque: '#5a5a5a', destaque2: '#a0a0a0' },
  estrutura: { painel: 'bloco', rotulo: 'quadrado', rotuloCaixa: 'alta', notas: 'dentro', figura: 'simples', minusculas: false, barras: 'vertical', corRotulo: 'tinta', multiplos: 'lado-a-lado', emblema: 'figura-modular', fundoPainel: 'alternado', costura: 'barra', manchete: 'texto' },
}

const sinalizacao: PrintStyle = {
  name: 'sinalizacao',
  label: 'Sinalização de aeroporto',
  referencia: 'Sinalização de aeroporto: faixas amarelas, setas, preto, grotesca legível à distância; inspirado em Benno Wissing e Total Design (aeroporto de Schiphol, 1967)',
  fontes: { titulo: f('Hind', SANS), corpo: f('Hind', SANS), numero: f('Hind', SANS), rotulo: f('Hind', SANS), anotacao: f('Hind', SANS), mono: f('Hind', SANS) },
  googleFonts: ['Hind:wght@400;500;600;700'],
  cor: { papel: '#fbfbf8', tinta: '#121212', tinta2: '#2b2b2b', tinta3: '#555553', linha: '#121212', destaque: '#121212', destaque2: '#9d9d9d', marcaTexto: '#fff200', contexto: '#9d9d9d', prova: { sustentada: '#121212', refutada: '#121212', 'nao-da-para-afirmar': '#121212', ...cinzas('#555553') } },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.35, tremor: 0, hachura: 'nenhuma' },
  grafico: 'limpo',
  marcaProva: 'pilula',
  raio: 0,
  caixaAlta: false,
  pb: { marcaTexto: '#d9d9d9' },
  estrutura: { painel: 'placa', rotulo: 'quadrado', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples', minusculas: false, cabeco: 'etiqueta', corRotulo: 'tinta', veredito: 'bloco-escuro', rastro: 'placa', manchete: 'faixa' },
}

const pictogramas: PrintStyle = {
  name: 'pictogramas',
  label: 'Pictogramas esportivos',
  referencia: 'Identidade de grande evento esportivo: pictogramas em grade, azul-claro, verde e laranja, sans de corpo leve; inspirado em Otl Aicher (Munique, 1972)',
  fontes: { titulo: f('Albert Sans', SANS), corpo: f('Albert Sans', SANS), numero: f('Albert Sans', SANS), rotulo: f('Albert Sans', SANS), anotacao: f('Albert Sans', SANS), mono: f('Albert Sans', SANS) },
  googleFonts: ['Albert Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400'],
  cor: { papel: '#ffffff', tinta: '#1f2a33', tinta2: '#34414b', tinta3: '#5f6b73', linha: '#1f2a33', destaque: '#f28c28', destaque2: '#6b8e3a', marcaTexto: '#d4e6e8', contexto: '#b9bcc0', prova: { sustentada: '#2f5f45', refutada: '#b35a0c', 'nao-da-para-afirmar': '#1f2a33', ...cinzas('#5f6b73') } },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.3, tremor: 0, hachura: 'nenhuma' },
  grafico: 'limpo',
  marcaProva: 'etiqueta',
  raio: 0,
  caixaAlta: false,
  pb: { destaque: '#8a8a8a', destaque2: '#3a3a3a', marcaTexto: '#d9d9d9' },
  estrutura: { painel: 'bloco', rotulo: 'quadrado', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples', minusculas: false, barras: 'vertical', corRotulo: 'sustentada', multiplos: 'lado-a-lado', emblema: 'pictogramas', fundoPainel: 'claro', manchete: 'faixa' },
}

const mapaDeMetro: PrintStyle = {
  name: 'mapa-de-metro',
  label: 'Mapa de metrô',
  referencia: 'Manual e mapa de metrô: faixa preta no topo, círculos coloridos, grotesca neutra; inspirado em Massimo Vignelli (metrô de Nova York, Unimark, 1970–1972)',
  fontes: { titulo: f('Inter', SANS), corpo: f('Inter', SANS), numero: f('Inter', SANS), rotulo: f('Inter', SANS), anotacao: f('Inter', SANS), mono: f('Inter', SANS) },
  googleFonts: ['Inter:wght@400;500;600;700'],
  cor: { papel: '#ffffff', tinta: '#111111', tinta2: '#2e2e2e', tinta3: '#595959', linha: '#111111', destaque: '#ee352e', destaque2: '#a7a9ac', marcaTexto: '#ebebe6', contexto: '#a7a9ac', prova: { sustentada: '#111111', refutada: '#d6261f', 'nao-da-para-afirmar': '#111111', ...cinzas('#595959') }, ornamento: ['#ee352e', '#ff6319', '#b933ad', '#996633'] },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.3, tremor: 0, hachura: 'nenhuma' },
  grafico: 'limpo',
  marcaProva: 'ponto',
  raio: 0,
  caixaAlta: false,
  pb: { destaque: '#4a4a4a' },
  estrutura: { painel: 'fio', rotulo: 'circulo', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples', minusculas: false, barras: 'vertical', cabeco: 'faixa', corRotulo: 'tinta', veredito: 'bloco-escuro', rastro: 'metro', manchete: 'texto' },
}

const jornal1959: PrintStyle = {
  name: 'jornal-1959',
  label: 'Jornal modernista (1959)',
  referencia: 'Reforma gráfica de jornal modernista: branco, preto e cinza, filetes, Bodoni no título, grade limpa; inspirado em Amilcar de Castro (reforma do Jornal do Brasil, 1956–1959)',
  fontes: { titulo: f('Libre Bodoni', SERIF), corpo: f('PT Serif', SERIF), numero: f('Libre Bodoni', SERIF), rotulo: f('Libre Franklin', SANS), anotacao: f('PT Serif', SERIF), mono: f('Libre Franklin', SANS) },
  googleFonts: ['Libre Bodoni:wght@400;700', 'PT Serif:ital,wght@0,400;0,700;1,400', 'Libre Franklin:wght@400;500;600;700'],
  cor: { papel: '#fdfdfb', tinta: '#111111', tinta2: '#2b2b2b', tinta3: '#595959', linha: '#111111', destaque: '#111111', destaque2: '#a3a3a3', marcaTexto: '#ececea', contexto: '#a3a3a3', prova: { sustentada: '#111111', refutada: '#111111', 'nao-da-para-afirmar': '#111111', ...cinzas('#595959') } },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.25, tremor: 0, hachura: 'nenhuma' },
  grafico: 'limpo',
  marcaProva: 'barra',
  raio: 0,
  caixaAlta: false,
  pb: {},
  estrutura: { painel: 'fio', rotulo: 'letra', rotuloCaixa: 'alta', notas: 'dentro', figura: 'simples', minusculas: false },
}

const azulejoModernista: PrintStyle = {
  name: 'azulejo-modernista',
  label: 'Azulejo modernista',
  referencia: 'Painéis de azulejo modernista: módulo azul e branco com semicírculos e quadrados, acento amarelo, geometria; inspirado em Athos Bulcão (Brasília)',
  fontes: { titulo: f('Jost', SANS), corpo: f('Jost', SANS), numero: f('Jost', SANS), rotulo: f('Jost', SANS), anotacao: f('Jost', SANS), mono: f('Jost', SANS) },
  googleFonts: ['Jost:ital,wght@0,400;0,500;0,600;0,700;1,400'],
  cor: { papel: '#fbfaf5', tinta: '#15171c', tinta2: '#2b2e35', tinta3: '#5f636b', linha: '#3040b0', destaque: '#3040b0', destaque2: '#aab3de', marcaTexto: '#f0efe8', contexto: '#aab3de', prova: { sustentada: '#15171c', refutada: '#3040b0', 'nao-da-para-afirmar': '#15171c', ...cinzas('#5f636b') }, ornamento: ['#3040b0', '#fbfaf5', '#f0b323'] },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.3, tremor: 0, hachura: 'nenhuma' },
  grafico: 'limpo',
  marcaProva: 'barra',
  raio: 0,
  caixaAlta: false,
  pb: { destaque: '#3a3a3a', destaque2: '#b0b0b0' },
  estrutura: { painel: 'fio', rotulo: 'quadrado', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples', minusculas: false, moldura: 'azulejo', corRotulo: 'destaque' },
}

const tropicalia: PrintStyle = {
  name: 'tropicalia',
  label: 'Tropicália',
  referencia: 'Capas e cartazes tropicalistas (1967–1969): ondas de cor, letreiro exuberante, laranja, roxo e magenta; inspirado em Rogério Duarte',
  fontes: { titulo: f('Shrikhand', SERIF), corpo: f('Work Sans', SANS), numero: f('Work Sans', SANS), rotulo: f('Work Sans', SANS), anotacao: f('Work Sans', SANS), mono: f('Work Sans', SANS) },
  googleFonts: ['Shrikhand', 'Work Sans:ital,wght@0,400;0,500;0,600;0,700;1,400'],
  cor: { papel: '#fff6e3', tinta: '#1e1a24', tinta2: '#332c3b', tinta3: '#61586a', linha: '#5b2a86', destaque: '#5b2a86', destaque2: '#ee8a1c', marcaTexto: '#fde7c2', contexto: '#ead9bf', prova: { sustentada: '#5b2a86', refutada: '#c21f6e', 'nao-da-para-afirmar': '#1e1a24', ...cinzas('#61586a') }, ornamento: ['#e8601c', '#d6247a', '#5b2a86', '#1f8a5b'] },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.3, tremor: 0, hachura: 'nenhuma' },
  grafico: 'limpo',
  marcaProva: 'barra',
  raio: 0,
  caixaAlta: false,
  pb: { destaque: '#2a2a2a', destaque2: '#a0a0a0' },
  estrutura: { painel: 'fio', rotulo: 'letra', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples', minusculas: false, moldura: 'ondas', tituloEstilo: 'arcoiris' },
}

const atlasOficial: PrintStyle = {
  name: 'atlas-oficial',
  label: 'Atlas oficial (cartografia)',
  referencia: 'Atlas oficiais: moldura cartográfica com régua alternada, hachura, terra e oliva, legenda de convenções; inspirado em atlas oficiais brasileiros (IBGE, Atlas Nacional)',
  fontes: { titulo: f('IBM Plex Sans Condensed', SANS), corpo: f('IBM Plex Serif', SERIF), numero: f('IBM Plex Sans Condensed', SANS), rotulo: f('IBM Plex Sans Condensed', SANS), anotacao: f('IBM Plex Serif', SERIF), mono: f('IBM Plex Sans Condensed', SANS) },
  googleFonts: ['IBM Plex Sans Condensed:wght@400;500;600;700', 'IBM Plex Serif:ital,wght@0,400;0,600;1,400'],
  cor: { papel: '#fbf8ef', tinta: '#23231d', tinta2: '#3a3a31', tinta3: '#666355', linha: '#23231d', destaque: '#8c5a2b', destaque2: '#5c6b2f', marcaTexto: '#eee8d3', contexto: '#d9d3bd', prova: { sustentada: '#23231d', refutada: '#8c5a2b', 'nao-da-para-afirmar': '#23231d', ...cinzas('#666355') }, ornamento: ['#23231d', '#fbf8ef'] },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.3, tremor: 0, hachura: 'simples' },
  grafico: 'limpo',
  marcaProva: 'barra',
  raio: 0,
  caixaAlta: true,
  pb: { destaque: '#4a4a4a', destaque2: '#7a7a7a' },
  estrutura: { painel: 'fio', rotulo: 'letra', rotuloCaixa: 'alta', notas: 'dentro', figura: 'simples', minusculas: false, moldura: 'regua' },
}

const gradeHolandesa: PrintStyle = {
  name: 'grade-holandesa',
  label: 'Grade holandesa',
  referencia: 'Grade aparente, letreiro modular espaçado, preto e um laranja; inspirado em Wim Crouwel (Stedelijk Museum, New Alphabet, 1967)',
  fontes: { titulo: f('Major Mono Display', MONO), corpo: f('Hanken Grotesk', SANS), numero: f('Hanken Grotesk', SANS), rotulo: f('Hanken Grotesk', SANS), anotacao: f('Hanken Grotesk', SANS), mono: f('Hanken Grotesk', SANS) },
  googleFonts: ['Major Mono Display', 'Hanken Grotesk:wght@400;500;600;700;800'],
  cor: { papel: '#ffffff', tinta: '#111111', tinta2: '#2e2e2e', tinta3: '#595959', linha: '#111111', destaque: '#111111', destaque2: '#f04e23', marcaTexto: '#fde3da', contexto: '#dddddd', prova: { sustentada: '#111111', refutada: '#c8391a', 'nao-da-para-afirmar': '#111111', ...cinzas('#595959') } },
  papel: { textura: 'milimetrado', intensidade: 0.5 },
  traco: { largura: 0.3, tremor: 0, hachura: 'nenhuma' },
  grafico: 'limpo',
  marcaProva: 'barra',
  raio: 0,
  caixaAlta: true,
  pb: { destaque2: '#9a9a9a' },
  estrutura: { painel: 'fio-grosso', rotulo: 'quadrado', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples', minusculas: true, corRotulo: 'destaque2' },
}

const papelRecortado: PrintStyle = {
  name: 'papel-recortado',
  label: 'Papel recortado',
  referencia: 'Cartazes e aberturas de filme em papel recortado: preto e laranja, letreiro à mão em blocos; inspirado em Saul Bass (Anatomy of a Murder, Vertigo)',
  fontes: { titulo: f('Londrina Solid', SANS), corpo: f('Work Sans', SANS), numero: f('Londrina Solid', SANS), rotulo: f('Work Sans', SANS), anotacao: f('Work Sans', SANS), mono: f('Work Sans', SANS) },
  googleFonts: ['Londrina Solid:wght@400;900', 'Work Sans:ital,wght@0,400;0,500;0,600;0,700;1,400'],
  cor: { papel: '#f3ead8', tinta: '#161616', tinta2: '#2c2a26', tinta3: '#5e574c', linha: '#161616', destaque: '#161616', destaque2: '#e8591a', marcaTexto: '#ecd9b9', contexto: '#d8cbb0', prova: { sustentada: '#161616', refutada: '#b3431a', 'nao-da-para-afirmar': '#161616', ...cinzas('#5e574c') }, ornamento: ['#161616', '#e8591a'] },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.35, tremor: 0, hachura: 'nenhuma' },
  grafico: 'limpo',
  marcaProva: 'barra',
  raio: 0,
  caixaAlta: false,
  pb: { destaque2: '#8a8a8a' },
  estrutura: { painel: 'fio-grosso', rotulo: 'letra', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples', minusculas: false, moldura: 'recortes', tituloEstilo: 'recorte' },
}

const popArt: PrintStyle = {
  name: 'pop-art',
  label: 'Pop art',
  referencia: 'Pop art: pontos Ben-Day, contorno preto grosso, primárias, balão e letreiro de quadrinhos; inspirado em Roy Lichtenstein',
  fontes: { titulo: f('Bangers', SANS), corpo: f('Nunito Sans', SANS), numero: f('Bangers', SANS), rotulo: f('Nunito Sans', SANS), anotacao: f('Comic Neue', HAND), mono: f('Nunito Sans', SANS) },
  googleFonts: ['Bangers', 'Nunito Sans:wght@400;600;700;800', 'Comic Neue:wght@400;700'],
  cor: { papel: '#fffdf5', tinta: '#111111', tinta2: '#2b2b2b', tinta3: '#555555', linha: '#111111', destaque: '#2b44b8', destaque2: '#e4252b', marcaTexto: '#f6ea00', contexto: '#d9d4c4', prova: { sustentada: '#111111', refutada: '#c81e24', 'nao-da-para-afirmar': '#111111', ...cinzas('#555555') }, ornamento: ['#e4252b', '#f6ea00', '#2b44b8'] },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.45, tremor: 0, hachura: 'pontilhada' },
  grafico: 'limpo',
  marcaProva: 'barra',
  raio: 0,
  caixaAlta: true,
  pb: { destaque: '#2a2a2a', destaque2: '#8a8a8a', marcaTexto: '#d9d9d9' },
  estrutura: { painel: 'fio-grosso', rotulo: 'letra', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples', minusculas: false, moldura: 'reticula', tituloEstilo: 'faixa', contornoBarra: true },
}

const cientifico: PrintStyle = {
  name: 'cientifico',
  label: 'Figura de periódico científico',
  referencia: 'Figuras de periódicos científicos: painéis A e B, eixos com rótulo, paleta segura para daltônicos, legenda longa; inspirado em figuras da Nature, da Science e da PNAS',
  fontes: { titulo: f('STIX Two Text', SERIF), corpo: f('STIX Two Text', SERIF), numero: f('Arimo', SANS), rotulo: f('Arimo', SANS), anotacao: f('Arimo', SANS), mono: f('Arimo', SANS) },
  googleFonts: ['STIX Two Text:ital,wght@0,400;0,600;0,700;1,400', 'Arimo:wght@400;700'],
  cor: { papel: '#ffffff', tinta: '#111111', tinta2: '#2e2e2e', tinta3: '#555555', linha: '#111111', destaque: '#3b4aa8', destaque2: '#d97a00', marcaTexto: '#f2f2f2', contexto: '#bdbdbd', prova: { sustentada: '#111111', refutada: '#111111', 'nao-da-para-afirmar': '#111111', ...cinzas('#555555') } },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.25, tremor: 0, hachura: 'nenhuma' },
  grafico: 'limpo',
  marcaProva: 'barra',
  raio: 0,
  caixaAlta: false,
  pb: { destaque: '#2a2a2a', destaque2: '#9a9a9a' },
  estrutura: { painel: 'fio', rotulo: 'letra', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples', minusculas: false, barras: 'vertical', forma: 'colunas', letraMultiplo: true, multiplos: 'lado-a-lado' },
}

const artNouveau: PrintStyle = {
  name: 'art-nouveau',
  label: 'Art nouveau',
  referencia: 'Art nouveau: moldura arredondada, ramos e folhas, ocre e verde-oliva, letreiro decorativo; inspirado em Alphonse Mucha',
  fontes: { titulo: f('Federo', SERIF), corpo: f('EB Garamond', SERIF), numero: f('EB Garamond', SERIF), rotulo: f('Federo', SERIF), anotacao: f('EB Garamond', SERIF), mono: f('EB Garamond', SERIF) },
  googleFonts: ['Federo', 'EB Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500'],
  cor: { papel: '#f6eedb', tinta: '#2a2718', tinta2: '#3f3a26', tinta3: '#625a44', linha: '#8a6d2c', destaque: '#4a5a2a', destaque2: '#b9832a', marcaTexto: '#efe2c2', contexto: '#e0d2ae', prova: { sustentada: '#4a5a2a', refutada: '#9a4a36', 'nao-da-para-afirmar': '#2a2718', ...cinzas('#625a44') }, ornamento: ['#4a5a2a', '#b9832a', '#8a6d2c'] },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.3, tremor: 0, hachura: 'nenhuma' },
  grafico: 'limpo',
  marcaProva: 'pilula',
  raio: 2,
  caixaAlta: false,
  pb: { destaque: '#3a3a3a', destaque2: '#a0a0a0' },
  estrutura: { painel: 'fio', rotulo: 'letra', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples', minusculas: false, moldura: 'ramos' },
}

const memphis: PrintStyle = {
  name: 'memphis',
  label: 'Memphis',
  referencia: 'Design pós-moderno de Milão (1981): zigue-zagues, triângulos, confete, turquesa, amarelo e rosa, contorno preto; inspirado em Ettore Sottsass e no grupo Memphis',
  fontes: { titulo: f('Bungee', SANS), corpo: f('Rubik', SANS), numero: f('Bungee', SANS), rotulo: f('Rubik', SANS), anotacao: f('Rubik', SANS), mono: f('Rubik', SANS) },
  googleFonts: ['Bungee', 'Rubik:ital,wght@0,400;0,500;0,700;1,400'],
  cor: { papel: '#fffaf0', tinta: '#161616', tinta2: '#2c2b29', tinta3: '#5c5a57', linha: '#161616', destaque: '#1fb5a8', destaque2: '#f6ea00', marcaTexto: '#fff2b8', contexto: '#e2dccb', prova: { sustentada: '#161616', refutada: '#c2185b', 'nao-da-para-afirmar': '#161616', ...cinzas('#5c5a57') }, ornamento: ['#161616', '#f6ea00', '#ff5fa2', '#1fb5a8'] },
  papel: { textura: 'nenhuma', intensidade: 0 },
  traco: { largura: 0.3, tremor: 0, hachura: 'nenhuma' },
  grafico: 'limpo',
  marcaProva: 'barra',
  raio: 0,
  caixaAlta: true,
  pb: { destaque: '#5a5a5a', destaque2: '#d0d0d0' },
  estrutura: { painel: 'caixa', rotulo: 'circulo', rotuloCaixa: 'normal', notas: 'dentro', figura: 'simples', minusculas: false, moldura: 'memphis', tituloEstilo: 'sombra', contornoBarra: true, corRotulo: 'destaque2' },
}

/** The 39 book styles, by name. */
export const printPresets = {
  dashboard,
  'graficos-1900': graficos1900,
  'cartao-postal': cartaoPostal,
  caderno,
  isotype,
  cordel,
  riso,
  jornal,
  prancheta,
  'prancheta-clara': pranchetaClara,
  aquarela,
  'minimo-de-tinta': minimoDeTinta,
  suico,
  concretismo,
  semanario,
  'infografico-ilustrado': infograficoIlustrado,
  'diagrama-modernista': diagramaModernista,
  'papel-salmao': papelSalmao,
  'dados-br': dadosBr,
  'fluxo-historico': fluxoHistorico,
  'blocos-coloridos': blocosColoridos,
  construtivismo,
  bauhaus,
  brutalista,
  divulgacao,
  'proporcao-modular': proporcaoModular,
  sinalizacao,
  pictogramas,
  'mapa-de-metro': mapaDeMetro,
  'jornal-1959': jornal1959,
  'azulejo-modernista': azulejoModernista,
  tropicalia,
  'atlas-oficial': atlasOficial,
  'grade-holandesa': gradeHolandesa,
  'papel-recortado': papelRecortado,
  'pop-art': popArt,
  cientifico,
  'art-nouveau': artNouveau,
  memphis,
} satisfies Record<string, PrintStyle>

export type PrintPresetName = keyof typeof printPresets
export const PRINT_PRESET_NAMES = Object.keys(printPresets) as PrintPresetName[]
export const DEFAULT_PRINT_STYLE: PrintPresetName = 'jornal'

// ---------------------------------------------------------------------------
// Deprecated ids
// ---------------------------------------------------------------------------

/**
 * Deprecated style ids and the current id each one maps to. The styles were
 * renamed to neutral, descriptive ids (no trademarks, institutions or people's
 * names); the old ids keep working through `resolvePrintStyleName`,
 * `resolvePrintStyle`, `LivroPrint estilo` and, as `print-<old id>`, the UI
 * theme lookup (`resolvePrintThemeName`), with a one-time console warning in
 * development builds.
 *
 * Removal: the aliases (and the `'modulor'` emblem) will be dropped in the
 * next major version of @datatechsolutions/tympan-tokens and
 * @datatechsolutions/tympan-print; migrate stored data books to the new ids.
 */
export const PRINT_STYLE_ALIASES = {
  economist: 'semanario',
  ft: 'papel-salmao',
  schiphol: 'sinalizacao',
  'jornal-do-brasil': 'jornal-1959',
  'atlas-ibge': 'atlas-oficial',
  deardata: 'cartao-postal',
  tufte: 'minimo-de-tinta',
  holmes: 'infografico-ilustrado',
  bayer: 'diagrama-modernista',
  dubois: 'graficos-1900',
  minard: 'fluxo-historico',
  mccandless: 'blocos-coloridos',
  corbusier: 'proporcao-modular',
  aicher: 'pictogramas',
  vignelli: 'mapa-de-metro',
  'athos-bulcao': 'azulejo-modernista',
  crouwel: 'grade-holandesa',
  'saul-bass': 'papel-recortado',
} as const satisfies Record<string, PrintPresetName>

/** A deprecated style id (see PRINT_STYLE_ALIASES). */
export type PrintStyleAlias = keyof typeof PRINT_STYLE_ALIASES
/** Any id a style can be named by: a current name or a deprecated alias. */
export type PrintStyleId = PrintPresetName | PrintStyleAlias

const isDev = (() => {
  try {
    return (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.NODE_ENV !== 'production'
  } catch {
    return true
  }
})()
const warned = new Set<string>()

/** Warns once per id (development builds only) that a deprecated id was used. @internal */
export function warnDeprecatedPrintId(old: string, current: string, kind = 'print style'): void {
  if (!isDev || warned.has(old)) return
  warned.add(old)
  console.warn(`[@datatechsolutions/tympan] The ${kind} "${old}" is deprecated; use "${current}". The old id will be removed in the next major version.`)
}

/**
 * The current name of a style id: a current name is returned as is, a
 * deprecated alias is mapped (with a one-time development warning), anything
 * else gives `undefined`.
 */
export function resolvePrintStyleName(id: string): PrintPresetName | undefined {
  if (Object.hasOwn(printPresets, id)) return id as PrintPresetName
  if (Object.hasOwn(PRINT_STYLE_ALIASES, id)) {
    const current = PRINT_STYLE_ALIASES[id as PrintStyleAlias]
    warnDeprecatedPrintId(id, current)
    return current
  }
  return undefined
}

/** The preset of a style id (current or deprecated); throws on an unknown id. */
export function printPresetById(id: string): PrintStyle {
  const name = resolvePrintStyleName(id)
  if (!name) throw new Error(`tympan: unknown print style "${id}"`)
  return printPresets[name]
}

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
    logo: overrides.logo ?? style.logo,
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
    ...(g.ornamento ? { ornamento: g.ornamento.map(toGrey) } : {}),
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

/**
 * The style as it will print: overrides applied, then (for `pb`) the grey
 * conversion. Takes a preset or a style id; a deprecated id resolves to its
 * current style (`resolvePrintStyle('economist').name === 'semanario'`).
 */
export function resolvePrintStyle(style: PrintStyle | PrintStyleId, options: Omit<PrintCssOptions, 'seletor'> = {}): PrintStyle {
  const base = typeof style === 'string' ? printPresetById(style) : style
  const merged = mergePrintStyle(base, options.overrides)
  if (!options.pb) return merged
  return { ...merged, cor: printStyleCoresPb(merged) }
}

const kebab: Record<Exclude<keyof PrintCores, 'prova' | 'ornamento'>, string> = {
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
  const minusculas = style.estrutura.minusculas
  vars.push(['--ty-print-titulo-caixa', style.caixaAlta ? 'uppercase' : minusculas ? 'lowercase' : 'none'])
  vars.push(['--ty-print-titulo-espaco', style.caixaAlta ? '0.04em' : 'normal'])
  const rc = style.estrutura.rotuloCaixa
  vars.push(['--ty-print-rotulo-caixa', minusculas ? 'lowercase' : rc === 'alta' ? 'uppercase' : 'none'])
  vars.push(['--ty-print-rotulo-variante', rc === 'versalete' ? 'small-caps' : 'normal'])
  vars.push(['--ty-print-rotulo-espaco', rc === 'normal' ? 'normal' : '0.07em'])
  const orn = style.cor.ornamento ?? []
  const reserva = [style.cor.destaque, style.cor.destaque2, style.cor.tinta, style.cor.marcaTexto]
  for (let i = 0; i < 4; i++) vars.push([`--ty-print-ornamento-${i + 1}`, orn[i] ?? reserva[i]!])
  const cr = style.estrutura.corRotulo
  if (cr) {
    const fundo = cr === 'sustentada' || cr === 'refutada' ? style.cor.prova[cr] : style.cor[cr]
    vars.push(['--ty-print-rotulo-fundo', fundo])
    vars.push(['--ty-print-rotulo-tinta', luminance(parseColor(fundo)) > 0.4 ? style.cor.tinta : style.cor.papel])
  }
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
