// useAssistantSession: one conversation with the platform assistant. The host
// supplies how questions travel: `openStream` (a stream of signals) or
// `askOnce` (a single reply). Everything the session keeps (utterances,
// phase, thread, draft) lives in one reducer; a signal from the transport is
// folded into the answering utterance by pure functions, so both transports
// share the same rules.

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { createId } from '../internal/ids'
import { parseAssistantVisual, type VisualEnvelope } from './visual'

export type Speaker = 'person' | 'assistant'

/** A piece of an utterance, in arrival order. */
export type Block =
  | { kind: 'prose'; body: string }
  | { kind: 'thinking'; body: string }
  | { kind: 'toolCall'; callId: string; tool: string; phase: 'working' | 'ok' | 'broken'; note?: string; args?: unknown; result?: unknown }
  | { kind: 'figure'; callId: string; envelope: VisualEnvelope }

export interface Utterance {
  key: string
  speaker: Speaker
  blocks: Block[]
  /** waiting: nothing arrived yet; arriving: blocks coming in; settled; broken. */
  phase: 'waiting' | 'arriving' | 'settled' | 'broken'
  problem?: string
}

/** Something the assistant asks the app to do; only "goTo" is acted upon. */
export type Directive = { kind: 'goTo'; to: string } | { kind: string; [field: string]: unknown }

/** What a streaming transport reports, one signal at a time. */
export type SessionSignal =
  | { signal: 'opened'; threadId?: string; linkId?: string }
  | { signal: 'prose'; chunk: string }
  | { signal: 'thinking'; chunk: string }
  | { signal: 'toolAnnounced'; callId: string; tool: string }
  | { signal: 'toolArgs'; callId: string; tool: string; args?: unknown }
  | { signal: 'toolResult'; callId: string; result?: unknown; failure?: string; note?: string }
  | { signal: 'directive'; directive: Directive }
  | { signal: 'closed'; threadId?: string }
  | { signal: 'fault'; reason: string }

/** What the transport receives for one question. */
export interface SessionRequest {
  question: string
  /** Earlier settled, non-empty utterances as plain text. */
  transcript: Array<{ speaker: Speaker; text: string }>
  threadId: string | null
  where: { audience: 'app' | 'conversation' | 'admin'; path?: string; screenName?: string; flowId?: string }
}

/** A one-shot transport's answer. */
export interface SessionReply {
  answer: string
  directives?: Directive[]
  toolCalls?: Array<{ callId: string; tool: string; args?: unknown; result?: unknown; failure?: string; note?: string }>
  linkId?: string
  threadId?: string
}

export interface AssistantSessionOptions {
  openStream?: (request: SessionRequest, wire: { signal: AbortSignal; deliver: (s: SessionSignal) => void }) => Promise<void>
  askOnce?: (request: SessionRequest) => Promise<SessionReply>
  path?: string
  screenName?: string
  audience?: 'app' | 'conversation' | 'admin'
  onGoTo?: (path: string) => void
  flowId?: string
  /** Name of the reserved tool whose results are drawn as figures. */
  figureTool?: string
  /** Localised error texts owned by the session. */
  texts?: { missingTransport?: string; failed?: string }
}

export type SessionPhase = 'idle' | 'asking' | 'receiving' | 'broken'

export interface SavedThread {
  id: string
  utterances: unknown[]
}

export interface AssistantSession {
  utterances: Utterance[]
  phase: SessionPhase
  working: boolean
  loadingHistory: boolean
  threadId: string | null
  draft: string
  setDraft: (text: string) => void
  ask: (text?: string) => void
  halt: () => void
  askAgain: () => void
  canAskAgain: boolean
  setLoadingHistory: (on: boolean) => void
  reset: () => void
  restore: (saved: SavedThread) => void
}

const FIGURE_TOOL = 'render_visual'

type ToolBlock = Extract<Block, { kind: 'toolCall' }>
type Written = Extract<Block, { kind: 'prose' | 'thinking' }>

/** The prose of an utterance (prose blocks only, joined). */
export function plainText(u: Pick<Utterance, 'blocks'>): string {
  let out = ''
  for (const b of u.blocks) if (b.kind === 'prose') out += b.body
  return out
}

// ---- folding signals into blocks -----------------------------------------

function extendWritten(blocks: Block[], kind: Written['kind'], chunk: string): Block[] {
  const last = blocks[blocks.length - 1]
  if (last && last.kind === kind) return blocks.slice(0, -1).concat({ kind, body: last.body + chunk })
  return blocks.concat({ kind, body: chunk })
}

