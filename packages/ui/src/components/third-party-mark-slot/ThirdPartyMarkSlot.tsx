import { Boxes, Cpu, Database } from 'lucide-react'
import { createContext, useContext, useState, type ReactNode } from 'react'
import { useMessages } from '../../internal/provider'

/** Where a mark comes from. The library itself ships none. */
export type MarkSource =
  | { kind: 'icon-set'; setName: string; slug: string }
  | { kind: 'asset'; url: string }
  | { kind: 'component'; render: () => ReactNode }

export interface MarkEntry {
  key: string
  source: MarkSource
  /** Owner of the trademark, for the host's notices. */
  owner: string
  /** Licence of the mark data (for example "CC0 1.0, Simple Icons 14.x"). Required. */
  licence: string
  /** Official brand colour; used only when the host opts in. */
  brandColour?: string
}

export interface MarkRegistry {
  readonly size: number
  get(key: string): MarkEntry | undefined
  keys(): string[]
}

/** Renders an icon-set source with the set's own path data (host-installed package). */
export type IconSetAdapter = (source: { setName: string; slug: string }, options: { brandColour?: string }) => ReactNode

/** Validates and freezes mark entries: unique keys, a licence note on each. */
export function createMarkRegistry(entries: readonly MarkEntry[] = []): MarkRegistry {
  const table = new Map<string, MarkEntry>()
  entries.forEach((entry, position) => {
    if (!entry.key) throw new Error(`createMarkRegistry: entry ${position} has no key.`)
    if (table.has(entry.key)) throw new Error(`createMarkRegistry: the key "${entry.key}" is registered twice.`)
    if (!entry.licence || !entry.licence.trim()) {
      throw new Error(`createMarkRegistry: the mark "${entry.key}" has no licence note; list where the mark data comes from.`)
    }
    table.set(entry.key, Object.freeze({ ...entry }))
  })
  return {
    size: table.size,
    get: (key) => table.get(key),
    keys: () => [...table.keys()],
  }
}

interface MarkEnvironment {
  registry: MarkRegistry
  adapter?: IconSetAdapter
  useBrandColours: boolean
}

const EMPTY: MarkEnvironment = { registry: createMarkRegistry(), useBrandColours: false }
const MarkContext = createContext<MarkEnvironment>(EMPTY)

export interface MarkRegistryProviderProps {
  registry: MarkRegistry
  /** Turns `icon-set` sources into rendered marks. Without it they use the fallback glyph. */
  iconSetAdapter?: IconSetAdapter
  /** Opt in to official brand colours (dropped under forced colours). */
  brandColours?: boolean
  children: ReactNode
}

export function MarkRegistryProvider({ registry, iconSetAdapter, brandColours = false, children }: MarkRegistryProviderProps) {
  const value: MarkEnvironment = { registry, adapter: iconSetAdapter, useBrandColours: brandColours }
  return <MarkContext.Provider value={value}>{children}</MarkContext.Provider>
}

export type MarkCategory = 'model' | 'datasource' | 'service'
export type MarkSize = 'inline' | 'bubble'

const neutralGlyphs = { model: Cpu, datasource: Database, service: Boxes } satisfies Record<MarkCategory, unknown>

function NeutralGlyph({ category }: { category: MarkCategory }) {
  const Glyph = neutralGlyphs[category]
  return <Glyph className="fk-mark__glyph" data-fallback="" aria-hidden="true" focusable="false" />
}

function AssetMark({ url, fallback }: { url: string; fallback: ReactNode }) {
  const [broken, setBroken] = useState(false)
  if (broken) return <>{fallback}</>
  return <img className="fk-mark__image" src={url} alt="" draggable={false} onError={() => setBroken(true)} />
}

/**
 * Only the mark (decorative, `aria-hidden` wrapper), for controls that carry
 * the product name in their own label.
 */
export function ThirdPartyMarkGlyph({ markKey, category = 'service' }: { markKey?: string; category?: MarkCategory }) {
  const env = useContext(MarkContext)
  const entry = markKey ? env.registry.get(markKey) : undefined
  const fallback = <NeutralGlyph category={category} />
  let drawn: ReactNode = fallback
  if (entry) {
    const source = entry.source
    if (source.kind === 'asset') drawn = <AssetMark url={source.url} fallback={fallback} />
    else if (source.kind === 'component') drawn = source.render()
    else if (env.adapter) drawn = env.adapter(source, { brandColour: env.useBrandColours ? entry.brandColour : undefined })
  }
  return (
    <span className="fk-mark__art" aria-hidden="true" data-registered={entry ? '' : undefined}>
      {drawn}
    </span>
  )
}

