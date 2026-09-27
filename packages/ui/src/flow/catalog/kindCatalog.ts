// NodeKindCatalog store: the backend's list of node kinds, installed once and
// queried by every canvas part. Everything answers "empty" until installed.

import type { Side } from '../model/types'
import { createId } from '../internal/ids'
import { setCatalogTones } from './palette'

export type BranchTone = 'success' | 'error' | 'info' | 'warning' | 'neutral'

export interface PortSpec {
  id: string
  side: Side
  /** Position along the side in percent (0–100); centred when absent. */
  offset?: number
  label?: string
  tone?: BranchTone
}

export interface PortTopology {
  inputs: PortSpec[]
  outputs: PortSpec[]
}

export interface FieldSchema {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object'
  enum?: Array<string | number>
  description?: string
  title?: string
  format?: string
  default?: unknown
}

export interface ConfigSchema {
  properties?: Record<string, FieldSchema>
  required?: string[]
}

/** Which form NodeConfigDialog shows for a kind. */
export type FormKind = 'compute' | 'simulation' | 'start' | 'agent' | 'rule' | 'report-output' | 'group' | 'datasource' | 'decision' | 'schema'

export interface NodeKindEntry {
  kind: string
  label: string
  category: string
  description?: string
  /** Icon registry key (lucide name in kebab case, e.g. "git-branch"). */
  icon?: string
  /** Tone name (categorical-1…8 or neutral). Never a colour. */
  tone?: string
  ports?: PortTopology
  defaultConfig?: Record<string, unknown>
  configSchema?: ConfigSchema
  formKind?: FormKind
  experimental?: boolean
  deprecated?: boolean
}

/** Kinds configured by choosing an existing thing (a saved agent, rule or source). */
export const PICKER_KINDS: readonly string[] = ['agent', 'rule', 'datasource']

const IDENTIFIER_KEY = /^(id|[a-z][A-Za-z0-9]*Id)$/

function cloneFillingIds(value: unknown, key: string | null): unknown {
  if (Array.isArray(value)) return value.map((v) => cloneFillingIds(v, null))
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = cloneFillingIds(v, k)
    return out
  }
  if (key !== null && IDENTIFIER_KEY.test(key) && value === '') return createId(key === 'id' ? 'item' : key.replace(/Id$/, ''))
  return value
}

type Listener = () => void

export class NodeKindCatalogStore {
  private entries: NodeKindEntry[] = []
  private index = new Map<string, NodeKindEntry>()
  private loaded = false
  private listeners = new Set<Listener>()
  private version = 0

  /** Replaces the catalog. Order is kept for palettes and grouping. */
  install(entries: readonly NodeKindEntry[]): void {
    this.entries = entries.map((e) => ({ ...e }))
    this.index = new Map(this.entries.map((e) => [e.kind, e]))
    this.loaded = true
    const tones: Record<string, string | undefined> = {}
    for (const e of this.entries) tones[e.kind] = e.tone
    setCatalogTones(tones)
    this.bump()
  }

  /** Back to "not loaded". */
  reset(): void {
    this.entries = []
    this.index = new Map()
    this.loaded = false
    setCatalogTones({})
    this.bump()
  }

  isLoaded(): boolean {
    return this.loaded
  }

  entry(kind: string): NodeKindEntry | undefined {
    return this.loaded ? this.index.get(kind) : undefined
  }

  exists(kind: string): boolean {
    return this.loaded && this.index.has(kind)
  }

  kinds(): string[] {
    return this.loaded ? this.entries.map((e) => e.kind) : []
  }

  /** Kinds grouped by category, both in catalog order. */
  byCategory(): Array<{ category: string; entries: NodeKindEntry[] }> {
    if (!this.loaded) return []
    const groups = new Map<string, NodeKindEntry[]>()
    for (const e of this.entries) {
      if (!groups.has(e.category)) groups.set(e.category, [])
      groups.get(e.category)!.push(e)
    }
    return [...groups.entries()].map(([category, entries]) => ({ category, entries }))
  }

  fieldOptions(kind: string, field: string): Array<string | number> {
    return this.entry(kind)?.configSchema?.properties?.[field]?.enum?.slice() ?? []
  }

  defaultConfig(kind: string): Record<string, unknown> | undefined {
    const d = this.entry(kind)?.defaultConfig
    return d ? (structuredClone(d) as Record<string, unknown>) : undefined
  }

  /**
   * Fresh default configuration: a deep copy whose empty identifiers are
   * filled with new unique ids. Nothing for picker kinds or when not loaded.
   */
  createDefaultConfig(kind: string): Record<string, unknown> | undefined {
    if (PICKER_KINDS.includes(kind)) return undefined
    const d = this.entry(kind)?.defaultConfig
    if (!d) return undefined
    return cloneFillingIds(d, null) as Record<string, unknown>
  }

  isExperimental(kind: string): boolean {
    return !!this.entry(kind)?.experimental
  }

  isDeprecated(kind: string): boolean {
    return !!this.entry(kind)?.deprecated
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getVersion = (): number => this.version

  private bump() {
    this.version++
    for (const l of this.listeners) l()
  }
}

/** The process-wide catalog installed from the backend. */
export const nodeKindCatalog = new NodeKindCatalogStore()

export const installNodeCatalog = (entries: readonly NodeKindEntry[]) => nodeKindCatalog.install(entries)
export const resetNodeCatalog = () => nodeKindCatalog.reset()