function indexOfCall(blocks: Block[], callId: string): number {
  return blocks.findIndex((b) => b.kind === 'toolCall' && b.callId === callId)
}

function withCall(blocks: Block[], callId: string, tool: string, args?: { value: unknown }): Block[] {
  const at = indexOfCall(blocks, callId)
  if (at < 0) return blocks.concat({ kind: 'toolCall', callId, tool, phase: 'working', ...(args ? { args: args.value } : {}) })
  if (!args) return blocks
  const copy = blocks.slice()
  copy[at] = { ...(copy[at] as ToolBlock), args: args.value }
  return copy
}

interface Outcome {
  callId: string
  tool?: string
  args?: unknown
  result?: unknown
  failure?: string
  note?: string
}

function withOutcome(blocks: Block[], o: Outcome, figureTool: string): Block[] {
  const at = indexOfCall(blocks, o.callId)
  const copy = blocks.slice()
  const base: ToolBlock = at >= 0 ? (copy[at] as ToolBlock) : { kind: 'toolCall', callId: o.callId, tool: o.tool ?? '', phase: 'working', ...(o.args !== undefined ? { args: o.args } : {}) }
  const note = o.note ?? o.failure
  const done: ToolBlock = { ...base, phase: o.failure ? 'broken' : 'ok', result: o.result, ...(note ? { note } : {}) }
  if (at >= 0) copy[at] = done
  else copy.push(done)
  if (o.failure || done.tool !== figureTool) return copy
  const envelope = parseAssistantVisual(o.result)
  return envelope ? copy.concat({ kind: 'figure', callId: o.callId, envelope }) : copy
}

/** Block change for a signal, or null for signals that change no block. */
const BLOCK_FOLDS: Partial<Record<SessionSignal['signal'], (blocks: Block[], s: SessionSignal, figureTool: string) => Block[]>> = {
  prose: (b, s) => extendWritten(b, 'prose', (s as { chunk: string }).chunk),
  thinking: (b, s) => extendWritten(b, 'thinking', (s as { chunk: string }).chunk),
  toolAnnounced: (b, s) => {
    const a = s as Extract<SessionSignal, { signal: 'toolAnnounced' }>
    return withCall(b, a.callId, a.tool)
  },
  toolArgs: (b, s) => {
    const a = s as Extract<SessionSignal, { signal: 'toolArgs' }>
    return withCall(b, a.callId, a.tool, { value: a.args })
  },
  toolResult: (b, s, fig) => withOutcome(b, s as unknown as Outcome, fig),
}

// ---- stored threads -------------------------------------------------------

const BLOCK_SHAPES: Record<string, (o: Record<string, unknown>) => boolean> = {
  prose: (o) => typeof o.body === 'string',
  thinking: (o) => typeof o.body === 'string',
  toolCall: (o) => typeof o.callId === 'string' && typeof o.tool === 'string' && ['working', 'ok', 'broken'].includes(String(o.phase)),
  figure: (o) => typeof o.callId === 'string' && parseAssistantVisual(o.envelope) !== null,
}

function isBlock(x: unknown): x is Block {
  if (!x || typeof x !== 'object') return false
  const check = BLOCK_SHAPES[String((x as { kind?: unknown }).kind)]
  return !!check && check(x as Record<string, unknown>)
}

/** Keeps only well-formed saved utterances and blocks. */
export function acceptSaved(raw: unknown[]): Utterance[] {
  const out: Utterance[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    if (o.speaker !== 'person' && o.speaker !== 'assistant') continue
    out.push({ key: typeof o.key === 'string' ? o.key : createId('utt'), speaker: o.speaker, blocks: Array.isArray(o.blocks) ? o.blocks.filter(isBlock) : [], phase: 'settled' })
  }
  return out
}

// ---- session state --------------------------------------------------------

interface SessionState {
  utterances: Utterance[]
  phase: SessionPhase
  threadId: string | null
  loadingHistory: boolean
  draft: string
}

type Move =
  | { type: 'draft'; text: string }
  | { type: 'loading'; on: boolean }
  | { type: 'pose'; question: Utterance | null; answer: Utterance }
  | { type: 'fold'; key: string; signal: SessionSignal; figureTool: string }
  | { type: 'reply'; key: string; reply: SessionReply; figureTool: string }
  | { type: 'thread'; id: string }
  | { type: 'end'; key: string; problem?: string }
  | { type: 'drop-last' }
  | { type: 'replace'; utterances: Utterance[]; threadId: string | null }

const EMPTY: SessionState = { utterances: [], phase: 'idle', threadId: null, loadingHistory: false, draft: '' }

