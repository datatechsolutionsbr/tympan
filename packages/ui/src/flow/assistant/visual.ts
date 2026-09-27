// Assistant visual payloads → report blocks. The producer is a language model,
// so the reader is lenient about key names (English, Portuguese and Spanish aliases)
// and strict about what each type needs.

import type { ReportSection, ReportSpec, ValueFormat } from '../report/ReportView'

export type VisualType = 'figures' | 'bar' | 'line' | 'area' | 'table' | 'sections' | 'prose' | 'region-map' | 'flow'

export interface VisualEnvelope {
  type: VisualType
  title: string
  subtitle?: string
  rows: Array<Record<string, unknown>>
  xKey?: string
  yKeys?: string[]
  format?: ValueFormat
  columnFormats?: Record<string, ValueFormat>
  country?: string
  graph?: Record<string, unknown>
  body?: string
}

const TYPE_ALIASES: Record<string, VisualType> = {
  figures: 'figures', figure: 'figures', kpi: 'figures', kpis: 'figures', numbers: 'figures', figuras: 'figures', numeros: 'figures', números: 'figures', indicadores: 'figures', cifras: 'figures',
  bar: 'bar', bars: 'bar', column: 'bar', columns: 'bar', barra: 'bar', barras: 'bar', colunas: 'bar', columnas: 'bar',
  line: 'line', lines: 'line', linha: 'line', linhas: 'line', linea: 'line', línea: 'line', lineas: 'line', líneas: 'line',
  area: 'area', área: 'area',
  table: 'table', tabela: 'table', tabla: 'table', grid: 'table',
  sections: 'sections', secoes: 'sections', seções: 'sections', report: 'sections', relatorio: 'sections', relatório: 'sections', secciones: 'sections', informe: 'sections',
  prose: 'prose', text: 'prose', texto: 'prose', md: 'prose', markdown: 'prose', note: 'prose', nota: 'prose', prosa: 'prose',
  'region-map': 'region-map', region_map: 'region-map', regionmap: 'region-map', map: 'region-map', mapa: 'region-map', choropleth: 'region-map', regions: 'region-map', regioes: 'region-map', regiões: 'region-map', coropletico: 'region-map', coroplético: 'region-map', regiones: 'region-map',
  flow: 'flow', graph: 'flow', grafo: 'flow', fluxo: 'flow', workflow: 'flow', flujo: 'flow', flow_graph: 'flow', 'flow-graph': 'flow',
}

const KEYS = {
  type: ['type', 'tipo', 'chart', 'grafico', 'gráfico', 'visual'],
  title: ['title', 'titulo', 'título', 'name', 'nome', 'nombre'],
  subtitle: ['subtitle', 'subtitulo', 'subtítulo', 'description', 'descricao', 'descrição', 'descripcion', 'descripción'],
  data: ['data', 'dados', 'rows', 'linhas', 'items', 'itens', 'values', 'valores', 'datos', 'filas', 'elementos'],
  x: ['xKey', 'x_key', 'x', 'eixoX', 'eixo_x', 'category', 'categoria'],
  y: ['yKeys', 'y_keys', 'y', 'series', 'séries', 'eixoY', 'eixo_y'],
  format: ['valueFormat', 'value_format', 'format', 'formato'],
  columnFormats: ['columnFormats', 'column_formats', 'formats', 'formatos'],
  country: ['country', 'pais', 'país', 'countryCode', 'country_code'],
  graph: ['graph', 'grafo', 'flow', 'fluxo', 'flujo'],
  body: ['body', 'markdown', 'corpo', 'content', 'conteudo', 'conteúdo', 'contenido', 'cuerpo', 'text', 'texto'],
}

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

function pick(o: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const k of keys) if (o[k] !== undefined && o[k] !== null) return o[k]
  return undefined
}

function asFormat(v: unknown): ValueFormat | undefined {
  const s = typeof v === 'string' ? v.toLowerCase() : ''
  if (['number', 'numero', 'número', 'integer'].includes(s)) return 'number'
  if (['currency', 'moeda', 'moneda', 'money', 'dinero'].includes(s)) return 'currency'
  if (['percent', 'percentage', 'porcentagem', 'percentual', 'porcentaje', '%'].includes(s)) return 'percent'
  return undefined
}

/**
 * Reads a visualization tool output. Accepts an object (or its JSON text)
 * marked as a visualization or carrying a type; returns null when it is not a
 * usable visual (the chat then shows the tool's text summary instead).
 */
