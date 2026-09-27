// Spread templates ("moldes"): an explicit grid for each page of a spread, in
// the six columns of the type area (sistema.md §1.2: 136 × 204 mm, six
// columns). A molde names the areas of each page, row by row, with their
// column spans; one row may grow (1fr) to take the height the others leave,
// so a dense page reaches the foot of the type area instead of stopping
// half-way. The content JSON puts each node in an area (`area: "d"`), and the
// molde decides where that area sits. Styles change the geometry through
// `estrutura` (Tufte's notes column in the outer margin, for instance), never
// the content.
import type { PrintStyle } from '@datatechsolutions/tympan-tokens'

/** One row of a page: areas with their column spans (summing to 6). */
export interface LinhaMolde {
  areas: ReadonlyArray<readonly [area: string, colunas: number]>
  /** The row takes the leftover height (1fr). At most one per page. */
  cresce?: boolean
  /** The row sits at the foot of the type area (a gap opens above it, not below). */
  pe?: boolean
  /** The row keeps its content height (headings, captions); it takes no share of the free height. */
  fixa?: boolean
}

/** Areas that are headings: their rows never take free height (a title stays on its panel). */
const FIXAS = /^(titulo|manchete|lead|costura|frase|fonte)/

export interface Molde {
  /** What the spread is for (documentation, and the editor's picker). */
  descricao: string
  /** Pages with deliberate white (respiro, part openings): the fill check does not apply. */
  respiro?: boolean
  /**
   * Largest copyfitting scale for a sparse page of this molde (livro/ajuste.ts; default 1.3). Reading pages
   * (running text, few blocks) may set their text larger rather than leave half the page blank.
   */
  maximo?: number
  par: LinhaMolde[]
  impar: LinhaMolde[]
}

const L = (areas: Array<[string, number]>, extra: Omit<LinhaMolde, 'areas'> = {}): LinhaMolde => ({ areas, ...extra })
const cheia = (area: string, extra: Omit<LinhaMolde, 'areas'> = {}) => L([[area, 6]], extra)

/**
 * The spreads of the Volume 0 storyboard (diagramacao/dashboards.html) and of
 * the style studies (diagramacao/estilos/estilo-*.html, the method spread of
 * the FPM chapter, pp. [22]–[23]).
 */
