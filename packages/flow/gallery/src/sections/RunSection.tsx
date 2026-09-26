import { useState } from 'react'
import { Button, FakhirProvider } from '@fakhir/design-system'
import { createFlowEditorStore, ExecutionTimeline, FlowEditorStateProvider, RunReplayDialog, RunRewindDialog, RunViews, VersionHistoryPanel, type RunSummary, type TimelineEntry } from '../../../src'

const runs: RunSummary[] = [
  { id: 'run-2026-09-20-1402', status: 'completed', startedAt: '2026-09-20T14:02:00Z', durationMs: 3400, actor: { kind: 'agent', name: 'stage-counter', agentKey: 'stage-counter' }, nodeResults: [{ nodeId: 'load-edition', status: 'completed', durationMs: 200, outputs: { rows: 94 } }, { nodeId: 'apply-rule-v2', status: 'completed', durationMs: 1100 }, { nodeId: 'count', status: 'completed', durationMs: 400, outputs: { stage3: 20, stage4: 17 } }] },
  { id: 'run-2026-09-19-1000', status: 'failed', startedAt: '2026-09-19T10:00:00Z', nodeResults: [{ nodeId: 'count', status: 'failed', error: 'timeout' }] },
]
const entries: TimelineEntry[] = [
  { nodeId: 'load-edition', nodeKind: 'datasource', status: 'completed', startedAt: '2026-09-20T14:02:00Z', completedAt: '2026-09-20T14:02:00.200Z', durationMs: 200, outputs: { rows: 94 } },
  { nodeId: 'decide-position', nodeKind: 'decision', status: 'completed', startedAt: '2026-09-20T14:02:00.200Z', completedAt: '2026-09-20T14:02:01.300Z', durationMs: 1100, modelCalls: [{ turn: 1, agent: 'coder', tokensIn: 1200, tokensOut: 80, cacheRead: 900, cacheWrite: 0, durationMs: 1000, stopReason: 'end_turn' }] },
  { nodeId: 'count', nodeKind: 'code', status: 'completed', startedAt: '2026-09-20T14:02:01.300Z', completedAt: '2026-09-20T14:02:01.700Z', durationMs: 400, outputs: { stage3: 20, stage4: 17 } },
]

/** Run views, timeline, trace/replay and version history for an analysis of the census edition. */
export function RunSection() {
  const [store] = useState(() => {
    const s = createFlowEditorStore({ initial: { nodes: [{ id: 'load-edition', kind: 'datasource', position: { x: 0, y: 0 }, data: { label: 'Carregar edição' } }, { id: 'count', kind: 'code', position: { x: 0, y: 0 }, data: { label: 'Contar' } }] } })
    s.actions.setNodeResult('load-edition', { status: 'success', durationMs: 200 })
    return s
  })
  const [replay, setReplay] = useState(false)
  const [rewind, setRewind] = useState(false)
  const [versions, setVersions] = useState(false)
  return (
    <section className="fk-gallery-section" aria-labelledby="run-title">
      <h2 id="run-title">Runs, trace and replay</h2>
      <FlowEditorStateProvider store={store}>
        <RunViews flowId="stage-count" loadRuns={() => Promise.resolve(runs)} defaultRunView={{ mode: 'panel', open: true }} />
      </FlowEditorStateProvider>
      <h3>Execution timeline</h3>
      <ExecutionTimeline
        entries={entries}
        inspectorActions={() => (
          <>
            <Button size="compact" variant="secondary" onPress={() => setRewind(true)}>
              Rewind from here
            </Button>
            <Button size="compact" variant="secondary" onPress={() => setReplay(true)}>
              Replay
            </Button>
          </>
        )}
      />
      <Button onPress={() => setVersions((v) => !v)}>Versions</Button>
      <VersionHistoryPanel open={versions} onClose={() => setVersions(false)} flowId="stage-count" currentVersion={3} loadVersions={() => Promise.resolve([3, 2, 1].map((n) => ({ number: n, publishedAt: `2026-09-${10 + n}T12:00:00Z`, publishedBy: { kind: 'person' as const, name: 'Natalia Mesquita' }, nodeCount: 7, connectorCount: 6 })))} onPreview={() => {}} onRestore={() => {}} />
      <RunReplayDialog open={replay} onClose={() => setReplay(false)} runId={runs[0]!.id} flowId="stage-count" originalInputs={{ edition: '2026-09-20', minStage: 3, strict: true }} onReplay={() => Promise.resolve(setReplay(false))} />
      <RunRewindDialog open={rewind} onClose={() => setRewind(false)} runId={runs[0]!.id} nodes={entries.map((e) => ({ nodeId: e.nodeId, nodeKind: e.nodeKind, status: e.status }))} onRewind={() => Promise.resolve(setRewind(false))} />
      <h3>العربية (RTL) · 日本語</h3>
      <FakhirProvider locale="ar">
        <div dir="rtl" lang="ar">
          <ExecutionTimeline entries={entries} />
        </div>
      </FakhirProvider>
      <FakhirProvider locale="ja">
        <ExecutionTimeline entries={entries.map((e) => ({ ...e, nodeId: `${e.nodeId}・政府AI調査` }))} />
      </FakhirProvider>
    </section>
  )
}