export function parseAssistantVisual(output: unknown): VisualEnvelope | null {
  let o = output
  if (typeof o === 'string') {
    try {
      o = JSON.parse(o)
    } catch {
      return null
    }
  }
  if (!isRecord(o)) return null
  // A wrapper such as { visualization: {...} } is unwrapped.
  if (isRecord(o.visualization)) o = o.visualization
  if (!isRecord(o)) return null
  const rawType = pick(o, KEYS.type)
  if (typeof rawType !== 'string') return null
  const type = TYPE_ALIASES[rawType.trim().toLowerCase()]
  if (!type) return null
  const title = pick(o, KEYS.title)
  if (typeof title !== 'string' || !title.trim()) return null

  const data = pick(o, KEYS.data)
  const rows = (Array.isArray(data) ? data : []).filter(isRecord)
  const env: VisualEnvelope = { type, title: title.trim(), rows }

  const subtitle = pick(o, KEYS.subtitle)
  if (typeof subtitle === 'string' && subtitle.trim()) env.subtitle = subtitle.trim()
  const x = pick(o, KEYS.x)
  if (typeof x === 'string') env.xKey = x
  const y = pick(o, KEYS.y)
  if (typeof y === 'string') env.yKeys = [y]
  else if (Array.isArray(y)) env.yKeys = y.filter((k): k is string => typeof k === 'string')
  const format = asFormat(pick(o, KEYS.format))
  if (format) env.format = format
  const cf = pick(o, KEYS.columnFormats)
  if (isRecord(cf)) {
    const out: Record<string, ValueFormat> = {}
    for (const [k, v] of Object.entries(cf)) {
      const f = asFormat(v)
      if (f) out[k] = f
    }
    env.columnFormats = out
  }
  const country = pick(o, KEYS.country)
  if (typeof country === 'string') env.country = country

  if (type === 'flow') {
    const graph = pick(o, KEYS.graph)
    if (!isRecord(graph)) return null
    env.graph = graph
    return env
  }
  if (type === 'prose') {
    const body = pick(o, KEYS.body)
    if (typeof body !== 'string' || !body.trim()) return null
    env.body = body
    return env
  }
  return rows.length ? env : null
}

const isNumeric = (v: unknown) => typeof v === 'number' && Number.isFinite(v)

/** x key and series keys: from the envelope, else the first non-numeric column and the numeric ones. */
export function inferAxes(env: Pick<VisualEnvelope, 'rows' | 'xKey' | 'yKeys'>): { x: string; y: string[] } {
  const first = env.rows[0] ?? {}
  const keys = Object.keys(first)
  const x = env.xKey ?? keys.find((k) => !isNumeric(first[k])) ?? keys[0] ?? 'x'
  const y = env.yKeys?.length ? env.yKeys : keys.filter((k) => k !== x && isNumeric(first[k]))
  return { x, y }
}

const REGION_KEYS = ['region', 'regiao', 'região', 'región', 'code', 'codigo', 'código', 'uf', 'state', 'estado', 'iso']
const LABEL_KEYS = ['label', 'title', 'titulo', 'título', 'name', 'nome', 'nombre', 'rotulo', 'rótulo', 'etiqueta']
const VALUE_KEYS = ['value', 'valor', 'total', 'count', 'contagem', 'conteo', 'n']

export interface EnvelopeToReportOptions {
  /** Country used by region maps without one (from the host configuration). */
  defaultCountry?: string
}

/** Converts a parsed envelope into a ReportView definition. */
export function envelopeToReport(env: VisualEnvelope, options: EnvelopeToReportOptions = {}): ReportSpec {
  const base: Pick<ReportSpec, 'title' | 'subtitle'> = { title: env.title, ...(env.subtitle ? { subtitle: env.subtitle } : {}) }
  const sections: ReportSection[] = []
  switch (env.type) {
    case 'figures':
      sections.push({
        type: 'figures',
        data: {
          items: env.rows.map((r) => {
            const label = pick(r, LABEL_KEYS)
            const value = pick(r, VALUE_KEYS)
            const format = asFormat(pick(r, KEYS.format)) ?? env.format
            return { label: typeof label === 'string' ? label : '', value: isNumeric(value) || typeof value === 'string' ? (value as number | string) : '', ...(format ? { format } : {}) }
          }),
        },
      })
      break
    case 'sections':
      for (const r of env.rows) {
        if (typeof r.type === 'string' && isRecord(r.data)) sections.push({ ...(r as object), type: r.type, data: r.data } as ReportSection)
      }
      break
    case 'prose':
      sections.push({ type: 'markdown', data: { body: env.body ?? '' } })
      break
    case 'region-map': {
      const items = env.rows.flatMap((r) => {
        const region = pick(r, REGION_KEYS)
        if (typeof region !== 'string' || !region.trim()) return []
        const label = pick(r, LABEL_KEYS)
        const value = pick(r, VALUE_KEYS)
        return [{ region: region.trim(), label: typeof label === 'string' ? label : region.trim(), value: isNumeric(value) ? (value as number) : Number(value) || 0 }]
      })
      const country = env.country ?? options.defaultCountry
      sections.push({ type: 'region-map', data: { items, ...(country ? { country } : {}), ...(env.format ? { format: env.format } : {}) } })
      break
    }
    case 'table': {
      const first = env.rows[0] ?? {}
      const columns = Object.keys(first).map((key) => {
        const format = env.columnFormats?.[key] ?? (isNumeric(first[key]) ? 'number' : undefined)
        return { key, label: key, ...(format ? { format } : {}) }
      })
      sections.push({ type: 'table', data: { rows: env.rows, columns } })
      break
    }
    case 'flow':
      sections.push({ type: 'flow', data: { graph: env.graph } })
      break
    default: {
      const { x, y } = inferAxes(env)
      sections.push({ type: env.type, data: { rows: env.rows, x, y, ...(env.format ? { format: env.format } : {}) } })
    }
  }
  return { ...base, sections }
}
