// ReportView (stand-in for the design system's wave-2 ReportView): renders a
// report definition as stacked sections. Used by AssistantVisualBlock and
// ReportOutputNodeForm. Charts are drawn in SVG from chart tokens, always with
// a text summary, a legend in words and a data-table toggle, so no value is
// carried by colour alone.

import { useId, useState, type ReactNode } from 'react'
import { useLocale } from 'react-aria-components'
import { MarkdownView } from '../assistant/MarkdownView'
import { defineLabels, fill, useLabels } from '../internal/labels'

export type ValueFormat = 'number' | 'currency' | 'percent'

export interface FigureItem {
  label: string
  value: number | string
  format?: ValueFormat
}

export type ReportSection =
  | { type: 'figures'; title?: string; data: { items: FigureItem[] } }
  | { type: 'bar' | 'line' | 'area'; title?: string; data: { rows: Array<Record<string, unknown>>; x: string; y: string[]; format?: ValueFormat } }
  | { type: 'table'; title?: string; data: { rows: Array<Record<string, unknown>>; columns: Array<{ key: string; label: string; format?: ValueFormat }> } }
  | { type: 'markdown'; title?: string; data: { body: string } }
  | { type: 'region-map'; title?: string; data: { country?: string; items: Array<{ region: string; label: string; value: number }>; format?: ValueFormat } }
  | { type: 'flow'; title?: string; data: { graph: unknown } }
  | { type: 'note'; title?: string; data: Record<string, unknown> }

export interface ReportSpec {
  title?: string
  subtitle?: string
  sections: ReportSection[]
}

export interface ReportIssue {
  path: string
  message: string
}

/** Structural check: an object with a sections list whose items have a type and a data object. */
export function validateReport(spec: unknown): ReportIssue[] {
  const issues: ReportIssue[] = []
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) return [{ path: '', message: 'not an object' }]
  const sections = (spec as { sections?: unknown }).sections
  if (!Array.isArray(sections)) return [{ path: 'sections', message: 'missing list' }]
  if (!sections.length) issues.push({ path: 'sections', message: 'empty' })
  sections.forEach((s, i) => {
    if (!s || typeof s !== 'object') issues.push({ path: `sections.${i}`, message: 'not an object' })
    else {
      if (typeof (s as { type?: unknown }).type !== 'string') issues.push({ path: `sections.${i}.type`, message: 'missing' })
      const d = (s as { data?: unknown }).data
      if (!d || typeof d !== 'object') issues.push({ path: `sections.${i}.data`, message: 'missing' })
    }
  })
  return issues
}

/**
 * Locale-aware value text. Percent accepts a fraction (0.25) or a whole
 * percentage (25). Currency needs a currency code from the host; without one
 * the value is shown as a number with two decimals.
 */
export function formatValue(value: unknown, format: ValueFormat | undefined, locale?: string, currency?: string): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return value === null || value === undefined ? '' : String(value)
  if (format === 'currency') {
    return currency
      ? new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value)
      : new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
  }
  if (format === 'percent') return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(Math.abs(value) > 1 ? value / 100 : value)
  return new Intl.NumberFormat(locale).format(value)
}

export interface ReportViewLabels {
  showTable: string
  showChart: string
  chartSummary: string
  bar: string
  line: string
  area: string
  table: string
  region: string
  value: string
  noContent: string
}

export const reportViewLabels = defineLabels<ReportViewLabels>('reportView', {
  en: {
    showTable: 'Show data table',
    showChart: 'Show chart',
    chartSummary: '{kind} of {series} by {x}, {count, plural, one {# row} other {# rows}}',
    bar: 'Bar chart',
    line: 'Line chart',
    area: 'Area chart',
    table: 'Data table',
    region: 'Region',
    value: 'Value',
    noContent: 'This section has no content to show.',
  },
  'pt-BR': {
    showTable: 'Mostrar tabela de dados',
    showChart: 'Mostrar gráfico',
    chartSummary: '{kind} de {series} por {x}, {count, plural, one {# linha} other {# linhas}}',
    bar: 'Gráfico de barras',
    line: 'Gráfico de linhas',
    area: 'Gráfico de área',
    table: 'Tabela de dados',
    region: 'Região',
    value: 'Valor',
    noContent: 'Esta seção não tem conteúdo para mostrar.',
  },
  es: {
    showTable: 'Mostrar tabla de datos',
    showChart: 'Mostrar gráfico',
    chartSummary: '{kind} de {series} por {x}, {count, plural, one {# fila} other {# filas}}',
    bar: 'Gráfico de barras',
    line: 'Gráfico de líneas',
    area: 'Gráfico de área',
    table: 'Tabla de datos',
    region: 'Región',
    value: 'Valor',
    noContent: 'Esta sección no tiene contenido para mostrar.',
  },
})