export interface ThirdPartyMarkSlotProps {
  markKey: string
  /** Visible and accessible product name. */
  name: string
  category?: MarkCategory
  /** When false the name is visually hidden but stays the accessible name. */
  showName?: boolean
  size?: MarkSize
  className?: string
}

/** A third-party product's mark (host-registered) beside its name (spec: wave-4/third-party-mark-slot.md). */
export function ThirdPartyMarkSlot(props: ThirdPartyMarkSlotProps) {
  const nameClass = props.showName === false ? 'fk-visually-hidden' : 'fk-mark__name'
  return (
    <span className={props.className ? `fk-mark ${props.className}` : 'fk-mark'} data-size={props.size ?? 'inline'}>
      <ThirdPartyMarkGlyph markKey={props.markKey} category={props.category} />
      <span className={nameClass}>{props.name}</span>
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* ProviderMark: model identifier → provider key → slot                */
/* ------------------------------------------------------------------ */

export interface ProviderRule {
  match: (modelId: string) => boolean
  key: string
  name: string
}

// Public vendor names (text only; no mark data). Order matters: first hit wins.
const VENDORS: Array<[key: string, name: string, familyWords: string[]]> = [
  ['anthropic', 'Anthropic', ['claude']],
  ['openai', 'OpenAI', ['gpt', 'o1', 'o3', 'o4']],
  ['google', 'Google', ['gemini', 'gemma']],
  ['meta', 'Meta', ['llama']],
  ['amazon', 'Amazon', ['nova', 'titan']],
  ['mistral', 'Mistral AI', ['mistral', 'mixtral', 'codestral']],
  ['cohere', 'Cohere', ['command']],
  ['deepseek', 'DeepSeek', ['deepseek']],
]

const ROUTING_PREFIX = /^(?:us|eu|apac|ap|ca|jp|au|us-gov|global)\./i

/** Removes a leading regional routing prefix ("eu.", "us." …) from a model identifier. */
export function stripRoutingPrefix(modelId: string): string {
  return modelId.trim().replace(ROUTING_PREFIX, '')
}

function vendorOf(id: string): string {
  const dot = id.indexOf('.')
  return (dot > 0 ? id.slice(0, dot) : '').toLowerCase()
}

/** The built-in matching rules; hosts may replace or extend them. */
export const defaultProviderRules: readonly ProviderRule[] = VENDORS.flatMap(([key, name]) => [
  { key, name, match: (id: string) => vendorOf(stripRoutingPrefix(id)) === key },
]).concat(
  VENDORS.map(([key, name, words]) => ({
    key,
    name,
    match: (id: string) => {
      const tokens = stripRoutingPrefix(id).toLowerCase().split(/[^a-z0-9]+/)
      return words.some((w) => tokens.includes(w))
    },
  })),
)

export interface ResolvedProvider {
  key: string
  /** Display name; empty for `other` (the component shows the localised word). */
  name: string
}

/** Maps a model identifier to a provider; unknown identifiers resolve to `other`. */
export function resolveProvider(modelId: string, rules: readonly ProviderRule[] = defaultProviderRules): ResolvedProvider {
  const bare = stripRoutingPrefix(modelId)
  for (const rule of rules) {
    if (rule.match(modelId) || rule.match(bare)) return { key: rule.key, name: rule.name }
  }
  return { key: 'other', name: '' }
}

export interface ProviderMarkProps {
  modelId: string
  rules?: readonly ProviderRule[]
  showName?: boolean
  size?: MarkSize
  className?: string
}

/** Model provider mark and name for a model identifier. Never shows a real mark for `other`. */
export function ProviderMark({ modelId, rules, showName, size, className }: ProviderMarkProps) {
  const copy = useMessages().providerMark
  const provider = resolveProvider(modelId, rules)
  const unknown = provider.key === 'other'
  return (
    <ThirdPartyMarkSlot
      markKey={unknown ? '' : provider.key}
      name={unknown ? copy.otherProvider : provider.name}
      category="model"
      showName={showName}
      size={size}
      className={className}
    />
  )
}
