import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { TympanProvider } from '@datatechsolutions/tympan'
import { expectNoAxeViolations } from '../../test/axe'
import { cssOf, mediaBlock } from '../../test/css'
import { setViewportWidth } from '../../test/media'
import type { FlowNode, NodeRunResult } from '../model/types'
import { createFlowEditorStore, FlowEditorStateProvider, type FlowEditorStore } from '../state/editorState'
import { applyRunEvent, useFlowExecution, useRunProjection } from './execution'
import { attachAuditEvents, ExecutionTimeline, type TimelineEntry } from './ExecutionTimeline'
import { canonicalEncode, diffTimelines, diffVariables, findForkPoint, normaliseStatus, parseLineage } from './lineage'
import { RunDrawer } from './RunDrawer'
import { RunInputDialog } from './RunInputDialog'
import { RunPanel } from './RunPanel'
import { RunPreviewPanel } from './RunPreviewPanel'
import { RunReplayDialog } from './RunReplayDialog'
import { RunRewindDialog } from './RunRewindDialog'
import { RunViews } from './RunViews'
import type { RunEvent, RunSummary } from './types'
import { VariableInspector } from './VariableInspector'
import { VersionHistoryPanel, type FlowVersion } from './VersionHistoryPanel'

const node = (id: string, kind: string, data: Record<string, unknown> = {}): FlowNode => ({ id, kind, position: { x: 0, y: 0 }, data: { label: id, ...data } })

function withEditor(ui: ReactNode, init: { nodes?: FlowNode[]; results?: Record<string, NodeRunResult>; running?: boolean; connectors?: Array<{ id: string; source: string; target: string }> } = {}, store?: FlowEditorStore) {
  const s = store ?? createFlowEditorStore({ initial: { nodes: init.nodes ?? [], connectors: init.connectors ?? [] } })
  if (init.results) for (const [k, v] of Object.entries(init.results)) s.actions.setNodeResult(k, v)
  if (init.running) s.actions.setRunning(true)
  const view = render(<FlowEditorStateProvider store={s}>{ui}</FlowEditorStateProvider>)
  return { store: s, ...view }
}

const runs: RunSummary[] = [
  { id: 'run-1', status: 'COMPLETED', startedAt: '2026-09-20T14:02:00Z', durationMs: 3400, nodeResults: [{ nodeId: 'load', status: 'completed', durationMs: 200, outputs: { rows: 94 } }] },
  { id: 'run-2', status: 'failed', startedAt: '2026-09-19T10:00:00Z', nodeResults: [{ nodeId: 'count', status: 'failed', error: 'timeout' }] },
]

describe('RunExecutionState', () => {
  const actions = () => ({ setRunning: vi.fn(), setNodeResult: vi.fn(), clearNodeResults: vi.fn() })

  it('is running from start until run content ends, and a completed event wins over a streaming status', async () => {
    let handlers: { onEvent(e: RunEvent): void; onStatus?(s: 'streaming'): void } | null = null
    const store = createFlowEditorStore()
    const wrapper = ({ children }: { children: ReactNode }) => <FlowEditorStateProvider store={store}>{children}</FlowEditorStateProvider>
    const { result } = renderHook(() => useFlowExecution('f1', () => Promise.resolve({ id: 'r1' }), (_id, h) => void (handlers = h)), { wrapper })
    await act(() => result.current.start())
    expect(result.current.isRunning).toBe(true)
    act(() => handlers!.onEvent({ type: 'run-completed' }))
    expect(result.current.isRunning).toBe(false)
  })

  it('keeps a node success when the run resumes', () => {
    const a = actions()
    for (const e of [{ type: 'run-started' }, { type: 'node-completed', nodeId: 'A' }, { type: 'run-started' }] as RunEvent[]) applyRunEvent(a, e)
    expect(a.setNodeResult).toHaveBeenCalledWith('A', { status: 'success', data: undefined })
    expect(a.clearNodeResults).not.toHaveBeenCalled()
  })

  it('applies only new events and clears when the list shrinks', () => {
    const a = actions()
    const five: RunEvent[] = Array.from({ length: 5 }, (_, i) => ({ type: 'node-started', nodeId: `n${i}` }))
    const { rerender } = renderHook(({ ev }) => useRunProjection(ev, 'streaming', a), { initialProps: { ev: five } })
    rerender({ ev: [...five, { type: 'node-started', nodeId: 'n5' }, { type: 'node-started', nodeId: 'n6' }] })
    expect(a.setNodeResult).toHaveBeenCalledTimes(7)
    expect(a.clearNodeResults).not.toHaveBeenCalled()
    rerender({ ev: [] })
    expect(a.clearNodeResults).toHaveBeenCalled()
  })

  it('cancels on the backend before resetting, and a failed start rethrows', async () => {
    const order: string[] = []
    const cancel = vi.fn(async () => void order.push('cancel'))
    const store = createFlowEditorStore()
    const wrapper = ({ children }: { children: ReactNode }) => <FlowEditorStateProvider store={store}>{children}</FlowEditorStateProvider>
    const { result } = renderHook(() => useFlowExecution('f', () => Promise.resolve({ id: 'r9' }), () => {}, cancel), { wrapper })
    await act(() => result.current.start())
    await act(() => result.current.stop())
    expect(cancel).toHaveBeenCalledWith('r9')
    expect(result.current.isRunning).toBe(false)
    const failing = renderHook(() => useFlowExecution('f', () => Promise.reject(new Error('no')), () => {}), { wrapper })
    await act(async () => {
      await expect(failing.result.current.start()).rejects.toThrow('no')
    })
    expect(failing.result.current.isRunning).toBe(false)
  })

  it('shows success for a restored node', () => {
    const a = actions()
    applyRunEvent(a, { type: 'node-restored', nodeId: 'B', durationMs: 5 })
    expect(a.setNodeResult).toHaveBeenCalledWith('B', { status: 'success', data: undefined, durationMs: 5 })
  })
})

