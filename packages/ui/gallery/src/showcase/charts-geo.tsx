// Gallery section for the "charts-geo" group: Chart, ReportView,
// LiveReportView, RegionMap, ToneTint and the region registry.
import { useMemo, useState } from 'react'
import {
  Button,
  Chart,
  LiveReportView,
  RegionMap,
  ReportView,
  brazilRegionTheme,
  createRegionThemeRegistry,
  tintStyle,
  toneNames,
  type ChartFigure,
  type OpenRunStream,
  type Report,
  type RunEvent,
} from '../../../src'
import { Section } from '../Section'

const stages: ChartFigure = {
  form: 'trend',
  heading: 'Days above the PM2.5 limit',
  reading: 'Centro and Harbour stations added up to 37 days above the limit in 2025.',
  across: { field: 'x', caption: 'Year' },
  up: { caption: 'Days', unit: 'days' },
  layers: [{ field: 'Centro' }, { field: 'Harbour' }, { field: 'Projection', projected: true }],
  records: [
    { x: '2022', Centro: 4, Harbour: 1, Projection: 'n/a' },
    { x: '2023', Centro: 9, Harbour: 6, Projection: 'n/a' },
    { x: '2024', Centro: 14, Harbour: 12, Projection: 12 },
    { x: '2025', Centro: 20, Harbour: 17, Projection: 19 },
    { x: '2026', Centro: 'n/a', Harbour: 'n/a', Projection: 25 },
  ],
  notes: [{ at: '2024', text: 'Low-emission zone' }],
}

const bars: ChartFigure = {
  form: 'columns',
  heading: 'Days above the limit by station',
  across: { field: 'x' },
  up: { unit: 'days' },
  layers: [{ field: 'PM2.5' }, { field: 'NO₂' }],
  records: [
    { x: 'Centro', 'PM2.5': 12, 'NO₂': 7 },
    { x: 'Harbour', 'PM2.5': 18, 'NO₂': 9 },
    { x: 'Park', 'PM2.5': 15, 'NO₂': 11 },
    { x: 'North', 'PM2.5': 6, 'NO₂': 2 },
  ],
}

const histogram: ChartFigure = {
  form: 'bins',
  heading: 'Readings per hour',
  across: { field: 'x' },
  layers: [{ field: 'Claims' }],
  records: ['0', '1', '2', '3', '4', '5', '6'].map((x, i) => ({ x, Claims: [3, 8, 14, 22, 17, 9, 4][i]! })),
}

const report: Report = {
  title: 'Days above the limit',
  subtitle: 'Run of 20 Sep 2026, 14:02, edition 2026-09 (fictional data)',
  kpis: [
    { label: 'Days above the limit', value: 94, delta: 4, tone: 'positive' },
    { label: 'Centro and Harbour', value: 37, unit: 'days' },
    { label: 'Proved claims', value: 512, delta: -3, tone: 'negative' },
    { label: 'Pending', value: 145 },
  ],
  charts: [bars, histogram],
  table: {
    title: 'Maintenance budget by station',
    columns: [
      { key: 'case', label: 'Station' },
      { key: 'budget', label: 'Budget', type: 'currency' },
      { key: 'share', label: 'Share', type: 'percent' },
    ],
    rows: [
      { case: 'Centro station', budget: 125000, share: 41.2 },
      { case: 'Harbour station', budget: null, share: 12.5 },
    ],
  },
  recommendation: 'Verify the twelve pending claims of table 2 before freezing the next edition.',
  sections: [
    { kind: 'narrative', title: 'Summary', text: 'Centro and Harbour added up to 37 of the 94 days above the limit; Park fell from 22 to 18.', actor: { kind: 'agent', name: 'limit-counter' }, durationSeconds: 3.4 },
    { kind: 'lifecycle', title: 'Steps', steps: [{ label: 'Load edition', state: 'complete' }, { label: 'Apply rule v2', state: 'current' }, { label: 'Publish', state: 'upcoming' }] },
    { kind: 'score', title: 'Confidence', label: 'Confidence', score: 82, bucket: 'high', reasoning: 'Every value cites an opened station reading.' },
    { kind: 'approval', title: 'Approval', decision: 'pending', by: 'Marina Duarte', prompt: 'Freeze edition 2026-10?' },
    { kind: 'note', tone: 'warning', text: 'Two station readings are archived copies.' },
    { kind: 'hologram', title: 'Unknown kind', payload: { x: 1 } },
  ],
  meta: { 'Generated at': '2026-09-20 14:02', Source: 'edition 2026-09' },
}