function touch(state: SessionState, key: string, change: (u: Utterance) => Utterance): Utterance[] {
  return state.utterances.map((u) => (u.key === key ? change(u) : u))
}

function sessionReducer(state: SessionState, move: Move): SessionState {
  switch (move.type) {
    case 'draft':
      return { ...state, draft: move.text }
    case 'loading':
      return { ...state, loadingHistory: move.on }
    case 'pose':
      return { ...state, phase: 'asking', utterances: [...state.utterances, ...(move.question ? [move.question] : []), move.answer] }
    case 'fold': {
      const fold = BLOCK_FOLDS[move.signal.signal]
      if (!fold) return state
      return { ...state, phase: 'receiving', utterances: touch(state, move.key, (u) => ({ ...u, phase: 'arriving', blocks: fold(u.blocks, move.signal, move.figureTool) })) }
    }
    case 'reply': {
      const r = move.reply
      return {
        ...state,
        ...(r.threadId ? { threadId: r.threadId } : {}),
        utterances: touch(state, move.key, (u) => {
          let blocks = u.blocks
          for (const call of r.toolCalls ?? []) blocks = withOutcome(blocks, call, move.figureTool)
          return { ...u, blocks: r.answer ? blocks.concat({ kind: 'prose', body: r.answer }) : blocks }
        }),
      }
    }
    case 'thread':
      return { ...state, threadId: move.id }
    case 'end':
      return {
        ...state,
        phase: move.problem === undefined ? 'idle' : 'broken',
        utterances: touch(state, move.key, (u) => (move.problem === undefined ? { ...u, phase: 'settled' } : { ...u, phase: 'broken', problem: move.problem })),
      }
    case 'drop-last':
      return { ...state, utterances: state.utterances.slice(0, -1) }
    case 'replace':
      return { ...state, utterances: move.utterances, threadId: move.threadId, phase: 'idle', draft: '' }
  }
}

/** App-relative paths only ("/records"); never another origin. */
function insideApp(path: unknown): path is string {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
}

function reasonOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** The question being answered: its cancel switch, the answering utterance, the question text. */
interface InFlight {
  cancel: AbortController
  answerKey: string
  question: string
  finished: boolean
}