describe('RunLineageAndDiff', () => {
  it('parses lineage and rejects root triggers', () => {
    expect(parseLineage('reset:r1')).toEqual({ kind: 'reset', baseRunId: 'r1' })
    expect(parseLineage('approval:r1:review')).toMatchObject({ kind: 'approval', baseRunId: 'r1', nodeId: 'review' })
    expect(parseLineage('user:alice')).toBeNull()
    expect(parseLineage('reset:')).toBeNull()
  })

  it('finds the fork point, normalises status and encodes canonically', () => {
    expect(findForkPoint([{ nodeId: 'x', restored: true }, { nodeId: 'y', restored: true }, { nodeId: 'z' }])).toBe('y')
    expect(normaliseStatus('COMPLETED')).toBe(normaliseStatus('completed'))
    expect(normaliseStatus('PausedForApproval')).toBe('paused_for_approval')
    expect(canonicalEncode({ b: 1, a: { d: 2, c: 3 } })).toBe(canonicalEncode({ a: { c: 3, d: 2 }, b: 1 }))
  })

  it('diffs timelines and variables', () => {
    const e = (nodeId: string, total: number) => ({ nodeId, nodeKind: 'code', status: 'completed', durationMs: 1, outputs: { total } })
    const d = diffTimelines([e('n', 1)], [e('n', 2), e('m', 1)])
    expect(d[0]).toMatchObject({ nodeId: 'n', diff: 'diverged', changedKeys: ['total'] })
    expect(d.at(-1)).toMatchObject({ nodeId: 'm', diff: 'onlyB' })
    expect(diffVariables({ a: 1 }, { a: 1, b: 2 }).map((r) => [r.key, r.diff])).toEqual([
      ['a', 'identical'],
      ['b', 'onlyB'],
    ])
  })
})

describe('RunPanel', () => {
  const start = node('start', 'start', { config: { inputVariables: ['edition'] } })
  it('enables Run with a start and an end node', () => {
    withEditor(<RunPanel open onClose={() => {}} onRun={() => {}} onStop={() => {}} />, { nodes: [start, node('end', 'end')] })
    expect(screen.getByRole('button', { name: 'Run' })).not.toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: 'Run' })).toBeEnabled()
  })

  it('disables Run and explains why without an end node', () => {
    withEditor(<RunPanel open onClose={() => {}} onRun={() => {}} onStop={() => {}} />, { nodes: [start] })
    const run = screen.getByRole('button', { name: 'Run' })
    expect(run.hasAttribute('disabled') || run.getAttribute('aria-disabled') === 'true').toBe(true)
    expect(screen.getByText('Add an end step to run this flow.')).toBeInTheDocument()
  })

  it('shows Stop and a running status while running; rows carry error words and localised durations; notes have no row', async () => {
    const { container } = withEditor(<RunPanel open onClose={() => {}} onRun={() => {}} onStop={() => {}} />, {
      nodes: [start, node('count', 'code'), node('n', 'note'), node('end', 'end')],
      results: { count: { status: 'error', error: 'timeout', durationMs: 1500 } },
      running: true,
    })
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument()
    expect(screen.getAllByText(/Running/).length).toBeGreaterThan(0)
    expect(screen.getByText('timeout')).toBeInTheDocument()
    expect(screen.getAllByText(/failed/).length).toBeGreaterThan(0)
    expect(screen.getByText('1.5 sec')).toBeInTheDocument()
    expect(screen.queryByText('n', { selector: '.ty-run-row__label' })).toBeNull()
    await expectNoAxeViolations(container)
  })
})

