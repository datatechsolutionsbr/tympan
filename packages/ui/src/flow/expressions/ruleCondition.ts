// Rule conditions: a predicate expression tree. `normalizeRuleCondition`
// rewrites older condition shapes into that tree, keeping their meaning. It
// must stay identical to the engine's normaliser (shared fixtures).

import { FLOW_INPUTS_REF, isOperation, type ExpressionNode, type OperationNode } from './model'

const ref = (path: string): ExpressionNode => ({ ref: path })
const lit = (value: unknown): ExpressionNode => ({ value })
const compare = (op: string, left: ExpressionNode, right: ExpressionNode): OperationNode => ({ operation: 'compare', op, left, right })
const all = (conditions: ExpressionNode[]): OperationNode => ({ operation: 'and', conditions })
const any = (conditions: ExpressionNode[]): OperationNode => ({ operation: 'or', conditions })

/** Default condition: flow input equals an empty literal. */
export function defaultRuleCondition(): OperationNode {
  return compare('eq', ref(FLOW_INPUTS_REF), lit(''))
}

/** A condition that never matches (used for unreadable input). */
export const NEVER_MATCHES: ExpressionNode = Object.freeze({ value: false })

const OPERATOR_WORDS: Record<string, string> = {
  equals: 'eq',
  eq: 'eq',
  '==': 'eq',
  '=': 'eq',
  not_equals: 'ne',
  notEquals: 'ne',
  ne: 'ne',
  '!=': 'ne',
  greater_than: 'gt',
  gt: 'gt',
  '>': 'gt',
  at_least: 'gte',
  gte: 'gte',
  '>=': 'gte',
  less_than: 'lt',
  lt: 'lt',
  '<': 'lt',
  at_most: 'lte',
  lte: 'lte',
  '<=': 'lte',
}

type Legacy = Record<string, unknown>

function convert(c: unknown): ExpressionNode {
  if (isOperation(c)) return c
  if (!c || typeof c !== 'object' || Array.isArray(c)) return NEVER_MATCHES
  const o = c as Legacy
  const group = (o.all ?? o.and) as unknown
  if (Array.isArray(group)) return all(group.map(convert))
  const either = (o.any ?? o.or) as unknown
  if (Array.isArray(either)) return any(either.map(convert))
  if ('not' in o) return { operation: 'not', condition: convert(o.not) }
  const field = typeof o.field === 'string' ? o.field : null
  if (!field) return NEVER_MATCHES
  const left = ref(field)
  if (o.truthy === true || o.type === 'truthy' || o.operator === 'truthy') {
    // Old "truthy": not null, not false, not empty text.
    return all([compare('ne', left, lit(null)), compare('ne', left, lit(false)), compare('ne', left, lit(''))])
  }
  if (typeof o.pattern === 'string') return { operation: 'matches', text: left, pattern: lit(o.pattern) }
  if ('min' in o || 'max' in o) {
    const parts: ExpressionNode[] = []
    if (o.min !== undefined) parts.push(compare('gte', left, lit(o.min)))
    if (o.max !== undefined) parts.push(compare('lte', left, lit(o.max)))
    return parts.length === 1 ? parts[0]! : all(parts)
  }
  if ('after' in o || 'before' in o) {
    const parts: ExpressionNode[] = []
    if (o.after !== undefined) parts.push(compare('gte', left, lit(o.after)))
    if (o.before !== undefined) parts.push(compare('lte', left, lit(o.before)))
    return parts.length === 1 ? parts[0]! : all(parts)
  }
  const op = OPERATOR_WORDS[String(o.operator ?? o.op ?? 'equals')]
  if (!op) return NEVER_MATCHES
  return compare(op, left, lit(o.value))
}

/** Normalises any stored condition into a predicate expression tree. */
export function normalizeRuleCondition(value: unknown): ExpressionNode {
  return convert(value)
}

/** Name of the root of a condition tree: its operation, "reference" or "value". */
export function conditionRootName(node: ExpressionNode | undefined): 'reference' | 'value' | string {
  if (isOperation(node)) return node.operation
  if (node && 'ref' in node) return 'reference'
  return 'value'
}

/** "and of 3 clauses" style summary data for rule pickers. */
export function conditionSummary(value: unknown): { root: string; clauses: number } {
  const n = normalizeRuleCondition(value)
  const root = conditionRootName(n)
  const list = isOperation(n) && Array.isArray(n.conditions) ? n.conditions.length : 1
  return { root, clauses: list }
}
