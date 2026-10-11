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
import { fontFaceCss, type FontManifest } from './fonts.ts'
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
    if (k === 'prova' && v && typeof v === 'object') out.prova = Object.fromEntries(Object.entries(v).map(([e, x]) => [e, cor(x)]))
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


/**
 * @font-face rules for a style from the fonts bundled in this package (`fonts/manifest.json`): every Google
 * Fonts spec of the style that is bundled, with URLs `<base><file>` (`base` is where the HTML finds
 * `@datatechsolutions/tympan-tokens/fonts/`), then the theme's own `fontesLocais`, which win for their family.
 */
export function fontesEmpacotadasCss(style: Pick<PrintStyle, 'googleFonts' | 'fontesLocais'>, manifest: FontManifest, base: string): string {
  const proprias = new Set((style.fontesLocais ?? []).map((f) => f.familia))
  const specs = style.googleFonts.filter((s) => manifest.specs[s] && !proprias.has(s.split(':')[0]!))
  return [specs.length ? fontFaceCss(manifest, specs, base) : '', fontesLocaisCss(style)].filter(Boolean).join('\n')
}
