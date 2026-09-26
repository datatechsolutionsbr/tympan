// useAssistantChat: a conversation with the platform assistant, one turn at a
// time, carried by a transport the host supplies (a stream of events, or one
// reply). The hook keeps the dialogue, the turn state and the composer text;
// what each stream event does to the answer bubble is a table of pure
// functions below, so the same rules serve both transports.

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

const VISUAL_TOOL = 'render_visual'

type TextPart = Extract<ChatPart, { type: 'text' }>
type ToolPart = Extract<ChatPart, { type: 'tool' }>

/** Text of a message (text parts only, joined). */
export function messageText(m: Pick<ChatMessage, 'parts'>): string {
  return m.parts
    .filter((p): p is TextPart => p.type === 'text')
    .map((p) => p.text)
    .join('')
}

/** Streaming text lands on the last part when it is of the same kind; otherwise it opens a part. */
function grow(parts: ChatPart[], kind: 'text' | 'reasoning', more: string): ChatPart[] {
  const tip = parts.at(-1)
  return tip?.type === kind ? [...parts.slice(0, -1), { ...tip, text: tip.text + more }] : [...parts, { type: kind, text: more }]
}

interface ToolResult {
  toolCallId: string
  toolName?: string
  input?: unknown
  output?: unknown
  error?: string
  summary?: string
}

/** Settles a tool call (adding it when it was never announced) and, for the visual tool, appends the visual answer. */
function settleTool(parts: ChatPart[], r: ToolResult, visualTool: string): ChatPart[] {
  const state: ToolPart['state'] = r.error ? 'failed' : 'succeeded'
  const note = r.summary ?? r.error
  const outcome = { state, output: r.output, ...(note ? { summary: note } : {}) }
  const known = parts.some((p) => p.type === 'tool' && p.toolCallId === r.toolCallId)
  const next: ChatPart[] = known
    ? parts.map((p) => (p.type === 'tool' && p.toolCallId === r.toolCallId ? { ...p, ...outcome } : p))
    : [...parts, { type: 'tool', toolCallId: r.toolCallId, toolName: r.toolName ?? '', input: r.input, ...outcome }]
  const call = next.find((p): p is ToolPart => p.type === 'tool' && p.toolCallId === r.toolCallId)
  const envelope = !r.error && call?.toolName === visualTool ? parseAssistantVisual(r.output) : null
  return envelope ? [...next, { type: 'visual', toolCallId: r.toolCallId, envelope }] : next
}

/** Declares (or adds input to) a tool call that is still running. */
function openTool(parts: ChatPart[], id: string, name: string, input?: { value: unknown }): ChatPart[] {
  if (!parts.some((p) => p.type === 'tool' && p.toolCallId === id)) return [...parts, { type: 'tool', toolCallId: id, toolName: name, state: 'running', ...(input ? { input: input.value } : {}) }]
  return input ? parts.map((p) => (p.type === 'tool' && p.toolCallId === id ? { ...p, input: input.value } : p)) : parts
}

type Rewrite = (parts: ChatPart[], visualTool: string) => ChatPart[]

/** How a stream event changes the answer's parts; events not listed change no part. */
function partsChange(e: StreamEvent): Rewrite | null {
  switch (e.type) {
    case 'text-delta':
      return (parts) => grow(parts, 'text', e.delta as string)
    case 'reasoning-delta':
      return (parts) => grow(parts, 'reasoning', e.delta as string)
    case 'tool-input-start':
      return (parts) => openTool(parts, e.toolCallId as string, e.toolName as string)
    case 'tool-input-available':
      return (parts) => openTool(parts, e.toolCallId as string, e.toolName as string, { value: (e as { input?: unknown }).input })
    case 'tool-output':
      return (parts, visualTool) => settleTool(parts, e as ToolResult, visualTool)
    default:
      return null
  }
}

const PART_CHECKS: Record<string, (o: Record<string, unknown>) => boolean> = {
  text: (o) => typeof o.text === 'string',
  reasoning: (o) => typeof o.text === 'string',
  tool: (o) => typeof o.toolCallId === 'string' && typeof o.toolName === 'string' && ['running', 'succeeded', 'failed'].includes(String(o.state)),
  visual: (o) => typeof o.toolCallId === 'string' && parseAssistantVisual(o.envelope) !== null,
}

