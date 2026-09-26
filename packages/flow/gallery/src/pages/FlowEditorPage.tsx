// Gallery: an analysis workflow of the research platform as a DAG. It reads
// the frozen census edition, applies the coding rule, asks a model to decide
// the regulatory position of each case (decision step, backlog B-002),
// checks the rule and publishes a stage count. Placeholder ids throughout.

import { useMemo, useState } from 'react'
import { FakhirProvider, SegmentedControl, messagesPtBR } from '@fakhir/design-system'
import { installNodeCatalog, type NodeKindEntry } from '../../../src/catalog/kindCatalog'
import { FlowEditor } from '../../../src/editor/FlowEditor'
import type { FlowGraph } from '../../../src/model/types'
import type { RunSummary } from '../../../src/run/types'
import { createFlowEditorStore } from '../../../src/state/editorState'

type Locale = 'pt-BR' | 'en' | 'ar' | 'ja'

const TEXT: Record<Locale, Record<string, string>> = {
  'pt-BR': {
    title: 'Análise: contagem por estágio', start: 'Início', source: 'Edição congelada do censo', rule: 'Aplicar regra de codificação v2', decision: 'Posição regulatória do operador',
    check: 'Regra de consistência', report: 'Contagem por estágio', end: 'Fim', note: 'Usa só a edição 2026-09-20; nada ao vivo.', group: 'Codificação',
    confirmed_primary: 'Confirmada, primária', confirmed_secondary: 'Confirmada, secundária', not_confirmed: 'Não confirmada', rulename: 'Consistência de estágio',
  },
  en: {
    title: 'Analysis: count by stage', start: 'Start', source: 'Frozen census edition', rule: 'Apply coding rule v2', decision: 'Operator regulatory position',
    check: 'Consistency rule', report: 'Count by stage', end: 'End', note: 'Reads only edition 2026-09-20; nothing live.', group: 'Coding',
    confirmed_primary: 'Confirmed, primary', confirmed_secondary: 'Confirmed, secondary', not_confirmed: 'Not confirmed', rulename: 'Stage consistency',
  },
  ar: {
    title: 'تحليل: العدد حسب المرحلة', start: 'البداية', source: 'نسخة التعداد المجمدة', rule: 'تطبيق قاعدة الترميز', decision: 'الموقف التنظيمي للمشغّل',
    check: 'قاعدة الاتساق', report: 'العدد حسب المرحلة', end: 'النهاية', note: 'تقرأ النسخة 2026-09-20 فقط.', group: 'الترميز',
    confirmed_primary: 'مؤكد، أساسي', confirmed_secondary: 'مؤكد، ثانوي', not_confirmed: 'غير مؤكد', rulename: 'اتساق المراحل',
  },
  ja: {
    title: '分析: 段階別の件数', start: '開始', source: '凍結された国勢調査版', rule: 'コーディング規則を適用', decision: '事業者の規制上の位置づけ',
    check: '整合性ルール', report: '段階別の件数', end: '終了', note: '2026-09-20 版のみを読み込みます。', group: 'コーディング',
    confirmed_primary: '確認済み（主）', confirmed_secondary: '確認済み（従）', not_confirmed: '未確認', rulename: '段階の整合性',
  },
}

const CATALOG: NodeKindEntry[] = [
  { kind: 'start', label: 'Start', category: 'Control flow', icon: 'play', formKind: 'start' },
  { kind: 'end', label: 'End', category: 'Control flow', icon: 'flag' },
  { kind: 'if-else', label: 'Branch', category: 'Control flow', icon: 'git-branch' },
  { kind: 'code', label: 'Compute', category: 'Data processing', icon: 'square-function', defaultConfig: { operation: 'pass' }, formKind: 'compute' },
  { kind: 'datasource', label: 'Data source', category: 'Data processing', icon: 'database', formKind: 'datasource' },
  { kind: 'decision', label: 'Decision', category: 'AI', icon: 'target', formKind: 'decision' },
  { kind: 'agent', label: 'Agent', category: 'AI', icon: 'bot', formKind: 'agent' },
  { kind: 'rule', label: 'Rule', category: 'Control flow', icon: 'scale', formKind: 'rule' },
  { kind: 'report-output', label: 'Report', category: 'Output', icon: 'file-chart-column', formKind: 'report-output' },
  { kind: 'note', label: 'Note', category: 'Annotation', icon: 'sticky-note' },
  { kind: 'group', label: 'Group', category: 'Annotation', icon: 'group', formKind: 'group' },
]
installNodeCatalog(CATALOG)

