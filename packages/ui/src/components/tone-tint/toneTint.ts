// ToneTint: a faint wash of a named tone on a glass surface, by token name
// only (spec: wave-4/tone-tint-resolver.md). No colour value lives here.
import type { CSSProperties } from 'react'
import { devWarning } from '../../internal/dev'

const SEMANTIC = ['accent', 'success', 'pending', 'error', 'neutral'] as const
const CATEGORICAL = ['categorical-1', 'categorical-2', 'categorical-3', 'categorical-4', 'categorical-5', 'categorical-6', 'categorical-7', 'categorical-8'] as const

export type ToneName = (typeof SEMANTIC)[number] | (typeof CATEGORICAL)[number]

/** Every tone, semantic first, in picker order. */
export const toneNames: readonly ToneName[] = Object.freeze([...SEMANTIC, ...CATEGORICAL])

export interface TintReferences {
  /** The tone itself (solid); alpha is applied with `color-mix()`. */
  rgb: string
  /** Surface wash. */
  soft: string
  /** Border and focus-adjacent glow. */
  ring: string
}

/** Where a tone is drawn; §2.3 allows categorical hues only in the first four. */
export type ToneContext = 'map' | 'chart' | 'legend' | 'graph-node' | 'surface' | 'table-cell' | 'record' | 'control'
const CATEGORY_CONTEXTS: ReadonlySet<ToneContext> = new Set(['map', 'chart', 'legend', 'graph-node'])

export function isToneName(value: unknown): value is ToneName {
  return typeof value === 'string' && (toneNames as readonly string[]).includes(value)
}

const ref = (tone: ToneName, part: 'rgb' | 'soft' | 'ring') => `var(--ty-tint-${tone}-${part})`

/** Token references for a tone; unknown input falls back to `fallback`, then to neutral. */
export function resolveTint(tone?: unknown, fallback?: ToneName): TintReferences {
  const chosen: ToneName = isToneName(tone) ? tone : isToneName(fallback) ? fallback : 'neutral'
  return { rgb: ref(chosen, 'rgb'), soft: ref(chosen, 'soft'), ring: ref(chosen, 'ring') }
}

/**
 * Inline style for a tinted surface root: sets the one property the glass
 * rule reads (`--ty-surface-tint`) plus its ring. Pair with `data-ty-tinted`.
 */
export function tintStyle(tone?: unknown, fallback?: ToneName): CSSProperties {
  const t = resolveTint(tone, fallback)
  return { ['--ty-surface-tint' as string]: t.soft, ['--ty-surface-tint-ring' as string]: t.ring } as CSSProperties
}

/**
 * Library usage check: a categorical tone outside maps, charts, legends and
 * graph nodes breaks §2.3. Returns the problem (and warns in development).
 */
export function checkToneUsage(tone: ToneName, context: ToneContext): string | null {
  const categorical = tone.startsWith('categorical-')
  const problem = categorical && !CATEGORY_CONTEXTS.has(context) ? `ToneTint: "${tone}" is a categorical tone and may not be used on a ${context} (design direction §2.3).` : null
  devWarning(problem !== null, problem ?? '')
  return problem
}