/** A scripted transport that plays a short run, for the gallery only. */
const scriptedStream: OpenRunStream = (_flow, _run, cb) => {
  const script: RunEvent[] = [
    { type: 'run.started' },
    { type: 'step.started', stepId: 'load', stepKind: 'datasource' },
    { type: 'step.completed', stepId: 'load', report: { title: 'Live count', kpis: [{ label: 'Days above the limit', value: 94 }] } },
    { type: 'step.started', stepId: 'classify', stepKind: 'rule' },
    { type: 'step.error', stepId: 'classify', message: 'Rule v1 is retired; using v2' },
    { type: 'step.started', stepId: 'count', stepKind: 'compute' },
    { type: 'step.completed', stepId: 'count', report: { sections: [{ kind: 'note', text: 'Harbour station: 17 days.' }] } },
    { type: 'run.paused', stepId: 'gate', prompt: 'Publish the result to the edition?' },
  ]
  const timers = script.map((e, i) => setTimeout(() => cb.event(e), 500 * (i + 1)))
  cb.connected()
  return () => timers.forEach(clearTimeout)
}

// Abstract demonstration geometry (not a real country): six squares.
const demoRegions = ['N', 'NE', 'E', 'S', 'W', 'C'] as const
const demoNames: Record<string, string> = { N: 'North sector', NE: 'North-east sector', E: 'East sector', S: 'South sector', W: 'West sector', C: 'Central sector' }
const demoCells: Record<string, [number, number]> = { N: [0, 4], NE: [4, 4], E: [4, 0], S: [0, -4], W: [-4, 0], C: [0, 0] }
const demoShapes = {
  type: 'FeatureCollection',
  features: demoRegions.map((code) => {
    const [x, y] = demoCells[code]!
    return {
      type: 'Feature',
      properties: { code },
      geometry: { type: 'Polygon', coordinates: [[[x - 2, y - 2], [x - 2, y + 2], [x + 2, y + 2], [x + 2, y - 2], [x - 2, y - 2]]] },
    }
  }),
}
const demoUrl = `data:application/geo+json,${encodeURIComponent(JSON.stringify(demoShapes))}`
const demoItems = [...'NNNNNNEEEECCCCCCCCSSWNE'].map((c, i) => ({ id: i, code: c === 'W' ? 'W' : c }))


const brazilStates = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
const brDemoItems = Array.from({ length: 50 }, (_, i) => ({ id: i, code: brazilStates[i % brazilStates.length]! }))
const brCentres: Record<string, readonly [number, number]> = { 'DF': [-47.88, -15.79], 'SP': [-46.63, -23.55], 'RJ': [-43.17, -22.90], 'AM': [-60.02, -3.11] } // A few centres for markers if needed

