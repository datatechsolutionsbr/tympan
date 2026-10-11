// Book themes: how a publisher or a collection defines its own look for
// @datatechsolutions/tympan-print without touching tympan's code.
//
// A theme inherits a base (one of the 39 presets or another registered theme)
// and overrides any token of PrintStyleOverrides, plus what belongs to a
// publisher rather than to a style: its marks (publisher logo, collection
// seal), the page format and bleed, the running head and folio, and local
// font files. Register it by id and pass the id to PrintBook as `estilo`.
//
// A theme may come from JSON, either in the theme's own shape
// (`PrintBookThemeJson`) or as a DTCG tree (`printThemeFromDtcg`), so a brand's
// identity can live in the brand's repository.

import { fromDtcgColor, type DtcgColor } from './dtcg.ts'
import { toHex } from './color.ts'
import { SYSTEM_FONT_FAMILIES, fontFaceCss, type FontManifest } from './fonts.ts'
import {
  mergePrintStyle,
  printPresetById,
  resolvePrintStyleName,
  type PrintCoresParciais,
  type PrintPagina,
  type PrintStyle,
  type PrintStyleOverrides,
} from './print-presets.ts'

/** A book theme: an id, a base and overrides. */
export interface PrintBookTheme extends PrintStyleOverrides {
  /** Registry id, e.g. 'lakebrasil-editorial'. Use it as PrintBook's `estilo`. */
  id: string
  /** A preset name (or deprecated alias) or the id of another registered theme. */
  base: string
  /** What the theme interprets (shown in galleries). */
  referencia?: string
}

/** The JSON form of a theme: the same fields, colours as hex strings or DTCG colour objects. */
export type PrintBookThemeJson = Omit<PrintBookTheme, 'cor' | 'pb'> & {
  cor?: Record<string, unknown>
  pb?: Record<string, unknown>
}

const REGISTRO = new Map<string, PrintBookTheme>()

/** A style with overrides and theme extras applied (same as mergePrintStyle, kept for readability). */
export const mergePrintTheme = mergePrintStyle

/** Resolves a theme id or a preset id to a complete PrintStyle (`name` = the theme id). */
export function printThemeById(id: string, visitados: string[] = []): PrintStyle {
  const tema = REGISTRO.get(id)
  if (!tema) return printPresetById(id)
  if (visitados.includes(id)) throw new Error(`tympan: book theme cycle ${[...visitados, id].join(' → ')}`)
  const base = printThemeById(tema.base, [...visitados, id])
  const { id: _id, base: _base, referencia, ...over } = tema
  return { ...mergePrintTheme(base, over), name: tema.id, label: tema.label ?? base.label, referencia: referencia ?? `Tema sobre ${base.name}: ${base.referencia}` }
}

/** True when `id` names a registered theme or a preset. */
export function isPrintThemeId(id: string): boolean {
  return REGISTRO.has(id) || resolvePrintStyleName(id) !== undefined
}

function normalizarCores(c: Record<string, unknown> | undefined): PrintCoresParciais | undefined {
  if (!c) return undefined
  const cor = (v: unknown): string => (typeof v === 'string' ? v : toHex(fromDtcgColor(v as DtcgColor)))
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(c)) {
    if ((k === 'prova' || k === 'temas') && v && typeof v === 'object') out[k] = Object.fromEntries(Object.entries(v).map(([e, x]) => [e, cor(x)]))
    else if ((k === 'ornamento' || k === 'categorica' || k === 'divergente') && Array.isArray(v)) out[k] = v.map(cor)
    else out[k] = cor(v)
  }
  return out as PrintCoresParciais
}

/** Validates and normalises a theme read from JSON (colours may be hex or DTCG colour objects). */
export function printThemeFromJson(json: PrintBookThemeJson | string): PrintBookTheme {
  const j = (typeof json === 'string' ? JSON.parse(json) : json) as PrintBookThemeJson
  if (!j || typeof j.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(j.id)) throw new Error('tympan: a book theme needs an `id` in kebab case')
  if (typeof j.base !== 'string') throw new Error(`tympan: book theme "${j.id}" needs a \`base\` (a preset or a registered theme)`)
  const { cor, pb, ...rest } = j
  const out: PrintBookTheme = { ...rest }
  const c = normalizarCores(cor)
  if (c) out.cor = c
  const p = normalizarCores(pb)
  if (p) out.pb = p
  return out
}

type No = Record<string, unknown>

/** Namespaces read for the theme's meta (id/name, base/extends): tympan's own and the short one brand repos use. */
const EXTS = ['br.com.datatechsolutions.tympan', 'dev.tympan.print'] as const

