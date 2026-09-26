import {
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react'
import { useLocale } from 'react-aria-components'
import { cx } from '../../internal/cx'
import type { ChartsGeoMessages } from '../../internal/messages/charts-geo'
import { useMessages } from '../../internal/provider'
import { DataTable } from '../data-table/DataTable'
import { EmptyState } from '../empty-state/EmptyState'
import { SegmentedControl } from '../segmented-control/SegmentedControl'
import { linear, niceTicks, segments, visibleLabelIndices } from './chartMath'
import { toPlot } from './plot'
import type { ChartFace, ChartFigure, Glyph, Plot, Track } from './types'

export type { ChartFace, ChartFigure, ChartForm, ChartLayer, ChartNote, ChartRecord } from './types'

export interface ChartProps {
  figure: ChartFigure
  face?: ChartFace
  defaultFace?: ChartFace
  onFaceChange?: (face: ChartFace) => void
  /** Width-to-height ratio of the plot; the chart always fills its container width. */
  aspect?: number
  /** Keyboard and pointer reading of points (default true). Static charts are one image. */
  interactive?: boolean
  /** Hide the chart/table switch (the table stays reachable through `face`). */
  hideViewSwitch?: boolean
  className?: string
}

/* ---------------------------------------------------------------- frame -- */

/** viewBox width and the gutters around the plot, in viewBox units. */
const CANVAS = 640
const GUTTER = { head: 16, foot: 36, axisSide: 52, farSide: 20 }

interface Frame {
  rtl: boolean
  tall: number
  /** Plot box in viewBox units (x0 always the physical left edge). */
  x0: number
  x1: number
  y0: number
  y1: number
  slotWidth: number
  slotX: (slot: number) => number
  valueY: (reading: number) => number
  floorY: number
  ticks: number[]
}

function frameFor(plot: Plot, aspect: number, rtl: boolean): Frame {
  const tall = Math.round(CANVAS / aspect)
  // The value axis sits on the inline start, so its wide gutter changes side in RTL.
  const x0 = rtl ? GUTTER.farSide : GUTTER.axisSide
  const x1 = CANVAS - (rtl ? GUTTER.axisSide : GUTTER.farSide)
  const y0 = GUTTER.head
  const y1 = tall - GUTTER.foot
  const slotWidth = (x1 - x0) / Math.max(plot.stops.length, 1)
  const valueY = linear(plot.span, [y1, y0])
  const [low, high] = plot.span
  return {
    rtl,
    tall,
    x0,
    x1,
    y0,
    y1,
    slotWidth,
    slotX: (slot) => (rtl ? x1 - slotWidth * (slot + 0.5) : x0 + slotWidth * (slot + 0.5)),
    valueY,
    floorY: valueY(Math.min(Math.max(0, low), high)),
    ticks: niceTicks(plot.span, 5),
  }
}

/* --------------------------------------------------------------- cursor -- */

/** Focused reading: slot (category) and lane (series), or none. */
type Cursor = { slot: number; lane: number } | null

type CursorEvent = { type: 'key'; key: string; rtl: boolean; slots: number; lanes: number } | { type: 'set'; to: Cursor }

function steer(cursor: Cursor, event: CursorEvent): Cursor {
  if (event.type === 'set') return event.to
  const at = cursor ?? { slot: 0, lane: 0 }
  const lastSlot = event.slots - 1
  const clampSlot = (s: number) => Math.min(lastSlot, Math.max(0, s))
  const forward = event.rtl ? 'ArrowLeft' : 'ArrowRight'
  const back = event.rtl ? 'ArrowRight' : 'ArrowLeft'
  switch (event.key) {
    case forward:
      return { ...at, slot: clampSlot(at.slot + 1) }
    case back:
      return { ...at, slot: clampSlot(at.slot - 1) }
    case 'ArrowDown':
      return { ...at, lane: Math.min(event.lanes - 1, at.lane + 1) }
    case 'ArrowUp':
      return { ...at, lane: Math.max(0, at.lane - 1) }
    case 'Home':
      return { ...at, slot: 0 }
    case 'End':
      return { ...at, slot: lastSlot }
    case 'Escape':
      return null
    default:
      return cursor
  }
}

const STEERING_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Escape'])

/* --------------------------------------------------------------- glyphs -- */

type GlyphDraw = (x: number, y: number, r: number, attrs: Record<string, unknown>) => ReactElement

const GLYPHS: Record<Glyph, GlyphDraw> = {
  dot: (x, y, r, attrs) => <circle {...attrs} cx={x} cy={y} r={r} />,
  box: (x, y, r, attrs) => <rect {...attrs} x={x - r} y={y - r} width={r * 2} height={r * 2} />,
  wedge: (x, y, r, attrs) => <polygon {...attrs} points={`${x},${y - r * 1.2} ${x + r * 1.1},${y + r * 0.9} ${x - r * 1.1},${y + r * 0.9}`} />,
  rhomb: (x, y, r, attrs) => <polygon {...attrs} points={`${x},${y - r * 1.3} ${x + r * 1.3},${y} ${x},${y + r * 1.3} ${x - r * 1.3},${y}`} />,
}

/* --------------------------------------------------------------- layers -- */

interface LayerProps {
  plot: Plot
  frame: Frame
  cursor: Cursor
  say: (reading: number) => string
}

function GridLayer({ plot, frame, say }: LayerProps) {
  const shown = visibleLabelIndices(plot.stops.length, frame.x1 - frame.x0)
  const tickX = frame.rtl ? frame.x1 + 8 : frame.x0 - 8
  return (
    <g className="fk-chart__axes" aria-hidden="true">
      {frame.ticks.map((t) => (
        <g key={t}>
          <line className="fk-chart__grid" x1={frame.x0} x2={frame.x1} y1={frame.valueY(t)} y2={frame.valueY(t)} />
          <text className="fk-chart__tick" x={tickX} y={frame.valueY(t)} textAnchor="end" dominantBaseline="middle">
            {say(t)}
          </text>
        </g>
      ))}
      <line className="fk-chart__baseline" x1={frame.x0} x2={frame.x1} y1={frame.y1} y2={frame.y1} />
      {shown.map((slot) => (
        <text key={slot} className="fk-chart__tick" x={frame.slotX(slot)} y={frame.y1 + 20} textAnchor="middle">
          {plot.stops[slot]}
        </text>
      ))}
    </g>
  )
}

function PinLayer({ plot, frame }: LayerProps) {
  const nudge = frame.rtl ? -4 : 4
  return (
    <g className="fk-chart__annotations">
      {plot.pins.map((pin) => {
        const x = frame.slotX(pin.slot)
        return (
          <g key={`${pin.slot}:${pin.text}`} className="fk-chart__annotation" data-category={plot.stops[pin.slot]}>
            <line x1={x} x2={x} y1={frame.y0} y2={frame.y1} />
            <text x={x + nudge} y={frame.y0 + 10}>
              {pin.text}
            </text>
          </g>
        )
      })}
    </g>
  )
}

function blockTrack(track: Track, lane: number, { plot, frame, cursor }: LayerProps) {
  const flush = plot.stroke.mode === 'block' && plot.stroke.flush
  const lanes = plot.tracks.length
  const group = flush ? frame.slotWidth : frame.slotWidth * 0.78
  const width = flush ? frame.slotWidth : group / lanes
  const leftOf = (slot: number) => {
    const middle = frame.slotX(slot)
    if (flush) return middle - frame.slotWidth / 2
    return frame.rtl ? middle + group / 2 - width * (lane + 1) : middle - group / 2 + width * lane
  }
  return track.readings.map((reading, slot) =>
    reading === null ? null : (
      <rect
        key={slot}
        className="fk-chart__mark fk-chart__bar"
        data-active={(cursor?.slot === slot && cursor.lane === lane) || undefined}
        data-overlap={flush && lanes > 1 ? '' : undefined}
        x={leftOf(slot)}
        y={Math.min(frame.valueY(reading), frame.floorY)}
        width={width}
        height={Math.max(Math.abs(frame.floorY - frame.valueY(reading)), 0.5)}
      />
    ),
  )
}

function pathTrack(track: Track, lane: number, { plot, frame, cursor }: LayerProps) {
  const runs = segments(track.readings.map((reading, slot) => (reading === null ? null : { x: frame.slotX(slot), y: frame.valueY(reading), slot })))
  const fill = plot.stroke.mode === 'path' && plot.stroke.fill
  const draw = GLYPHS[track.glyph]
  const trace = (run: (typeof runs)[number]) => run.map((p, k) => `${k ? 'L' : 'M'}${p.x},${p.y}`).join(' ')
  return (
    <>
      {fill
        ? runs.map((run, k) => (
            <path key={`fill${k}`} className="fk-chart__area" d={`M${run[0]!.x},${frame.floorY} ${trace(run).replace(/^M/, 'L')} L${run.at(-1)!.x},${frame.floorY} Z`} />
          ))
        : null}
      {runs.map((run, k) => (
        <path key={`stroke${k}`} className="fk-chart__line" strokeDasharray={track.dash} d={trace(run)} />
      ))}
      {runs.flat().map((p) => {
        const lit = cursor?.slot === p.slot && cursor.lane === lane
        return <g key={p.slot}>{draw(p.x, p.y, lit ? 5.6 : 3.5, { className: 'fk-chart__mark', 'data-active': lit || undefined })}</g>
      })}
    </>
  )
}

function TrackLayer(props: LayerProps) {
  const drawTrack = props.plot.stroke.mode === 'block' ? blockTrack : pathTrack
  return (
    <g className="fk-chart__marks">
      {props.plot.tracks.map((track, lane) => (
        <g key={track.label} data-series={track.label} data-index={lane} data-kind={props.plot.kind} style={{ color: track.hue }}>
          {drawTrack(track, lane, props)}
        </g>
      ))}
    </g>
  )
}

/** Drawing order: grid under pins under marks. */
const LAYERS = [GridLayer, PinLayer, TrackLayer]

function Key({ plot, name }: { plot: Plot; name: string }) {
  return (
    <ul className="fk-chart__legend" aria-label={name}>
      {plot.tracks.map((track) => (
        <li key={track.label} className="fk-chart__legend-item" style={{ color: track.hue }} data-dashed={track.dash ? '' : undefined}>
          <svg className="fk-chart__swatch" viewBox="0 0 24 12" aria-hidden="true" focusable="false">
            <line x1="1" x2="23" y1="6" y2="6" strokeDasharray={track.dash ? '4 3' : undefined} />
          </svg>
          <span className="fk-chart__legend-name">{track.label}</span>
        </li>
      ))}
    </ul>
  )
}

function TableView({ plot, caption, say, copy }: { plot: Plot; caption: string; say: (v: number) => string; copy: ChartsGeoMessages['chart'] }) {
  const columnOf = (lane: number) => `lane-${lane}`
  return (
    <DataTable
      caption={caption}
      columns={[
        { id: 'stop', header: plot.stopsHeader ?? copy.categoryColumn },
        ...plot.tracks.map((track, lane) => ({ id: columnOf(lane), header: track.label, numeric: true, align: 'end' as const })),
      ]}
      rows={plot.stops.map((stop, slot) => ({
        id: String(slot),
        cells: Object.fromEntries([
          ['stop', stop],
          ...plot.tracks.map((track, lane) => {
            const reading = track.readings[slot] ?? null
            return [columnOf(lane), reading === null ? <span className="fk-chart__missing">{copy.missing}</span> : say(reading)]
          }),
        ]) as Record<string, ReactNode>,
      }))}
    />
  )
}

/* ------------------------------------------------------------ component -- */

/** Accessible figure for a declarative chart, with a complete table view (spec: wave-2/chart.md). */
export function Chart(props: ChartProps) {
  const copy = useMessages().chart
  const { locale, direction } = useLocale()
  const rtl = direction === 'rtl'
  const base = useId()
  const live = props.interactive ?? true
  const plot = useMemo(() => toPlot(props.figure), [props.figure])
  const frame = useMemo(() => frameFor(plot, props.aspect ?? 16 / 9, rtl), [plot, props.aspect, rtl])
  const [ownFace, setOwnFace] = useState<ChartFace>(props.defaultFace ?? 'drawing')
  const view = props.face ?? ownFace
  const [cursor, dispatch] = useReducer(steer, null)
  const canvas = useRef<SVGSVGElement>(null)

  const say = useMemo(() => {
    const digits = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })
    const joiner = new Intl.ListFormat(locale, { type: 'unit', style: 'narrow' })
    const unit = plot.unit
    return (v: number) => (unit ? joiner.format([digits.format(v), unit]) : digits.format(v))
  }, [locale, plot.unit])

  const blank = plot.stops.length === 0 || plot.tracks.length === 0
  const ids = { title: `${base}-title`, hint: `${base}-hint` }

  const readoutText = (() => {
    if (!cursor) return ''
    const track = plot.tracks[cursor.lane]
    const stop = plot.stops[cursor.slot]
    if (!track || stop === undefined) return ''
    const reading = track.readings[cursor.slot] ?? null
    return copy.readout(stop, track.label, reading === null ? copy.missing : say(reading))
  })()

  const chooseView = (next: string) => {
    if (props.face === undefined) setOwnFace(next as ChartFace)
    props.onFaceChange?.(next as ChartFace)
  }

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!STEERING_KEYS.has(event.key)) return
    event.preventDefault()
    dispatch({ type: 'key', key: event.key, rtl, slots: plot.stops.length, lanes: plot.tracks.length })
  }

  const aim = (event: ReactPointerEvent<SVGSVGElement>) => {
    const box = canvas.current?.getBoundingClientRect()
    if (!box?.width) return
    const vx = ((event.clientX - box.left) / box.width) * CANVAS
    const vy = ((event.clientY - box.top) / box.height) * frame.tall
    const along = rtl ? frame.x1 - vx : vx - frame.x0
    const slot = Math.max(0, Math.min(plot.stops.length - 1, Math.floor(along / frame.slotWidth)))
    const nearest = plot.tracks
      .map((track, lane) => ({ lane, reading: track.readings[slot] ?? null }))
      .filter((c): c is { lane: number; reading: number } => c.reading !== null)
      .sort((a, b) => Math.abs(frame.valueY(a.reading) - vy) - Math.abs(frame.valueY(b.reading) - vy))[0]
    dispatch({ type: 'set', to: { slot, lane: nearest?.lane ?? 0 } })
  }

  const layerProps: LayerProps = { plot, frame, cursor, say }

  const plotArea = (): ReactNode => {
    const drawing = (
      <svg
        ref={canvas}
        className="fk-chart__svg"
        viewBox={`0 0 ${CANVAS} ${frame.tall}`}
        preserveAspectRatio="xMidYMid meet"
        direction={rtl ? 'rtl' : 'ltr'}
        role={live ? undefined : 'img'}
        aria-label={live ? undefined : props.figure.heading}
        aria-hidden={live ? true : undefined}
        focusable="false"
        {...(live ? { onPointerMove: aim, onPointerDown: aim, onPointerLeave: () => dispatch({ type: 'set', to: null }) } : {})}
      >
        {LAYERS.map((Layer, depth) => (
          <Layer key={depth} {...layerProps} />
        ))}
      </svg>
    )
    if (!live) {
      return (
        <div className="fk-chart__plot" data-kind={plot.kind}>
          {drawing}
        </div>
      )
    }
    const bubbleAt = cursor ? (rtl ? CANVAS - frame.slotX(cursor.slot) : frame.slotX(cursor.slot)) / CANVAS : 0
    return (
      <div
        className="fk-chart__plot"
        role="group"
        tabIndex={0}
        aria-labelledby={ids.title}
        aria-describedby={ids.hint}
        onKeyDown={onKey}
        onFocus={() => dispatch({ type: 'set', to: cursor ?? { slot: 0, lane: 0 } })}
        onBlur={() => dispatch({ type: 'set', to: null })}
        data-kind={plot.kind}
      >
        {drawing}
        {cursor && readoutText ? (
          <div
            className="fk-chart__readout"
            aria-hidden="true"
            style={{ insetInlineStart: `${bubbleAt * 100}%` }}
            data-edge={cursor.slot > plot.stops.length / 2 ? 'end' : 'start'}
          >
            {readoutText}
          </div>
        ) : null}
        <span id={ids.hint} className="fk-visually-hidden">
          {copy.plotHint(props.figure.heading)}
        </span>
      </div>
    )
  }

  const body: ReactNode = blank ? (
    <EmptyState reason="custom" framing="inline" title={copy.noData} description={copy.noDataHint} headingLevel={4} />
  ) : view === 'table' ? (
    <TableView plot={plot} caption={props.figure.heading} say={say} copy={copy} />
  ) : (
    plotArea()
  )

  const { heading: title, aside: subtitle, reading: finding } = props.figure
  return (
    <figure className={cx('fk-chart', props.className)} aria-labelledby={ids.title} data-view={view} data-kind={plot.kind} data-direction={direction}>
      <figcaption className="fk-chart__caption">
        <span id={ids.title} className="fk-chart__title">
          {title}
        </span>
        {subtitle ? <span className="fk-chart__subtitle">{subtitle}</span> : null}
        {finding ? <span className="fk-chart__finding">{finding}</span> : null}
      </figcaption>
      {blank || props.hideViewSwitch ? null : (
        <div className="fk-chart__tools">
          <SegmentedControl
            size="compact"
            label={copy.viewSwitch}
            options={[
              { value: 'drawing', label: copy.chartView },
              { value: 'table', label: copy.tableView },
            ]}
            value={view}
            onChange={chooseView}
          />
        </div>
      )}
      {!blank && view === 'drawing' ? <Key plot={plot} name={copy.legend} /> : null}
      {body}
      <div className="fk-visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {readoutText}
      </div>
    </figure>
  )
}
