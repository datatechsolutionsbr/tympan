// Render catalog: the resolvers node components use to present a kind. A host
// may replace any resolver through <NodeKindCatalogProvider>; without one, the
// installed NodeKindCatalog store answers.

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import type { IconComponent } from '@fakhir/design-system'
import { FALLBACK_KIND_ICONS, resolveIcon } from './icons'
import { nodeKindCatalog, type NodeKindCatalogStore, type NodeKindEntry, type PortTopology } from './kindCatalog'
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

export function catalogFromStore(store: NodeKindCatalogStore, floatingConnections = false): RenderCatalog {
  const entryOf = (kind: string): NodeKindEntry | undefined => store.entry(kind)
  return {
    entry(kind) {
      const e = entryOf(kind)
      return e ? { label: e.label, category: e.category, ...(e.description ? { description: e.description } : {}) } : undefined
    },
    icon(kind) {
      return resolveIcon(entryOf(kind)?.icon ?? FALLBACK_KIND_ICONS[kind])
    },
    tone: kindTone,
    ports(kind) {
      return entryOf(kind)?.ports
    },
    identity() {
      return null
    },
    badgeTone: kindTone,
    floatingConnections,
  }
}

const RenderCatalogContext = createContext<RenderCatalog | null>(null)

export interface NodeKindCatalogProviderProps extends RenderCatalogOverrides {
  store?: NodeKindCatalogStore
  children: ReactNode
}

/** Lets a host replace any resolver (icon, tone, identity …) for the subtree. */
export function NodeKindCatalogProvider({ store = nodeKindCatalog, children, ...overrides }: NodeKindCatalogProviderProps) {
  const version = useSyncExternalStore(store.subscribe, store.getVersion, store.getVersion)
  const { entry, icon, tone, ports, identity, badgeTone, floatingConnections } = overrides
  const value = useMemo<RenderCatalog>(() => {
    const base = catalogFromStore(store, floatingConnections ?? false)
    return {
      entry: entry ?? base.entry,
      icon: icon ?? base.icon,
      tone: tone ?? base.tone,
      ports: ports ?? base.ports,
      identity: identity ?? base.identity,
      badgeTone: badgeTone ?? base.badgeTone,
      floatingConnections: floatingConnections ?? false,
    }
    // version re-derives the catalog after a new install
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, version, entry, icon, tone, ports, identity, badgeTone, floatingConnections])
  return <RenderCatalogContext.Provider value={value}>{children}</RenderCatalogContext.Provider>
}

/** Current render catalog (provider, else the installed store). Re-renders on install. */
export function useRenderCatalog(): RenderCatalog {
  const fromContext = useContext(RenderCatalogContext)
  const version = useSyncExternalStore(nodeKindCatalog.subscribe, nodeKindCatalog.getVersion, nodeKindCatalog.getVersion)
  return useMemo(() => fromContext ?? catalogFromStore(nodeKindCatalog), [fromContext, version])
}

/** Readable fallback for a kind key when no catalog label exists ("if-else" → "If else"). */
export function humaniseKey(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()
  return words ? words[0]!.toUpperCase() + words.slice(1) : key
}