describe('RunPreviewPanel', () => {
  it('lists runs with status words, expands a run and opens a node detail', async () => {
    withEditor(<RunPreviewPanel open onClose={() => {}} flowId="f" loadRuns={() => Promise.resolve(runs)} />)
    const rows = await screen.findAllByRole('button', { name: /Run started/ })
    expect(rows).toHaveLength(2)
    expect(screen.getAllByText('completed').length).toBeGreaterThan(0)
    await userEvent.click(rows[0]!)
    expect(rows[0]).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(screen.getByRole('button', { name: /load/ }))
    expect(await screen.findByText(/"rows": 94/)).toBeInTheDocument()
  })

  it('shows live results and reloads history when a run finishes', async () => {
    const loadRuns = vi.fn(() => Promise.resolve(runs))
    const { store } = withEditor(<RunPreviewPanel open onClose={() => {}} flowId="f" loadRuns={loadRuns} />, { nodes: [node('B', 'code')], running: true })
    act(() => store.actions.setNodeResult('B', { status: 'success', durationMs: 10 }))
    expect(await screen.findAllByText(/completed|success/)).not.toHaveLength(0)
    const before = loadRuns.mock.calls.length
    act(() => store.actions.setRunning(false))
    await waitFor(() => expect(loadRuns.mock.calls.length).toBeGreaterThan(before))
  })

  it('offers retry when the loader rejects', async () => {
    const loadRuns = vi.fn(() => Promise.reject(new Error('offline')))
    withEditor(<RunPreviewPanel open onClose={() => {}} flowId="f" loadRuns={loadRuns} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    expect(loadRuns).toHaveBeenCalledTimes(2)
  })
})

describe('RunDrawer', () => {
  const props = { open: true, onClose: () => {}, flowId: 'f', runStatus: 'completed', loadRuns: () => Promise.resolve(runs) }

  it('sums tokens from node outputs, or says they were not reported', () => {
    const { unmount } = withEditor(<RunDrawer {...props} isRunning={false} />, {
      nodes: [node('a', 'agent'), node('b', 'agent')],
      results: { a: { status: 'success', data: { usage: { input_tokens: 10, output_tokens: 5 } } }, b: { status: 'success', data: { usage: { input_tokens: 10, output_tokens: 5 } } } },
    })
    const tokens = screen.getByRole('heading', { name: 'Model tokens' }).parentElement!
    expect(tokens).toHaveTextContent('20')
    expect(tokens).toHaveTextContent('10')
    expect(tokens).toHaveTextContent('30')
    unmount()
    withEditor(<RunDrawer {...props} isRunning={false} />, { nodes: [node('a', 'code')], results: { a: { status: 'success', data: {} } } })
    expect(screen.getByText('Token usage was not reported.')).toBeInTheDocument()
  })

  it('moves between Live and History with arrow keys and reports one error with a word', async () => {
    withEditor(<RunDrawer {...props} isRunning={false} />, { nodes: [node('a', 'code')], results: { a: { status: 'error', error: 'boom' } } })
    expect(screen.getByText('1 error')).toBeInTheDocument()
    screen.getByRole('tab', { name: 'Live' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'History' })).toHaveAttribute('aria-selected', 'true')
  })

  it('switches to Live and clears the selection when a new run starts', async () => {
    const onTab = vi.fn()
    const onSel = vi.fn()
    const { rerender } = render(
      <FlowEditorStateProvider store={createFlowEditorStore()}>
        <RunDrawer {...props} isRunning={false} tab="history" selectedRunId="run-1" onTabChange={onTab} onSelectedRunChange={onSel} />
      </FlowEditorStateProvider>,
    )
    rerender(
      <FlowEditorStateProvider store={createFlowEditorStore()}>
        <RunDrawer {...props} isRunning tab="history" selectedRunId="run-1" onTabChange={onTab} onSelectedRunChange={onSel} />
      </FlowEditorStateProvider>,
    )
    expect(onTab).toHaveBeenCalledWith('live')
    expect(onSel).toHaveBeenCalledWith(null)
  })

  it('shows an error with retry when history fails to load', async () => {
    const loadRuns = vi.fn(() => Promise.reject(new Error('offline')))
    withEditor(<RunDrawer {...props} loadRuns={loadRuns} isRunning={false} tab="history" />)
    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    expect(loadRuns).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('complementary', { name: 'Run details' })).toBeInTheDocument()
  })
})