function buildGraph(t: Record<string, string>): FlowGraph {
  return {
    nodes: [
      { id: 'start', kind: 'start', position: { x: 0, y: 0 }, data: { label: t.start, inputVariables: ['edition'], inputDefaults: { edition: '2026-09-20' } } },
      { id: 'source', kind: 'datasource', position: { x: 0, y: 150 }, data: { label: t.source, sourceId: 'census', dialect: 'postgresql', table: 'assertions', selectedColumns: ['case_id', 'key', 'value'], filters: [{ column: 'edition', operator: 'equals', value: '{{start.edition}}' }], limit: 5000 } },
      { id: 'coding', kind: 'group', position: { x: -40, y: 360 }, size: { width: 400, height: 470 }, data: { name: t.group, tone: 'categorical-3', expanded: true, autoFit: true } },
      { id: 'rule', kind: 'code', parentId: 'coding', position: { x: 40, y: 64 }, data: { label: t.rule, operation: 'map' } },
      { id: 'decision', kind: 'decision', parentId: 'coding', position: { x: 40, y: 214 }, data: { label: t.decision, input: { ref: 'assertion.value' }, options: [{ value: 'confirmed_primary', label: t.confirmed_primary }, { value: 'confirmed_secondary', label: t.confirmed_secondary }, { value: 'not_confirmed', label: t.not_confirmed }], provider: 'provider-a', model: 'family-large', modelVersion: '2026-06-01', threshold: 0.6 } },
      { id: 'check', kind: 'rule', position: { x: 440, y: 580 }, data: { label: t.check, ruleId: 'r-stage' } },
      { id: 'report', kind: 'report-output', position: { x: 0, y: 900 }, data: { label: t.report, from: 'count.report' } },
      { id: 'end', kind: 'end', position: { x: 0, y: 1050 }, data: { label: t.end } },
      { id: 'note', kind: 'note', position: { x: 420, y: 150 }, size: { width: 240, height: 120 }, data: { text: t.note, tone: 'categorical-5' } },
    ],
    connectors: [
      { id: 'c1', source: 'start', target: 'source' },
      { id: 'c2', source: 'source', target: 'rule' },
      { id: 'c3', source: 'rule', target: 'decision' },
      { id: 'c4', source: 'decision', target: 'report', label: t.confirmed_primary },
      { id: 'c5', source: 'check', target: 'decision', sourcePort: 'rule' },
      { id: 'c6', source: 'report', target: 'end' },
    ],
    viewport: { x: 0, y: 0, zoom: 1 },
  }
}

const RUNS: RunSummary[] = [
  {
    id: 'run-2026-09-20-1402',
    status: 'COMPLETED',
    startedAt: '2026-09-20T14:02:00Z',
    durationMs: 3400,
    nodeResults: [
      { nodeId: 'source', status: 'completed', durationMs: 200, outputs: { rows: 94 } },
      { nodeId: 'rule', status: 'completed', durationMs: 1100, outputs: { coded: 94 } },
      { nodeId: 'decision', status: 'completed', durationMs: 1700, outputs: { usage: { input_tokens: 5200, output_tokens: 310 } } },
      { nodeId: 'report', status: 'completed', durationMs: 400, outputs: { stage3: 20, stage4: 17 } },
    ],
  } as RunSummary,
  { id: 'run-2026-09-19-0911', status: 'FAILED', startedAt: '2026-09-19T09:11:00Z', durationMs: 900, nodeResults: [{ nodeId: 'decision', status: 'failed', error: 'model version unavailable' }] } as RunSummary,
]

export function FlowEditorPage() {
  const [locale, setLocale] = useState<Locale>('pt-BR')
  const t = TEXT[locale]
  const rtl = locale === 'ar'
  // One editor per locale so the sample titles follow the switch.
  const store = useMemo(() => {
    const g = buildGraph(t)
    const s = createFlowEditorStore({ initial: { nodes: g.nodes, connectors: g.connectors, layoutDirection: 'down' } })
    s.actions.setNodeResult('source', { status: 'success', durationMs: 200 })
    s.actions.setNodeResult('rule', { status: 'success', durationMs: 1100 })
    s.actions.setNodeResult('decision', { status: 'running' })
    return s
  }, [t])

  return (
    <div className="fk-gallery-page" lang={locale} dir={rtl ? 'rtl' : 'ltr'}>
      <div className="fk-gallery-page__bar">
        <h1>{t.title}</h1>
        <SegmentedControl label="Idioma / Language" size="compact" options={['pt-BR', 'en', 'ar', 'ja']} value={locale} onChange={(v) => setLocale(v as Locale)} />
      </div>
      <FakhirProvider locale={locale} {...(locale === 'pt-BR' ? { baseMessages: messagesPtBR } : {})}>
        <div className="fk-gallery-page__stage">
          <FlowEditor
            key={locale}
            flowId="analysis-stage-count"
            store={store}
            reference={{
              rules: [{ id: 'r-stage', name: t.rulename ?? '', priority: 1, enabled: true, categories: ['coding'] }],
              dataSources: [{ id: 'census', name: 'census-api', dialect: 'postgresql', connected: true }],
              dialects: [{ key: 'postgresql', displayName: 'PostgreSQL' }],
              decisionResults: {
                decision: { value: 'confirmed_primary', probabilities: { confirmed_primary: 0.82, confirmed_secondary: 0.13, not_confirmed: 0.05 }, provider: 'provider-a', model: 'family-large', modelVersion: '2026-06-01' },
              },
            }}
            defaultOutlineOpen
            runs={{ loadRuns: async () => RUNS, defaultRunView: { mode: 'panel', open: true } }}
          />
        </div>
      </FakhirProvider>
    </div>
  )
}
