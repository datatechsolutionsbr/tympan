import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { newestFlowArtifact, plainText, useAssistantSession, type AssistantSessionOptions, type SessionRequest, type SessionSignal } from './useAssistantSession'

/** A stream transport the test drives event by event. */
function controllableStream() {
  let emit: (e: SessionSignal) => void = () => {}
  let end: () => void = () => {}
  let fail: (e: Error) => void = () => {}
  const turns: SessionRequest[] = []
  const signals: AbortSignal[] = []
  const openStream = vi.fn((turn: SessionRequest, wire: { signal: AbortSignal; deliver: (e: SessionSignal) => void }) => {
    turns.push(turn)
    signals.push(wire.signal)
    emit = wire.deliver
    return new Promise<void>((resolve, reject) => {
      end = resolve
      fail = reject
      wire.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
    })
  })
  return { openStream, turns, signals, emit: (e: SessionSignal) => act(() => emit(e)), end: () => act(async () => end()), fail: (e: Error) => act(async () => fail(e)) }
}

const setup = (options: AssistantSessionOptions) => renderHook(() => useAssistantSession(options))

describe('useAssistantSession', () => {
  it('goes asking, then receiving on the first chunk, then idle on end', async () => {
    const s = controllableStream()
    const { result } = setup({ openStream: s.openStream })
    act(() => result.current.ask('How many cases?'))
    expect(result.current.phase).toBe('asking')
    expect(result.current.working).toBe(true)
    s.emit({ signal: 'prose', chunk: 'Nine' })
    expect(result.current.phase).toBe('receiving')
    await s.end()
    expect(result.current.phase).toBe('idle')
    expect(plainText(result.current.utterances[1]!)).toBe('Nine')
  })

  it('keeps prose, tool, prose signals as three blocks in order and extends prose of the same kind', async () => {
    const s = controllableStream()
    const { result } = setup({ openStream: s.openStream })
    act(() => result.current.ask('Count'))
    s.emit({ signal: 'prose', chunk: 'Let me ' })
    s.emit({ signal: 'prose', chunk: 'check.' })
    s.emit({ signal: 'toolAnnounced', callId: 't1', tool: 'count_records' })
    s.emit({ signal: 'toolResult', callId: 't1', result: { n: 9 }, note: '9 records' })
    s.emit({ signal: 'prose', chunk: 'Nine.' })
    await s.end()
    const blocks = result.current.utterances[1]!.blocks
    expect(blocks.map((b) => b.kind)).toEqual(['prose', 'toolCall', 'prose'])
    expect(blocks[0]).toEqual({ kind: 'prose', body: 'Let me check.' })
    expect(blocks[1]).toMatchObject({ phase: 'ok', note: '9 records' })
  })

  it('keeps the partial answer as final when stopped and does not fail the turn', async () => {
    const s = controllableStream()
    const { result } = setup({ openStream: s.openStream })
    act(() => result.current.ask('Long answer'))
    s.emit({ signal: 'prose', chunk: 'Partial' })
    act(() => result.current.halt())
    await waitFor(() => expect(result.current.phase).toBe('idle'))
    expect(s.signals[0]!.aborted).toBe(true)
    expect(result.current.utterances[1]).toMatchObject({ phase: 'settled' })
    expect(plainText(result.current.utterances[1]!)).toBe('Partial')
  })

  it('fails the turn on a stream error and retry re-sends the prompt without duplicating the user bubble', async () => {
    const s = controllableStream()
    const { result } = setup({ openStream: s.openStream })
    act(() => result.current.ask('Summarise rd-0714'))
    s.emit({ signal: 'fault', reason: 'quota exceeded' })
    expect(result.current.phase).toBe('broken')
    expect(result.current.utterances[1]).toMatchObject({ phase: 'broken', problem: 'quota exceeded' })
    expect(result.current.canAskAgain).toBe(true)
    act(() => result.current.askAgain())
    expect(s.turns[1]!.question).toBe('Summarise rd-0714')
    expect(result.current.utterances.filter((m) => m.speaker === 'person')).toHaveLength(1)
    s.emit({ signal: 'prose', chunk: 'Done' })
    await s.end()
    expect(result.current.utterances).toHaveLength(2)
    expect(result.current.phase).toBe('idle')
  })

  it('applies navigate actions only for app-relative paths', () => {
    const s = controllableStream()
    const onGoTo = vi.fn()
    const { result } = setup({ openStream: s.openStream, onGoTo })
    act(() => result.current.ask('Open records'))
    s.emit({ signal: 'directive', directive: { kind: 'goTo', to: 'https://x' } })
    expect(onGoTo).not.toHaveBeenCalled()
    s.emit({ signal: 'directive', directive: { kind: 'goTo', to: '/records' } })
    expect(onGoTo).toHaveBeenCalledWith('/records')
  })

  it('fails with a configuration message when no transport exists', async () => {
    const { result } = setup({ texts: { missingTransport: 'Assistant not configured' } })
    await act(async () => result.current.ask('Hello'))
    expect(result.current.utterances[1]).toMatchObject({ phase: 'broken', problem: 'Assistant not configured' })
  })

  it('uses the one-shot transport only when no stream transport exists and pins the conversation id', async () => {
    const askOnce = vi.fn(async () => ({ answer: 'Nine records.', threadId: 'c-1', toolCalls: [{ callId: 't', tool: 'count', result: { n: 9 } }] }))
    const { result } = setup({ askOnce })
    await act(async () => result.current.ask('Count'))
    expect(result.current.threadId).toBe('c-1')
    expect(result.current.utterances[1]!.blocks.map((b) => b.kind)).toEqual(['toolCall', 'prose'])
  })

  it('never falls back to the one-shot transport when the stream fails', async () => {
    const s = controllableStream()
    const askOnce = vi.fn()
    const { result } = setup({ openStream: s.openStream, askOnce })
    act(() => result.current.ask('Hi'))
    await s.fail(new Error('network'))
    expect(askOnce).not.toHaveBeenCalled()
    expect(result.current.utterances[1]).toMatchObject({ phase: 'broken', problem: 'network' })
  })

  it('sends only settled, non-empty history with the screen context read at send time', async () => {
    const s = controllableStream()
    const { result, rerender } = renderHook((p: { path: string }) => useAssistantSession({ openStream: s.openStream, path: p.path, screenName: 'Catalog', audience: 'app' }), { initialProps: { path: '/a' } })
    act(() => result.current.ask('First'))
    s.emit({ signal: 'opened', threadId: 'conv-9' })
    s.emit({ signal: 'prose', chunk: 'Answer' })
    await s.end()
    rerender({ path: '/b' })
    act(() => result.current.ask('Second'))
    expect(s.turns[1]!.transcript).toEqual([
      { speaker: 'person', text: 'First' },
      { speaker: 'assistant', text: 'Answer' },
    ])
    expect(s.turns[1]!.where).toEqual({ audience: 'app', path: '/b', screenName: 'Catalog' })
    expect(s.turns[1]!.threadId).toBe('conv-9')
  })

  it('restores only well-formed blocks and reset clears everything', () => {
    const { result } = setup({})
    act(() => result.current.setDraft('draft'))
    act(() =>
      result.current.restore({
        id: 'c-2',
        utterances: [
          { key: 'm1', speaker: 'person', blocks: [{ kind: 'prose', body: 'Hi' }] },
          { key: 'm2', speaker: 'assistant', blocks: [{ kind: 'prose', body: 'Hello' }, { kind: 'prose' }, { kind: 'image', url: 'x' }] },
          { speaker: 'robot', blocks: [] },
        ],
      }),
    )
    expect(result.current.utterances).toHaveLength(2)
    expect(result.current.utterances[1]!.blocks).toEqual([{ kind: 'prose', body: 'Hello' }])
    expect(result.current.draft).toBe('')
    expect(result.current.threadId).toBe('c-2')
    act(() => result.current.reset())
    expect(result.current.utterances).toEqual([])
    expect(result.current.threadId).toBeNull()
  })

  it('adds a visual part when the visualization tool succeeds and finds the latest graph artifact', async () => {
    const s = controllableStream()
    const { result } = setup({ openStream: s.openStream })
    act(() => result.current.ask('Chart it'))
    s.emit({ signal: 'toolAnnounced', callId: 'v', tool: 'render_visual' })
    s.emit({ signal: 'toolResult', callId: 'v', result: { type: 'bar', title: 'Cases', data: [{ uf: 'SP', total: 3 }] } })
    s.emit({ signal: 'toolAnnounced', callId: 'g', tool: 'create_flow' })
    s.emit({ signal: 'toolResult', callId: 'g', result: { flowId: 'flow-1', graph: { nodes: [], connectors: [] } } })
    await s.end()
    expect(result.current.utterances[1]!.blocks.some((b) => b.kind === 'figure')).toBe(true)
    expect(newestFlowArtifact(result.current.utterances)).toMatchObject({ callId: 'g', flowId: 'flow-1' })
  })
})
