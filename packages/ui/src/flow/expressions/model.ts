// Expression trees and the operation vocabulary. The vocabulary belongs to the
// engine: hosts pass it as an ExpressionCatalog (from the backend node
// catalog). This module only groups, describes and seeds it.

/** A node of an expression tree: an operation, a reference or a literal. */
export type ExpressionNode = OperationNode | ReferenceNode | LiteralNode

export interface OperationNode {
  operation: string
  [operand: string]: unknown
}
export interface ReferenceNode {
  ref: string
}
export interface LiteralNode {
  value: unknown
}

export type OperandKind = 'expression' | 'list' | 'param' | 'raw'
export type LoopBinding = 'item' | 'index' | 'accumulator'

export interface OperandSlotSpec {
  key: string
  kind: OperandKind
  /** Known sub-vocabulary of a parameter (shown with friendly names). */
  vocabulary?: 'comparison' | 'arithmetic' | 'sortOrder' | readonly string[]
  /** Loop variables this expression slot binds for its subtree. */
  binds?: readonly LoopBinding[]
  optional?: boolean
}

export type YieldType = 'boolean' | 'number' | 'string' | 'list' | 'object' | 'any'

export interface OperationSpec {
  name: string
  /** One of EXPRESSION_FAMILIES; anything else falls into "core". */
  family?: string
  operands: readonly OperandSlotSpec[]
  yields?: YieldType
  /** Operands to seed when the operation is picked (defaults per slot kind otherwise). */
  starter?: Record<string, unknown>
}

export interface ExpressionCatalog {
  operations: readonly OperationSpec[]
}

/** The twelve families, in display order. "core" also receives unknown families. */
export const EXPRESSION_FAMILIES = [
  'aggregation',
  'list',
  'set',
  'object',
  'arithmetic',
  'text',
  'logic',
  'conversion',
  'datetime',
  'pattern',
  'utility',
  'core',
] as const
export type ExpressionFamily = (typeof EXPRESSION_FAMILIES)[number]

export const VOCABULARIES: Record<'comparison' | 'arithmetic' | 'sortOrder', readonly string[]> = {
  comparison: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte'],
  arithmetic: ['add', 'subtract', 'multiply', 'divide', 'modulo', 'power'],
  sortOrder: ['asc', 'desc'],
}

/** Engine nesting limit mirrored by the builder. */
export const MAX_EXPRESSION_DEPTH = 8

/** Reference used for "the flow's inputs" when nothing more specific exists. */
export const FLOW_INPUTS_REF = 'inputs'

export const isOperation = (n: unknown): n is OperationNode => !!n && typeof n === 'object' && !Array.isArray(n) && typeof (n as OperationNode).operation === 'string'
export const isReference = (n: unknown): n is ReferenceNode => !!n && typeof n === 'object' && !Array.isArray(n) && typeof (n as ReferenceNode).ref === 'string' && !('operation' in (n as object))
export const isLiteral = (n: unknown): n is LiteralNode => !!n && typeof n === 'object' && !Array.isArray(n) && 'value' in (n as object) && !('operation' in (n as object)) && !('ref' in (n as object))

export function familyOf(op: OperationSpec): ExpressionFamily {
  return (EXPRESSION_FAMILIES as readonly string[]).includes(op.family ?? '') ? (op.family as ExpressionFamily) : 'core'
}

export function vocabularyOf(slot: OperandSlotSpec): readonly string[] | null {
  if (!slot.vocabulary) return null
  return typeof slot.vocabulary === 'string' ? VOCABULARIES[slot.vocabulary] : slot.vocabulary
}

/**
 * An entry of the operation picker. Operations with an arithmetic-kind
 * parameter are offered as one verb per arithmetic kind ("add", "subtract"),
 * which still emits the same tree.
 */
export interface PickerEntry {
  id: string
  family: ExpressionFamily
  op: OperationSpec
  /** Arithmetic verb fixed by this entry, if any. */
  verb?: { key: string; value: string }
}

