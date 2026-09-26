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
  type ChartSpec,
  type OpenRunStream,
  type Report,
  type RunEvent,
} from '../../../src'
import { Section } from '../Section'

const stages: ChartSpec = {
  type: 'line',
  title: 'Cases by stage',
  finding: 'Stages 3 and 4 add up to 37 of the 94 cases.',
  xAxis: { key: 'x', label: 'Year' },
  yAxis: { label: 'Cases', unit: 'cases' },
  series: [{ name: 'Stage 3' }, { name: 'Stage 4' }, { name: 'Projection', dashed: true }],
  data: [
    { x: '2022', 'Stage 3': 4, 'Stage 4': 1, Projection: 'n/a' },
    { x: '2023', 'Stage 3': 9, 'Stage 4': 6, Projection: 'n/a' },
    { x: '2024', 'Stage 3': 14, 'Stage 4': 12, Projection: 12 },
    { x: '2025', 'Stage 3': 20, 'Stage 4': 17, Projection: 19 },
    { x: '2026', 'Stage 3': 'n/a', 'Stage 4': 'n/a', Projection: 25 },
  ],
  annotations: [{ x: '2024', label: 'Rule v2' }],
}

const bars: ChartSpec = {
  type: 'bar',
  title: 'Capability by region',
  xAxis: { key: 'x' },
  yAxis: { unit: 'cases' },
  series: [{ name: 'Informs' }, { name: 'Transacts' }],
  data: [
    { x: 'Americas', Informs: 12, Transacts: 7 },
    { x: 'Europe', Informs: 18, Transacts: 9 },
    { x: 'Asia', Informs: 15, Transacts: 11 },
    { x: 'Africa', Informs: 6, Transacts: 2 },
  ],
}

const histogram: ChartSpec = {
  type: 'histogram',
  title: 'Answers per claim',
  xAxis: { key: 'x' },
  yAxis: {},
  series: [{ name: 'Claims' }],
  data: ['0', '1', '2', '3', '4', '5', '6'].map((x, i) => ({ x, Claims: [3, 8, 14, 22, 17, 9, 4][i]! })),
}

const report: Report = {
  title: 'Count by stage',
  subtitle: 'Run of 20 Sep 2026, 14:02, edition 2026-09-20',
  kpis: [
    { label: 'Cases', value: 94, delta: 4, tone: 'positive' },
    { label: 'Stage 3 and 4', value: 37, unit: 'cases' },
    { label: 'Proved claims', value: 512, delta: -3, tone: 'negative' },
    { label: 'Pending', value: 145 },
  ],
  charts: [bars, histogram],
  table: {
    title: 'Budget by case',
    columns: [
      { key: 'case', label: 'Case' },
      { key: 'budget', label: 'Budget', type: 'currency' },
      { key: 'share', label: 'Share', type: 'percent' },
    ],
    rows: [
      { case: 'Case A', budget: 125000, share: 41.2 },
      { case: 'Case B', budget: null, share: 12.5 },
    ],
  },
  recommendation: 'Verify the twelve pending claims of table 2 before freezing the next edition.',
  sections: [
    { kind: 'narrative', title: 'Summary', text: 'Stages 3 and 4 add up to 37 of the 94 cases; stage 1 fell from 22 to 18.', actor: { kind: 'agent', name: 'stage-counter' }, durationSeconds: 3.4 },
    { kind: 'lifecycle', title: 'Steps', steps: [{ label: 'Load edition', state: 'complete' }, { label: 'Apply rule v2', state: 'current' }, { label: 'Publish', state: 'upcoming' }] },
    { kind: 'score', title: 'Confidence', label: 'Confidence', score: 82, bucket: 'high', reasoning: 'Every value cites an open source.' },
    { kind: 'approval', title: 'Approval', decision: 'pending', by: 'Author', prompt: 'Freeze edition 2026-09-27?' },
    { kind: 'note', tone: 'warning', text: 'Two sources are archived copies.' },
    { kind: 'hologram', title: 'Unknown kind', payload: { x: 1 } },
  ],
  meta: { 'Generated at': '2026-09-20 14:02', Source: 'edition 2026-09-20' },
}

/** A scripted transport that plays a short run, for the gallery only. */
const scriptedStream: OpenRunStream = (_flow, _run, cb) => {
  const script: RunEvent[] = [
    { type: 'run.started' },
    { type: 'step.started', stepId: 'load', stepKind: 'datasource' },
    { type: 'step.completed', stepId: 'load', report: { title: 'Live count', kpis: [{ label: 'Cases', value: 94 }] } },
    { type: 'step.started', stepId: 'classify', stepKind: 'rule' },
    { type: 'step.error', stepId: 'classify', message: 'Rule v1 is retired; using v2' },
    { type: 'step.started', stepId: 'count', stepKind: 'compute' },
    { type: 'step.completed', stepId: 'count', report: { sections: [{ kind: 'note', text: 'Stage 4: 17 cases.' }] } },
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
    <div className="fk-gallery-showcase">
      <Section id={id('chart')} title="Chart (line, bar, histogram; table view)">
        <Chart spec={stages} />
        <Chart spec={bars} />
        <Chart spec={histogram} defaultView="table" />
        <Chart spec={{ ...bars, title: 'Empty chart', data: [] }} />
      </Section>

      <Section id={id('report')} title="ReportView">
        <ReportView report={report} currency="BRL" />
      </Section>

      <Section id={id('live')} title="LiveReportView">
        <Button size="compact" onPress={() => setRunKey((k) => k + 1)}>
          Replay the run
        </Button>
        <LiveReportView key={runKey} flowId="stage-count" runId={`run-${runKey}`} openStream={scriptedStream} interactive submitInput={async () => {}} />
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

      <Section id={id('tint')} title="ToneTint">
        <div className="fk-gallery-row">
          {toneNames.map((t) => (
            <span key={t} data-fk-tinted="" style={{ ...tintStyle(t), padding: '8px 12px', border: '1px solid', borderRadius: 10 }}>
              {t}
            </span>
          ))}
        </div>
      </Section>

      <Section id={id('regions')} title="RegionThemeRegistry (Brazil: ISO 3166-2 codes, IBGE macro-regions)">
        {registry.getMacroRegions('BR')?.map((g) => (
          <p key={g.id}>
            <strong>{g.id}</strong>: {g.codes.map((c) => registry.getSubdivision('BR', c)?.name.local).join(', ')}
          </p>
        ))}
      </Section>
    </div>
  )
}
