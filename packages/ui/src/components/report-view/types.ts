// The report document ReportView renders (spec: wave-2/report-view.md).
// Top-level keys are the host contract named by the spec; every block is
// declared on its own and the document is their composition.
import type { ChartSpec } from '../chart/types'

/* ---------------------------------------------------------- vocabularies -- */

const COLUMN_FORMATS = ['text', 'number', 'currency', 'percent'] as const
/** How a table column's values are formatted. */
export type ReportColumnType = (typeof COLUMN_FORMATS)[number]

/** Emphasis a block may carry (never colour alone). */
export type ReportTone = 'default' | 'info' | 'success' | 'warning' | 'danger'

/** Direction of a figure's change, as the author judges it. */
type Leaning = 'positive' | 'negative' | 'neutral'

/* ---------------------------------------------------------------- blocks -- */

/** The figure itself: a label and a value with an optional unit. */
type FigureCore = { label: string; value: number | string; unit?: string }

/** Optional change attached to a figure (a signed number, shown with its sign). */
type FigureChange = { delta?: number; deltaUnit?: string; tone?: Leaning }

export type ReportKpi = FigureCore & FigureChange

/** One declared column of the table block. */
type ReportColumn = { key: string; label: string; type?: ReportColumnType; align?: 'start' | 'end' }

export type ReportTable = {
  title?: string
  columns: ReportColumn[]
  rows: Array<Record<string, unknown>>
}

/** A typed block: `kind` picks the renderer; unknown kinds render as a neutral note. */
export type ReportSection = { kind: string; id?: string; title?: string } & Record<string, unknown>

/** Footer facts: a record, or ordered label/value pairs. */
type FooterFacts = Record<string, string> | Array<{ label: string; value: string }>

/* -------------------------------------------------------------- document -- */

type Heading = { title: string; subtitle?: string }

type Blocks = {
  kpis?: ReportKpi[]
  charts?: ChartSpec[]
  table?: ReportTable
  recommendation?: string
  sections?: ReportSection[]
}

type Presentation = {
  layout?: 'grid' | 'stacked'
  /** Footer metadata (generated at, source). */
  meta?: FooterFacts
}

export type Report = Heading & Blocks & Presentation

/* ----------------------------------------------------------- validation -- */

/** Extra facts per issue code; `validateReport` returns one entry per problem. */
type IssueFacts = {
  empty: object
  chartSeriesMissing: { index: number }
  tableColumnMissing: { key: string }
}

export type ReportIssue = { [Code in keyof IssueFacts]: { code: Code } & IssueFacts[Code] }[keyof IssueFacts]
