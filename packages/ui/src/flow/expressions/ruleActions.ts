// RuleActionCatalog (wave 4): what a rule may do. The host supplies the
// catalog; the library ships a domain-neutral default set that fits a research
// workflow. The catalog only describes the form: the engine executes actions.

export type ParamType = 'text' | 'number' | 'boolean' | 'choice' | 'reference' | 'duration'
export const PARAM_TYPES: readonly ParamType[] = ['text', 'number', 'boolean', 'choice', 'reference', 'duration']

export type DurationUnit = 'minutes' | 'hours' | 'days'
export const DURATION_UNITS: readonly DurationUnit[] = ['minutes', 'hours', 'days']

export interface ParamSpec {
  key: string
  labelKey: string
  type: ParamType
  required?: boolean
  default?: unknown
  hintKey?: string
  min?: number
  max?: number
  step?: number
  options?: Array<{ value: string; labelKey: string }>
  optionsFrom?: 'branches' | 'roles' | 'statuses'
  /** Read the text value as the declared type of the referenced parameter (Set value). */
  typedBy?: string
}

export interface ParamError {
  key: string
  code: 'required' | 'noOptions' | 'invalid'
}

export interface ActionKind {
  kind: string
  labelKey: string
  descriptionKey?: string
  icon?: string
  params: ParamSpec[]
  validate?: (params: Record<string, unknown>) => ParamError[]
}

export interface ActionContext {
  branches?: Array<{ value: string; label: string }>
  roles?: Array<{ value: string; label: string }>
  statuses?: Array<{ value: string; label: string }>
}

export const CUSTOM_ACTION = 'custom'

export const defaultRuleActions: readonly ActionKind[] = Object.freeze([
  {
    kind: 'set-value',
    labelKey: 'setValue',
    descriptionKey: 'setValueDescription',
    params: [
      { key: 'target', labelKey: 'target', type: 'reference', required: true },
      { key: 'value', labelKey: 'value', type: 'text', required: true, typedBy: 'target' },
    ],
  },
  { kind: 'add-tag', labelKey: 'addTag', descriptionKey: 'addTagDescription', params: [{ key: 'tag', labelKey: 'tag', type: 'text', required: true }] },
  {
    kind: 'request-review',
    labelKey: 'requestReview',
    descriptionKey: 'requestReviewDescription',
    params: [
      { key: 'role', labelKey: 'role', type: 'choice', optionsFrom: 'roles', required: true },
      { key: 'reason', labelKey: 'reason', type: 'text', required: true },
      { key: 'dueIn', labelKey: 'dueIn', type: 'duration' },
    ],
  },
  {
    kind: 'notify',
    labelKey: 'notify',
    descriptionKey: 'notifyDescription',
    params: [
      { key: 'recipient', labelKey: 'recipient', type: 'choice', optionsFrom: 'roles', required: true },
      { key: 'message', labelKey: 'message', type: 'text', required: true },
    ],
  },
  { kind: 'route', labelKey: 'route', descriptionKey: 'routeDescription', params: [{ key: 'branch', labelKey: 'branch', type: 'choice', optionsFrom: 'branches', required: true }] },
  {
    kind: 'stop',
    labelKey: 'stop',
    descriptionKey: 'stopDescription',
    params: [
      {
        key: 'outcome',
        labelKey: 'outcome',
        type: 'choice',
        required: true,
        default: 'completed',
        options: [
          { value: 'completed', labelKey: 'completed' },
          { value: 'failed', labelKey: 'failed' },
        ],
      },
      { key: 'reason', labelKey: 'reason', type: 'text' },
    ],
  },
] satisfies ActionKind[])

/** Validates a host action kind; throws on duplicate keys or unknown parameter types. */
export function defineRuleAction(kind: ActionKind, existing: readonly ActionKind[] = defaultRuleActions): ActionKind {
  if (!kind.kind || kind.kind === CUSTOM_ACTION) throw new Error(`defineRuleAction: "${kind.kind}" is reserved or empty.`)
  if (existing.some((k) => k.kind === kind.kind)) throw new Error(`defineRuleAction: an action kind "${kind.kind}" already exists.`)
  const seen = new Set<string>()
  for (const p of kind.params) {
    if (seen.has(p.key)) throw new Error(`defineRuleAction: parameter "${p.key}" appears twice in "${kind.kind}".`)
    seen.add(p.key)
    if (!PARAM_TYPES.includes(p.type)) throw new Error(`defineRuleAction: parameter "${p.key}" has unknown type "${String(p.type)}".`)
    if (!p.labelKey) throw new Error(`defineRuleAction: parameter "${p.key}" has no label key.`)
  }
  return Object.freeze({ ...kind })
}

/** Default parameters of a kind. */
export function defaultParams(kind: ActionKind | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const p of kind?.params ?? []) {
    if (p.default !== undefined) out[p.key] = p.default
    else if (p.type === 'boolean') out[p.key] = false
    else if (p.type === 'duration') continue
    else out[p.key] = p.type === 'number' ? null : ''
  }
  return out
}

/** Options of a choice parameter, from the spec or the host context. */
export function choiceOptions(p: ParamSpec, ctx: ActionContext): Array<{ value: string; label?: string; labelKey?: string }> {
  if (p.options) return p.options
  return (p.optionsFrom ? ctx[p.optionsFrom] : undefined) ?? []
}

/** Parameter errors: missing required values and choices with no options. */
export function validateParams(kind: ActionKind, params: Record<string, unknown>, ctx: ActionContext): ParamError[] {
  const errors: ParamError[] = []
  for (const p of kind.params) {
    if (p.type === 'choice' && !choiceOptions(p, ctx).length) {
      errors.push({ key: p.key, code: 'noOptions' })
      continue
    }
    const v = params[p.key]
    if (p.required && (v === undefined || v === null || v === '')) errors.push({ key: p.key, code: 'required' })
  }
  return [...errors, ...(kind.validate?.(params) ?? [])]
}

/** "5" → 5, "true" → true, other text stays text (custom parameters). */
export function readLooseValue(text: string): string | number | boolean {
  const t = text.trim()
  if (t === 'true') return true
  if (t === 'false') return false
  if (t !== '' && Number.isFinite(Number(t))) return Number(t)
  return text
}

/** Reads text as the declared type of a referenced value. */
export function readTyped(text: string, type: 'number' | 'boolean' | 'string' | undefined): unknown {
  if (type === 'number') {
    const n = Number(text)
    return text.trim() !== '' && Number.isFinite(n) ? n : text
  }
  if (type === 'boolean') return text === 'true' ? true : text === 'false' ? false : text
  return text
}
