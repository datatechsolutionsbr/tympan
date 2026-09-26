// useAssistantChat: one conversation with the platform assistant, one turn at
// a time, over a host transport (streamed or one-shot). The hook owns the
// message list, the turn status and the composer text; it never talks to a
// server by itself.

import { useCallback, useEffect, useRef, useState } from 'react'
import { createId } from '../internal/ids'
import { parseAssistantVisual, type VisualEnvelope } from './visual'

export type ChatRole = 'user' | 'assistant'

export type ChatPart =
  | { type: 'text'; text: string }
  | { type: 'reasoning'; text: string }
  | { type: 'tool'; toolCallId: string; toolName: string; state: 'running' | 'succeeded' | 'failed'; summary?: string; input?: unknown; output?: unknown }
  | { type: 'visual'; toolCallId: string; envelope: VisualEnvelope }

export interface ChatMessage {
  id: string
  role: ChatRole
  parts: ChatPart[]
  /** pending: waiting for the first part; streaming: parts arriving; done; failed. */
  state: 'pending' | 'streaming' | 'done' | 'failed'
  error?: string
}

export type AssistantAction = { type: 'navigate'; path: string } | { type: string; [key: string]: unknown }

export type StreamEvent =
  | { type: 'start'; conversationId?: string; connectionId?: string }
  | { type: 'text-delta'; delta: string }
  | { type: 'reasoning-delta'; delta: string }
  | { type: 'tool-input-start'; toolCallId: string; toolName: string }
  | { type: 'tool-input-available'; toolCallId: string; toolName: string; input?: unknown }
  | { type: 'tool-output'; toolCallId: string; output?: unknown; error?: string; summary?: string }
  | { type: 'action'; action: AssistantAction }
  | { type: 'finish'; conversationId?: string }
  | { type: 'error'; message: string }

export interface ChatTurn {
  prompt: string
  history: Array<{ role: ChatRole; text: string }>
  conversationId: string | null
  context: { currentPath?: string; screenTitle?: string; mode: 'app' | 'conversation' | 'admin'; boundFlowId?: string }
}

export interface OneShotReply {
  reply: string
  actions?: AssistantAction[]
  toolEvents?: Array<{ toolCallId: string; toolName: string; input?: unknown; output?: unknown; error?: string; summary?: string }>
  connectionId?: string
  conversationId?: string
}

export interface AssistantChatOptions {
  streamTransport?: (turn: ChatTurn, io: { signal: AbortSignal; onEvent: (e: StreamEvent) => void }) => Promise<void>
  transport?: (turn: ChatTurn) => Promise<OneShotReply>
  currentPath?: string
  screenTitle?: string
  mode?: 'app' | 'conversation' | 'admin'
  onNavigate?: (path: string) => void
  boundFlowId?: string
  /** Name of the reserved visualization tool. */
  visualToolName?: string
  /** Error texts owned by the hook (the host passes localised strings). */
  messages?: { noTransport?: string; failed?: string }
}

export type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error'

export interface StoredConversation {
  id: string
  messages: unknown[]
}

export interface AssistantChat {
  messages: ChatMessage[]
  status: ChatStatus
  busy: boolean
  isHydrating: boolean
  conversationId: string | null
  input: string
  setInput: (text: string) => void
  send: (text?: string) => void
  stop: () => void
  retry: () => void
  canRetry: boolean
  setHydrating: (on: boolean) => void
  newConversation: () => void
  hydrate: (stored: StoredConversation) => void
}

const DEFAULT_VISUAL_TOOL = 'render_visual'

