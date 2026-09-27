// Generic decision step (backlog B-002): a model reads an input state and
// chooses one value from a declared set of options. The run records the
// chosen value, the probability of each option, and which provider and model
// version decided, so an analysis can be audited and replayed.

/** One allowed outcome of the decision. */
export interface DecisionOption {
  /** Stable value written to the output (for example "above_limit"). */
  value: string
  /** Human label (from the host's i18n). */
  label: string
  description?: string
}

/** Where the input state comes from: an upstream reference, plus an optional shape. */
export interface DecisionInputState {
  /** Reference to an upstream value (for example "assertion.value"). */
  ref: string
  /** Optional JSON-Schema-like description of the expected input. */
  schema?: Record<string, unknown>
}

export interface DecisionConfig {
  kind: 'decision'
  input: DecisionInputState
  options: DecisionOption[]
  /** Instruction given to the model (may reference upstream values). */
  instruction?: string
  provider?: string
  model?: string
  /** Pinned model version; recorded with every result. */
  modelVersion?: string
  /** Name of the output variable (default "decision"). */
  outputVariable?: string
  /** Minimum probability for the result to count as decided; below it the step asks for review. */
  threshold?: number
}

/** What one run of the decision produced. */
export interface DecisionResult {
  value: string
  /** Probability per option value (0..1); they need not sum to exactly 1. */
  probabilities: Record<string, number>
  provider: string
  model: string
  modelVersion: string
  /** True when the top probability is under the configured threshold. */
  needsReview?: boolean
}

export function defaultDecisionConfig(): DecisionConfig {
  return { kind: 'decision', input: { ref: '' }, options: [], outputVariable: 'decision' }
}

/** Options sorted by probability, highest first; unknown options last. */
export function rankedOptions(result: DecisionResult, options: readonly DecisionOption[]): Array<DecisionOption & { probability: number | null }> {
  return options
    .map((o) => ({ ...o, probability: result.probabilities[o.value] ?? null }))
    .sort((a, b) => (b.probability ?? -1) - (a.probability ?? -1))
}
