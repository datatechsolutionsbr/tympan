// Tolerant reader of docs/history/timeline.json: an array (or { entries: [...] }) of entries with a date, an
// era, a title and a body (strings, or objects keyed by locale) and optional metrics. Pure; tested.

export type Texto = string | Record<string, string>

export interface EntradaHistoria {
  id: string
  data: string
  era: Texto
  titulo: Texto
  texto: Texto
  metricas: string[]
}

const eTexto = (v: unknown): v is Texto => typeof v === 'string' || (!!v && typeof v === 'object' && !Array.isArray(v))

function metricas(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((m) => (typeof m === 'string' ? m : m && typeof m === 'object' ? Object.entries(m).map(([k, x]) => `${k}: ${String(x)}`).join(' · ') : String(m)))
  if (v && typeof v === 'object') return Object.entries(v).map(([k, x]) => `${k}: ${String(x)}`)
  return []
}

export function lerLinhaDoTempo(json: unknown): EntradaHistoria[] {
  const lista = Array.isArray(json) ? json : json && typeof json === 'object' && Array.isArray((json as { entries?: unknown }).entries) ? (json as { entries: unknown[] }).entries : []
  return lista
    .filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
    .map((e, i) => {
      const titulo = (e.title ?? e.titulo ?? '') as Texto
      const data = String(e.date ?? e.data ?? '')
      const id = String(e.id ?? `${data}-${i}`).replace(/[^\w-]/g, '-')
      return {
        id,
        data,
        era: eTexto(e.era) ? e.era : '',
        titulo: eTexto(titulo) ? titulo : '',
        texto: (eTexto(e.body) ? e.body : eTexto(e.texto) ? e.texto : '') as Texto,
        metricas: metricas(e.metrics ?? e.metricas),
      }
    })
    .sort((a, b) => a.data.localeCompare(b.data))
}

/** The text in the active locale, else English, else Portuguese, else any. */
export function textoNoIdioma(t: Texto, locale: string): string {
  if (typeof t === 'string') return t
  return t[locale] ?? t[locale.split('-')[0]!] ?? t.en ?? t['pt-BR'] ?? t.pt ?? Object.values(t)[0] ?? ''
}
