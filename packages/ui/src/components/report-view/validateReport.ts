// Pure validation of a report pasted by hand or produced by an agent.
// Accepts anything and never throws.
import type { ReportIssue } from './types'

type Loose = Record<string, unknown>
const isObject = (v: unknown): v is Loose => typeof v === 'object' && v !== null && !Array.isArray(v)
const listOf = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])

function hasContent(r: Loose): boolean {
  const table = isObject(r.table) ? r.table : null
  const checks = [
    listOf(r.kpis).length > 0,
    listOf(r.charts).length > 0,
    !!table && listOf(table.rows).length > 0,
    typeof r.recommendation === 'string' && r.recommendation.trim() !== '',
    listOf(r.sections).length > 0,
  ]
  return checks.some(Boolean)
}

function chartIssues(charts: unknown[]): ReportIssue[] {
  const out: ReportIssue[] = []
  charts.forEach((chart, index) => {
    const series = isObject(chart) ? chart.series : undefined
    if (!Array.isArray(series) || series.length === 0) out.push({ code: 'chartSeriesMissing', index })
  })
  return out
}

function tableIssues(table: Loose): ReportIssue[] {
  const declared = new Set(listOf(table.columns).flatMap((c) => (isObject(c) && typeof c.key === 'string' ? [c.key] : [])))
  const reported = new Set<string>()
  for (const row of listOf(table.rows)) {
    if (!isObject(row)) continue
    for (const key of Object.keys(row)) if (!declared.has(key)) reported.add(key)
  }
  return [...reported].map((key) => ({ code: 'tableColumnMissing' as const, key }))
}

/** Issues of a report; empty when it is valid. */
export function validateReport(input: unknown): ReportIssue[] {
  try {
    if (!isObject(input)) return [{ code: 'empty' }]
    const issues: ReportIssue[] = hasContent(input) ? [] : [{ code: 'empty' }]
    issues.push(...chartIssues(listOf(input.charts)))
    if (isObject(input.table)) issues.push(...tableIssues(input.table))
    return issues
  } catch {
    return [{ code: 'empty' }]
  }
}
