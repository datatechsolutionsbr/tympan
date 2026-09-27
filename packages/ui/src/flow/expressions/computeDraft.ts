// State of the compute form's expression, independent of its markup: the tree,
// its JSON text and the text's problem move together through one reducer, so
// a bad text never loses the last good tree.

import { useEffect, useReducer, useRef } from 'react'
import { fill } from '../internal/labels'
import { FLOW_INPUTS_REF, parseExpressionText, prettyJson, type ExpressionCatalog, type ExpressionTextError, type OperationNode } from './model'

/** Seeded into a blank document: hands the flow's inputs through unchanged. */
export const PASS_THROUGH: OperationNode = { operation: 'identity', value: { ref: FLOW_INPUTS_REF } }

/** Keys of the earlier script-based compute step, dropped on load. */
export const LEGACY_SCRIPT_KEYS = ['script', 'code', 'language', 'runtime'] as const

/** The stored configuration minus the old script keys. */
export function withoutScriptKeys(config: Record<string, unknown>): Record<string, unknown> {
  const legacy = new Set<string>(LEGACY_SCRIPT_KEYS)
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(config)) if (!legacy.has(key)) out[key] = config[key]
  return out
}

/** The tree to start from: the stored operation, or the pass-through. */
export function openingTree(config: Record<string, unknown>): OperationNode {
  const candidate = config.expression
  const usable = !!candidate && typeof candidate === 'object' && typeof (candidate as { operation?: unknown }).operation === 'string'
  return usable ? (candidate as OperationNode) : PASS_THROUGH
}

type ProblemWords = { unparseable: string; missingOperation: string; unknownOperation: string }

/** Sentence for a text problem; null for an empty document (no message). */
export function textErrorMessage(error: ExpressionTextError, words: ProblemWords, locale?: string): string | null {
  if (error.kind === 'empty') return null
  if (error.kind === 'missing-operation') return words.missingOperation
  if (error.kind === 'unparseable') return fill(words.unparseable, { detail: error.detail }, locale)
  return fill(words.unknownOperation, { name: error.operation }, locale)
}

/** Sample data text: blank means "none"; otherwise a JSON object is required. */
export function sampleFromText(text: string): { ok: true; value: Record<string, unknown> | undefined } | { ok: false; reason: string } {
  if (text.trim() === '') return { ok: true, value: undefined }
  try {
    const value: unknown = JSON.parse(text)
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) return { ok: true, value: value as Record<string, unknown> }
    return { ok: false, reason: 'object expected' }
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) }
  }
}

interface DraftState {
  tree: OperationNode
  text: string
  problem: ExpressionTextError | null
}

type DraftMove = { to: 'text'; text: string; catalog: ExpressionCatalog | undefined } | { to: 'tree'; tree: OperationNode } | { to: 'reprint' }

function draftReducer(state: DraftState, move: DraftMove): DraftState {
  if (move.to === 'tree') return { ...state, tree: move.tree }
  if (move.to === 'reprint') return { ...state, text: prettyJson(state.tree), problem: null }
  const read = parseExpressionText(move.text, move.catalog)
  return read.ok ? { tree: read.value, text: move.text, problem: null } : { ...state, text: move.text, problem: read.error }
}

/**
 * The expression as tree and text. `splice` inserts a fragment at the caret
 * (or replaces a blank document) and puts the caret after it.
 */
export function useComputeDraft(start: OperationNode, catalog: ExpressionCatalog | undefined) {
  const [state, move] = useReducer(draftReducer, start, (tree) => ({ tree, text: prettyJson(tree), problem: null }))
  const textArea = useRef<HTMLTextAreaElement>(null)
  const pendingCaret = useRef<number | null>(null)

  useEffect(() => {
    const at = pendingCaret.current
    if (at === null || !textArea.current) return
    pendingCaret.current = null
    textArea.current.focus()
    textArea.current.setSelectionRange(at, at)
  }, [state.text])

  const editText = (text: string) => move({ to: 'text', text, catalog })
  const splice = (fragment: string) => {
    if (state.text.trim() === '') {
      pendingCaret.current = fragment.length
      editText(fragment)
      return
    }
    const el = textArea.current
    const start = el?.selectionStart ?? state.text.length
    const end = el?.selectionEnd ?? start
    pendingCaret.current = start + fragment.length
    editText(state.text.slice(0, start) + fragment + state.text.slice(end))
  }
  return {
    ...state,
    textArea,
    editText,
    splice,
    setTree: (tree: OperationNode) => move({ to: 'tree', tree }),
    reprint: () => move({ to: 'reprint' }),
  }
}