export function pickerEntries(catalog: ExpressionCatalog | undefined, mode: 'expression' | 'predicate'): PickerEntry[] {
  if (!catalog) return []
  const out: PickerEntry[] = []
  for (const op of catalog.operations) {
    if (mode === 'predicate' && op.yields !== 'boolean') continue
    const verbSlot = op.operands.find((s) => s.kind === 'param' && s.vocabulary === 'arithmetic')
    if (verbSlot) {
      for (const v of VOCABULARIES.arithmetic) out.push({ id: `${op.name}:${v}`, family: familyOf(op), op, verb: { key: verbSlot.key, value: v } })
    } else out.push({ id: op.name, family: familyOf(op), op })
  }
  return out
}

/** Picker entry that represents `node` (verb-aware). */
export function entryIdOf(node: OperationNode, entries: readonly PickerEntry[]): string | null {
  const match = entries.find((e) => e.op.name === node.operation && (!e.verb || node[e.verb.key] === e.verb.value))
  return match?.id ?? null
}

export function starterFor(slot: OperandSlotSpec): unknown {
  switch (slot.kind) {
    case 'expression':
      return { value: null }
    case 'list':
      return []
    case 'param':
      return vocabularyOf(slot)?.[0] ?? ''
    case 'raw':
      return {}
  }
}

/** A fresh operation node with starter operands. */
export function seedOperation(entry: PickerEntry): OperationNode {
  const node: OperationNode = { operation: entry.op.name }
  for (const slot of entry.op.operands) {
    if (slot.optional) continue
    node[slot.key] = entry.op.starter && slot.key in entry.op.starter ? structuredClone(entry.op.starter[slot.key]) : starterFor(slot)
  }
  if (entry.verb) node[entry.verb.key] = entry.verb.value
  return node
}

export function findOperation(catalog: ExpressionCatalog | undefined, name: string): OperationSpec | undefined {
  return catalog?.operations.find((o) => o.name === name)
}

/** Slots of an operation the catalog does not know, inferred from its operands. */
export function inferSlots(node: OperationNode): OperandSlotSpec[] {
  return Object.keys(node)
    .filter((k) => k !== 'operation')
    .map((key) => {
      const v = node[key]
      if (Array.isArray(v)) return { key, kind: 'list' as const }
      if (v && typeof v === 'object') return isOperation(v) || isReference(v) || isLiteral(v) ? { key, kind: 'expression' as const } : { key, kind: 'raw' as const }
      return { key, kind: 'param' as const }
    })
}

/** Reads a literal field: structured data when it parses, else plain text. */
export function readLiteral(text: string): unknown {
  const t = text.trim()
  if (t === '') return ''
  try {
    return JSON.parse(t)
  } catch {
    return text
  }
}

export function writeLiteral(value: unknown): string {
  if (value === null || value === undefined) return ''
  return typeof value === 'string' ? value : JSON.stringify(value)
}

export type ExpressionTextError = { kind: 'empty' } | { kind: 'unparseable'; detail: string } | { kind: 'missing-operation' } | { kind: 'unknown-operation'; operation: string }

/** Validates a structured-text document holding one expression tree. */
export function parseExpressionText(text: string, catalog?: ExpressionCatalog): { ok: true; value: OperationNode } | { ok: false; error: ExpressionTextError } {
  if (!text.trim()) return { ok: false, error: { kind: 'empty' } }
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    return { ok: false, error: { kind: 'unparseable', detail: e instanceof Error ? e.message : String(e) } }
  }
  if (!isOperation(parsed) || !parsed.operation.trim()) return { ok: false, error: { kind: 'missing-operation' } }
  if (catalog && !findOperation(catalog, parsed.operation)) return { ok: false, error: { kind: 'unknown-operation', operation: parsed.operation } }
  return { ok: true, value: parsed }
}

export const prettyJson = (v: unknown) => JSON.stringify(v, null, 2)
