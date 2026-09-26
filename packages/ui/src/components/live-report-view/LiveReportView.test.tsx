import { act, render, renderHook, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../../../test/axe'
import { cssOf, mediaBlock } from '../../../test/css'
import { ThemeScope } from '../../internal/ThemeScope'
import { LiveReportView } from './LiveReportView'
import { initialRunView, phaseOf, reduceRunEvent, type RunEvent } from './runEvents'
import { useRunEventStream, type OpenRunStream, type RunStreamCallbacks } from './useRunEventStream'

function fakeTransport() {
  const opened: Array<{ runId: string; cursor: string | null; cb: RunStreamCallbacks; close: ReturnType<typeof vi.fn> }> = []
  const open: OpenRunStream = vi.fn((_flow, runId, cb, cursor) => {
    const close = vi.fn()
    opened.push({ runId, cursor, cb, close })
    return close
  })
  return { open, opened, last: () => opened[opened.length - 1]! }
}

afterEach(() => vi.useRealTimers())

describe('run-event reduction', () => {
  it('marks a completed step done and shows the section it produced', () => {
    const events: RunEvent[] = [
      { type: 'run.started' },
      { type: 'step.started', stepId: 'A' },
      { type: 'step.completed', stepId: 'A', report: { title: 'Run', sections: [{ kind: 'note', text: 'Counted 94 cases' }] } },
    ]
    const v = events.reduce(reduceRunEvent, initialRunView(null))
    expect(v.phase).toBe('running')
    expect(v.steps).toEqual([{ id: 'A', state: 'done', kind: undefined }])
    expect(v.report?.sections).toHaveLength(1)
  })

  it('pauses and appends an input request', () => {
    const v = [{ type: 'run.paused', stepId: 'B', prompt: 'Approve the rule?' } as RunEvent].reduce(reduceRunEvent, initialRunView(null))
    expect(v.phase).toBe('paused')
    expect(v.report?.sections?.[0]).toMatchObject({ kind: 'inputRequest', prompt: 'Approve the rule?', stepId: 'B' })
  })

  it('reads run statuses case-insensitively', () => {
    expect(phaseOf('COMPLETED')).toBe('completed')
    expect(phaseOf('Canceled')).toBe('cancelled')
    expect(phaseOf('weird')).toBe('pending')
  })
})

describe('useRunEventStream', () => {
  it('gives up with status error after three retries of a stream that keeps failing', () => {
    vi.useFakeTimers()
    const t = fakeTransport()
    const { result } = renderHook(() => useRunEventStream('f', 'r1', t.open))
    for (let i = 0; i < 4; i++) {
      act(() => t.last().cb.error(new Error(`boom ${i}`)))
      act(() => {
        vi.advanceTimersByTime(5000)
      })
    }
    expect(t.opened).toHaveLength(4)
    expect(result.current.status).toBe('error')
  })

  it('resumes from the last cursor after a reconnect', () => {
    vi.useFakeTimers()
    const t = fakeTransport()
    renderHook(() => useRunEventStream('f', 'r1', t.open))
    act(() => {
      t.last().cb.event({ type: 'run.started' })
      t.last().cb.cursor('ev-7')
      t.last().cb.error(new Error('drop'))
    })
    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(t.last().cursor).toBe('ev-7')
  })

  it('closes the old connection before opening a new one and resets events when the run changes', () => {
    const t = fakeTransport()
    const { result, rerender } = renderHook(({ run }) => useRunEventStream('f', run, t.open), { initialProps: { run: 'r1' } })
    act(() => t.last().cb.event({ type: 'run.started' }))
    expect(result.current.events).toHaveLength(1)
    const first = t.last()
    rerender({ run: 'r2' })
    expect(first.close).toHaveBeenCalledTimes(1)
    expect(t.opened).toHaveLength(2)
    expect(t.last().runId).toBe('r2')
    expect(result.current.events).toHaveLength(0)
  })

  it('stops the circuit after too many attempts inside the window', () => {
    vi.useFakeTimers()
    const t = fakeTransport()
    const { result } = renderHook(() => useRunEventStream('f', 'r', t.open, { maxRetries: 99, breakerAttempts: 2, backoffMs: 10 }))
    for (let i = 0; i < 3; i++) {
      act(() => t.last().cb.error(new Error('x')))
      act(() => {
        vi.advanceTimersByTime(100)
      })
    }
    expect(result.current.status).toBe('error')
  })

  it('closes on unmount and reports completion', () => {
    const t = fakeTransport()
    const { result, unmount } = renderHook(() => useRunEventStream('f', 'r', t.open))
    act(() => t.last().cb.done('completed'))
    expect(result.current.status).toBe('completed')
    unmount()
    expect(t.last().close).toHaveBeenCalled()
  })
})

describe('LiveReportView', () => {
  it('never subscribes for a finished run and shows the initial report', () => {
    const t = fakeTransport()
    render(<LiveReportView flowId="f" runId="r" openStream={t.open} initialStatus="COMPLETED" initialReport={{ title: 'Final report', recommendation: 'Done.' }} />)
    expect(t.open).not.toHaveBeenCalled()
    expect(screen.getByRole('region', { name: 'Final report' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Completed')
  })

  it('announces phases, lists steps with words and fills the report', () => {
    const t = fakeTransport()
    render(<LiveReportView flowId="f" runId="r" openStream={t.open} />)
    expect(screen.getByText('Waiting for data')).toBeInTheDocument()
    act(() => {
      t.last().cb.event({ type: 'run.started' })
      t.last().cb.event({ type: 'step.started', stepId: 'load', stepKind: 'datasource' })
      t.last().cb.event({ type: 'step.completed', stepId: 'load', report: { title: 'Count', sections: [{ kind: 'note', text: '94 cases loaded' }] } })
      t.last().cb.event({ type: 'step.error', stepId: 'count', message: 'division by zero' })
    })
    expect(screen.getByRole('status')).toHaveTextContent('Running')
    const steps = screen.getByRole('list', { name: 'Steps' })
    expect(within(steps).getByText('done')).toBeInTheDocument()
    expect(within(steps).getByText('division by zero')).toBeInTheDocument()
    expect(screen.getByText('94 cases loaded')).toBeInTheDocument()
  })

  it('shows an input request when paused and answers it optimistically when interactive', async () => {
    const t = fakeTransport()
    const submitInput = vi.fn(() => Promise.resolve())
    render(<LiveReportView flowId="f" runId="r" openStream={t.open} interactive submitInput={submitInput} />)
    act(() => t.last().cb.event({ type: 'run.paused', stepId: 'gate', prompt: 'Approve the stage rule?' }))
    expect(screen.getByRole('status')).toHaveTextContent('Paused')
    expect(screen.getByText('Approve the stage rule?')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }))
    expect(submitInput).toHaveBeenCalledWith('r', 'gate', { approved: true })
    expect(screen.getByRole('status')).toHaveTextContent('Running')
  })

  it('shows the failure message in an error block', () => {
    const t = fakeTransport()
    render(<LiveReportView flowId="f" runId="r" openStream={t.open} />)
    act(() => t.last().cb.event({ type: 'run.failed', message: 'timeout' }))
    expect(screen.getByText('timeout')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Failed')
  })

  it('pulses only when motion is allowed', () => {
    const css = cssOf('components/live-report-view/LiveReportView.css')
    expect(mediaBlock(css, /\(prefers-reduced-motion:\s*reduce\)/)).toMatch(/animation:\s*none/)
  })

  it('has no axe violations, light and dark', async () => {
    const t = fakeTransport()
    const { container } = render(
      <>
        {(['light', 'dark'] as const).map((s) => (
          <ThemeScope key={s} scheme={s}>
            <LiveReportView flowId="f" runId={`r-${s}`} openStream={t.open} initialReport={{ title: `Run ${s}`, sections: [{ kind: 'note', text: 'Loaded' }] }} />
          </ThemeScope>
        ))}
      </>,
    )
    act(() => {
      for (const o of t.opened) {
        o.cb.event({ type: 'step.started', stepId: 'load' })
        o.cb.event({ type: 'step.error', stepId: 'count', message: 'bad' })
      }
    })
    await expectNoAxeViolations(container)
  })
})
