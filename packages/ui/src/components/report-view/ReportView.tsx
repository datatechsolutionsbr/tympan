import { ArrowDownRight, ArrowRight, ArrowUpRight, Lightbulb } from 'lucide-react'
import { useId, useMemo, type ReactNode } from 'react'
import { useLocale } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import { Chart } from '../chart/Chart'
import { DataTable } from '../data-table/DataTable'
import { EmptyState } from '../empty-state/EmptyState'
import { rendererFor, type SectionContext } from './sections'
import type { Report, ReportKpi, ReportSection, ReportTable } from './types'
import { validateReport } from './validateReport'

export type { Report, ReportColumnType, ReportIssue, ReportKpi, ReportSection, ReportTable, ReportTone } from './types'
export { validateReport } from './validateReport'

export interface ReportViewProps {
  report: Report
  /** Replaces the read-only summary of an `inputRequest` section (e.g. with SchemaRequestForm). */
  renderInputRequest?: (data: ReportSection) => ReactNode
  /** Replaces the default KPI tile (e.g. with MetricTile). */
  renderKpi?: (kpi: ReportKpi, index: number) => ReactNode
  /** Renders `markdown` sections (e.g. with MarkdownView); plain paragraphs otherwise. */
  renderMarkdown?: (source: string) => ReactNode
  /** Renders `regionMap` sections (e.g. with RegionMap); a list of codes otherwise. */
  renderRegionMap?: (data: ReportSection) => ReactNode
  /** Formatting locale; defaults to the provider locale. */
  locale?: string
  /** ISO 4217 code for currency columns and receipts without their own currency. */
  currency?: string
  className?: string
}

type Formatters = { number: (v: number) => string; money: (v: number, currency?: string) => string; percent: (v: number) => string }

function useFormatters(locale: string, currency?: string): Formatters {
  return useMemo(() => {
    const plain = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })
    const pct = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 })
    const moneyCache = new Map<string, Intl.NumberFormat>()
    return {
      number: (v) => plain.format(v),
      percent: (v) => pct.format(v / 100),
      money: (v, code = currency) => {
        if (!code) return plain.format(v)
        let f = moneyCache.get(code)
        if (!f) {
          f = new Intl.NumberFormat(locale, { style: 'currency', currency: code })
          moneyCache.set(code, f)
        }
        return f.format(v)
      },
    }
  }, [locale, currency])
}

function DefaultKpi({ kpi, fmt }: { kpi: ReportKpi; fmt: Formatters }) {
  const value = typeof kpi.value === 'number' ? fmt.number(kpi.value) : kpi.value
  const d = kpi.delta
  const Trend = d === undefined || d === 0 ? ArrowRight : d > 0 ? ArrowUpRight : ArrowDownRight
  // Sideways parts of the trend arrow follow the reading direction (up stays up).
  return (
    <div className="fk-report__kpi" data-tone={kpi.tone ?? 'neutral'}>
      <span className="fk-report__kpi-label">{kpi.label}</span>
      <span className="fk-report__kpi-value">
        {value}
        {kpi.unit ? <span className="fk-report__kpi-unit"> {kpi.unit}</span> : null}
      </span>
      {d !== undefined ? (
        <span className="fk-report__kpi-delta">
          <Trend className="fk-icon fk-mirror-rtl" aria-hidden="true" focusable="false" />
          {`${d > 0 ? '+' : ''}${fmt.number(d)}${kpi.deltaUnit ?? ''}`}
        </span>
      ) : null}
    </div>
  )
}

