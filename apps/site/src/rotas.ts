// Hash routes of the site. Hash only (the static build works from any folder and as an artifact) and path
// segments only, no query string. Every route may start with a locale (#/ja/…); links the site writes
// always carry the active one.
//   #/<loc>/                                             Início
//   #/<loc>/componentes/<página>                          Componentes
//   #/<loc>/temas/<tema>/<modo>/<tema B>                  Temas
//   #/<loc>/livro/<estilo>/<gráfico>/<cor|pb>/<modo>/<estilo B>   Livro
//   #/<loc>/livro/<estilo>/<gráfico>/<cor|pb>/completo/<dupla>     Livro, the whole sample book
//   #/<loc>/video/<tema>                                   Vídeo
//   #/<loc>/instalar                                       Instalar
// Trailing segments may be left out (their defaults apply). Pure functions, tested in test/rotas.test.ts.
import { PRINT_PRESET_NAMES, resolvePrintStyleName, type PrintPresetName } from './tokens'
import { LOCALE_CODES } from './i18n/locales'

export type SecaoId = 'inicio' | 'componentes' | 'temas' | 'livro' | 'video' | 'instalar'
export const SECAO_IDS: readonly SecaoId[] = ['inicio', 'componentes', 'temas', 'livro', 'video', 'instalar']

/** The four ways of looking at themes and book styles (from the Estúdio's Livro tab). */
export type Modo = 'um' | 'comparar' | 'antes' | 'galeria' | 'completo'
export const MODOS: readonly Modo[] = ['um', 'comparar', 'antes', 'galeria', 'completo']

/** Chart of the method spread: the style's own ('estudo'), a fixed shape, or the map spread. */
export type Grafico = 'estudo' | 'halteres' | 'barras' | 'contagem' | 'mapa'
export const GRAFICOS: readonly Grafico[] = ['estudo', 'halteres', 'barras', 'contagem', 'mapa']

export const ESTILO_PADRAO: PrintPresetName = 'jornal'
/** Default "before" of Antes × depois in Livro: the base editorial dashboard. */
export const ESTILO_BASE: PrintPresetName = 'dashboard'
export const TEMA_PADRAO = 'tympan'
export const TODOS_ESTILOS: readonly PrintPresetName[] = PRINT_PRESET_NAMES

export type Rota =
  | { secao: 'inicio' }
  | { secao: 'componentes'; pagina?: string }
  | { secao: 'temas'; tema: string; modo: Modo; b: string }
  | { secao: 'livro'; estilo: PrintPresetName; grafico: Grafico; pb: boolean; modo: Modo; b: PrintPresetName; dupla?: string }
  | { secao: 'video'; tema: string }
  | { secao: 'instalar' }

export type RotaDe<S extends SecaoId> = Extract<Rota, { secao: S }>

const modoDe = (v: string | undefined): Modo => (MODOS.includes(v as Modo) ? (v as Modo) : 'um')
const graficoDe = (v: string | undefined): Grafico => (GRAFICOS.includes(v as Grafico) ? (v as Grafico) : 'estudo')
/** A known style id, an old id (alias) mapped to its new name, or the fallback. */
export const estiloDe = (v: string | null | undefined, padrao: PrintPresetName = ESTILO_PADRAO): PrintPresetName =>
  (v && resolvePrintStyleName(v)) || padrao
const dec = (s: string) => {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

/** Splits "#/ja/livro/…" into the locale segment (if it is one of ours) and the route segments. */
export function segmentos(hash: string): { locale?: string; partes: string[] } {
  const partes = hash.replace(/^#\/?/, '').split('?')[0]!.split('/').filter(Boolean).map(dec)
  if (partes[0] && LOCALE_CODES.includes(partes[0])) return { locale: partes[0], partes: partes.slice(1) }
  return { partes }
}

/** Reads a location hash into a route; anything unknown opens Início. */
export function lerRota(hash: string): Rota {
  const [secao, a, b, c, d, e] = segmentos(hash).partes
  switch (secao) {
    case 'componentes':
      return { secao, ...(a ? { pagina: a } : {}) }
    case 'temas':
      return { secao, tema: a || TEMA_PADRAO, modo: modoDe(b), b: c || TEMA_PADRAO }
    case 'livro':
      // In the whole-book mode the last segment is the spread; elsewhere it is the style B.
      return modoDe(d) === 'completo'
        ? { secao, estilo: estiloDe(a), grafico: graficoDe(b), pb: c === 'pb', modo: 'completo', b: ESTILO_BASE, ...(e ? { dupla: e } : {}) }
        : { secao, estilo: estiloDe(a), grafico: graficoDe(b), pb: c === 'pb', modo: modoDe(d), b: estiloDe(e, ESTILO_BASE) }
    case 'video':
      return { secao, tema: a || TEMA_PADRAO }
    case 'instalar':
      return { secao }
    default:
      return { secao: 'inicio' }
  }
}

/** The route's path segments, without trailing defaults. */
function partesDaRota(r: Rota): string[] {
  switch (r.secao) {
    case 'inicio':
      return []
    case 'componentes':
      return r.pagina ? ['componentes', r.pagina] : ['componentes']
    case 'temas': {
      const usaB = (r.modo === 'comparar' || r.modo === 'antes') && r.b !== TEMA_PADRAO
      return aparar(['temas', r.tema, r.modo, ...(usaB ? [r.b] : [])], [null, null, 'um'])
    }
    case 'livro': {
      const usaB = (r.modo === 'comparar' || r.modo === 'antes') && r.b !== ESTILO_BASE
      const fim = r.modo === 'completo' && r.dupla ? [r.dupla] : usaB ? [r.b] : []
      return aparar(['livro', r.estilo, r.grafico, r.pb ? 'pb' : 'cor', r.modo, ...fim], [null, null, 'estudo', 'cor', 'um'])
    }
    case 'video':
      return ['video', r.tema]
    case 'instalar':
      return ['instalar']
  }
}

/** Drops trailing segments that equal their default (`null` = always kept). */
function aparar(p: string[], padroes: Array<string | null>): string[] {
  const out = [...p]
  while (out.length && padroes[out.length - 1] != null && out[out.length - 1] === padroes[out.length - 1]) out.pop()
  return out
}

/** Formats a route as a hash, with the locale segment when given. */
export function formatarRota(r: Rota, locale?: string): string {
  const p = partesDaRota(r).map(encodeURIComponent)
  return `#/${[...(locale ? [locale] : []), ...p].join('/')}`
}

/** Next or previous item of a list, wrapping around (← → through styles and themes). */
export function vizinho<T>(lista: readonly T[], atual: T, passo: 1 | -1): T {
  if (!lista.length) return atual
  const i = lista.indexOf(atual)
  const n = lista.length
  return lista[(((i < 0 ? 0 : i + passo) % n) + n) % n]!
}

/** True when an arrow key press should change the style (not while typing or inside a composite widget). */
export function teclaDeTroca(alvo: EventTarget | null): boolean {
  const el = alvo as HTMLElement | null
  if (!el || typeof el.closest !== 'function') return true
  return !el.closest('input, textarea, select, [role="slider"], [role="listbox"], [role="radiogroup"], [role="tablist"], [role="menu"], [contenteditable="true"]')
}
