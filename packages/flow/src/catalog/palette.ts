// FlowPaletteTokens (wave-4 spec): every colour decision of the canvas as a
// token reference. Components receive `var(--fk-flow-…)` strings or a tone
// name for a data attribute; never a literal colour.

export const TONE_NAMES = [
  'categorical-1',
  'categorical-2',
  'categorical-3',
  'categorical-4',
  'categorical-5',
  'categorical-6',
  'categorical-7',
  'categorical-8',
  'neutral',
] as const

export type ToneName = (typeof TONE_NAMES)[number]

export function isToneName(value: unknown): value is ToneName {
  return typeof value === 'string' && (TONE_NAMES as readonly string[]).includes(value)
}

/**
 * Default tone per kind family, used when the backend catalog sends none.
 * Start and end share a tone (icon and label tell them apart).
 */
const FAMILY_TONES: ReadonlyArray<[ToneName, readonly string[]]> = [
  ['categorical-1', ['start', 'end', 'trigger', 'input', 'output']],
  ['categorical-2', ['if-else', 'branch', 'switch', 'rule', 'condition', 'decision']],
  ['categorical-3', ['code', 'compute', 'iteration', 'iteration-start', 'loop', 'simulation', 'transform']],
  ['categorical-4', ['agent', 'answer', 'llm']],
  ['categorical-5', ['report-output', 'report', 'dashboard']],
  ['categorical-6', ['datasource', 'data-source']],
  // Provenance kinds (W3C PROV, design direction §3.13).
  ['categorical-7', ['query', 'retrieval', 'source']],
  ['categorical-8', ['assertion', 'record', 'verification', 'analysis', 'edition', 'manuscript']],
  ['neutral', ['note', 'group']],
]

const defaultTones = new Map<string, ToneName>()
for (const [tone, kinds] of FAMILY_TONES) for (const k of kinds) defaultTones.set(k, tone)

let catalogTones = new Map<string, ToneName>()
let hostTones = new Map<string, ToneName>()

/** Installs tones read from the backend node catalog (invalid names are ignored). */
export function setCatalogTones(map: Record<string, string | undefined>): void {
  const next = new Map<string, ToneName>()
  for (const [kind, tone] of Object.entries(map)) if (isToneName(tone)) next.set(kind, tone)
  catalogTones = next
}

/** Host override of kind tones. Throws on a tone that is not a categorical token name. */
export function overrideKindTones(map: Record<string, string>): void {
  const next = new Map(hostTones)
  for (const [kind, tone] of Object.entries(map)) {
    if (!isToneName(tone)) {
      throw new Error(`overrideKindTones: "${tone}" (kind "${kind}") is not a tone name; expected one of ${TONE_NAMES.join(', ')}.`)
    }
    next.set(kind, tone)
  }
  hostTones = next
}

/** Clears host overrides and catalog tones (tests, host teardown). */
export function resetKindTones(): void {
  catalogTones = new Map()
  hostTones = new Map()
}

/** Tone for a kind: host override, then catalog, then default family, then neutral. */
export function kindTone(kind: string): ToneName {
  return hostTones.get(kind) ?? catalogTones.get(kind) ?? defaultTones.get(kind) ?? 'neutral'
}

export interface KindTokenRefs {
  bubble: string
  bubbleInk: string
  badge: string
  badgeInk: string
  minimap: string
  port: string
}

/** Token references for the parts drawn in a kind's tone. */
export function toneTokens(tone: ToneName): KindTokenRefs {
  return {
    bubble: `var(--fk-flow-tone-${tone})`,
    bubbleInk: `var(--fk-flow-tone-${tone}-ink)`,
    badge: `var(--fk-flow-tone-${tone}-soft)`,
    badgeInk: `var(--fk-flow-tone-${tone}-text)`,
    minimap: `var(--fk-flow-tone-${tone})`,
    port: `var(--fk-flow-tone-${tone})`,
  }
}

export function kindTokens(kind: string): KindTokenRefs {
  return toneTokens(kindTone(kind))
}

/** Connector colours. Every conditional connector also carries a word and a line style. */
export const connectorTokens = Object.freeze({
  rest: 'var(--fk-flow-connector)',
  active: 'var(--fk-flow-connector-active)',
  true: 'var(--fk-flow-connector-true)',
  false: 'var(--fk-flow-connector-false)',
  rule: 'var(--fk-flow-connector-rule)',
})

/** Run accent of a running node: always the semantic pending colour, never the kind tone. */
export const RUN_ACCENT = 'var(--fk-flow-ring-running)'
