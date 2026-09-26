import { useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { useLocale } from 'react-aria-components'
import { cx } from '../../internal/cx'
import { useMessages } from '../../internal/provider'
import { DataTable } from '../data-table/DataTable'
import { EmptyState } from '../empty-state/EmptyState'
import { SegmentedControl } from '../segmented-control/SegmentedControl'
import { linear, niceTicks, segments, toNumber, valueDomain, visibleLabelIndices } from './chartMath'
import type { ChartRow, ChartSeries, ChartSpec, ChartView } from './types'

export type { ChartKind, ChartRow, ChartSeries, ChartSpec, ChartView } from './types'

export interface ChartProps {
  spec: ChartSpec
  view?: ChartView
  defaultView?: ChartView
  onViewChange?: (view: ChartView) => void
  /** Width-to-height ratio of the plot; the chart always fills its container width. */
  aspect?: number
  /** Keyboard and pointer reading of points (default true). Static charts are one image. */
  interactive?: boolean
  /** Hide the chart/table switch (the table stays reachable through `view`). */
  hideViewSwitch?: boolean
  className?: string
}

// Plot frame in viewBox units; the SVG scales to the container.
const FRAME = { width: 640, top: 16, right: 20, bottom: 36, left: 52 }
const SHAPES = ['circle', 'square', 'triangle', 'diamond'] as const
const DASHES = ['6 4', '2 3', '10 3 2 3', '4 4']
const TOKEN = /^(?:--fk-)?(chart|categorical)-([1-8])$/

type Pointer = { cat: number; ser: number } | null

function paint(series: ChartSeries, index: number): string {
  const m = series.colorToken ? TOKEN.exec(series.colorToken) : null
  return m ? `var(--fk-${m[1]}-${m[2]})` : `var(--fk-chart-${(index % 8) + 1})`
}

function categoryOf(row: ChartRow, key: string): string {
  const raw = row[key] ?? row.x
  return raw === null || raw === undefined ? '' : String(raw)
}

/** Shape drawn at a datum: shape varies by series so colour is never alone. */
function Marker({ shape, cx: x, cy: y, r, active }: { shape: (typeof SHAPES)[number]; cx: number; cy: number; r: number; active: boolean }) {
  const size = active ? r * 1.6 : r
  const common = { className: 'fk-chart__mark', 'data-active': active || undefined }
  switch (shape) {
    case 'square':
      return <rect {...common} x={x - size} y={y - size} width={size * 2} height={size * 2} />
    case 'triangle':
      return <polygon {...common} points={`${x},${y - size * 1.2} ${x + size * 1.1},${y + size * 0.9} ${x - size * 1.1},${y + size * 0.9}`} />
    case 'diamond':
      return <polygon {...common} points={`${x},${y - size * 1.3} ${x + size * 1.3},${y} ${x},${y + size * 1.3} ${x - size * 1.3},${y}`} />
    default:
      return <circle {...common} cx={x} cy={y} r={size} />
  }
}

interface Geometry {
  height: number
  plotLeft: number
  plotRight: number
  plotTop: number
  plotBottom: number
  band: number
  centre: (i: number) => number
  y: (v: number) => number
  ticks: number[]
  base: number
}

function measure(spec: ChartSpec, aspect: number): Geometry {
  const height = Math.round(FRAME.width / aspect)
  const plotLeft = FRAME.left
  const plotRight = FRAME.width - FRAME.right
  const plotTop = FRAME.top
  const plotBottom = height - FRAME.bottom
  const n = Math.max(spec.data.length, 1)
  const band = (plotRight - plotLeft) / n
  const domain = valueDomain(spec)
  const y = linear(domain, [plotBottom, plotTop])
  const floor = Math.min(Math.max(0, domain[0]), domain[1])
  return {
    height,
    plotLeft,
    plotRight,
    plotTop,
    plotBottom,
    band,
    centre: (i) => plotLeft + band * (i + 0.5),
    y,
    ticks: niceTicks(domain, 5),
    base: y(floor),
  }
}

function SeriesMarks({ spec, g, active }: { spec: ChartSpec; g: Geometry; active: Pointer }) {
  const perSeries = spec.series.length
  return (
    <g className="fk-chart__marks">
      {spec.series.map((s, si) => {
        const colour = paint(s, si)
        const values = spec.data.map((row) => toNumber(row[s.name]))
        const hit = (ci: number) => active?.cat === ci && active.ser === si

        if (spec.type === 'bar' || spec.type === 'histogram') {
          const touching = spec.type === 'histogram'
          const groupWidth = touching ? g.band : g.band * 0.78
          const width = touching ? g.band : groupWidth / perSeries
          return (
            <g key={s.name} data-series={s.name} data-index={si} style={{ color: colour }} data-kind={spec.type}>
              {values.map((v, ci) => {
                if (v === null) return null
                const left = touching ? g.plotLeft + g.band * ci : g.centre(ci) - groupWidth / 2 + width * si
                const top = Math.min(g.y(v), g.base)
                return (
                  <rect
                    key={ci}
                    className="fk-chart__mark fk-chart__bar"
                    data-active={hit(ci) || undefined}
                    data-overlap={touching && perSeries > 1 ? '' : undefined}
                    x={left}
                    y={top}
                    width={width}
                    height={Math.max(Math.abs(g.base - g.y(v)), 0.5)}
                  />
                )
              })}
            </g>
          )
        }

        const points = values.map((v, ci) => (v === null ? null : ([g.centre(ci), g.y(v), ci] as const)))
        const runs = segments(points)
        const shape = SHAPES[si % SHAPES.length]!
        return (
          <g key={s.name} data-series={s.name} data-index={si} style={{ color: colour }} data-kind={spec.type}>
            {spec.type === 'area'
              ? runs.map((run, ri) => (
                  <path
                    key={`a${ri}`}
                    className="fk-chart__area"
                    d={`M${run[0]![0]},${g.base} ${run.map(([x, yv]) => `L${x},${yv}`).join(' ')} L${run[run.length - 1]![0]},${g.base} Z`}
                  />
                ))
              : null}
            {runs.map((run, ri) => (
              <path
                key={`l${ri}`}
                className="fk-chart__line"
                strokeDasharray={s.dashed ? DASHES[si % DASHES.length] : undefined}
                d={run.map(([x, yv], k) => `${k === 0 ? 'M' : 'L'}${x},${yv}`).join(' ')}
              />
            ))}
            {runs.flat().map(([x, yv, ci]) => (
              <Marker key={ci} shape={shape} cx={x} cy={yv} r={3.5} active={hit(ci)} />
            ))}
          </g>
        )
      })}
    </g>
  )
}

function Axes({ spec, g, format }: { spec: ChartSpec; g: Geometry; format: (v: number) => string }) {
  const labelled = visibleLabelIndices(spec.data.length, g.plotRight - g.plotLeft)
  return (
    <g className="fk-chart__axes" aria-hidden="true">
      {g.ticks.map((t) => (
        <g key={t}>
          <line className="fk-chart__grid" x1={g.plotLeft} x2={g.plotRight} y1={g.y(t)} y2={g.y(t)} />
          <text className="fk-chart__tick" x={g.plotLeft - 8} y={g.y(t)} textAnchor="end" dominantBaseline="middle">
            {format(t)}
          </text>
        </g>
      ))}
      <line className="fk-chart__baseline" x1={g.plotLeft} x2={g.plotRight} y1={g.plotBottom} y2={g.plotBottom} />
      {labelled.map((i) => (
        <text key={i} className="fk-chart__tick" x={g.centre(i)} y={g.plotBottom + 20} textAnchor="middle">
          {categoryOf(spec.data[i]!, spec.xAxis.key)}
        </text>
      ))}
    </g>
  )
}

function Annotations({ spec, g }: { spec: ChartSpec; g: Geometry }) {
  const cats = spec.data.map((r) => categoryOf(r, spec.xAxis.key))
  const placed = (spec.annotations ?? []).flatMap((a) => {
    const i = cats.indexOf(String(a.x))
    return i < 0 ? [] : [{ ...a, i }]
  })
  return (
    <g className="fk-chart__annotations">
      {placed.map((a) => (
        <g key={`${a.i}-${a.label}`} className="fk-chart__annotation" data-category={cats[a.i]}>
          <line x1={g.centre(a.i)} x2={g.centre(a.i)} y1={g.plotTop} y2={g.plotBottom} />
          <text x={g.centre(a.i) + 4} y={g.plotTop + 10}>
            {a.label}
          </text>
        </g>
      ))}
    </g>
  )
}

function Legend({ series, label }: { series: ChartSeries[]; label: string }) {
  return (
    <ul className="fk-chart__legend" aria-label={label}>
      {series.map((s, i) => (
        <li key={s.name} className="fk-chart__legend-item" style={{ color: paint(s, i) }} data-dashed={s.dashed || undefined}>
          <svg className="fk-chart__swatch" viewBox="0 0 24 12" aria-hidden="true" focusable="false">
            <line x1="1" x2="23" y1="6" y2="6" strokeDasharray={s.dashed ? '4 3' : undefined} />
          </svg>
          <span className="fk-chart__legend-name">{s.name}</span>
        </li>
      ))}
    </ul>
  )
}

/** Accessible figure for a declarative chart, with a complete table view (spec: wave-2/chart.md). */
export function Chart(props: ChartProps) {
  const { spec, aspect = 16 / 9, interactive = true } = props
  const m = useMessages().chart
  const { locale } = useLocale()
  const uid = useId()
  const [innerView, setInnerView] = useState<ChartView>(props.defaultView ?? 'chart')
  const view = props.view ?? innerView
  const [pointer, setPointer] = useState<Pointer>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const numberFormat = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }), [locale])
  const unit = spec.yAxis.unit
  const format = (v: number) => `${numberFormat.format(v)}${unit ? ` ${unit}` : ''}`
  const g = useMemo(() => measure(spec, aspect), [spec, aspect])
  const empty = spec.data.length === 0 || spec.series.length === 0

  const switchView = (next: string) => {
    const v = next as ChartView
    if (props.view === undefined) setInnerView(v)
    props.onViewChange?.(v)
  }

  const describe = (p: NonNullable<Pointer>) => {
    const row = spec.data[p.cat]
    const s = spec.series[p.ser]
    if (!row || !s) return ''
    const v = toNumber(row[s.name])
    return m.readout(categoryOf(row, spec.xAxis.key), s.name, v === null ? m.missing : format(v))
  }

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = spec.data.length - 1
    const current = pointer ?? { cat: 0, ser: 0 }
    const moves: Record<string, () => Pointer> = {
      ArrowRight: () => ({ ...current, cat: Math.min(last, current.cat + 1) }),
      ArrowLeft: () => ({ ...current, cat: Math.max(0, current.cat - 1) }),
      ArrowDown: () => ({ ...current, ser: Math.min(spec.series.length - 1, current.ser + 1) }),
      ArrowUp: () => ({ ...current, ser: Math.max(0, current.ser - 1) }),
      Home: () => ({ ...current, cat: 0 }),
      End: () => ({ ...current, cat: last }),
      Escape: () => null,
    }
    const move = moves[e.key]
    if (!move) return
    e.preventDefault()
    setPointer(move())
  }

  const fromPointer = (e: ReactPointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const box = svg.getBoundingClientRect()
    if (!box.width) return
    const vx = ((e.clientX - box.left) / box.width) * FRAME.width
    const vy = ((e.clientY - box.top) / box.height) * g.height
    const cat = Math.max(0, Math.min(spec.data.length - 1, Math.floor((vx - g.plotLeft) / g.band)))
    let ser = 0
    let best = Infinity
    spec.series.forEach((s, i) => {
      const v = toNumber(spec.data[cat]?.[s.name])
      if (v === null) return
      const d = Math.abs(g.y(v) - vy)
      if (d < best) {
        best = d
        ser = i
      }
    })
    setPointer({ cat, ser })
  }

  const readout = pointer ? describe(pointer) : ''
  const titleId = `${uid}-title`
  const hintId = `${uid}-hint`

  let body: ReactNode
  if (empty) {
    body = <EmptyState reason="custom" framing="inline" title={m.noData} description={m.noDataHint} headingLevel={4} />
  } else if (view === 'table') {
    body = (
      <DataTable
        caption={spec.title}
        columns={[
          { id: '__x', header: spec.xAxis.label ?? m.categoryColumn },
          ...spec.series.map((s) => ({ id: `s:${s.name}`, header: s.name, numeric: true, align: 'end' as const })),
        ]}
        rows={spec.data.map((row, i) => {
          const cells: Record<string, ReactNode> = { __x: categoryOf(row, spec.xAxis.key) }
          for (const s of spec.series) {
            const v = toNumber(row[s.name])
            cells[`s:${s.name}`] = v === null ? <span className="fk-chart__missing">{m.missing}</span> : format(v)
          }
          return { id: String(i), cells }
        })}
      />
    )
  } else {
    const svg = (
      <svg
        ref={svgRef}
        className="fk-chart__svg"
        viewBox={`0 0 ${FRAME.width} ${g.height}`}
        preserveAspectRatio="xMidYMid meet"
        role={interactive ? undefined : 'img'}
        aria-label={interactive ? undefined : spec.title}
        aria-hidden={interactive ? true : undefined}
        focusable="false"
        onPointerMove={interactive ? fromPointer : undefined}
        onPointerDown={interactive ? fromPointer : undefined}
        onPointerLeave={interactive ? () => setPointer(null) : undefined}
      >
        <Axes spec={spec} g={g} format={format} />
        <Annotations spec={spec} g={g} />
        <SeriesMarks spec={spec} g={g} active={pointer} />
      </svg>
    )
    const bubble =
      pointer && readout ? (
        <div
          className="fk-chart__readout"
          aria-hidden="true"
          style={{ insetInlineStart: `${(g.centre(pointer.cat) / FRAME.width) * 100}%` }}
          data-edge={pointer.cat > spec.data.length / 2 ? 'end' : 'start'}
        >
          {readout}
        </div>
      ) : null
    body = interactive ? (
      <div
        className="fk-chart__plot"
        role="group"
        tabIndex={0}
        aria-labelledby={titleId}
        aria-describedby={hintId}
        onKeyDown={onKey}
        onFocus={() => setPointer((p) => p ?? { cat: 0, ser: 0 })}
        onBlur={() => setPointer(null)}
        data-kind={spec.type}
      >
        {svg}
        {bubble}
        <span id={hintId} className="fk-visually-hidden">
          {m.plotHint(spec.title)}
        </span>
      </div>
    ) : (
      <div className="fk-chart__plot" data-kind={spec.type}>
        {svg}
      </div>
    )
  }

  return (
    <figure className={cx('fk-chart', props.className)} aria-labelledby={titleId} data-view={view} data-kind={spec.type}>
      <figcaption className="fk-chart__caption">
        <span id={titleId} className="fk-chart__title">
          {spec.title}
        </span>
        {spec.subtitle ? <span className="fk-chart__subtitle">{spec.subtitle}</span> : null}
        {spec.finding ? <span className="fk-chart__finding">{spec.finding}</span> : null}
      </figcaption>
      {!empty && !props.hideViewSwitch ? (
        <div className="fk-chart__tools">
          <SegmentedControl
            size="compact"
            label={m.viewSwitch}
            options={[
              { value: 'chart', label: m.chartView },
              { value: 'table', label: m.tableView },
            ]}
            value={view}
            onChange={switchView}
          />
        </div>
      ) : null}
      {!empty && view === 'chart' ? <Legend series={spec.series} label={m.legend} /> : null}
      {body}
      <div className="fk-visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {readout}
      </div>
    </figure>
  )
}