/** Text of a message (text parts only, joined). */
export function messageText(m: Pick<ChatMessage, 'parts'>): string {
  return m.parts
    .filter((p): p is Extract<ChatPart, { type: 'text' }> => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

/** Appends a delta to the last part of the same kind, or opens a new part. */
function appendDelta(parts: ChatPart[], kind: 'text' | 'reasoning', delta: string): ChatPart[] {
  const last = parts[parts.length - 1]
  if (last && last.type === kind) return [...parts.slice(0, -1), { ...last, text: last.text + delta }]
  return [...parts, { type: kind, text: delta }]
}

function isWellFormedPart(p: unknown): p is ChatPart {
  if (!p || typeof p !== 'object') return false
  const o = p as Record<string, unknown>
  switch (o.type) {
    case 'text':
    case 'reasoning':
      return typeof o.text === 'string'
    case 'tool':
      return typeof o.toolCallId === 'string' && typeof o.toolName === 'string' && ['running', 'succeeded', 'failed'].includes(o.state as string)
    case 'visual':
      return typeof o.toolCallId === 'string' && !!parseAssistantVisual(o.envelope)
    default:
      return false
  }
}

/** Keeps only well-formed stored messages and parts. */
export function sanitiseStored(raw: unknown[]): ChatMessage[] {
  const out: ChatMessage[] = []
  for (const m of raw) {
    if (!m || typeof m !== 'object') continue
    const o = m as Record<string, unknown>
    if (o.role !== 'user' && o.role !== 'assistant') continue
    const parts = Array.isArray(o.parts) ? o.parts.filter(isWellFormedPart) : []
    out.push({ id: typeof o.id === 'string' ? o.id : createId('msg'), role: o.role, parts, state: 'done' })
  }
  return out
}

export function useAssistantChat(options: AssistantChatOptions = {}): AssistantChat {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<ChatStatus>('ready')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isHydrating, setHydrating] = useState(false)
  const [input, setInput] = useState('')
  const opts = useRef(options)
  opts.current = options
  const messagesRef = useRef(messages)
  messagesRef.current = messages
  const convRef = useRef(conversationId)
  convRef.current = conversationId
  const turn = useRef<{ controller: AbortController; assistantId: string; prompt: string } | null>(null)
  const lastPrompt = useRef<string | null>(null)

  const patchAssistant = useCallback((id: string, fn: (m: ChatMessage) => ChatMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? fn(m) : m)))
  }, [])

  const applyAction = useCallback((action: AssistantAction) => {
    if (action.type === 'navigate' && typeof action.path === 'string' && action.path.startsWith('/') && !action.path.startsWith('//')) {
      opts.current.onNavigate?.(action.path)
    }
  }, [])

  const toolOutput = useCallback((m: ChatMessage, e: { toolCallId: string; output?: unknown; error?: string; summary?: string; toolName?: string; input?: unknown }): ChatMessage => {
    let found = false
    const parts: ChatPart[] = m.parts.map((p) => {
      if (p.type !== 'tool' || p.toolCallId !== e.toolCallId) return p
      found = true
      return { ...p, state: e.error ? 'failed' : 'succeeded', ...(e.summary ?? e.error ? { summary: e.summary ?? e.error } : {}), output: e.output }
    })
    if (!found) parts.push({ type: 'tool', toolCallId: e.toolCallId, toolName: e.toolName ?? '', state: e.error ? 'failed' : 'succeeded', ...(e.summary ?? e.error ? { summary: e.summary ?? e.error } : {}), input: e.input, output: e.output })
    const tool = parts.find((p): p is Extract<ChatPart, { type: 'tool' }> => p.type === 'tool' && p.toolCallId === e.toolCallId)
    if (!e.error && tool && tool.toolName === (opts.current.visualToolName ?? DEFAULT_VISUAL_TOOL)) {
      const envelope = parseAssistantVisual(e.output)
      if (envelope) parts.push({ type: 'visual', toolCallId: e.toolCallId, envelope })
    }
    return { ...m, parts, state: 'streaming' }
  }, [])

  const run = useCallback(
    async (prompt: string, reuseUser: boolean) => {
      const o = opts.current
      // History: settled turns only, no empty texts.
      const history = messagesRef.current
        .filter((m) => m.state === 'done')
        .map((m) => ({ role: m.role, text: messageText(m) }))
        .filter((h) => h.text.trim())
      const assistantId = createId('msg')
      const controller = new AbortController()
      turn.current = { controller, assistantId, prompt }
      lastPrompt.current = prompt
      const assistant: ChatMessage = { id: assistantId, role: 'assistant', parts: [], state: 'pending' }
      setMessages((prev) => (reuseUser ? [...prev, assistant] : [...prev, { id: createId('msg'), role: 'user', parts: [{ type: 'text', text: prompt }], state: 'done' }, assistant]))
      setStatus('submitted')
      const payload: ChatTurn = {
        prompt,
        history,
        conversationId: convRef.current,
        context: { mode: o.mode ?? 'app', ...(o.currentPath !== undefined ? { currentPath: o.currentPath } : {}), ...(o.screenTitle !== undefined ? { screenTitle: o.screenTitle } : {}), ...(o.boundFlowId ? { boundFlowId: o.boundFlowId } : {}) },
      }
      const live = () => turn.current?.assistantId === assistantId && !controller.signal.aborted
      const fail = (message: string) => {
        if (!live()) return
        patchAssistant(assistantId, (m) => ({ ...m, state: 'failed', error: message }))
        setStatus('error')
        turn.current = null
      }
      const finish = () => {
        if (!live()) return
        patchAssistant(assistantId, (m) => ({ ...m, state: 'done' }))
        setStatus('ready')
        turn.current = null
      }

      if (o.streamTransport) {
        let failed = false
        const onEvent = (e: StreamEvent) => {
          if (!live() || failed) return
          switch (e.type) {
            case 'start':
              if (e.conversationId) setConversationId(e.conversationId)
              return
            case 'text-delta':
            case 'reasoning-delta':
              setStatus('streaming')
              patchAssistant(assistantId, (m) => ({ ...m, state: 'streaming', parts: appendDelta(m.parts, e.type === 'text-delta' ? 'text' : 'reasoning', e.delta) }))
              return
            case 'tool-input-start':
            case 'tool-input-available':
              setStatus('streaming')
              patchAssistant(assistantId, (m) => {
                const existing = m.parts.some((p) => p.type === 'tool' && p.toolCallId === e.toolCallId)
                const parts: ChatPart[] = existing
                  ? m.parts.map((p) => (p.type === 'tool' && p.toolCallId === e.toolCallId && e.type === 'tool-input-available' ? { ...p, input: e.input } : p))
                  : [...m.parts, { type: 'tool', toolCallId: e.toolCallId, toolName: e.toolName, state: 'running', ...(e.type === 'tool-input-available' ? { input: e.input } : {}) }]
                return { ...m, state: 'streaming', parts }
              })
              return
            case 'tool-output':
              setStatus('streaming')
              patchAssistant(assistantId, (m) => toolOutput(m, e))
              return
            case 'action':
              applyAction(e.action)
              return
            case 'finish':
              if (e.conversationId) setConversationId(e.conversationId)
              finish()
              return
            case 'error':
              failed = true
              fail(e.message)
              return
          }
        }
        try {
          await o.streamTransport(payload, { signal: controller.signal, onEvent })
          if (!failed) finish()
        } catch (err) {
          if (controller.signal.aborted) return
          fail(err instanceof Error ? err.message : String(err))
        }
        return
      }
      if (o.transport) {
        try {
          const reply = await o.transport(payload)
          if (!live()) return
          if (reply.conversationId) setConversationId(reply.conversationId)
          patchAssistant(assistantId, (m) => {
            let next = m
            for (const t of reply.toolEvents ?? []) next = toolOutput(next, t)
            return { ...next, parts: reply.reply ? [...next.parts, { type: 'text', text: reply.reply }] : next.parts }
          })
          for (const a of reply.actions ?? []) applyAction(a)
          finish()
        } catch (err) {
          fail(err instanceof Error ? err.message : String(err))
        }
        return
      }
      fail(o.messages?.noTransport ?? 'The assistant is not configured: no transport was provided.')
    },
    [applyAction, patchAssistant, toolOutput],
  )

  const busy = status === 'submitted' || status === 'streaming'

  const send = useCallback(
    (text?: string) => {
      const prompt = (text ?? input).trim()
      if (!prompt || turn.current) return
      if (text === undefined) setInput('')
      void run(prompt, false)
    },
    [input, run],
  )

  const stop = useCallback(() => {
    const t = turn.current
    if (!t) return
    turn.current = null
    t.controller.abort()
    // The partial answer stays as the final answer; the turn is not failed.
    setMessages((prev) => prev.map((m) => (m.id === t.assistantId ? { ...m, state: 'done' } : m)))
    setStatus('ready')
  }, [])

  const lastFailed = messages.length > 0 && messages[messages.length - 1]!.state === 'failed'
  const canRetry = lastFailed && !!lastPrompt.current && !busy

  const retry = useCallback(() => {
    const prompt = lastPrompt.current
    const last = messagesRef.current[messagesRef.current.length - 1]
    if (!prompt || !last || last.state !== 'failed' || turn.current) return
    // Drop the failed bubble; the user bubble stays and is not duplicated.
    setMessages((prev) => prev.slice(0, -1))
    messagesRef.current = messagesRef.current.slice(0, -1)
    void run(prompt, true)
  }, [run])

  const abortTurn = () => {
    turn.current?.controller.abort()
    turn.current = null
  }

  const newConversation = useCallback(() => {
    abortTurn()
    setMessages([])
    setConversationId(null)
    setStatus('ready')
    setInput('')
    lastPrompt.current = null
  }, [])

  const hydrate = useCallback((stored: StoredConversation) => {
    abortTurn()
    setMessages(sanitiseStored(Array.isArray(stored.messages) ? stored.messages : []))
    setConversationId(stored.id)
    setStatus('ready')
    setInput('')
    setHydrating(false)
    lastPrompt.current = null
  }, [])

  useEffect(() => () => turn.current?.controller.abort(), [])

  return { messages, status, busy, isHydrating, conversationId, input, setInput, send, stop, retry, canRetry, setHydrating, newConversation, hydrate }
}

/** Latest successful tool result carrying a flow graph (create, edit, read …), if any. */
export function latestGraphArtifact(messages: readonly ChatMessage[]): { toolCallId: string; flowId?: string; graph: Record<string, unknown> } | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const parts = messages[i]!.parts
    for (let j = parts.length - 1; j >= 0; j--) {
      const p = parts[j]!
      if (p.type !== 'tool' || p.state !== 'succeeded' || !p.output || typeof p.output !== 'object') continue
      const out = p.output as Record<string, unknown>
      const graph = out.graph
      if (graph && typeof graph === 'object' && Array.isArray((graph as Record<string, unknown>).nodes)) {
        const flowId = typeof out.flowId === 'string' ? out.flowId : typeof out.id === 'string' ? out.id : undefined
        return { toolCallId: p.toolCallId, graph: graph as Record<string, unknown>, ...(flowId ? { flowId } : {}) }
      }
    }
  }
  return null
}