function TableBlock({ table, fmt, noValue, fallbackCaption }: { table: ReportTable; fmt: Formatters; noValue: string; fallbackCaption: string }) {
  const cell = (raw: unknown, type: string | undefined): ReactNode => {
    if (raw === null || raw === undefined || raw === '') {
      return (
        // §2.13: no dash as decoration; the empty-value word is shown in the muted tone.
        <span className="fk-report__no-value">{noValue}</span>
      )
    }
    if (typeof raw !== 'number') return String(raw)
    if (type === 'currency') return fmt.money(raw)
    if (type === 'percent') return fmt.percent(raw)
    return type === 'number' ? fmt.number(raw) : String(raw)
  }
  return (
    <DataTable
      caption={table.title ?? fallbackCaption}
      captionVisible={!!table.title}
      columns={table.columns.map((c) => {
        const numeric = c.type === 'number' || c.type === 'currency' || c.type === 'percent'
        return { id: c.key, header: c.label, numeric, align: c.align ?? (numeric ? 'end' : 'start') }
      })}
      rows={table.rows.map((row, i) => ({
        id: String(i),
        cells: Object.fromEntries(table.columns.map((c) => [c.key, cell(row[c.key], c.type)])),
      }))}
    />
  )
}

function metaPairs(meta: Report['meta']): Array<{ label: string; value: string }> {
  if (!meta) return []
  return Array.isArray(meta) ? meta : Object.entries(meta).map(([label, value]) => ({ label, value }))
}

/** Read-only renderer of a structured run report (spec: wave-2/report-view.md). */
export function ReportView(props: ReportViewProps) {
  const { report } = props
  const copy = useMessages().report
  const provided = useLocale().locale
  const fmt = useFormatters(props.locale ?? provided, props.currency)
  const titleId = useId()
  const isEmpty = validateReport(report).some((i) => i.code === 'empty')

  const ctx: SectionContext = {
    copy,
    number: fmt.number,
    money: fmt.money,
    renderMarkdown: props.renderMarkdown,
    renderInputRequest: props.renderInputRequest,
    renderRegionMap: props.renderRegionMap,
  }
  const kpis = report.kpis ?? []
  const charts = report.charts ?? []
  const sections = report.sections ?? []
  const footer = metaPairs(report.meta)

  return (
    <section className={cx('fk-report', props.className)} aria-labelledby={titleId} data-layout={report.layout ?? 'grid'}>
      <header className="fk-report__header">
        <h2 id={titleId} className="fk-report__title">
          {report.title}
        </h2>
        {report.subtitle ? <p className="fk-report__subtitle">{report.subtitle}</p> : null}
      </header>

      {isEmpty ? <EmptyState reason="custom" framing="section" title={copy.empty} description={copy.emptyHint} headingLevel={3} /> : null}

      {kpis.length ? (
        <div className="fk-report__kpis">
          {kpis.map((k, i) => (
            <div key={`${k.label}-${i}`} className="fk-report__kpi-cell">
              {props.renderKpi ? props.renderKpi(k, i) : <DefaultKpi kpi={k} fmt={fmt} />}
            </div>
          ))}
        </div>
      ) : null}

      {charts.length ? (
        <div className="fk-report__charts">
          {charts.map((c, i) =>
            Array.isArray(c.layers) && c.layers.length ? <Chart key={`${c.heading}-${i}`} figure={c} /> : null,
          )}
        </div>
      ) : null}

      {report.table && report.table.rows.length ? (
        <TableBlock table={report.table} fmt={fmt} noValue={copy.noValue} fallbackCaption={report.title} />
      ) : null}

      {report.recommendation && report.recommendation.trim() ? (
        <div className="fk-report__recommendation" role="note" aria-label={copy.recommendation}>
          <Lightbulb className="fk-icon" aria-hidden="true" focusable="false" />
          <div>
            <p className="fk-report__recommendation-label">{copy.recommendation}</p>
            <p className="fk-report__prose">{report.recommendation}</p>
          </div>
        </div>
      ) : null}

      {sections.map((s, i) => {
        const render = rendererFor(s?.kind)
        return (
          <article key={s.id ?? i} className="fk-report__section" data-kind={String(s?.kind)}>
            {s.title ? <h3 className="fk-report__section-title">{s.title}</h3> : null}
            {render(s, ctx)}
          </article>
        )
      })}

      {footer.length ? (
        <footer className="fk-report__footer">
          <dl className="fk-report__pairs">
            {footer.map((p) => (
              <div key={p.label} className="fk-report__pair">
                <dt>{p.label}</dt>
                <dd>{p.value}</dd>
              </div>
            ))}
          </dl>
        </footer>
      ) : null}
    </section>
  )
}
