// ExpressionBuilder: builds a computation (or, in predicate mode, a yes/no
// test) as a tree of operations, without code. The root resolves strings,
// catalog and limits once and hands them to every level through
// BuilderEnvProvider; the levels themselves live in ./builder. Each operand is
// a labelled group ("‹key›, level n") with its level also written as text, so
// depth is never told by colour alone.

import { useMemo } from 'react'
import { useFlowLocale, useLabels } from '../internal/labels'
import { useExpressionCatalog } from './catalogContext'
import { expressionBuilderLabels, type ExpressionBuilderLabels } from './labels'
import { MAX_EXPRESSION_DEPTH, isOperation, pickerEntries, type ExpressionCatalog, type ExpressionNode } from './model'
import { BuilderEnvProvider, groupName, type BuilderEnv } from './builder/shared'
import { OperandEditor, OperationEditor } from './builder/tree'

export { expressionBuilderLabels, type ExpressionBuilderLabels }
export const defaultExpressionBuilderLabels: ExpressionBuilderLabels = expressionBuilderLabels.bundles.en

export interface ExpressionBuilderProps {
  value: ExpressionNode | undefined
  onChange: (next: ExpressionNode) => void
  /** Upstream references offered as chips. */
  references?: readonly string[]
  mode?: 'expression' | 'predicate'
  /** Internal recursion depth (0 at the root). */
  depth?: number
  maxDepth?: number
  /** Overrides the ExpressionCatalogProvider. */
  catalog?: ExpressionCatalog
  labels?: Partial<ExpressionBuilderLabels>
  /** Accessible name of the root group. */
  label?: string
}

/** Everything the levels share, resolved once per builder. */
function useRootEnv(props: ExpressionBuilderProps): { env: BuilderEnv; rootPalette: BuilderEnv['innerPalette'] } {
  const words = useLabels(expressionBuilderLabels, props.labels)
  const { catalog, loading } = useExpressionCatalog(props.catalog)
  const { locale } = useFlowLocale()
  const mode = props.mode ?? 'expression'
  const depthLimit = props.maxDepth ?? MAX_EXPRESSION_DEPTH
  const innerPalette = useMemo(() => pickerEntries(catalog, 'expression'), [catalog])
  const rootPalette = useMemo(() => pickerEntries(catalog, mode), [catalog, mode])
  const env = useMemo<BuilderEnv>(
    () => ({ words, locale, catalog, catalogPending: !!loading || !catalog, depthLimit, innerPalette }),
    [words, locale, catalog, loading, depthLimit, innerPalette],
  )
  return { env, rootPalette }
}

export function ExpressionBuilder(props: ExpressionBuilderProps) {
  const { value, onChange, label } = props
  const depth = props.depth ?? 0
  const refs = props.references ?? []
  const { env, rootPalette } = useRootEnv(props)
  const { words } = env
  // A root that already holds a reference or a literal is shown as an operand with its kind switch.
  const body =
    value === undefined || isOperation(value) ? (
      <OperationEditor node={value} onNode={onChange} depth={depth} refs={refs} palette={rootPalette} />
    ) : (
      <OperandEditor slotKey={label ?? words.kindLiteral} value={value} onValue={onChange} depth={depth} refs={refs} palette={rootPalette} />
    )
  return (
    <BuilderEnvProvider value={env}>
      <div className="ty-expr" data-depth={depth} role="group" aria-label={label ?? groupName(words, words.operation, depth)}>
        {body}
      </div>
    </BuilderEnvProvider>
  )
}