/** English defaults (plain object). */
export const defaultReportViewLabels: ReportViewLabels = reportViewLabels.bundles.en

export interface ReportViewProps {
  spec: ReportSpec
  locale?: string
  currency?: string
  /** Heading level of the report title (sections use the next level). */
  headingLevel?: 2 | 3 | 4
  /** Charts start as a chart or as their data table (phones: table). */
  defaultChartView?: 'chart' | 'table'
  labels?: Partial<ReportViewLabels>
  className?: string
}

type HeadingTag = 'h2' | 'h3' | 'h4' | 'h5'

export function ReportView({ spec, locale, currency, headingLevel = 3, defaultChartView = 'chart', labels, className }: ReportViewProps) {
  const l = useLabels(reportViewLabels, labels)
  const provider = useLocale()
  const loc = locale ?? provider.locale
  const H = `h${headingLevel}` as HeadingTag
  const S = `h${Math.min(5, headingLevel + 1)}` as HeadingTag
  const fmt = (v: unknown, f?: ValueFormat) => formatValue(v, f, loc, currency)
  return (
    <div className={['ty-flow-report', className].filter(Boolean).join(' ')}>
      {spec.title ? <H className="ty-flow-report__title">{spec.title}</H> : null}
      {spec.subtitle ? <p className="ty-flow-report__subtitle">{spec.subtitle}</p> : null}
      {spec.sections.map((section, i) => (
        <section key={i} className="ty-flow-report__section" data-type={section.type}>
          {section.title && !isChart(section) ? <S className="ty-flow-report__section-title">{section.title}</S> : null}
          {renderSection(section, { fmt, l, S, defaultChartView, locale: loc })}
        </section>
      ))}
    </div>
  )
}

function isChart(s: ReportSection): s is Extract<ReportSection, { type: 'bar' | 'line' | 'area' }> {
  return s.type === 'bar' || s.type === 'line' || s.type === 'area'
}

interface Ctx {
  fmt: (v: unknown, f?: ValueFormat) => string
  l: ReportViewLabels
  S: HeadingTag
  defaultChartView: 'chart' | 'table'
  locale: string
}

