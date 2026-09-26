// Declarative chart description produced by analyses and agents (spec: wave-2/chart.md).

export type ChartKind = 'line' | 'bar' | 'area' | 'histogram'

export interface ChartSeries {
  name: string
  /** A chart or categorical token name: `chart-3`, `categorical-5`. */
  colorToken?: string
  /** Estimates or projections. */
  dashed?: boolean
}

export type ChartRow = { x: string | number } & Record<string, string | number | null | undefined>

export interface ChartSpec {
  type: ChartKind
  title: string
  subtitle?: string
  /** Finding sentence shown under the title (design direction §5). */
  finding?: string
  xAxis: { key: string; label?: string }
  yAxis: { label?: string; unit?: string; domain?: [number, number] }
  series: ChartSeries[]
  data: ChartRow[]
  annotations?: Array<{ x: string | number; label: string }>
}

export type ChartView = 'chart' | 'table'