export const MOLDES: Record<string, Molde> = {
  // Study pp. [22]–[23]: heading; a + b side by side; linking text; d (chart + data table) as large as the
  // page allows; source at the foot. Odd page: d′ "how to read" in two numbered columns; the verdict heading;
  // e with its claims and proof states; f and g side by side at the foot.
  metodo: {
    descricao: 'O método (estudo de estilo): a+b, costura, d grande com tabela | d′, veredito e, f+g',
    par: [cheia('titulo'), L([['a', 3], ['b', 3]]), cheia('lead'), cheia('d', { cresce: true }), cheia('fonte', { pe: true })],
    impar: [cheia('d2'), cheia('titulo2'), cheia('e', { cresce: true }), L([['f', 3], ['g', 3]], { pe: true })],
  },
  // Storyboard dupla 1: the promise (a) and the scoreboard (b, c, c′).
  'promessa-placar': {
    maximo: 1.45,
    descricao: 'A promessa e o placar: título, manchete, a | b, c (mapa) + legenda, c′, fonte',
    par: [cheia('titulo'), cheia('manchete'), cheia('a', { cresce: true }), cheia('costura', { pe: true })],
    impar: [cheia('titulo'), cheia('b'), cheia('c', { cresce: true }), cheia('c3'), cheia('c2', { pe: true }), cheia('fonte', { pe: true })],
  },
  // The same, with the map and the second scoreboard figure side by side (Código Florestal, storyboard [111]).
  'promessa-placar-lado': {
    maximo: 1.45,
    descricao: 'A promessa e o placar, com o mapa (c) e a figura c′ lado a lado',
    par: [cheia('titulo'), cheia('manchete'), cheia('a', { cresce: true }), cheia('costura', { pe: true })],
    impar: [cheia('titulo'), cheia('b'), L([['c', 3], ['c3', 3]], { cresce: true }), cheia('fonte', { pe: true })],
  },
  // Storyboard dupla 2: running text in four columns and notes in two (respiro), one small figure.
  virada: {
    descricao: 'A virada (respiro): texto corrido em 4 colunas + notas em 2 | texto, figura pequena, frase',
    maximo: 1.6,
    par: [L([['texto', 4], ['notas', 2]], { cresce: true })],
    impar: [L([['texto', 4], ['notas', 2]]), L([['fig', 4], ['notas', 2]], { cresce: true }), cheia('frase'), cheia('fonte', { pe: true })],
  },
  // The tests of a method: three tests, the medians they rest on, what is missing | the trace and your city.
  testes: {
    maximo: 1.45,
    descricao: 'Os testes e o rastro: testes, gráficos de apoio lado a lado, texto, quando o dado chegar | h + índice',
    par: [cheia('titulo'), cheia('d3'), L([['d4', 3], ['d5', 3]], { cresce: true }), cheia('texto'), L([['q', 4], ['notas', 2]], { pe: true }), cheia('fonte', { pe: true })],
    impar: [cheia('titulo2'), L([['g', 3], ['h', 3]], { cresce: true }), cheia('g2'), cheia('fonte', { pe: true })],
  },
  // Storyboard dupla 4: the verdict (e, f) | the trace (g), your city (h), the index of numbers (g′).
  veredito: {
    maximo: 1.45,
    descricao: 'O veredito: e grande, f | g + h lado a lado, índice g′, fonte',
    par: [cheia('titulo'), cheia('e', { cresce: true }), cheia('f', { pe: true })],
    impar: [cheia('titulo2'), L([['g', 3], ['h', 3]], { cresce: true }), cheia('g2'), cheia('prox'), cheia('fonte', { pe: true })],
  },
  // A reading page (respiro) beside a method page: running text in four columns, the numbers and the caveats
  // in the two-column margin, the rule of thumb at the foot (storyboard dupla 2, one page of it).
  leitura: {
    descricao: 'Página de leitura (respiro): texto em 4 colunas + números e ressalvas na margem de 2, regra de bolso no pé',
    maximo: 1.6,
    par: [L([['texto', 4], ['notas', 2]], { cresce: true }), cheia('frase', { pe: true })],
    impar: [L([['texto', 4], ['notas', 2]], { cresce: true }), cheia('frase', { pe: true })],
  },
  // A chapter without the promise spread: the method chart on the left, the reading on the right.
  grafico: {
    maximo: 1.45,
    descricao: 'Gráfico do método: título, d grande, fonte | d′ (figuras de apoio ou testes), leitura, texto, fonte',
    par: [cheia('titulo'), cheia('d', { cresce: true }), cheia('fonte', { pe: true })],
    impar: [cheia('d2'), cheia('titulo2'), cheia('fig', { cresce: true }), cheia('texto'), L([['q', 4], ['notas', 2]]), cheia('b'), cheia('f'), cheia('frase'), cheia('fonte', { pe: true })],
  },

  // Pending verdict (Kandir, FUNDEB, fiscal framework): numbers, the claim under test | the design published first.
  pendente: {
    maximo: 1.45,
    descricao: 'Veredito pendente: b, e, f | desenho publicado antes, g + h',
    par: [cheia('titulo'), cheia('b'), L([['fig', 4], ['nota', 2]]), cheia('e', { cresce: true }), cheia('f', { pe: true })],
    impar: [cheia('desenho'), L([['g', 3], ['h', 3]], { cresce: true })],
  },
  // Storyboard dupla 5: for whom the rule works, and what the chapter leaves for the next.
  fechamento: {
    maximo: 1.45,
    descricao: 'Para quem: título, figura grande, fonte | título, veredito curto, texto, quando o dado chegar, próximo capítulo',
    par: [cheia('titulo'), cheia('fig', { cresce: true }), cheia('q'), cheia('fonte', { pe: true })],
    impar: [cheia('titulo2'), L([['e', 3], ['e2', 3]], { cresce: true }), cheia('texto'), cheia('q'), cheia('prox', { pe: true })],
  },
  // Front matter.
  'como-ler': {
    maximo: 1.45,
    descricao: 'Como ler: título e espécime com as letras | estados de prova, seguir um número, selos, dados, cabeço, sua cidade',
    par: [cheia('titulo'), cheia('especime', { cresce: true }), cheia('letras', { pe: true })],
    impar: [cheia('estados', { cresce: true }), L([['k1', 3], ['k2', 3]]), cheia('dados'), L([['k3', 3], ['k4', 3]], { pe: true })],
  },

  'linha-do-tempo': {
    maximo: 1.45,
    descricao: 'Linha do tempo das leis em duas páginas',
    par: [cheia('titulo'), cheia('linha', { cresce: true })],
    impar: [cheia('linha', { cresce: true }), cheia('nota', { pe: true })],
  },
  'abertura-parte': {
    maximo: 1.45,
    descricao: 'Abertura de parte (respiro): número, título, pergunta, nesta parte | prancha com uma figura',
    par: [cheia('abertura', { cresce: true })],
    impar: [cheia('fig', { cresce: true }), cheia('fonte', { pe: true })],
  },
  // Toolbox: one spread per method.
  ferramenta: {
    maximo: 1.45,
    descricao: 'Caixa de ferramentas: o desenho, a hipótese, o sinal | receita, consulta, testes, onde aparece',
    par: [cheia('titulo'), cheia('d', { cresce: true }), L([['t1', 3], ['t2', 3]], { pe: true })],
    impar: [L([['receita', 3], ['consulta', 3]]), cheia('testes'), L([['onde', 3], ['leitura', 3]], { cresce: true }), cheia('frase', { pe: true })],
  },
  // Atlas plate: a bled map on the left, legend and regional cut-outs on the right.
  atlas: {
    maximo: 1.45,
    descricao: 'Prancha de atlas: mapa sangrado | recortes regionais e legenda, fonte',
    par: [cheia('mapa', { cresce: true })],
    impar: [cheia('titulo'), cheia('recortes', { cresce: true }), cheia('fonte', { pe: true })],
  },

  creditos: {
    maximo: 1.45,
    descricao: 'Reprodução e créditos: tabela de consultas, passos | ficha, marcas (colofão: branco intencional)',
    par: [cheia('titulo'), cheia('tabela', { cresce: true }), L([['passos', 3], ['local', 3]], { pe: true }), cheia('assina', { pe: true })],
    impar: [cheia('titulo2'), cheia('ficha', { cresce: true }), L([['marca', 2], ['marca-texto', 4]], { pe: true }), L([['editora', 2], ['editora-texto', 4]], { pe: true })],
  },

}

