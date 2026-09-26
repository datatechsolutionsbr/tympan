// Gallery: the shape of an analysis workflow as a DAG (start, data source,
// compute, a decision step of backlog B-002, a rule, a report). All names,
// values, probabilities and counts are neutral sample data.

import { useMemo, useState } from 'react'
import { FakhirProvider, Tag, SegmentedControl, messagesPtBR } from '@fakhir/design-system'
import { installNodeCatalog, type NodeKindEntry } from '../../../src/catalog/kindCatalog'
import { FlowEditor } from '../../../src/editor/FlowEditor'
import type { FlowGraph } from '../../../src/model/types'
import type { RunSummary } from '../../../src/run/types'
import { createFlowEditorStore } from '../../../src/state/editorState'

type Locale = 'pt-BR' | 'en' | 'ar' | 'ja'

// Sample data only (project rule: no invented research data). Every name,
// value, probability, model and count below is a neutral placeholder.
const TEXT: Record<Locale, Record<string, string>> = {
  'pt-BR': {
    badge: 'Dados de exemplo', title: 'Análise de exemplo', start: 'Início', source: 'Fonte de dados A', rule: 'Regra de exemplo', decision: 'Decisão de exemplo',
    check: 'Regra de consistência de exemplo', report: 'Relatório de exemplo', end: 'Fim', note: 'Fluxo de exemplo: nomes e valores são marcadores.', group: 'Grupo de exemplo',
    confirmed_primary: 'Opção A', confirmed_secondary: 'Opção B', not_confirmed: 'Opção C', rulename: 'Regra de exemplo',
  },
  en: {
    badge: 'Sample data', title: 'Sample analysis', start: 'Start', source: 'Data source A', rule: 'Sample rule', decision: 'Sample decision',
    check: 'Sample consistency rule', report: 'Sample report', end: 'End', note: 'Sample flow: names and values are placeholders.', group: 'Sample group',
    confirmed_primary: 'Option A', confirmed_secondary: 'Option B', not_confirmed: 'Option C', rulename: 'Sample rule',
  },
  ar: {
    badge: 'بيانات تجريبية', title: 'تحليل تجريبي', start: 'البداية', source: 'مصدر بيانات أ', rule: 'قاعدة تجريبية', decision: 'قرار تجريبي',
    check: 'قاعدة اتساق تجريبية', report: 'تقرير تجريبي', end: 'النهاية', note: 'مسار تجريبي: الأسماء والقيم عناصر نائبة.', group: 'مجموعة تجريبية',
    confirmed_primary: 'الخيار أ', confirmed_secondary: 'الخيار ب', not_confirmed: 'الخيار ج', rulename: 'قاعدة تجريبية',
  },
  ja: {
    badge: 'サンプルデータ', title: 'サンプル分析', start: '開始', source: 'データソース A', rule: 'サンプル規則', decision: 'サンプル判断',
    check: 'サンプル整合性ルール', report: 'サンプルレポート', end: '終了', note: 'サンプルのフロー：名前と値はプレースホルダー。', group: 'サンプルグループ',
    confirmed_primary: '選択肢 A', confirmed_secondary: '選択肢 B', not_confirmed: '選択肢 C', rulename: 'サンプル規則',
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
      { id: 'start', kind: 'start', position: { x: 0, y: 0 }, data: { label: t.start, inputVariables: ['edition'], inputDefaults: { edition: '[edição]' } } },
      { id: 'source', kind: 'datasource', position: { x: 0, y: 150 }, data: { label: t.source, sourceId: 'source-a', dialect: 'postgresql', table: 'tabela_a', selectedColumns: ['col_a', 'col_b', 'col_c'], filters: [{ column: 'edition', operator: 'equals', value: '{{start.edition}}' }], limit: 5000 } },
      { id: 'coding', kind: 'group', position: { x: -40, y: 360 }, size: { width: 400, height: 470 }, data: { name: t.group, tone: 'categorical-3', expanded: true, autoFit: true } },
      { id: 'rule', kind: 'code', parentId: 'coding', position: { x: 40, y: 64 }, data: { label: t.rule, operation: 'map' } },
      { id: 'decision', kind: 'decision', parentId: 'coding', position: { x: 40, y: 214 }, data: { label: t.decision, input: { ref: 'item.value' }, options: [{ value: 'option_a', label: t.confirmed_primary }, { value: 'option_b', label: t.confirmed_secondary }, { value: 'option_c', label: t.not_confirmed }], provider: '[provedor]', model: '[modelo]', modelVersion: '[versão]', threshold: 0.6 } },
      { id: 'check', kind: 'rule', position: { x: 440, y: 580 }, data: { label: t.check, ruleId: 'r-sample' } },
      { id: 'report', kind: 'report-output', position: { x: 0, y: 900 }, data: { label: t.report, from: 'sample.report' } },
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
    id: 'run-sample-2',
    status: 'COMPLETED',
    startedAt: '2026-01-02T10:00:00Z',
    durationMs: 3400,
    nodeResults: [
      { nodeId: 'source', status: 'completed', durationMs: 200, outputs: { rows: 30 } },
      { nodeId: 'rule', status: 'completed', durationMs: 1100, outputs: { coded: 30 } },
      { nodeId: 'decision', status: 'completed', durationMs: 1700, outputs: { usage: { input_tokens: 5200, output_tokens: 310 } } },
      { nodeId: 'report', status: 'completed', durationMs: 400, outputs: { a: 12, b: 18 } },
    ],
  } as RunSummary,
  { id: 'run-sample-1', status: 'FAILED', startedAt: '2026-01-01T10:00:00Z', durationMs: 900, nodeResults: [{ nodeId: 'decision', status: 'failed', error: '[erro de exemplo]' }] } as RunSummary,
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
        <Tag tone="accent">{t.badge}</Tag>
        <SegmentedControl label="Idioma / Language" size="compact" options={['pt-BR', 'en', 'ar', 'ja']} value={locale} onChange={(v) => setLocale(v as Locale)} />
      </div>
      <FakhirProvider locale={locale} {...(locale === 'pt-BR' ? { baseMessages: messagesPtBR } : {})}>
        <div className="fk-gallery-page__stage">
          <FlowEditor
            key={locale}
            flowId="sample-analysis"
            store={store}
            reference={{
              rules: [{ id: 'r-sample', name: t.rulename ?? '', priority: 1, enabled: true, categories: ['sample'] }],
              dataSources: [{ id: 'source-a', name: t.source ?? '', dialect: 'postgresql', connected: true }],
              dialects: [{ key: 'postgresql', displayName: 'PostgreSQL' }],
              decisionResults: {
                decision: { value: 'option_a', probabilities: { option_a: 0.6, option_b: 0.3, option_c: 0.1 }, provider: '[provedor]', model: '[modelo]', modelVersion: '[versão]' },
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
