import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { TympanProvider } from '@datatechsolutions/tympan'
import { expectNoAxeViolations } from '../../test/axe'
import { cssOf, mediaBlock } from '../../test/css'
import { setViewportWidth } from '../../test/media'
import { AssistantConversation } from './AssistantConversation'
import { ConversationShell } from './ConversationShell'
import { groupThreadsByDay } from './threadDays'
import type { ThreadSummary } from './ThreadHistory'
import type { AssistantSession, Utterance } from './useAssistantSession'

function fakeSession(over: Partial<AssistantSession> = {}): AssistantSession {
  return {
    utterances: [],
    phase: 'idle',
    working: false,
    loadingHistory: false,
    threadId: null,
    draft: '',
    setDraft: vi.fn(),
    ask: vi.fn(),
    halt: vi.fn(),
    askAgain: vi.fn(),
    canAskAgain: false,
    setLoadingHistory: vi.fn(),
    reset: vi.fn(),
    restore: vi.fn(),
    ...over,
  }
}

/** A chat whose composer text lives in React state, like the real hook. */
function LiveChat({ send, busy = false }: { send: (t?: string) => void; busy?: boolean }) {
  const [input, setInput] = useState('')
  return <AssistantConversation session={fakeSession({ draft: input, setDraft: setInput, ask: send, working: busy })} />
}

const graphMessage = (toolCallId: string): Utterance => ({
  key: `m-${toolCallId}`,
  speaker: 'assistant',
  phase: 'settled',
  blocks: [{ kind: 'toolCall', callId: toolCallId, tool: 'create_flow', phase: 'ok', result: { flowId: 'flow-12345678', graph: { nodes: [], connectors: [] } } }],
})

const now = new Date('2026-09-26T12:00:00')
const day = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString()
const conversations: ThreadSummary[] = [
  { id: 'c1', title: 'Budget', updatedAt: day(0), agents: ['coder', 'reviewer', 'counter', 'writer'] },
  { id: 'c2', title: 'Stage counts', updatedAt: day(1) },
  { id: 'c3', title: 'Sources', updatedAt: day(3) },
  { id: 'c4', title: 'Old plan', updatedAt: day(30) },
]

describe('AssistantConversation', () => {
  it('is a polite log and sends with Enter, inserting a line break with Shift+Enter', async () => {
    const send = vi.fn()
    const { container } = render(<LiveChat send={send} />)
    expect(container.querySelector('[role="log"]')).toHaveAttribute('aria-live', 'polite')
    const box = screen.getByRole('textbox', { name: 'Message to the assistant' })
    await userEvent.type(box, 'one{Shift>}{Enter}{/Shift}two')
    expect(send).not.toHaveBeenCalled()
    expect(box).toHaveValue('one\ntwo')
    await userEvent.keyboard('{Enter}')
    expect(send).toHaveBeenCalledTimes(1)
    await expectNoAxeViolations(container)
  })

  it('keeps the composer editable while busy and offers stop instead of send', async () => {
    const stop = vi.fn()
    render(<AssistantConversation session={fakeSession({ working: true, halt: stop, phase: 'receiving' })} />)
    expect(screen.getByRole('textbox')).not.toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Stop' }))
    expect(stop).toHaveBeenCalled()
  })

  it('shows a failed turn with its message and a retry action, announced assertively', async () => {
    const retry = vi.fn()
    render(<AssistantConversation session={fakeSession({ canAskAgain: true, askAgain: retry, utterances: [{ key: 'a', speaker: 'assistant', phase: 'broken', blocks: [], problem: 'quota exceeded' }] })} />)
    expect(screen.getByRole('alert')).toHaveTextContent('quota exceeded')
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(retry).toHaveBeenCalled()
  })

  it('sends a starter prompt from the empty state', async () => {
    const send = vi.fn()
    render(<AssistantConversation session={fakeSession({ ask: send })} suggestions={['Quantos casos no estágio 4?']} />)
    await userEvent.click(screen.getByRole('button', { name: 'Quantos casos no estágio 4?' }))
    expect(send).toHaveBeenCalledWith('Quantos casos no estágio 4?')
  })

  it('works right to left: bubbles align by logical side and Enter still sends', async () => {
    const send = vi.fn()
    const { container } = render(
      <TympanProvider locale="ar">
        <div dir="rtl">
          <AssistantConversation session={fakeSession({ ask: send, draft: 'مرحبا', utterances: [{ key: 'u', speaker: 'person', phase: 'settled', blocks: [{ kind: 'prose', body: 'سؤال' }] }] })} />
        </div>
      </TympanProvider>,
    )
    expect(container.querySelector('[data-speaker="person"]')).toHaveAttribute('data-align', 'end')
    screen.getByRole('textbox').focus()
    await userEvent.keyboard('{Enter}')
    expect(send).toHaveBeenCalled()
  })

  it('uses the built-in Portuguese strings', () => {
    render(
      <TympanProvider locale="pt-BR">
        <AssistantConversation session={fakeSession()} />
      </TympanProvider>,
    )
    expect(screen.getByRole('textbox', { name: 'Mensagem para o assistente' })).toBeInTheDocument()
  })

  it('stops the typing indicator and skeleton under reduced motion and keeps bubble borders in forced colours', () => {
    const css = cssOf('assistant/assistant.css')
    expect(mediaBlock(css, /\(prefers-reduced-motion: reduce\)/)).toMatch(/animation:\s*none/)
    expect(mediaBlock(css, /\(forced-colors: active\)/)).toMatch(/CanvasText/)
  })
})