/**
 * The page geometry a style gives a molde. Styles with notes in the outer
 * margin (Tufte) move the small blocks of a row (the numbers, how to read the
 * chart, the trace, the source) into a two-column margin beside the main
 * block, as in the study estilo-10-tufte.
 */
export function linhasDoMolde(molde: Molde, lado: 'par' | 'impar', estilo: PrintStyle): LinhaMolde[] {
  const linhas = molde[lado]
  if (estilo.estrutura.notas !== 'margem') return linhas
  const variante = MARGEM[`${nomeDe(molde)}:${lado}`]
  return variante ?? linhas.map(margemGenerica)
}

function nomeDe(molde: Molde): string {
  return Object.entries(MOLDES).find(([, m]) => m === molde)?.[0] ?? ''
}

/** Two blocks side by side (3 + 3) become main (4) + note (2); a full row stays full. */
function margemGenerica(l: LinhaMolde): LinhaMolde {
  const [x, y] = l.areas
  if (l.areas.length === 2 && x && y && x[1] === 3 && y[1] === 3) return { ...l, areas: [[x[0], 4], [y[0], 2]] }
  return l
}

/** Tufte: the study keeps the main column at four columns and runs the sidenotes down the outer two. */
const MARGEM: Record<string, LinhaMolde[]> = {
  'metodo:par': [cheia('titulo'), L([['a', 4], ['b', 2]]), L([['lead', 4], ['b', 2]]), L([['d', 4], ['fonte', 2]], { cresce: true })],
  'metodo:impar': [L([['titulo2', 4], ['d2', 2]]), L([['e', 4], ['d2', 2]], { cresce: true }), L([['f', 4], ['g', 2]], { pe: true })],
  'veredito:par': [L([['titulo', 4], ['f', 2]]), L([['e', 4], ['f', 2]], { cresce: true })],
  'promessa-placar:impar': [L([['titulo', 4], ['c2', 2]]), L([['b', 4], ['c2', 2]]), L([['c', 4], ['c2', 2]], { cresce: true }), L([['c3', 4], ['fonte', 2]], { pe: true })],
}

/**
 * A molde is a superset: rows whose areas the page does not use are dropped, and a cell of an unused area
 * in a row is given to its neighbour on the left (or right), so no column is left empty by accident. A cell
 * is given only when the neighbour stays a rectangle on the grid (an area that spans two rows keeps one
 * width); otherwise it stays empty ('.'), because an L-shaped area would void the whole grid.
 */