const wellFormed = (p: unknown): p is ChatPart => !!p && typeof p === 'object' && (PART_CHECKS[String((p as { type?: unknown }).type)]?.(p as Record<string, unknown>) ?? false)

/** Keeps only well-formed stored messages and parts. */
export function sanitiseStored(raw: unknown[]): ChatMessage[] {
  return raw.flatMap((m): ChatMessage[] => {
    const o = m && typeof m === 'object' ? (m as Record<string, unknown>) : null
    if (!o || (o.role !== 'user' && o.role !== 'assistant')) return []
    return [{ id: typeof o.id === 'string' ? o.id : createId('msg'), role: o.role, parts: Array.isArray(o.parts) ? o.parts.filter(wellFormed) : [], state: 'done' }]
  })
}

/** App-relative paths only ("/records"); never another origin. */
const isAppPath = (path: unknown): path is string => typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')

const errorText = (why: unknown) => (why instanceof Error ? why.message : String(why))

/** The one turn in flight: its cancel switch, the answer bubble it writes, and the prompt. */
interface Flight {
  abort: AbortController
  answerId: string
  prompt: string
}

export function useAssistantChat(options: AssistantChatOptions = {}): AssistantChat {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<ChatStatus>('ready')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isHydrating, setHydrating] = useState(false)
  const [input, setInput] = useState('')
  // Latest values read at send time without re-creating the callbacks.
  const live = useRef({ options, messages, conversationId })
  live.current = { options, messages, conversationId }
  const flight = useRef<Flight | null>(null)
  const lastPrompt = useRef<string | null>(null)

  const editAnswer = (id: string, edit: (m: ChatMessage) => ChatMessage) => setMessages((all) => all.map((m) => (m.id === id ? edit(m) : m)))

  const land = (f: Flight, outcome: { failed: string } | 'done') => {
    if (flight.current !== f || f.abort.signal.aborted) return
    flight.current = null
    editAnswer(f.answerId, (m) => (outcome === 'done' ? { ...m, state: 'done' } : { ...m, state: 'failed', error: outcome.failed }))
    setStatus(outcome === 'done' ? 'ready' : 'error')
  }

  const act = (a: AssistantAction) => {
    if (a.type === 'navigate' && isAppPath(a.path)) live.current.options.onNavigate?.(a.path)
  }

  const launch = useCallback(async (prompt: string, userAlreadyShown: boolean) => {
    const { options: o, messages: before, conversationId: conv } = live.current
    const visualTool = o.visualToolName ?? VISUAL_TOOL
    const history = before.filter((m) => m.state === 'done').flatMap((m) => (messageText(m).trim() ? [{ role: m.role, text: messageText(m) }] : []))
    const f: Flight = { abort: new AbortController(), answerId: createId('msg'), prompt }
    flight.current = f
    lastPrompt.current = prompt
    const bubble: ChatMessage = { id: f.answerId, role: 'assistant', parts: [], state: 'pending' }
    const asked: ChatMessage[] = userAlreadyShown ? [] : [{ id: createId('msg'), role: 'user', parts: [{ type: 'text', text: prompt }], state: 'done' }]
    setMessages((all) => [...all, ...asked, bubble])
    setStatus('submitted')
    const context: ChatTurn['context'] = { mode: o.mode ?? 'app' }
    if (o.currentPath !== undefined) context.currentPath = o.currentPath
    if (o.screenTitle !== undefined) context.screenTitle = o.screenTitle
    if (o.boundFlowId) context.boundFlowId = o.boundFlowId
    const turn: ChatTurn = { prompt, history, conversationId: conv, context }
    const current = () => flight.current === f && !f.abort.signal.aborted

    if (o.streamTransport) {
      let broke = false
      const onEvent = (e: StreamEvent) => {
        if (!current() || broke) return
        const change = partsChange(e)
        if (change) {
          setStatus('streaming')
          editAnswer(f.answerId, (m) => ({ ...m, state: 'streaming', parts: change(m.parts, visualTool) }))
          return
        }
        if ((e.type === 'start' || e.type === 'finish') && e.conversationId) setConversationId(e.conversationId)
        if (e.type === 'action') act(e.action)
        if (e.type === 'finish') land(f, 'done')
        if (e.type === 'error') {
          broke = true
          land(f, { failed: e.message })
        }
      }
      try {
        await o.streamTransport(turn, { signal: f.abort.signal, onEvent })
        if (!broke) land(f, 'done')
      } catch (why) {
        if (!f.abort.signal.aborted) land(f, { failed: errorText(why) })
      }
      return
    }
    if (!o.transport) return land(f, { failed: o.messages?.noTransport ?? 'The assistant is not configured: no transport was provided.' })
    try {
      const reply = await o.transport(turn)
      if (!current()) return
      if (reply.conversationId) setConversationId(reply.conversationId)
      editAnswer(f.answerId, (m) => {
        const parts = (reply.toolEvents ?? []).reduce<ChatPart[]>((acc, t) => settleTool(acc, t, visualTool), m.parts)
        return { ...m, parts: reply.reply ? [...parts, { type: 'text', text: reply.reply }] : parts }
      })
      reply.actions?.forEach(act)
      land(f, 'done')
    } catch (why) {
      land(f, { failed: errorText(why) })
    }
    // The helpers above only read refs and stable setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const busy = status === 'submitted' || status === 'streaming'

  const send = useCallback(
    (text?: string) => {
      const prompt = (text ?? input).trim()
      if (!prompt || flight.current) return
      if (text === undefined) setInput('')
      void launch(prompt, false)
    },
    [input, launch],
  )

  const stop = useCallback(() => {
    const f = flight.current
    if (!f) return
    flight.current = null
    f.abort.abort()
    // What arrived so far becomes the answer; the turn does not count as failed.
    editAnswer(f.answerId, (m) => ({ ...m, state: 'done' }))
    setStatus('ready')
  }, [])

  const tail = messages.at(-1)
  const canRetry = tail?.state === 'failed' && !!lastPrompt.current && !busy

  const retry = useCallback(() => {
    const prompt = lastPrompt.current
    const all = live.current.messages
    if (!prompt || all.at(-1)?.state !== 'failed' || flight.current) return
    // The failed bubble goes; the question stays once.
    live.current = { ...live.current, messages: all.slice(0, -1) }
    setMessages((m) => m.slice(0, -1))
    void launch(prompt, true)
  }, [launch])

  const startOver = (next: { messages: ChatMessage[]; conversationId: string | null }) => {
    flight.current?.abort.abort()
    flight.current = null
    lastPrompt.current = null
    setMessages(next.messages)
    setConversationId(next.conversationId)
    setStatus('ready')
    setInput('')
  }

  const newConversation = useCallback(() => startOver({ messages: [], conversationId: null }), [])
  const hydrate = useCallback((stored: StoredConversation) => {
    startOver({ messages: sanitiseStored(Array.isArray(stored.messages) ? stored.messages : []), conversationId: stored.id })
    setHydrating(false)
  }, [])

  useEffect(() => () => flight.current?.abort.abort(), [])

  return { messages, status, busy, isHydrating, conversationId, input, setInput, send, stop, retry, canRetry, setHydrating, newConversation, hydrate }
}

type GraphArtifactFound = { toolCallId: string; flowId?: string; graph: Record<string, unknown> }

/** Latest successful tool result carrying a flow graph (create, edit, read …), if any. */
export function latestGraphArtifact(messages: readonly ChatMessage[]): GraphArtifactFound | null {
  const tools = messages.flatMap((m) => m.parts).filter((p): p is ToolPart => p.type === 'tool' && p.state === 'succeeded')
  for (const call of tools.reverse()) {
    const out = call.output && typeof call.output === 'object' ? (call.output as Record<string, unknown>) : null
    const graph = out?.graph as Record<string, unknown> | undefined
    if (!graph || typeof graph !== 'object' || !Array.isArray(graph.nodes)) continue
    const flowId = [out!.flowId, out!.id].find((v): v is string => typeof v === 'string')
    return flowId ? { toolCallId: call.toolCallId, graph, flowId } : { toolCallId: call.toolCallId, graph }
  }
  return null
}