function renderSection(section: ReportSection, ctx: Ctx): ReactNode {
  const { fmt, l } = ctx
  switch (section.type) {
    case 'figures':
      return (
        <dl className="ty-flow-report__figures">
          {section.data.items.map((f, i) => (
            <div key={i} className="ty-flow-report__figure">
              <dt className="ty-flow-report__figure-label">{f.label}</dt>
              <dd className="ty-flow-report__figure-value">{fmt(f.value, f.format)}</dd>
            </div>
          ))}
        </dl>
      )
    case 'table':
      return (
        <ScrollTable label={section.title ?? l.table}>
          <thead>
            <tr>
              {section.data.columns.map((c) => (
                <th key={c.key} scope="col">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.data.rows.map((r, i) => (
              <tr key={i}>
                {section.data.columns.map((c) => (
                  <td key={c.key} data-numeric={typeof r[c.key] === 'number' || undefined}>
                    {fmt(r[c.key], c.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      )
    case 'bar':
    case 'line':
    case 'area':
      return <ChartBlock section={section} ctx={ctx} />
    case 'markdown':
      return <MarkdownView source={section.data.body} baseHeadingLevel={4} />
    case 'region-map':
      return (
        <ScrollTable label={section.title ?? l.table}>
          <thead>
            <tr>
              <th scope="col">{l.region}</th>
              <th scope="col">{l.value}</th>
            </tr>
          </thead>
          <tbody>
            {section.data.items.map((it) => (
              <tr key={it.region}>
                <th scope="row">
                  {it.label} <span className="ty-flow-report__code">{it.region}</span>
                </th>
                <td data-numeric="true">{fmt(it.value, section.data.format)}</td>
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      )
    default:
      return <p className="ty-flow-report__note">{l.noContent}</p>
  }
}

function ScrollTable({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ty-flow-report__table-wrap" tabIndex={0} role="region" aria-label={label}>
      <table className="ty-flow-report__table">{children}</table>
    </div>
  )
}

const W = 480
const H = 200
const PAD = { top: 12, right: 12, bottom: 28, left: 12 }

function ChartBlock({ section, ctx }: { section: Extract<ReportSection, { type: 'bar' | 'line' | 'area' }>; ctx: Ctx }) {
  const { rows, x, y, format } = section.data
  const { l, fmt, S } = ctx
  const [view, setView] = useState<'chart' | 'table'>(ctx.defaultChartView)
  const tableId = useId()
  const captionId = useId()
  const values = rows.flatMap((r) => y.map((k) => (typeof r[k] === 'number' ? (r[k] as number) : 0)))
  const max = Math.max(0, ...values)
  const min = Math.min(0, ...values)
  const span = max - min || 1
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const yOf = (v: number) => PAD.top + plotH - ((v - min) / span) * plotH
  const baseline = yOf(0)
  const band = plotW / Math.max(1, rows.length)
  const kind = section.type === 'bar' ? l.bar : section.type === 'line' ? l.line : l.area
  const summary = fill(l.chartSummary, { kind, series: y.join(', '), x, count: rows.length }, ctx.locale)

  const marks: ReactNode[] = []
  y.forEach((key, s) => {
    const val = (r: Record<string, unknown>) => (typeof r[key] === 'number' ? (r[key] as number) : 0)
    if (section.type === 'bar') {
      const barW = Math.max(2, (band * 0.7) / y.length)
      rows.forEach((r, i) => {
        const v = val(r)
        const top = Math.min(yOf(v), baseline)
        marks.push(<rect key={`${key}-${i}`} className="ty-flow-report__mark" data-series={s % 8} x={PAD.left + band * i + band * 0.15 + barW * s} y={top} width={barW} height={Math.max(1, Math.abs(yOf(v) - baseline))} />)
      })
    } else {
      const pts = rows.map((r, i) => `${PAD.left + band * i + band / 2},${yOf(val(r))}`)
      if (section.type === 'area' && rows.length) {
        const first = PAD.left + band / 2
        const last = PAD.left + band * (rows.length - 1) + band / 2
        marks.push(<polygon key={`${key}-fill`} className="ty-flow-report__area" data-series={s % 8} points={`${first},${baseline} ${pts.join(' ')} ${last},${baseline}`} />)
      }
      marks.push(<polyline key={key} className="ty-flow-report__line" data-series={s % 8} points={pts.join(' ')} />)
      rows.forEach((r, i) => marks.push(<circle key={`${key}-p${i}`} className="ty-flow-report__point" data-series={s % 8} data-shape={s % 3} cx={PAD.left + band * i + band / 2} cy={yOf(val(r))} r={3.5} />))
    }
  })

  return (
    <figure className="ty-flow-report__chart" aria-labelledby={captionId}>
      <figcaption id={captionId} className="ty-flow-report__caption">
        {section.title ? <S className="ty-flow-report__section-title">{section.title}</S> : null}
        <span className="ty-flow-report__summary">{summary}</span>
      </figcaption>
      {view === 'chart' ? (
        <>
          <svg className="ty-flow-report__svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary} preserveAspectRatio="none">
            <line className="ty-flow-report__axis" x1={PAD.left} x2={W - PAD.right} y1={baseline} y2={baseline} />
            {marks}
            {rows.map((r, i) => (
              <text key={i} className="ty-flow-report__tick" x={PAD.left + band * i + band / 2} y={H - 8} textAnchor="middle">
                {String(r[x] ?? '')}
              </text>
            ))}
          </svg>
          {y.length > 1 ? (
            <ul className="ty-flow-report__legend">
              {y.map((k, s) => (
                <li key={k} className="ty-flow-report__legend-item" data-series={s % 8} data-shape={s % 3}>
                  <span className="ty-flow-report__swatch" aria-hidden="true" />
                  {k}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
      <button type="button" className="ty-flow-report__toggle" aria-expanded={view === 'table'} aria-controls={tableId} onClick={() => setView((v) => (v === 'chart' ? 'table' : 'chart'))}>
        {view === 'chart' ? l.showTable : l.showChart}
      </button>
      <div id={tableId} hidden={view !== 'table'}>
        <ScrollTable label={section.title ?? l.table}>
          <thead>
            <tr>
              <th scope="col">{x}</th>
              {y.map((k) => (
                <th key={k} scope="col">
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <th scope="row">{String(r[x] ?? '')}</th>
                {y.map((k) => (
                  <td key={k} data-numeric="true">
                    {fmt(r[k], format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      </div>
    </figure>
  )
}
