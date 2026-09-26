import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { latestGraphArtifact, messageText, useAssistantChat, type AssistantChatOptions, type ChatTurn, type StreamEvent } from './useAssistantChat'

/** A stream transport the test drives event by event. */
function controllableStream() {
  let emit: (e: StreamEvent) => void = () => {}
  let end: () => void = () => {}
  let fail: (e: Error) => void = () => {}
  const turns: ChatTurn[] = []
  const signals: AbortSignal[] = []
  const streamTransport = vi.fn((turn: ChatTurn, io: { signal: AbortSignal; onEvent: (e: StreamEvent) => void }) => {
    turns.push(turn)
    signals.push(io.signal)
    emit = io.onEvent
    return new Promise<void>((resolve, reject) => {
      end = resolve
      fail = reject
      io.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
    })
  })
  return { streamTransport, turns, signals, emit: (e: StreamEvent) => act(() => emit(e)), end: () => act(async () => end()), fail: (e: Error) => act(async () => fail(e)) }
}

const setup = (options: AssistantChatOptions) => renderHook(() => useAssistantChat(options))

describe('useAssistantChat', () => {
  it('goes submitted, then streaming on the first delta, then ready on end', async () => {
    const s = controllableStream()
    const { result } = setup({ streamTransport: s.streamTransport })
    act(() => result.current.send('How many cases?'))
    expect(result.current.status).toBe('submitted')
    expect(result.current.busy).toBe(true)
    s.emit({ type: 'text-delta', delta: 'Nine' })
    expect(result.current.status).toBe('streaming')
    await s.end()
    expect(result.current.status).toBe('ready')
    expect(messageText(result.current.messages[1]!)).toBe('Nine')
  })

  it('keeps text, tool, text events as three parts in order and appends deltas to the same kind', async () => {
    const s = controllableStream()
    const { result } = setup({ streamTransport: s.streamTransport })
    act(() => result.current.send('Count'))
    s.emit({ type: 'text-delta', delta: 'Let me ' })
    s.emit({ type: 'text-delta', delta: 'check.' })
    s.emit({ type: 'tool-input-start', toolCallId: 't1', toolName: 'count_records' })
    s.emit({ type: 'tool-output', toolCallId: 't1', output: { n: 9 }, summary: '9 records' })
    s.emit({ type: 'text-delta', delta: 'Nine.' })
    await s.end()
    const parts = result.current.messages[1]!.parts
    expect(parts.map((p) => p.type)).toEqual(['text', 'tool', 'text'])
    expect(parts[0]).toEqual({ type: 'text', text: 'Let me check.' })
    expect(parts[1]).toMatchObject({ state: 'succeeded', summary: '9 records' })
  })

  it('keeps the partial answer as final when stopped and does not fail the turn', async () => {
    const s = controllableStream()
    const { result } = setup({ streamTransport: s.streamTransport })
    act(() => result.current.send('Long answer'))
    s.emit({ type: 'text-delta', delta: 'Partial' })
    act(() => result.current.stop())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(s.signals[0]!.aborted).toBe(true)
    expect(result.current.messages[1]).toMatchObject({ state: 'done' })
    expect(messageText(result.current.messages[1]!)).toBe('Partial')
  })

  it('fails the turn on a stream error and retry re-sends the prompt without duplicating the user bubble', async () => {
    const s = controllableStream()
    const { result } = setup({ streamTransport: s.streamTransport })
    act(() => result.current.send('Summarise r115b'))
    s.emit({ type: 'error', message: 'quota exceeded' })
    expect(result.current.status).toBe('error')
    expect(result.current.messages[1]).toMatchObject({ state: 'failed', error: 'quota exceeded' })
    expect(result.current.canRetry).toBe(true)
    act(() => result.current.retry())
    expect(s.turns[1]!.prompt).toBe('Summarise r115b')
    expect(result.current.messages.filter((m) => m.role === 'user')).toHaveLength(1)
    s.emit({ type: 'text-delta', delta: 'Done' })
    await s.end()
    expect(result.current.messages).toHaveLength(2)
    expect(result.current.status).toBe('ready')
  })

  it('applies navigate actions only for app-relative paths', () => {
    const s = controllableStream()
    const onNavigate = vi.fn()
    const { result } = setup({ streamTransport: s.streamTransport, onNavigate })
    act(() => result.current.send('Open records'))
    s.emit({ type: 'action', action: { type: 'navigate', path: 'https://x' } })
    expect(onNavigate).not.toHaveBeenCalled()
    s.emit({ type: 'action', action: { type: 'navigate', path: '/records' } })
    expect(onNavigate).toHaveBeenCalledWith('/records')
  })

  it('fails with a configuration message when no transport exists', async () => {
    const { result } = setup({ messages: { noTransport: 'Assistant not configured' } })
    await act(async () => result.current.send('Hello'))
    expect(result.current.messages[1]).toMatchObject({ state: 'failed', error: 'Assistant not configured' })
  })

  it('uses the one-shot transport only when no stream transport exists and pins the conversation id', async () => {
    const transport = vi.fn(async () => ({ reply: 'Nine records.', conversationId: 'c-1', toolEvents: [{ toolCallId: 't', toolName: 'count', output: { n: 9 } }] }))
    const { result } = setup({ transport })
    await act(async () => result.current.send('Count'))
    expect(result.current.conversationId).toBe('c-1')
    expect(result.current.messages[1]!.parts.map((p) => p.type)).toEqual(['tool', 'text'])
  })

  it('never falls back to the one-shot transport when the stream fails', async () => {
    const s = controllableStream()
    const transport = vi.fn()
    const { result } = setup({ streamTransport: s.streamTransport, transport })
    act(() => result.current.send('Hi'))
    await s.fail(new Error('network'))
    expect(transport).not.toHaveBeenCalled()
    expect(result.current.messages[1]).toMatchObject({ state: 'failed', error: 'network' })
  })

  it('sends only settled, non-empty history with the screen context read at send time', async () => {
    const s = controllableStream()
    const { result, rerender } = renderHook((p: { path: string }) => useAssistantChat({ streamTransport: s.streamTransport, currentPath: p.path, screenTitle: 'Catalog', mode: 'app' }), { initialProps: { path: '/a' } })
    act(() => result.current.send('First'))
    s.emit({ type: 'start', conversationId: 'conv-9' })
    s.emit({ type: 'text-delta', delta: 'Answer' })
    await s.end()
    rerender({ path: '/b' })
    act(() => result.current.send('Second'))
    expect(s.turns[1]!.history).toEqual([
      { role: 'user', text: 'First' },
      { role: 'assistant', text: 'Answer' },
    ])
    expect(s.turns[1]!.context).toEqual({ mode: 'app', currentPath: '/b', screenTitle: 'Catalog' })
    expect(s.turns[1]!.conversationId).toBe('conv-9')
  })

  it('hydrates only well-formed parts and newConversation clears everything', () => {
    const { result } = setup({})
    act(() => result.current.setInput('draft'))
    act(() =>
      result.current.hydrate({
        id: 'c-2',
        messages: [
          { id: 'm1', role: 'user', parts: [{ type: 'text', text: 'Hi' }] },
          { id: 'm2', role: 'assistant', parts: [{ type: 'text', text: 'Hello' }, { type: 'text' }, { type: 'image', url: 'x' }] },
          { role: 'robot', parts: [] },
        ],
      }),
    )
    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[1]!.parts).toEqual([{ type: 'text', text: 'Hello' }])
    expect(result.current.input).toBe('')
    expect(result.current.conversationId).toBe('c-2')
    act(() => result.current.newConversation())
    expect(result.current.messages).toEqual([])
    expect(result.current.conversationId).toBeNull()
  })

  it('adds a visual part when the visualization tool succeeds and finds the latest graph artifact', async () => {
    const s = controllableStream()
    const { result } = setup({ streamTransport: s.streamTransport })
    act(() => result.current.send('Chart it'))
    s.emit({ type: 'tool-input-start', toolCallId: 'v', toolName: 'render_visual' })
    s.emit({ type: 'tool-output', toolCallId: 'v', output: { type: 'bar', title: 'Cases', data: [{ uf: 'SP', total: 3 }] } })
    s.emit({ type: 'tool-input-start', toolCallId: 'g', toolName: 'create_flow' })
    s.emit({ type: 'tool-output', toolCallId: 'g', output: { flowId: 'flow-1', graph: { nodes: [], connectors: [] } } })
    await s.end()
    expect(result.current.messages[1]!.parts.some((p) => p.type === 'visual')).toBe(true)
    expect(latestGraphArtifact(result.current.messages)).toMatchObject({ toolCallId: 'g', flowId: 'flow-1' })
  })
})
