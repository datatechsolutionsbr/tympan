// Minimal ReportView (stand-in for the wave-2 ReportView of the design
// system): renders a report definition as stacked sections. Used by
// AssistantVisualBlock and ReportOutputNodeForm. Owned by the assistant group;
// this first version fixes the contract.

import type { ReactNode } from 'react'

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

export interface ReportViewProps {
  spec: ReportSpec
  locale?: string
  currency?: string
  /** Heading level of the report title (sections use the next level). */
  headingLevel?: 2 | 3 | 4
  className?: string
}

export function formatValue(value: unknown, format: ValueFormat | undefined, locale?: string, currency = 'BRL'): string {
  if (typeof value !== 'number') return value === null || value === undefined ? '' : String(value)
  if (format === 'currency') return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value)
  if (format === 'percent') return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(value > 1 ? value / 100 : value)
  return new Intl.NumberFormat(locale).format(value)
}

type HeadingTag = 'h2' | 'h3' | 'h4' | 'h5'

export function ReportView({ spec, locale, currency, headingLevel = 3, className }: ReportViewProps) {
  const H = `h${headingLevel}` as HeadingTag
  const S = `h${Math.min(5, headingLevel + 1)}` as HeadingTag
  return (
    <div className={['fk-report', className].filter(Boolean).join(' ')}>
      {spec.title ? <H className="fk-report__title">{spec.title}</H> : null}
      {spec.subtitle ? <p className="fk-report__subtitle">{spec.subtitle}</p> : null}
      {spec.sections.map((section, i) => (
        <section key={i} className="fk-report__section" data-type={section.type}>
          {section.title ? <S className="fk-report__section-title">{section.title}</S> : null}
          {renderSection(section, locale, currency)}
        </section>
      ))}
    </div>
  )
}

function renderSection(section: ReportSection, locale?: string, currency?: string): ReactNode {
  switch (section.type) {
    case 'figures':
      return (
        <dl className="fk-report__figures">
          {section.data.items.map((f, i) => (
            <div key={i} className="fk-report__figure">
              <dt>{f.label}</dt>
              <dd>{formatValue(f.value, f.format, locale, currency)}</dd>
            </div>
          ))}
        </dl>
      )
    case 'table':
      return (
        <div className="fk-report__table-wrap" tabIndex={0} role="region" aria-label={section.title ?? 'Table'}>
          <table className="fk-report__table">
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
                    <td key={c.key}>{formatValue(r[c.key], c.format, locale, currency)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'bar':
    case 'line':
    case 'area': {
      const { rows, x, y, format } = section.data
      const max = Math.max(1, ...rows.flatMap((r) => y.map((k) => (typeof r[k] === 'number' ? (r[k] as number) : 0))))
      return (
        <figure className="fk-report__chart">
          <div className="fk-report__bars" aria-hidden="true">
            {rows.map((r, i) => (
              <div key={i} className="fk-report__bar-row">
                <span className="fk-report__bar-label">{String(r[x] ?? '')}</span>
                {y.map((k) => (
                  <span key={k} className="fk-report__bar" style={{ inlineSize: `${(Math.max(0, Number(r[k]) || 0) / max) * 100}%` }} />
                ))}
              </div>
            ))}
          </div>
          <table className="fk-report__table">
            <caption className="fk-visually-hidden">{section.title ?? ''}</caption>
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
                    <td key={k}>{formatValue(r[k], format, locale, currency)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      )
    }
    case 'markdown':
      return section.data.body.split(/\n{2,}/).map((p, i) => (
        <p key={i} className="fk-report__prose">
          {p}
        </p>
      ))
    case 'region-map':
      return (
        <table className="fk-report__table">
          <tbody>
            {section.data.items.map((it) => (
              <tr key={it.region}>
                <th scope="row">{it.label}</th>
                <td>{formatValue(it.value, section.data.format, locale, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    default:
      return <p className="fk-report__note">{section.title ?? section.type}</p>
  }
}