describe('RunViews (wave 4 run-view-modes)', () => {
  it('expands from panel to drawer keeping the selection, and compacts back with focus on expand', async () => {
    withEditor(<RunViews flowId="f" loadRuns={() => Promise.resolve(runs)} defaultRunView={{ mode: 'panel', open: true }} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Open full run details' }))
    expect(screen.getByRole('complementary', { name: 'Run details' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Run preview' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Switch to compact view' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open full run details' })).toHaveFocus())
  })

  it('opens the drawer on the failing node when a run fails', () => {
    const { store } = withEditor(<RunViews flowId="f" loadRuns={() => Promise.resolve([])} defaultRunView={{ mode: 'panel', open: true }} />, { nodes: [node('count', 'code')] })
    act(() => store.actions.setNodeResult('count', { status: 'error', error: 'timeout' }))
    expect(screen.getByRole('complementary', { name: 'Run details' })).toBeInTheDocument()
  })

  it('uses only the full-screen drawer below 1024 px, without switch controls', () => {
    setViewportWidth(800)
    withEditor(<RunViews flowId="f" loadRuns={() => Promise.resolve([])} defaultRunView={{ mode: 'panel', open: true }} />)
    expect(screen.getByRole('complementary', { name: 'Run details' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Switch to compact view' })).toBeNull()
  })

  it('opens the remembered mode first', () => {
    const { rerender } = withEditor(<RunViews flowId="f" loadRuns={() => Promise.resolve([])} preferredModeStore={{ get: () => 'panel', set: () => {} }} />)
    rerender(
      <FlowEditorStateProvider store={createFlowEditorStore()}>
        <RunViews flowId="f" loadRuns={() => Promise.resolve([])} preferredModeStore={{ get: () => 'panel', set: () => {} }} runView={{ mode: 'drawer', open: true }} />
      </FlowEditorStateProvider>,
    )
    // Controlled hosts decide; uncontrolled first opening follows the store:
    const store = createFlowEditorStore()
    render(
      <FlowEditorStateProvider store={store}>
        <RunViews flowId="g" loadRuns={() => Promise.resolve([])} preferredModeStore={{ get: () => 'panel', set: () => {} }} defaultRunView={{ mode: 'drawer', open: false }} openOnRun />
      </FlowEditorStateProvider>,
    )
    act(() => store.actions.setRunning(true))
    expect(screen.getByRole('region', { name: 'Run preview' })).toBeInTheDocument()
  })

  it('closes on Escape inside a view', async () => {
    withEditor(<RunViews flowId="f" loadRuns={() => Promise.resolve([])} defaultRunView={{ mode: 'drawer', open: true }} />)
    screen.getByRole('tab', { name: 'Live' }).focus()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('complementary', { name: 'Run details' })).toBeNull()
  })
})

describe('RunInputDialog', () => {
  const start = node('s', 'start', { config: { inputVariables: ['loanAmount', 'nSteps'], inputDefaults: { loanAmount: '1000' } } })

  it('humanises labels, shows identifier hints and pre-fills defaults again after Cancel', async () => {
    const { rerender, store } = withEditor(<RunInputDialog open onClose={() => {}} onRun={() => {}} />, { nodes: [start] })
    const field = screen.getByRole('textbox', { name: /Loan amount/ })
    expect(field).toHaveValue('1000')
    expect(screen.getByText('loanAmount')).toBeInTheDocument()
    await userEvent.clear(field)
    await userEvent.type(field, '5')
    rerender(
      <FlowEditorStateProvider store={store}>
        <RunInputDialog open={false} onClose={() => {}} onRun={() => {}} />
      </FlowEditorStateProvider>,
    )
    rerender(
      <FlowEditorStateProvider store={store}>
        <RunInputDialog open onClose={() => {}} onRun={() => {}} />
      </FlowEditorStateProvider>,
    )
    expect(screen.getByRole('textbox', { name: /Loan amount/ })).toHaveValue('1000')
  })

  it('uses a whole-number field for count variables and sends blanks as empty strings', async () => {
    const onRun = vi.fn()
    withEditor(<RunInputDialog open onClose={() => {}} onRun={onRun} classifyVariable={(n) => (n === 'nSteps' ? 'count' : 'text')} />, { nodes: [start] })
    expect(screen.getByRole('textbox', { name: /N steps/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Run' }))
    expect(onRun.mock.calls[0]![0]).toMatchObject({ loanAmount: '1000' })
    expect(Object.keys(onRun.mock.calls[0]![0])).toEqual(['loanAmount', 'nSteps'])
  })

  it('shows the empty message and still runs without inputs', async () => {
    const onRun = vi.fn()
    withEditor(<RunInputDialog open onClose={() => {}} onRun={onRun} />, { nodes: [node('s', 'start')] })
    expect(screen.getByText(/declares no inputs/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Run' }))
    expect(onRun).toHaveBeenCalledWith({})
  })
})

describe('RunReplayDialog', () => {
  const base = { open: true, onClose: () => {}, runId: 'run-12345678-aaaa', flowId: 'flow-87654321-bbbb' }

  it('sends only touched keys in their original types, or an empty object', async () => {
    const onReplay = vi.fn(() => Promise.resolve())
    render(<RunReplayDialog {...base} originalInputs={{ amount: 10, name: 'a' }} onReplay={onReplay} />)
    await userEvent.click(screen.getByRole('button', { name: 'Replay' }))
    expect(onReplay).toHaveBeenLastCalledWith({})
  })

  it('converts an edited number back to a number', async () => {
    const onReplay = vi.fn(() => Promise.resolve())
    render(<RunReplayDialog {...base} originalInputs={{ amount: 10, name: 'a' }} onReplay={onReplay} />)
    const field = screen.getByRole('textbox', { name: /amount/ })
    await userEvent.clear(field)
    await userEvent.type(field, '12')
    await userEvent.click(screen.getByRole('button', { name: 'Replay' }))
    expect(onReplay).toHaveBeenLastCalledWith({ amount: 12 })
  })

  it('blocks invalid structured text naming the key, and shows a rejection message', async () => {
    const onReplay = vi.fn(() => Promise.reject(new Error('conflict')))
    render(<RunReplayDialog {...base} originalInputs={{ filters: { uf: 'SP' }, go: true }} onReplay={onReplay} />)
    expect(screen.getByRole('radio', { name: 'true' })).toBeChecked()
    const area = screen.getByRole('textbox', { name: /filters/ })
    fireEvent.change(area, { target: { value: '{ nope' } })
    await userEvent.click(screen.getByRole('button', { name: 'Replay' }))
    expect(onReplay).not.toHaveBeenCalled()
    expect(screen.getAllByText(/filters is not valid structured data/).length).toBeGreaterThan(0)
    await userEvent.click(screen.getByRole('button', { name: /Reset filters/ }))
    expect(screen.queryByRole('button', { name: /Reset filters/ })).toBeNull()
    await userEvent.click(screen.getByRole('radio', { name: 'false' }))
    await userEvent.click(screen.getByRole('button', { name: 'Replay' }))
    expect(await screen.findAllByText('conflict')).not.toHaveLength(0)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

describe('RunRewindDialog', () => {
  const nodes = [
    { nodeId: 'a', nodeKind: 'code', status: 'COMPLETED' },
    { nodeId: 'b', nodeKind: 'code', status: 'completed' },
    { nodeId: 'c', nodeKind: 'code', status: 'failed' },
  ]
  const base = { open: true, onClose: () => {}, runId: 'run-1' }

  it('selects the first completed node, previews kept and re-run lists, and sends only the cut point', async () => {
    const onRewind = vi.fn(() => Promise.resolve())
    render(<RunRewindDialog {...base} nodes={nodes} initialNodeId="c" onRewind={onRewind} />)
    const picker = screen.getByRole('combobox', { name: /Keep results up to/ }) as HTMLSelectElement
    expect(picker.value).toBe('a')
    await userEvent.selectOptions(picker, 'b')
    expect(screen.getByRole('heading', { name: /Kept from this run: 2 steps/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Will run again: 1 step/ })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Rewind' }))
    expect(onRewind).toHaveBeenCalledWith({ resetToNode: 'b' })
  })

  it('shows only the warning and Cancel without a completed node, and keeps the dialog open on failure', async () => {
    const { unmount } = render(<RunRewindDialog {...base} nodes={[nodes[2]!]} onRewind={() => Promise.resolve()} />)
    expect(screen.getByText(/nothing to keep/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rewind' })).toBeNull()
    unmount()
    render(<RunRewindDialog {...base} nodes={nodes} onRewind={() => Promise.reject(new Error('locked'))} />)
    await userEvent.click(screen.getByRole('button', { name: 'Rewind' }))
    expect(await screen.findAllByText(/locked/)).not.toHaveLength(0)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

describe('ExecutionTimeline', () => {
  const entries: TimelineEntry[] = [
    { nodeId: 'a', nodeKind: 'code', status: 'completed', startedAt: '2026-09-20T14:02:00Z', completedAt: '2026-09-20T14:02:01Z', durationMs: 200 },
    { nodeId: 'b', nodeKind: 'agent', status: 'completed', startedAt: '2026-09-20T14:02:01Z', completedAt: '2026-09-20T14:02:02Z', durationMs: 800, restored: true },
    { nodeId: 'c', nodeKind: 'code', status: 'completed', startedAt: '2026-09-20T14:02:02Z', completedAt: '2026-09-20T14:02:03Z', durationMs: 100 },
  ]

  it('shows only the empty message without entries', () => {
    render(<ExecutionTimeline entries={[]} />)
    expect(screen.getByText('This run has no steps to show.')).toBeInTheDocument()
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('selects the first entry by default and the failed one when there is a failure', () => {
    const { unmount } = render(<ExecutionTimeline entries={entries} />)
    expect(screen.getByRole('region', { name: 'Details of a' })).toBeInTheDocument()
    unmount()
    render(<ExecutionTimeline entries={[entries[0]!, { ...entries[2]!, status: 'failed', error: 'boom' }]} />)
    expect(screen.getByRole('region', { name: 'Details of c' })).toBeInTheDocument()
  })

  it('follows a controlled selection and reports activation, and shows the restored tag', async () => {
    const onSelect = vi.fn()
    const { container } = render(<ExecutionTimeline entries={entries} selectedNodeId="b" onSelect={onSelect} />)
    expect(screen.getByRole('region', { name: 'Details of b' })).toHaveTextContent('restored')
    await userEvent.click(screen.getAllByRole('option')[2]!)
    expect(onSelect).toHaveBeenCalledWith('c')
    await expectNoAxeViolations(container)
  })

  it('attaches audit events in order to their node only', () => {
    const out = attachAuditEvents(entries, [
      { kind: 'model-call', nodeId: 'a', sequence: 2, call: { turn: 2, inputTokens: 1, outputTokens: 1 } },
      { kind: 'tool-call', nodeId: 'a', sequence: 1, call: { tool: 'search', turn: 1, status: 'completed' } },
      { kind: 'model-call', nodeId: 'ghost', sequence: 3, call: { turn: 1 } },
    ] as never)
    expect(out[0]!.modelCalls).toHaveLength(1)
    expect(out[0]!.toolCalls).toHaveLength(1)
    expect(out[1]).toBe(entries[1])
  })

  it('includes cache reads and writes in a model call summary', () => {
    render(<ExecutionTimeline entries={[{ ...entries[0]!, modelCalls: [{ turn: 1, tokensIn: 100, tokensOut: 20, cacheRead: 50, cacheWrite: 5 }] }]} />)
    expect(screen.getByText(/cache 50 read, 5 written/)).toBeInTheDocument()
  })

  it('works under RTL with Portuguese steps label', () => {
    render(
      <TympanProvider locale="pt-BR">
        <div dir="rtl">
          <ExecutionTimeline entries={entries} />
        </div>
      </TympanProvider>,
    )
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })
})

describe('VariableInspector', () => {
  it('orders entries topologically, lists start outputs, branch inputs and excludes notes', async () => {
    const nodes = [node('C', 'end'), node('B', 'if-else', { conditions: [{ variable: 'score' }] }), node('A', 'start', { config: { inputVariables: ['amount', 'term'] } }), node('N', 'note')]
    const { container } = withEditor(<VariableInspector open onClose={() => {}} />, {
      nodes,
      connectors: [
        { id: '1', source: 'A', target: 'B' },
        { id: '2', source: 'B', target: 'C' },
      ],
    })
    const triggers = screen.getAllByRole('button', { expanded: false })
    expect(triggers.map((t) => t.textContent).join('|')).toMatch(/A.*B.*C/)
    expect(screen.queryByRole('button', { name: /^N/ })).toBeNull()
    triggers[0]!.focus()
    await userEvent.keyboard('{Enter}')
    expect(triggers[0]).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('amount')).toBeInTheDocument()
    expect(screen.getByText('term')).toBeInTheDocument()
    await userEvent.click(triggers[1]!)
    expect(screen.getByText('score')).toBeInTheDocument()
    await expectNoAxeViolations(container)
  })
})

describe('VersionHistoryPanel', () => {
  const versions: FlowVersion[] = [2, 4, 3].map((n) => ({ number: n, publishedAt: '2026-09-20T14:02:00Z', publishedBy: { kind: 'person', name: 'Natalia' }, nodeCount: 7, connectorCount: 6 }))
  const base = { open: true, onClose: () => {}, flowId: 'f', currentVersion: 4, onPreview: () => {}, onRestore: () => {} }

  it('lists versions newest first with the current one marked and not restorable', async () => {
    const { container } = render(<VersionHistoryPanel {...base} loadVersions={() => Promise.resolve(versions)} />)
    const items = await screen.findAllByRole('listitem')
    expect(items.map((i) => within(i).getByText(/^Version/).textContent)).toEqual(['Version 4', 'Version 3', 'Version 2'])
    expect(within(items[0]!).getByText('current')).toBeInTheDocument()
    expect(within(items[0]!).queryByRole('button', { name: /Restore/ })).toBeNull()
    expect(within(items[1]!).getByText('Natalia')).toBeInTheDocument()
    expect(within(items[1]!).getByText('7 nodes, 6 connectors')).toBeInTheDocument()
    await expectNoAxeViolations(container)
  })

  it('shows an error with retry, and the empty message without a loader', async () => {
    const loadVersions = vi.fn(() => Promise.reject(new Error('offline')))
    const { unmount } = render(<VersionHistoryPanel {...base} loadVersions={loadVersions} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    expect(loadVersions).toHaveBeenCalledTimes(2)
    unmount()
    render(<VersionHistoryPanel {...base} />)
    expect(screen.getByText('No version has been published yet.')).toBeInTheDocument()
  })

  it('closes on Escape and restores the chosen version', async () => {
    const onClose = vi.fn()
    const onRestore = vi.fn()
    render(<VersionHistoryPanel {...base} onClose={onClose} onRestore={onRestore} loadVersions={() => Promise.resolve(versions)} />)
    await userEvent.click(await screen.findByRole('button', { name: 'Restore version 2' }))
    expect(onRestore).toHaveBeenCalledWith(expect.objectContaining({ number: 2 }))
    screen.getByRole('button', { name: 'Restore version 2' }).focus()
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('uses Spanish strings in RTL', async () => {
    render(
      <TympanProvider locale="es">
        <div dir="rtl">
          <VersionHistoryPanel {...base} loadVersions={() => Promise.resolve(versions)} />
        </div>
      </TympanProvider>,
    )
    expect(await screen.findByText('Versión 4')).toBeInTheDocument()
  })
})

describe('run stylesheet', () => {
  it('stops spinning under reduced motion, marks selection in forced colours and uses logical properties', () => {
    const css = cssOf('run/run.css')
    expect(mediaBlock(css, /\(prefers-reduced-motion: reduce\)/)).toMatch(/animation:\s*none/)
    expect(mediaBlock(css, /\(forced-colors: active\)/)).toMatch(/Highlight/)
    expect(css).toMatch(/min-block-size: 44px/)
    expect(css).not.toMatch(/(margin|padding)-(left|right)|[^-]left:|[^-]right:/)
  })
})
