// Gallery: an analysis flow of research steps. Known values only: the frozen
// edition 2026-09-20 with 582 records and the counts per phase 9 · 26 · 24 ·
// 18. Everything else (criteria, captions, phase names, version, seed) is a
// neutral placeholder, and the page carries the "Dados de exemplo" badge.

import { useMemo, useState } from 'react'
import { FakhirProvider, SegmentedControl, Switch, Tag, messagesPtBR } from '@fakhir/design-system'
import { FlowEditor } from '../../../src/editor/FlowEditor'
import { autoLayout } from '../../../src/layout/autoLayout'
import type { FlowConnector, FlowNode } from '../../../src/model/types'
import type { RunSummary } from '../../../src/run/types'
import { createFlowEditorStore } from '../../../src/state/editorState'

type Locale = 'pt-BR' | 'en' | 'ar' | 'ja'

const TEXT: Record<Locale, Record<string, string>> = {
  'pt-BR': { badge: 'Dados de exemplo', title: 'Análise de exemplo', group: 'Agrupar por país e fase', count: 'Contagem por fase', keys: 'país, fase', phaseColumn: 'fase', criterion: '[critério]', caption: '[legenda]', phase: '[fase {n}]', broken: 'Mostrar uma ligação incompatível', noAgents: 'Projeto sem agentes' },
  en: { badge: 'Sample data', title: 'Sample analysis', group: 'Group by country and phase', count: 'Count per phase', keys: 'country, phase', phaseColumn: 'phase', criterion: '[criterion]', caption: '[caption]', phase: '[phase {n}]', broken: 'Show a mismatched link', noAgents: 'Project without agents' },
  ar: { badge: 'بيانات تجريبية', title: 'تحليل تجريبي', group: 'تجميع حسب البلد والمرحلة', count: 'العدد حسب المرحلة', keys: 'البلد، المرحلة', phaseColumn: 'المرحلة', criterion: '[معيار]', caption: '[تعليق]', phase: '[المرحلة {n}]', broken: 'إظهار رابط غير متوافق', noAgents: 'مشروع بلا وكلاء' },
  ja: { badge: 'サンプルデータ', title: 'サンプル分析', group: '国と段階でグループ化', count: '段階ごとの件数', keys: '国, 段階', phaseColumn: '段階', criterion: '[条件]', caption: '[キャプション]', phase: '[段階 {n}]', broken: '不整合なリンクを表示', noAgents: 'エージェントなしのプロジェクト' },
}

const COUNTS = [9, 26, 24, 18]

const link = (id: string, source: string, target: string): FlowConnector => ({ id, source, target, sourcePort: 'out', targetPort: 'in-0' })

function buildFlow(t: Record<string, string>, broken: boolean): { nodes: FlowNode[]; connectors: FlowConnector[] } {
  const at = { x: 0, y: 0 }
  const nodes: FlowNode[] = [
    { id: 'edition', kind: 'step', position: at, data: { stepId: 'frozen-edition', edition: '2026-09-20', count: 582 } },
    { id: 'filter', kind: 'step', position: at, data: { stepId: 'filter', criterion: t.criterion, before: 582, after: '[n]' } },
    { id: 'group', kind: 'step', position: at, data: { stepId: 'group', label: t.group, keys: t.keys } },
    { id: 'count', kind: 'step', position: at, data: { stepId: 'describe', label: t.count, counts: COUNTS.join(' · ') } },
    { id: 'table', kind: 'step', position: at, data: { stepId: 'citable-table', caption: t.caption } },
    { id: 'chart', kind: 'step', position: at, data: { stepId: 'citable-chart', caption: t.caption } },
  ]
  const connectors = [link('l1', 'edition', 'filter'), link('l2', 'filter', 'group'), link('l3', 'group', 'count'), link('l4', 'count', 'table'), link('l5', 'count', 'chart')]
  if (broken) {
    nodes.push({ id: 'number', kind: 'step', position: at, data: { stepId: 'manuscript-number' } })
    connectors.push(link('l6', 'table', 'number'))
  }
  // Unplaced steps: lay them out once, top to bottom.
  return { nodes: autoLayout(nodes.map((n) => ({ ...n, size: { width: 250, height: 86 } })), connectors, 'top-down'), connectors }
}

const RUNS: RunSummary[] = [
  { id: 'run-sample-2', status: 'COMPLETED', startedAt: '2026-01-02T10:00:00Z', durationMs: 3400, nodeResults: [] } as RunSummary,
  { id: 'run-sample-1', status: 'COMPLETED', startedAt: '2026-01-01T10:00:00Z', durationMs: 3100, nodeResults: [] } as RunSummary,
]

export function FlowEditorPage() {
  const [locale, setLocale] = useState<Locale>('pt-BR')
  const [broken, setBroken] = useState(false)
  const [noAgents, setNoAgents] = useState(false)
  const t = TEXT[locale]
  const rtl = locale === 'ar'
  // One editor per locale and example so the sample titles follow the switch.
  const store = useMemo(() => {
    const g = buildFlow(t, broken)
    const s = createFlowEditorStore({ initial: { nodes: g.nodes, connectors: g.connectors, layoutDirection: 'down' } })
    for (const id of ['edition', 'filter', 'group', 'count']) s.actions.setNodeResult(id, { status: 'success' })
    s.actions.setNodeResult('table', { status: 'running' })
    return s
  }, [t, broken])

  return (
    <div className="fk-gallery-page" lang={locale} dir={rtl ? 'rtl' : 'ltr'}>
      <div className="fk-gallery-page__bar">
        <h1>{t.title}</h1>
        <Tag tone="accent">{t.badge}</Tag>
        <SegmentedControl label="Idioma / Language" size="compact" options={['pt-BR', 'en', 'ar', 'ja']} value={locale} onChange={(v) => setLocale(v as Locale)} />
        <Switch label={t.broken} size="small" isSelected={broken} onChange={setBroken} />
        <Switch label={t.noAgents} size="small" isSelected={noAgents} onChange={setNoAgents} />
      </div>
      <FakhirProvider locale={locale} {...(locale === 'pt-BR' ? { baseMessages: messagesPtBR } : {})}>
        <div className="fk-gallery-page__stage">
          <FlowEditor
            key={`${locale}-${broken}`}
            flowId="sample-analysis"
            store={store}
            agentsAllowed={!noAgents}
            flowFacts={{ version: '[versão]', runsOverEdition: RUNS.length, deterministic: true, seed: '[semente]' }}
            onRunFlow={() => undefined}
            onTestStep={() => undefined}
            outputPreview={(id) => (id === 'count' ? { columns: [t.phaseColumn!, 'n'], rows: COUNTS.map((n, i) => [t.phase!.replace('{n}', String(i + 1)), n]) } : null)}
            runs={{ loadRuns: async () => RUNS }}
          />
        </div>
      </FakhirProvider>
    </div>
  )
}
