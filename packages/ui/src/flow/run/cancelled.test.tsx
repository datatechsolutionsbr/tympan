// Cancelled (and the other server states: queued, paused_for_approval,
// suspended) across the run group: stream, projection, words, views.
import { act, render, renderHook, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { StatusPill, TympanProvider } from '../../index'
import { expectNoAxeViolations } from '../../../test/axe'
import { eventTypeFromContract, runStatusFromContract } from '../../utilities/api-error-model/apiErrors'
import { toneForStatus } from '../../utilities/formatters/formatters'
import { createFlowEditorStore, FlowEditorStateProvider } from '../state/editorState'
import { applyRunEvent, isTerminalStreamStatus, useFlowExecution, useRunProjection, type RunStreamHandlers } from './execution'
import { ExecutionTimeline } from './ExecutionTimeline'
import { RunDrawer } from './RunDrawer'
import { RunStatusMark, runWordOf } from './RunStatusMark'
import type { RunEvent, RunSummary } from './types'

const editor = (store = createFlowEditorStore()) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <FlowEditorStateProvider store={store}>{children}</FlowEditorStateProvider>
  }

describe('cancelled run stream', () => {
  it('a cancelled stream status ends the run and is terminal', async () => {
    let handlers: RunStreamHandlers | null = null
    const { result } = renderHook(() => useFlowExecution('f', () => Promise.resolve({ id: 'r1' }), (_id, h) => void (handlers = h)), { wrapper: editor() })
    await act(() => result.current.start())
    expect(result.current.isRunning).toBe(true)
    act(() => handlers!.onStatus?.('cancelled'))
    expect(result.current.streamStatus).toBe('cancelled')
    expect(result.current.isRunning).toBe(false)
    expect(isTerminalStreamStatus('cancelled')).toBe(true)
    expect(isTerminalStreamStatus('streaming')).toBe(false)
  })

  it('a run-cancelled event ends the run', async () => {
    let handlers: RunStreamHandlers | null = null
    const { result } = renderHook(() => useFlowExecution('f', () => Promise.resolve({ id: 'r1' }), (_id, h) => void (handlers = h)), { wrapper: editor() })
    await act(() => result.current.start())
    act(() => handlers!.onEvent({ type: 'run-cancelled', runId: 'r1' }))
    expect(result.current.isRunning).toBe(false)
  })

  it('projection stops running on run-cancelled and on a cancelled stream', () => {
    const a = { setRunning: vi.fn(), setNodeResult: vi.fn(), clearNodeResults: vi.fn() }
    applyRunEvent(a, { type: 'run-cancelled' })
    expect(a.setRunning).toHaveBeenLastCalledWith(false)
    const b = { setRunning: vi.fn(), setNodeResult: vi.fn(), clearNodeResults: vi.fn() }
    const events: RunEvent[] = [{ type: 'run-started' }]
    renderHook(() => useRunProjection(events, 'cancelled', b))
    expect(b.setRunning).toHaveBeenLastCalledWith(false)
  })
})

describe('cancelled run words', () => {
  it('maps every server state to its own word, never failed', () => {
    expect(runWordOf('cancelled')).toBe('cancelled')
    expect(runWordOf('CANCELED')).toBe('cancelled')
    expect(runWordOf('queued')).toBe('pending')
    expect(runWordOf('paused_for_approval')).toBe('awaiting-approval')
    expect(runWordOf('suspended')).toBe('suspended')
  })

  it('shows an icon and the word in every catalogue', () => {
    const { unmount } = render(<RunStatusMark status="cancelled" />)
    expect(screen.getByText('cancelled')).toBeInTheDocument()
    unmount()
    render(
      <TympanProvider locale="pt-BR">
        <RunStatusMark status="cancelled" />
        <RunStatusMark status="paused_for_approval" />
        <RunStatusMark status="suspended" />
      </TympanProvider>,
    )
    expect(screen.getByText('cancelada')).toBeInTheDocument()
    expect(screen.getByText('aguardando aprovação')).toBeInTheDocument()
    expect(screen.getByText('suspensa')).toBeInTheDocument()
  })

  it('reads cancelled as neutral and the waiting states as pending, never positive', () => {
    expect(toneForStatus('cancelled')).toBe('neutral')
    expect(toneForStatus('paused_for_approval')).toBe('pending')
    expect(toneForStatus('suspended')).toBe('pending')
  })

  it('maps contract statuses and the cancelled run.status event', () => {
    expect(runStatusFromContract('cancelled')).toBe('cancelled')
    expect(runStatusFromContract('paused_for_approval')).toBe('paused')
    expect(runStatusFromContract('suspended')).toBe('paused')
    expect(runStatusFromContract('queued')).toBe('pending')
    expect(eventTypeFromContract('run.status', 'cancelled')).toBe('run.cancelled')
    expect(eventTypeFromContract('run.status', 'paused_for_approval')).toBe('run.paused')
  })

  it('StatusPill knows cancelled', () => {
    render(<StatusPill status="cancelled" />)
    expect(screen.getByText('Cancelled')).toBeInTheDocument()
  })
})

describe('cancelled run views', () => {
  it('RunDrawer heads a cancelled run as cancelled, not idle or failed', async () => {
    const loadRuns = (): Promise<RunSummary[]> => Promise.resolve([])
    const { container } = render(
      <FlowEditorStateProvider store={createFlowEditorStore()}>
        <RunDrawer open onClose={() => {}} flowId="f" runStatus="cancelled" isRunning={false} loadRuns={loadRuns} />
      </FlowEditorStateProvider>,
    )
    const drawer = screen.getByRole('complementary', { name: 'Run details' })
    expect(drawer).toHaveTextContent('cancelled')
    expect(drawer).not.toHaveTextContent('failed')
    await expectNoAxeViolations(container)
  })

  it('ExecutionTimeline lists a cancelled step with its word', async () => {
    const { container } = render(<ExecutionTimeline entries={[{ nodeId: 'load', nodeKind: 'code', status: 'cancelled' }]} />)
    expect(screen.getAllByText('cancelled').length).toBeGreaterThan(0)
    await expectNoAxeViolations(container)
  })
})
