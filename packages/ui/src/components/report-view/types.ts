// Report model rendered by ReportView (spec: wave-2/report-view.md).
import type { ChartSpec } from '../chart/types'

export type ReportTone = 'default' | 'info' | 'success' | 'warning' | 'danger'

export interface ReportKpi {
  label: string
  value: number | string
  unit?: string
  /** Change as a signed number, shown with its sign. */
  delta?: number
  deltaUnit?: string
  tone?: 'positive' | 'negative' | 'neutral'
}

export type ReportColumnType = 'text' | 'number' | 'currency' | 'percent'

export interface ReportTable {
  title?: string
  columns: Array<{ key: string; label: string; type?: ReportColumnType; align?: 'start' | 'end' }>
  rows: Array<Record<string, unknown>>
}

/** A typed block; `kind` selects the renderer, unknown kinds render as a neutral note. */
export interface ReportSection {
  kind: string
  id?: string
  title?: string
  [field: string]: unknown
}

export interface Report {
  title: string
  subtitle?: string
  kpis?: ReportKpi[]
  charts?: ChartSpec[]
  table?: ReportTable
  recommendation?: string
  sections?: ReportSection[]
  layout?: 'grid' | 'stacked'
  /** Footer metadata (generated at, source). */
  meta?: Record<string, string> | Array<{ label: string; value: string }>
}

export type ReportIssue =
  | { code: 'empty' }
  | { code: 'chartSeriesMissing'; index: number }
  | { code: 'tableColumnMissing'; key: string }
