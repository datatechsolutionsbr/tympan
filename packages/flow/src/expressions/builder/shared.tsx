// What every level of one expression builder shares (strings, catalog,
// limits), plus the small helpers the levels use.

import { createContext, useContext, type ReactNode } from 'react'
import { fill } from '../../internal/labels'
import type { ExpressionBuilderLabels } from '../labels'
import type { ExpressionCatalog, LoopBinding, PickerEntry } from '../model'

export interface BuilderEnv {
  words: ExpressionBuilderLabels
  locale: string
  catalog: ExpressionCatalog | undefined
  catalogPending: boolean
  depthLimit: number
  /** Palette below the root (always the full expression palette). */
  innerPalette: PickerEntry[]
}

const EnvContext = createContext<BuilderEnv | null>(null)
export const BuilderEnvProvider = EnvContext.Provider

export function useBuilderEnv(): BuilderEnv {
  const env = useContext(EnvContext)
  if (!env) throw new Error('Expression builder parts must be inside ExpressionBuilder.')
  return env
}

/** Name shown for a picker entry: its flattened verb when it has one, else the operation. */
export function entryLabel(words: ExpressionBuilderLabels, entry: PickerEntry): string {
  if (entry.verb) return words.vocabulary[entry.verb.value] ?? entry.verb.value
  return words.operations[entry.op.name] ?? entry.op.name
}

/** Loop variables (engine identifiers) come first among the chips of their subtree. */
export function chipsWithLoopNames(references: readonly string[], binds: readonly LoopBinding[] | undefined): string[] {
  const extra = (binds ?? []).filter((b) => !references.includes(b))
  return [...extra, ...references]
}

/** Accessible name of a group at `depth` (0-based) for operand `key`. */
export function groupName(words: ExpressionBuilderLabels, key: string, depth: number): string {
  return fill(words.level, { key, level: depth + 1 })
}

/** Header shared by operand groups: the key in mono and the level as text (depth never by colour). */
export function SlotHeading({ slotKey, trailing }: { slotKey: string; trailing: ReactNode }) {
  return (
    <div className="ty-expr__slot-head">
      <code className="ty-expr__slot-key" dir="ltr">
        {slotKey}
      </code>
      {trailing}
    </div>
  )
}