describe('ConversationShell', () => {
  it('groups by today, yesterday, last 7 days and older, in that order', () => {
    expect(groupThreadsByDay(conversations, now).map((g) => g.bucket)).toEqual(['today', 'yesterday', 'lastWeek', 'older'])
  })

  it('puts an unparsable date in older', () => {
    const groups = groupThreadsByDay([{ id: 'x', title: 'x', updatedAt: 'not a date' }], now)
    expect(groups).toEqual([{ bucket: 'older', threads: [{ id: 'x', title: 'x', updatedAt: 'not a date' }] }])
  })

  it('shows the no-results message when filtering by favourites with none', async () => {
    render(<ConversationShell session={fakeSession()} threads={conversations} onOpenThread={vi.fn()} onRemoveThread={vi.fn()} onStartThread={vi.fn()} starred={{ ids: [], onChange: vi.fn() }} />)
    await userEvent.click(screen.getByRole('button', { name: 'Favourites only' }))
    expect(screen.getByText('No conversation matches this filter.')).toBeInTheDocument()
  })

  it('names the conversation in the delete confirmation and deletes on confirm', async () => {
    const confirm = vi.fn(async () => true)
    const onDelete = vi.fn()
    render(<ConversationShell session={fakeSession()} threads={conversations} onOpenThread={vi.fn()} onRemoveThread={onDelete} onStartThread={vi.fn()} confirm={confirm} />)
    await userEvent.click(screen.getByRole('button', { name: 'Delete Budget' }))
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ title: 'Delete “Budget”?' }))
    expect(onDelete).toHaveBeenCalledWith('c1')
  })

  it('opens the canvas for a graph result, keeps it closed once closed, and reopens from the composer', async () => {
    const chat = fakeSession({ utterances: [graphMessage('t1')] })
    const { rerender } = render(<ConversationShell session={chat} threads={conversations} onOpenThread={vi.fn()} onRemoveThread={vi.fn()} onStartThread={vi.fn()} renderCanvas={() => <p>canvas body</p>} />)
    const panel = screen.getByRole('complementary', { name: 'Live canvas' })
    expect(within(panel).getByText('canvas body')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Close canvas' }))
    expect(screen.queryByRole('complementary', { name: 'Live canvas' })).toBeNull()
    rerender(<ConversationShell session={fakeSession({ utterances: [graphMessage('t1')] })} threads={conversations} onOpenThread={vi.fn()} onRemoveThread={vi.fn()} onStartThread={vi.fn()} renderCanvas={() => <p>canvas body</p>} />)
    expect(screen.queryByRole('complementary', { name: 'Live canvas' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Open canvas' }))
    expect(screen.getByRole('complementary', { name: 'Live canvas' })).toBeInTheDocument()
    rerender(<ConversationShell session={fakeSession({ utterances: [graphMessage('t1'), graphMessage('t2')] })} threads={conversations} onOpenThread={vi.fn()} onRemoveThread={vi.fn()} onStartThread={vi.fn()} renderCanvas={() => <p>canvas body</p>} />)
    expect(screen.getByRole('complementary', { name: 'Live canvas' })).toBeInTheDocument()
  })

  it('reaches the history through a drawer on a narrow viewport', async () => {
    setViewportWidth(375)
    render(<ConversationShell session={fakeSession()} threads={conversations} onOpenThread={vi.fn()} onRemoveThread={vi.fn()} onStartThread={vi.fn()} />)
    expect(screen.queryByRole('navigation', { name: 'Conversation history' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Conversations' }))
    expect(await screen.findByRole('navigation', { name: 'Conversation history' })).toBeInTheDocument()
  })

  it('marks the active row, keeps row actions visible, wraps long Japanese titles without cutting them, and passes axe', async () => {
    const long = '段階別の件数と凍結版の比較に関する長い会話のタイトルです'
    const { container } = render(
      <TympanProvider locale="ja">
        <ConversationShell session={fakeSession({ threadId: 'j1' })} threads={[{ id: 'j1', title: long, updatedAt: day(0) }]} onOpenThread={vi.fn()} onRemoveThread={vi.fn()} onStartThread={vi.fn()} />
      </TympanProvider>,
    )
    const row = container.querySelector('.ty-convo-row__main')!
    expect(row).toHaveAttribute('aria-current', 'page')
    expect(row).toHaveAttribute('title', long)
    expect(row.querySelector('.ty-convo-row__title')).toHaveTextContent(long)
    expect(cssOf('assistant/assistant.css')).toMatch(/\.ty-convo-row__title\s*\{[^}]*line-clamp/)
    await expectNoAxeViolations(container)
  })

  it('works right to left with the history as a navigation landmark', async () => {
    const onSelect = vi.fn()
    render(
      <TympanProvider locale="ar">
        <div dir="rtl">
          <ConversationShell session={fakeSession()} threads={[{ id: 'a1', title: 'عدد الحالات', updatedAt: day(0) }]} onOpenThread={onSelect} onRemoveThread={vi.fn()} onStartThread={vi.fn()} />
        </div>
      </TympanProvider>,
    )
    const nav = screen.getByRole('navigation')
    await userEvent.click(within(nav).getByText('عدد الحالات'))
    expect(onSelect).toHaveBeenCalledWith('a1')
  })
})