export function ChartsGeoShowcase({ scope }: { scope: string }) {
  const id = (s: string) => `${scope}-${s}`
  const [active, setActive] = useState<Set<string>>(new Set(['C']))
  const [runKey, setRunKey] = useState(0)
  const registry = useMemo(() => {
    const r = createRegionThemeRegistry()
    r.register(brazilRegionTheme)
    return r
  }, [])

  return (
    <div className="ty-gallery-showcase">
      <Section id={id('chart-trend')} title="Chart: Line/Trend">
        <Chart figure={stages} />
      </Section>
      <Section id={id('chart-bars')} title="Chart: Bar/Columns">
        <Chart figure={bars} />
      </Section>
      <Section id={id('chart-histogram')} title="Chart: Histogram (Table view)">
        <Chart figure={histogram} defaultFace="table" />
      </Section>
      <Section id={id('chart-empty')} title="Chart: Empty">
        <Chart figure={{ ...bars, heading: 'Empty chart', records: [] }} />
      </Section>

      <Section id={id('report')} title="ReportView">
        <ReportView report={report} currency="BRL" />
      </Section>

      <Section id={id('live')} title="LiveReportView">
        <Button size="compact" onPress={() => setRunKey((k) => k + 1)}>
          Replay the run
        </Button>
        <LiveReportView key={runKey} flowId="limit-count" runId={`run-${runKey}`} openStream={scriptedStream} interactive submitInput={async () => {}} />
      </Section>

      <Section id={id('map')} title="RegionMap (abstract demo geometry)">
        <RegionMap
          items={demoItems}
          getRegionCode={(i) => i.code}
          regionCentres={Object.fromEntries(demoRegions.map((c) => [c, demoCells[c]!]))}
          shapesUrl={demoUrl}
          projection="equal-area"
          getRegionName={(c) => demoNames[c] ?? c}
          isRegionActive={(c) => active.has(c)}
          onRegionToggle={(c) =>
            setActive((s) => {
              const n = new Set(s)
              if (n.has(c)) n.delete(c)
              else n.add(c)
              return n
            })
          }
          renderRegionDetail={(code, list) => (
            <p>
              {demoNames[code]}: {list.length} cases
            </p>
          )}
          formatCounter={(t) => `${t.items} cases in ${t.regions} regions, ${t.active} selected as filter`}
          legendLimit={4}
        />
      </Section>

      
      <Section id={id('map-brazil')} title="Map of Brazil (Equal Earth Projection)">
        <RegionMap
          items={brDemoItems}
          getRegionCode={(i) => i.code}
          regionCentres={brCentres}
          shapesUrl="/maps/brazil-states.geojson"
          detailPosition="bottom-right"
          regionProperty="sigla"
          projection="equal-area"
          getRegionName={(c) => registry.getSubdivision('BR', c)?.name.local ?? c}
          getRegionTone={(c) => {
            const regions = registry.getMacroRegions('BR')
            const macro = regions?.find((r) => r.codes.includes(c))
            const mapping: Record<string, any> = {
              north: 'categorical-1',
              northeast: 'categorical-2',
              'central-west': 'categorical-3',
              southeast: 'categorical-4',
              south: 'categorical-5'
            }
            return macro ? mapping[macro.id] : 'neutral'
          }}
          getRegionFlag={(c) => `/flags/${c}.svg`}
          isRegionActive={(c) => active.has(c)}
          onRegionToggle={(c) =>
            setActive((s) => {
              const n = new Set(s)
              if (n.has(c)) n.delete(c)
              else n.add(c)
              return n
            })
          }
          renderRegionDetail={(code, list) => (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <img src={`/flags/${code}.svg`} alt={code} style={{ width: '24px', borderRadius: '2px', border: '1px solid var(--ty-line)' }} />
              <p style={{ margin: 0 }}>
                {registry.getSubdivision('BR', code)?.name.local ?? code}: {list.length} cases
              </p>
            </div>
          )}
          formatCounter={(t) => `${t.items} cases in ${t.regions} regions`}
        />
      </Section>

      <Section id={id('tint')} title="ToneTint">
        <div className="ty-gallery-row">
          {toneNames.map((t) => (
            <span key={t} data-ty-tinted="" style={{ ...tintStyle(t), padding: '8px 12px', border: '1px solid', borderRadius: 10 }}>
              {t}
            </span>
          ))}
        </div>
      </Section>

      <Section id={id('regions')} title="RegionThemeRegistry (Brazil: ISO 3166-2 codes and macro-regions)">
        {registry.getMacroRegions('BR')?.map((g) => (
          <p key={g.id}>
            <strong>{g.id}</strong>: {g.codes.map((c) => registry.getSubdivision('BR', c)?.name.local).join(', ')}
          </p>
        ))}
      </Section>
    </div>
  )
}
