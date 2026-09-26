// A small sample vocabulary for the gallery and tests. It is NOT the engine's
// catalog: hosts pass the one their backend serves. The names below match the
// shapes produced by normalizeRuleCondition (compare, and, or, not, matches,
// coalesce) so rules render in the visual builder.

import type { ExpressionCatalog } from './model'

export const exampleExpressionCatalog: ExpressionCatalog = {
  operations: [
    { name: 'count', family: 'aggregation', yields: 'number', operands: [{ key: 'list', kind: 'expression' }] },
    { name: 'sum', family: 'aggregation', yields: 'number', operands: [{ key: 'list', kind: 'expression' }] },
    { name: 'map', family: 'list', yields: 'list', operands: [{ key: 'list', kind: 'expression' }, { key: 'body', kind: 'expression', binds: ['item', 'index'] }] },
    { name: 'filter', family: 'list', yields: 'list', operands: [{ key: 'list', kind: 'expression' }, { key: 'where', kind: 'expression', binds: ['item', 'index'] }] },
    { name: 'sort', family: 'list', yields: 'list', operands: [{ key: 'list', kind: 'expression' }, { key: 'order', kind: 'param', vocabulary: 'sortOrder' }] },
    {
      name: 'fold',
      family: 'list',
      yields: 'any',
      operands: [
        { key: 'list', kind: 'expression' },
        { key: 'initial', kind: 'expression' },
        { key: 'body', kind: 'expression', binds: ['accumulator', 'item', 'index'] },
      ],
    },
    { name: 'union', family: 'set', yields: 'list', operands: [{ key: 'lists', kind: 'list' }] },
    { name: 'pick', family: 'object', yields: 'object', operands: [{ key: 'object', kind: 'expression' }, { key: 'keys', kind: 'raw' }] },
    { name: 'arithmetic', family: 'arithmetic', yields: 'number', operands: [{ key: 'op', kind: 'param', vocabulary: 'arithmetic' }, { key: 'left', kind: 'expression' }, { key: 'right', kind: 'expression' }] },
    { name: 'concat', family: 'text', yields: 'string', operands: [{ key: 'parts', kind: 'list' }] },
    { name: 'compare', family: 'logic', yields: 'boolean', operands: [{ key: 'op', kind: 'param', vocabulary: 'comparison' }, { key: 'left', kind: 'expression' }, { key: 'right', kind: 'expression' }] },
    { name: 'and', family: 'logic', yields: 'boolean', operands: [{ key: 'conditions', kind: 'list' }] },
    { name: 'or', family: 'logic', yields: 'boolean', operands: [{ key: 'conditions', kind: 'list' }] },
    { name: 'not', family: 'logic', yields: 'boolean', operands: [{ key: 'condition', kind: 'expression' }] },
    { name: 'is_empty', family: 'logic', yields: 'boolean', operands: [{ key: 'value', kind: 'expression' }] },
    { name: 'in', family: 'logic', yields: 'boolean', operands: [{ key: 'value', kind: 'expression' }, { key: 'list', kind: 'expression' }] },
    { name: 'to_number', family: 'conversion', yields: 'number', operands: [{ key: 'value', kind: 'expression' }] },
    { name: 'days_between', family: 'datetime', yields: 'number', operands: [{ key: 'from', kind: 'expression' }, { key: 'to', kind: 'expression' }] },
    { name: 'matches', family: 'pattern', yields: 'boolean', operands: [{ key: 'text', kind: 'expression' }, { key: 'pattern', kind: 'expression' }] },
    { name: 'lookup', family: 'utility', yields: 'any', operands: [{ key: 'key', kind: 'expression' }, { key: 'table', kind: 'raw' }] },
    { name: 'coalesce', family: 'core', yields: 'any', operands: [{ key: 'values', kind: 'list' }] },
    { name: 'identity', family: 'core', yields: 'any', operands: [{ key: 'value', kind: 'expression' }] },
  ],
}