export function linhasUsadas(linhas: LinhaMolde[], usadas: Set<string> | null): LinhaMolde[] {
  if (!usadas) return linhas
  const kept = linhas.filter((l) => l.areas.some(([a]) => usadas.has(a)))
  // Cell matrix: the name of each of the six columns, and whether it was lent from an unused area.
  const grade = kept.map((l) => l.areas.flatMap(([a, n]) => Array.from({ length: n }, () => (usadas.has(a) ? a : null)) as Array<string | null>))
  const emprestado = grade.map((r) => r.map((c) => c === null))
  for (const r of grade) {
    for (let i = 0; i < 6; i++) if (r[i] === null && i > 0 && r[i - 1] !== null) r[i] = r[i - 1]!
    for (let i = 5; i >= 0; i--) if (r[i] === null && i < 5 && r[i + 1] !== null) r[i] = r[i + 1]!
  }
  // Undo loans that break an area's rectangle, until every area is one.
  for (let volta = 0; volta < 12; volta++) {
    const ruim = areaNaoRetangular(grade)
    if (!ruim) break
    let mudou = false
    grade.forEach((r, y) => r.forEach((c, x) => {
      if (c === ruim && emprestado[y]![x]) {
        // Lend the cell to the area above it instead (a column that grows down), or leave it empty.
        const acima = y > 0 ? grade[y - 1]![x] : null
        r[x] = acima && acima !== '.' && acima !== ruim ? acima : '.'
        mudou = true
      }
    }))
    if (!mudou) break
  }
  // A vertical loan that still breaks a rectangle falls back to an empty cell.
  for (let volta = 0; volta < 12; volta++) {
    const ruim = areaNaoRetangular(grade)
    if (!ruim) break
    grade.forEach((r, y) => r.forEach((c, x) => {
      if (c === ruim && emprestado[y]![x]) r[x] = '.'
    }))
  }
  const out: LinhaMolde[] = grade.map((r, y) => {
    const areas: Array<[string, number]> = []
    for (const c of r) {
      const nome = c ?? '.'
      const ult = areas[areas.length - 1]
      if (ult && ult[0] === nome) ult[1] += 1
      else areas.push([nome, 1])
    }
    return { ...kept[y]!, areas }
  })
  // The growing row may have been dropped: the last content row (not a heading, not the foot) grows instead.
  if (!out.some((l) => l.cresce)) {
    for (let i = out.length - 1; i >= 0; i--) {
      const l = out[i]!
      if (l.pe || l.fixa || l.areas.every(([a]) => FIXAS.test(a) || a === '.')) continue
      out[i] = { ...l, cresce: true }
      break
    }
  }
  return out
}

/** First area of the cell matrix that is not a rectangle (CSS grid areas must be), or null. */
function areaNaoRetangular(grade: Array<Array<string | null>>): string | null {
  const caixas = new Map<string, { x0: number; x1: number; y0: number; y1: number; n: number }>()
  grade.forEach((r, y) => r.forEach((c, x) => {
    if (!c || c === '.') return
    const b = caixas.get(c)
    if (!b) caixas.set(c, { x0: x, x1: x, y0: y, y1: y, n: 1 })
    else Object.assign(b, { x0: Math.min(b.x0, x), x1: Math.max(b.x1, x), y0: Math.min(b.y0, y), y1: Math.max(b.y1, y), n: b.n + 1 })
  }))
  for (const [nome, b] of caixas) if ((b.x1 - b.x0 + 1) * (b.y1 - b.y0 + 1) !== b.n) return nome
  return null
}

/** CSS grid of a page: `grid-template-areas` and `grid-template-rows`, and each area's column span. */
export interface InfoArea {
  colunas: number
  cresce: boolean
  pe: boolean
}

export function gradeDoMolde(linhas: LinhaMolde[]): { areas: string; linhas: string; info: Map<string, InfoArea> } {
  const info = new Map<string, InfoArea>()
  const areas = linhas
    .map((l) => {
      const celulas: string[] = []
      for (const [a, n] of l.areas) {
        if (a === '.') {
          for (let i = 0; i < n; i++) celulas.push('.')
          continue
        }
        const antes = info.get(a)
        const cresce = !l.pe && !l.fixa && !FIXAS.test(a)
        info.set(a, { colunas: Math.max(antes?.colunas ?? 0, n), cresce: Boolean(antes?.cresce || cresce), pe: Boolean(antes?.pe || l.pe) })
        for (let i = 0; i < n; i++) celulas.push(a)
      }
      if (celulas.length !== 6) throw new Error(`tympan-print: linha de molde com ${celulas.length} colunas (${l.areas.map((a) => a.join(':')).join(' ')})`)
      return `"${celulas.join(' ')}"`
    })
    .join(' ')
  // Free height is shared by the content rows (not by headings or the foot), weighted towards the row the
  // molde marks as growing: the page reaches its foot with air between blocks instead of one hole below them.
  const rows = linhas.map((l) => {
    if (l.cresce) return 'minmax(auto, 3fr)'
    if (l.pe || l.fixa || l.areas.every(([a]) => FIXAS.test(a))) return 'auto'
    return 'minmax(auto, 1fr)'
  })
  return { areas, linhas: rows.join(' '), info }
}

export function moldePorNome(nome: string | undefined): Molde | undefined {
  return nome ? MOLDES[nome] : undefined
}