/** Unwraps a DTCG group into plain values: `{ $value }` leaves become their value; `$`-keys are dropped. */
function desembrulhar(n: unknown): unknown {
  if (!n || typeof n !== 'object' || Array.isArray(n)) return n
  const o = n as No
  if ('$value' in o) {
    const v = o.$value
    if (o.$type === 'fontFamily' && Array.isArray(v)) return pilhaDeFontes(v as string[])
    if (o.$type === 'color' && v && typeof v === 'object') return toHex(fromDtcgColor(v as DtcgColor))
    if (o.$type === 'dimension' && v && typeof v === 'object' && 'unit' in (v as No)) return emMm(v as { value: number; unit: string })
    return v
  }
  const out: No = {}
  for (const [k, v] of Object.entries(o)) if (!k.startsWith('$')) out[k] = desembrulhar(v)
  return out
}

const GENERICAS = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-[a-z-]+)$/
const pilhaDeFontes = (v: string[]) => v.map((x) => (GENERICAS.test(x) || /^["']/.test(x) ? x : `"${x}"`)).join(', ')
const emMm = (v: { value: number; unit: string }) => (v.unit === 'px' ? (v.value * 25.4) / 96 : v.unit === 'pt' ? (v.value * 25.4) / 72 : v.unit === 'cm' ? v.value * 10 : v.value)

/** Figures from the meta: an object by role, or a phrase such as "tabular-nums em numero e rotulo". */
function lerAlgarismos(v: unknown): Record<string, 'tabular' | 'proporcional'> | undefined {
  if (v && typeof v === 'object') return v as Record<string, 'tabular' | 'proporcional'>
  if (typeof v !== 'string') return undefined
  const tipo = /proporc|proportional/.test(v) ? 'proporcional' : /tabular/.test(v) ? 'tabular' : undefined
  if (!tipo) return undefined
  const papeis = ['numero', 'rotulo', 'corpo'].filter((p) => v.includes(p))
  return Object.fromEntries((papeis.length ? papeis : ['numero']).map((p) => [p, tipo]))
}

/**
 * A theme from a DTCG (2025.10) tree. The tree mirrors PrintStyleOverrides: each group is a field
 * (`label`, `fontes.<role>`, `googleFonts`, `cor.<role>`, `cor.prova.<state>`, `cor.categorica.<n>`,
 * `cor.divergente.<n>`, `traco.largura`, `pb.*`, `estrutura.*`, `texto.*`, `marcas.*`, `pagina.*`, `folio.*`,
 * `fontesLocais`…) and each `{ "$type", "$value" }` leaf becomes its value (colours as hex or DTCG colour
 * objects, `fontFamily` arrays become CSS stacks, dimensions become mm). The theme's id and base come from
 * the root `$extensions["dev.tympan.print"]` (or `["br.com.datatechsolutions.tympan"]`) as `name`/`id` and
 * `extends`/`base`.
 */
export function printThemeFromDtcg(tree: No | string): PrintBookTheme {
  const t = (typeof tree === 'string' ? JSON.parse(tree) : tree) as No
  const exts = (t.$extensions ?? {}) as No
  const meta = Object.assign({}, ...EXTS.map((e) => exts[e] as No | undefined).filter(Boolean).map((m) => ({ ...(m!.tema as No | undefined), ...m }))) as No
  const id = (meta.id ?? meta.name) as string | undefined
  const base = (meta.base ?? meta.extends) as string | undefined
  if (!id || !base) throw new Error(`tympan: a DTCG book theme needs $extensions["dev.tympan.print"] with name and extends`)
  const corpo = desembrulhar(t) as No
  // Ordered lists written as groups ("1", "2"… or "a", "b"…) become arrays.
  const cor = corpo.cor as No | undefined
  for (const g of [cor, corpo.pb as No | undefined])
    if (g) for (const k of ['categorica', 'divergente', 'ornamento']) if (g[k] && typeof g[k] === 'object' && !Array.isArray(g[k])) g[k] = Object.entries(g[k] as No).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true })).map(([, v]) => v)
  // Brand-repo extras in the meta: per-role weights, figures and the data palette.
  const texto = { ...(corpo.texto as No | undefined) }
  if (meta.pesos && typeof meta.pesos === 'object') texto.pesos = { ...(meta.pesos as No), ...(texto.pesos as No | undefined) }
  const alg = lerAlgarismos(meta.algarismos)
  if (alg) texto.algarismos = { ...alg, ...(texto.algarismos as No | undefined) }
  if (Object.keys(texto).length) corpo.texto = texto
  const dado = meta.dado as Record<string, string> | undefined
  if (dado) {
    const c = { ...(corpo.cor as No | undefined) }
    if (dado.interesse && c.interesse === undefined) c.interesse = dado.interesse
    if (dado.contexto) c.contexto = dado.contexto
    if (dado.perdeu && dado.ganhou && c.divergente === undefined) c.divergente = [dado.perdeu, dado.ganhou]
    corpo.cor = c
  }
  return printThemeFromJson({ ...corpo, id, base, ...(meta.referencia ? { referencia: meta.referencia as string } : {}) } as PrintBookThemeJson)
}

