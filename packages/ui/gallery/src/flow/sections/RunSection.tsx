import { useState } from 'react'
import { Button } from '../../../../src'
import { createFlowEditorStore, ExecutionTimeline, FlowEditorStateProvider, RunReplayDialog, RunRewindDialog, RunViews, VersionHistoryPanel, type RunSummary, type TimelineEntry } from '../../../../src/flow'
import { Section } from '../../Section'

const runs: RunSummary[] = [
  { id: 'run-sample-2', status: 'completed', startedAt: '2026-01-02T10:00:00Z', durationMs: 3400, actor: { kind: 'agent', name: '[agente]', agentKey: '[agente]' }, nodeResults: [{ nodeId: 'load-sample', status: 'completed', durationMs: 200, outputs: { rows: 30 } }, { nodeId: 'apply-sample-rule', status: 'completed', durationMs: 1100 }, { nodeId: 'count', status: 'completed', durationMs: 400, outputs: { a: 12, b: 18 } }] },
  { id: 'run-sample-1', status: 'failed', startedAt: '2026-01-01T10:00:00Z', nodeResults: [{ nodeId: 'count', status: 'failed', error: 'timeout' }] },
]
const entries: TimelineEntry[] = [
  { nodeId: 'load-sample', nodeKind: 'datasource', status: 'completed', startedAt: '2026-01-02T10:00:00Z', completedAt: '2026-01-02T10:00:00.200Z', durationMs: 200, outputs: { rows: 30 } },
  { nodeId: 'sample-decision', nodeKind: 'decision', status: 'completed', startedAt: '2026-01-02T10:00:00.200Z', completedAt: '2026-01-02T10:00:01.300Z', durationMs: 1100, modelCalls: [{ turn: 1, agent: '[agente]', tokensIn: 1200, tokensOut: 80, cacheRead: 900, cacheWrite: 0, durationMs: 1000, stopReason: 'end_turn' }] },
  { nodeId: 'count', nodeKind: 'code', status: 'completed', startedAt: '2026-01-02T10:00:01.300Z', completedAt: '2026-01-02T10:00:01.700Z', durationMs: 400, outputs: { a: 12, b: 18 } },
]

export function RunSection() {
  const [store] = useState(() => {
    const s = createFlowEditorStore({ initial: { nodes: [{ id: 'load-sample', kind: 'datasource', position: { x: 0, y: 0 }, data: { label: 'Carregar edição' } }, { id: 'count', kind: 'code', position: { x: 0, y: 0 }, data: { label: 'Contar' } }] } })
    s.actions.setNodeResult('load-sample', { status: 'success', durationMs: 200 })
    return s
  })
  const [replay, setReplay] = useState(false)
  const [rewind, setRewind] = useState(false)
  return (
    <>
      <Section id="run-views" title="RunViews">
        <div style={{ position: 'relative', height: 600, display: 'flex', alignItems: 'flex-start' }}>
          <FlowEditorStateProvider store={store}>
            <RunViews flowId="sample-analysis" loadRuns={() => Promise.resolve(runs)} defaultRunView={{ mode: 'panel', open: true }} />
          </FlowEditorStateProvider>
        </div>
      </Section>
      <Section id="run-timeline" title="ExecutionTimeline">
        <div style={{ height: 400, background: 'var(--ty-surface)', border: '1px solid var(--ty-line)', borderRadius: 'var(--ty-radius-card)' }}>
          <ExecutionTimeline entries={entries} />
        </div>
      </Section>
      <Section id="run-replay-dialog" title="RunReplayDialog">
        <Button onPress={() => setReplay(true)}>Open Replay dialog</Button>
        <RunReplayDialog open={replay} onClose={() => setReplay(false)} runId={runs[0]!.id} flowId="sample-analysis" originalInputs={{ edition: '[edição]', minValue: 3, strict: true }} onReplay={() => Promise.resolve(setReplay(false))} />
      </Section>
      <Section id="run-rewind-dialog" title="RunRewindDialog">
        <Button onPress={() => setRewind(true)}>Open Rewind dialog</Button>
        <RunRewindDialog open={rewind} onClose={() => setRewind(false)} runId={runs[0]!.id} nodes={entries.map((e) => ({ nodeId: e.nodeId, nodeKind: e.nodeKind, status: e.status }))} onRewind={() => Promise.resolve(setRewind(false))} />
      </Section>
      <Section id="run-version-history" title="VersionHistoryPanel">
        <div style={{ position: 'relative', height: 600, display: 'flex' }}>
          <VersionHistoryPanel open={true} onClose={() => {}} flowId="sample-analysis" currentVersion={3} loadVersions={() => Promise.resolve([3, 2, 1].map((n) => ({ number: n, publishedAt: `2026-01-0${n}T12:00:00Z`, publishedBy: { kind: 'person' as const, name: 'Pessoa A' }, nodeCount: 7, connectorCount: 6 })))} onPreview={() => {}} onRestore={() => {}} />
        </div>
      </Section>
    </>
  )
}