export function useAssistantSession(options: AssistantSessionOptions = {}): AssistantSession {
  const [state, dispatch] = useReducer(sessionReducer, EMPTY)
  // Read at ask time without re-creating callbacks.
  const latest = useRef({ options, state })
  latest.current = { options, state }
  const inFlight = useRef<InFlight | null>(null)
  const lastQuestion = useRef<string | null>(null)

  const finish = useCallback((f: InFlight, problem?: string) => {
    if (f.finished || inFlight.current !== f || f.cancel.signal.aborted) return
    f.finished = true
    inFlight.current = null
    dispatch(problem === undefined ? { type: 'end', key: f.answerKey } : { type: 'end', key: f.answerKey, problem })
  }, [])

  const obey = useCallback((d: Directive) => {
    if (d.kind === 'goTo' && insideApp(d.to)) latest.current.options.onGoTo?.(d.to)
  }, [])

  const run = useCallback(
    async (question: string, repeat: boolean) => {
      const { options: o, state: s } = latest.current
      const figureTool = o.figureTool ?? FIGURE_TOOL
      const transcript: SessionRequest['transcript'] = []
      for (const u of s.utterances) {
        const text = plainText(u)
        if (u.phase === 'settled' && text.trim()) transcript.push({ speaker: u.speaker, text })
      }
      const where: SessionRequest['where'] = { audience: o.audience ?? 'app' }
      if (o.path !== undefined) where.path = o.path
      if (o.screenName !== undefined) where.screenName = o.screenName
      if (o.flowId) where.flowId = o.flowId
      const request: SessionRequest = { question, transcript, threadId: s.threadId, where }

      const f: InFlight = { cancel: new AbortController(), answerKey: createId('utt'), question, finished: false }
      inFlight.current = f
      lastQuestion.current = question
      dispatch({
        type: 'pose',
        question: repeat ? null : { key: createId('utt'), speaker: 'person', blocks: [{ kind: 'prose', body: question }], phase: 'settled' },
        answer: { key: f.answerKey, speaker: 'assistant', blocks: [], phase: 'waiting' },
      })
      const alive = () => inFlight.current === f && !f.cancel.signal.aborted && !f.finished

      if (o.openStream) {
        const deliver = (sig: SessionSignal) => {
          if (!alive()) return
          if (BLOCK_FOLDS[sig.signal]) return dispatch({ type: 'fold', key: f.answerKey, signal: sig, figureTool })
          if ((sig.signal === 'opened' || sig.signal === 'closed') && sig.threadId) dispatch({ type: 'thread', id: sig.threadId })
          if (sig.signal === 'directive') obey(sig.directive)
          else if (sig.signal === 'closed') finish(f)
          else if (sig.signal === 'fault') finish(f, sig.reason)
        }
        try {
          await o.openStream(request, { signal: f.cancel.signal, deliver })
          finish(f)
        } catch (error) {
          if (!f.cancel.signal.aborted) finish(f, reasonOf(error))
        }
        return
      }
      if (!o.askOnce) {
        finish(f, o.texts?.missingTransport ?? 'The assistant is not configured: no transport was provided.')
        return
      }
      try {
        const reply = await o.askOnce(request)
        if (!alive()) return
        dispatch({ type: 'reply', key: f.answerKey, reply, figureTool })
        reply.directives?.forEach(obey)
        finish(f)
      } catch (error) {
        finish(f, reasonOf(error))
      }
    },
    [finish, obey],
  )

  const working = state.phase === 'asking' || state.phase === 'receiving'

  const ask = useCallback(
    (text?: string) => {
      const question = (text ?? latest.current.state.draft).trim()
      if (!question || inFlight.current) return
      if (text === undefined) dispatch({ type: 'draft', text: '' })
      void run(question, false)
    },
    [run],
  )

  const halt = useCallback(() => {
    const f = inFlight.current
    if (!f) return
    inFlight.current = null
    f.finished = true
    f.cancel.abort()
    // What arrived so far stays as the answer; the question is not failed.
    dispatch({ type: 'end', key: f.answerKey })
  }, [])

  const last = state.utterances[state.utterances.length - 1]
  const canAskAgain = last?.phase === 'broken' && !!lastQuestion.current && !working

  const askAgain = useCallback(() => {
    const question = lastQuestion.current
    const all = latest.current.state.utterances
    if (!question || all[all.length - 1]?.phase !== 'broken' || inFlight.current) return
    // The broken answer goes; the question stays once.
    latest.current = { ...latest.current, state: { ...latest.current.state, utterances: all.slice(0, -1) } }
    dispatch({ type: 'drop-last' })
    void run(question, true)
  }, [run])

  const replaceWith = useCallback((utterances: Utterance[], threadId: string | null) => {
    inFlight.current?.cancel.abort()
    inFlight.current = null
    lastQuestion.current = null
    dispatch({ type: 'replace', utterances, threadId })
  }, [])

  const reset = useCallback(() => replaceWith([], null), [replaceWith])
  const restore = useCallback(
    (saved: SavedThread) => {
      replaceWith(acceptSaved(Array.isArray(saved.utterances) ? saved.utterances : []), saved.id)
      dispatch({ type: 'loading', on: false })
    },
    [replaceWith],
  )
  const setDraft = useCallback((text: string) => dispatch({ type: 'draft', text }), [])
  const setLoadingHistory = useCallback((on: boolean) => dispatch({ type: 'loading', on }), [])

  useEffect(() => () => inFlight.current?.cancel.abort(), [])

  return useMemo(
    () => ({
      utterances: state.utterances,
      phase: state.phase,
      working,
      loadingHistory: state.loadingHistory,
      threadId: state.threadId,
      draft: state.draft,
      setDraft,
      ask,
      halt,
      askAgain,
      canAskAgain,
      setLoadingHistory,
      reset,
      restore,
    }),
    [state, working, setDraft, ask, halt, askAgain, canAskAgain, setLoadingHistory, reset, restore],
  )
}

export interface FlowArtifact {
  callId: string
  flowId?: string
  graph: Record<string, unknown>
}

/** Newest successful tool result that carries a flow graph (create, edit, read …), if any. */
export function newestFlowArtifact(utterances: readonly Utterance[]): FlowArtifact | null {
  for (let i = utterances.length - 1; i >= 0; i--) {
    const blocks = utterances[i]!.blocks
    for (let j = blocks.length - 1; j >= 0; j--) {
      const b = blocks[j]!
      if (b.kind !== 'toolCall' || b.phase !== 'ok' || !b.result || typeof b.result !== 'object') continue
      const result = b.result as Record<string, unknown>
      const graph = result.graph as Record<string, unknown> | undefined
      if (!graph || typeof graph !== 'object' || !Array.isArray(graph.nodes)) continue
      const flowId = typeof result.flowId === 'string' ? result.flowId : typeof result.id === 'string' ? result.id : undefined
      return flowId ? { callId: b.callId, flowId, graph } : { callId: b.callId, graph }
    }
  }
  return null
}
