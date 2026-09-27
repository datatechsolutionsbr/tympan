// How a node kind is presented (label, icon, tone, ports, per-node identity).
// By default the installed NodeKindCatalog answers; a host can swap any single
// answer for a subtree with <NodeKindCatalogProvider>.

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import type { IconComponent } from '../../index'
import { FALLBACK_KIND_ICONS, resolveIcon } from './icons'
import { nodeKindCatalog, type NodeKindCatalogStore, type PortTopology } from './kindCatalog'
import { kindTone, type ToneName } from './palette'

/** Per-instance presentation that wins over the per-kind catalog data. */
export interface NodeIdentity {
  icon?: IconComponent
  title?: string
  description?: string
}

export interface RenderCatalog {
  /** Label and category for a kind (label falls back to a humanised kind key only when nothing else exists). */
  entry(kind: string): { label: string; category: string; description?: string } | undefined
  icon(kind: string): IconComponent
  tone(kind: string): ToneName
  ports(kind: string): PortTopology | undefined
  identity(kind: string, data: Record<string, unknown>): NodeIdentity | null
  badgeTone(kind: string): ToneName
  /** Connectors attach to node borders; ports become invisible (ids kept). */
  floatingConnections: boolean
}

export interface RenderCatalogOverrides extends Partial<Omit<RenderCatalog, 'floatingConnections'>> {
  floatingConnections?: boolean
}

/** Answers read straight from a catalog store. */
export function catalogFromStore(store: NodeKindCatalogStore, floatingConnections = false): RenderCatalog {
  return {
    entry: (kind) => {
      const found = store.entry(kind)
      if (!found) return undefined
      const { label, category, description } = found
      return description ? { label, category, description } : { label, category }
    },
    icon: (kind) => resolveIcon(store.entry(kind)?.icon ?? FALLBACK_KIND_ICONS[kind]),
    tone: kindTone,
    badgeTone: kindTone,
    ports: (kind) => store.entry(kind)?.ports,
    identity: () => null,
    floatingConnections,
  }
}

const ANSWER_KEYS = ['entry', 'icon', 'tone', 'ports', 'identity', 'badgeTone'] as const

/** Base answers with every defined override laid on top. */
function layered(base: RenderCatalog, patch: RenderCatalogOverrides): RenderCatalog {
  const out = { ...base, floatingConnections: patch.floatingConnections ?? false }
  for (const key of ANSWER_KEYS) {
    const replacement = patch[key]
    if (replacement) (out as Record<string, unknown>)[key] = replacement
  }
  return out
}

/** Re-renders when a new catalog is installed into the store. */
const useStoreVersion = (store: NodeKindCatalogStore) => useSyncExternalStore(store.subscribe, store.getVersion, store.getVersion)

const CatalogContext = createContext<RenderCatalog | null>(null)

export interface NodeKindCatalogProviderProps extends RenderCatalogOverrides {
  store?: NodeKindCatalogStore
  children: ReactNode
}

/** Lets a host replace any resolver (icon, tone, identity …) for the subtree. */
export function NodeKindCatalogProvider({ store = nodeKindCatalog, children, ...patch }: NodeKindCatalogProviderProps) {
  const version = useStoreVersion(store)
  const deps = [store, version, patch.floatingConnections, ...ANSWER_KEYS.map((k) => patch[k])]
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const catalog = useMemo(() => layered(catalogFromStore(store, patch.floatingConnections ?? false), patch), deps)
  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>
}

/** The catalog in effect: a provider's, else the installed store's. */
export function useRenderCatalog(): RenderCatalog {
  const provided = useContext(CatalogContext)
  const version = useStoreVersion(nodeKindCatalog)
  return useMemo(() => provided ?? catalogFromStore(nodeKindCatalog), [provided, version])
}

/** Readable fallback for a kind key when no catalog label exists ("if-else" → "If else"). */
export function humaniseKey(key: string): string {
  const spaced = key
    .split(/(?<=[a-z0-9])(?=[A-Z])|[_-]+/)
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : key
}