/** Registers (or replaces) a theme; accepts the theme object, its JSON or a DTCG tree. Returns the theme. */
export function registerPrintTheme(tema: PrintBookTheme | PrintBookThemeJson | No | string): PrintBookTheme {
  const obj = typeof tema === 'string' ? (JSON.parse(tema) as No) : (tema as No)
  const t = obj.$extensions ? printThemeFromDtcg(obj) : printThemeFromJson(obj as PrintBookThemeJson)
  if (resolvePrintStyleName(t.id)) throw new Error(`tympan: book theme id "${t.id}" collides with a preset`)
  REGISTRO.set(t.id, t)
  printThemeById(t.id) // fails now on an unknown base or a cycle
  return t
}

/** Removes a registered theme (tests, hot reload). */
export function unregisterPrintTheme(id: string): boolean {
  return REGISTRO.delete(id)
}

/** Ids of the registered themes, in registration order. */
export function registeredPrintThemes(): string[] {
  return [...REGISTRO.keys()]
}

/** `@font-face` rules for a style's local font files ('' when it has none). */
export function fontesLocaisCss(style: Pick<PrintStyle, 'fontesLocais'>): string {
  return (style.fontesLocais ?? [])
    .map(
      (f) =>
        `@font-face { font-family: "${f.familia.replace(/"/g, '')}"; src: url("${f.src.replace(/"/g, '%22')}") format("woff2"); font-weight: ${f.peso ?? 400}; font-style: ${f.estilo ?? 'normal'}; font-display: block; }`,
    )
    .join('\n')
}

/** Trim and bleed of a style (defaults 170 × 240 mm, 3 mm bleed). */
export function paginaDoEstilo(style: Pick<PrintStyle, 'pagina'>): Required<PrintPagina> {
  const p = style.pagina ?? {}
  return { largura: p.largura ?? 170, altura: p.altura ?? 240, sangria: p.sangria ?? 3, marcasCorte: p.marcasCorte ?? false }
}

/** A neutral example theme (registered nowhere by default): a small press over `semanario`, in two inks. */
export const TEMA_EXEMPLO_EDITORA: PrintBookTheme = {
  id: 'editora-exemplo',
  base: 'semanario',
  label: 'Editora Exemplo · coleção ensaios',
  fontes: { titulo: '"Source Serif 4", Georgia, serif' },
  cor: { destaque: '#1f4e79', destaque2: '#b5562b', marcaTexto: '#e8eef5' },
  pb: { destaque: '#333333', destaque2: '#8a8a8a' },
  texto: { nomesProprios: 'preservar' },
  folio: { folio: 'centro', cabeco: 'externo' },
  pagina: { largura: 160, altura: 230, sangria: 3 },
}


/** Families named in a style's font stacks (quotes removed), in role order, without generic and system faces. */
export function familiasDoEstilo(style: Pick<PrintStyle, 'fontes'>): string[] {
  const out: string[] = []
  for (const pilha of Object.values(style.fontes) as string[])
    for (const f of pilha.split(',').map((x) => x.trim().replace(/^["']|["']$/g, '')))
      if (f && !SYSTEM_FONT_FAMILIES.includes(f) && !out.includes(f)) out.push(f)
  return out
}

/** Families the style names (first of each stack) that have neither a bundled file nor a theme `fontesLocais`. */
export function familiasSemArquivo(style: Pick<PrintStyle, 'fontes' | 'fontesLocais'>, manifest: FontManifest): string[] {
  const proprias = new Set((style.fontesLocais ?? []).map((f) => f.familia))
  const primeiras = (Object.values(style.fontes) as string[]).map((p) => p.split(',')[0]!.trim().replace(/^["']|["']$/g, ''))
  return [...new Set(primeiras)].filter((f) => !SYSTEM_FONT_FAMILIES.includes(f) && !proprias.has(f) && !manifest.families[f])
}

/**
 * @font-face rules for a style from the fonts bundled in this package (`fonts/manifest.json`): every face of
 * every family its font stacks name (so a mono or label family outside `googleFonts` is not forgotten), with
 * URLs `<base><file>`, then the theme's own `fontesLocais`, which win for their family.
 */
export function fontesEmpacotadasCss(style: Pick<PrintStyle, 'fontes' | 'googleFonts' | 'fontesLocais'>, manifest: FontManifest, base: string): string {
  const proprias = new Set((style.fontesLocais ?? []).map((f) => f.familia))
  const familias = new Set(familiasDoEstilo(style).filter((f) => manifest.families[f] && !proprias.has(f)))
  // Every bundled spec of those families (faces are de-duplicated by fontFaceCss).
  const specs = Object.keys(manifest.specs).filter((s) => familias.has(s.split(':')[0]!))
  return [specs.length ? fontFaceCss(manifest, specs, base) : '', fontesLocaisCss(style)].filter(Boolean).join('\n')
}
