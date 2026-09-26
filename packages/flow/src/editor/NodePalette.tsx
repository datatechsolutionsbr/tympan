// NodePalette: everything that can be placed on the canvas, in collapsible
// sections, searchable, draggable (React Aria drag and drop) and placeable by
// keyboard or tap through `onPlace` (Enter on an item).

import { useMemo, useState, type ReactNode } from 'react'
import { Bot, ChevronRight, Database, GripVertical, Plus, Scale, Server } from 'lucide-react'
import { Button as AriaButton, Disclosure, DisclosurePanel, GridList, GridListItem, Heading, useDragAndDrop } from 'react-aria-components'
import { Button, TextField, type IconComponent } from '@fakhir/design-system'
import { useRenderCatalog } from '../catalog/RenderCatalog'
import { nodeKindCatalog, PICKER_KINDS, type NodeKindCatalogStore, type NodeKindEntry } from '../catalog/kindCatalog'
import { defineLabels, fill, useFlowLocale, useLabels } from '../internal/labels'
import { useSyncExternalStore } from 'react'

/** Drag payload media type; its data is JSON of PalettePayload. */
export const PALETTE_MEDIA_TYPE = 'application/x-fakhir-node'

export interface PalettePayload {
  kind: string
  label: string
  entityId?: string
  config?: Record<string, unknown>
}

export interface PaletteAgent {
  id: string
  name: string
  role?: string
  tier?: string
}
export interface PaletteRule {
  id: string
  name: string
  enabled: boolean
}
export interface PaletteEntity {
  id: string
  name: string
  dialect?: string
}
export interface PaletteProvider {
  id: string
  name: string
  configured: boolean
  modelCount: number
}

export interface NodePaletteLabels {
  palette: string
  search: string
  results: string
  noResults: string
  agents: string
  rules: string
  dataSources: string
  providers: string
  addAgent: string
  addRule: string
  addDataSource: string
  addProvider: string
  emptyAgents: string
  emptyRules: string
  emptyDataSources: string
  emptyProviders: string
  emptySteps: string
  on: string
  off: string
  configured: string
  needsSetup: string
  models: string
  count: string
  dragItem: string
}

export const nodePaletteLabels = defineLabels<NodePaletteLabels>('NodePalette', {
  en: {
    palette: 'Steps to add',
    search: 'Search steps',
    results: '{count, plural, =0 {No results} one {# result} other {# results}}',
    noResults: 'Nothing matches this search',
    agents: 'Agents',
    rules: 'Rules',
    dataSources: 'Data sources',
    providers: 'Model providers',
    addAgent: 'Add agent',
    addRule: 'Add rule',
    addDataSource: 'Add data source',
    addProvider: 'Add model provider',
    emptyAgents: 'No agents yet',
    emptyRules: 'No rules yet',
    emptyDataSources: 'No data sources yet',
    emptyProviders: 'No providers yet',
    emptySteps: 'Loading the step catalogue',
    dragItem: 'Drag {name}',
    on: 'on',
    off: 'off',
    configured: 'configured',
    needsSetup: 'needs setup',
    models: '{count, plural, one {# model} other {# models}}',
    count: '{count, plural, one {# item} other {# items}}',
  },
  'pt-BR': {
    palette: 'Passos para adicionar',
    search: 'Buscar passos',
    results: '{count, plural, =0 {Nenhum resultado} one {# resultado} other {# resultados}}',
    noResults: 'Nada corresponde a esta busca',
    agents: 'Agentes',
    rules: 'Regras',
    dataSources: 'Fontes de dados',
    providers: 'Provedores de modelo',
    addAgent: 'Adicionar agente',
    addRule: 'Adicionar regra',
    addDataSource: 'Adicionar fonte de dados',
    addProvider: 'Adicionar provedor de modelo',
    emptyAgents: 'Nenhum agente ainda',
    emptyRules: 'Nenhuma regra ainda',
    emptyDataSources: 'Nenhuma fonte de dados ainda',
    emptyProviders: 'Nenhum provedor ainda',
    emptySteps: 'Carregando o catálogo de passos',
    dragItem: 'Arrastar {name}',
    on: 'ligada',
    off: 'desligada',
    configured: 'configurado',
    needsSetup: 'precisa de configuração',
    models: '{count, plural, one {# modelo} other {# modelos}}',
    count: '{count, plural, one {# item} other {# itens}}',
  },
  es: {
    palette: 'Pasos para añadir',
    search: 'Buscar pasos',
    results: '{count, plural, =0 {Sin resultados} one {# resultado} other {# resultados}}',
    noResults: 'Nada coincide con esta búsqueda',
    agents: 'Agentes',
    rules: 'Reglas',
    dataSources: 'Fuentes de datos',
    providers: 'Proveedores de modelos',
    addAgent: 'Añadir agente',
    addRule: 'Añadir regla',
    addDataSource: 'Añadir fuente de datos',
    addProvider: 'Añadir proveedor de modelos',
    emptyAgents: 'Aún no hay agentes',
    emptyRules: 'Aún no hay reglas',
    emptyDataSources: 'Aún no hay fuentes de datos',
    emptyProviders: 'Aún no hay proveedores',
    emptySteps: 'Cargando el catálogo de pasos',
    dragItem: 'Arrastrar {name}',
    on: 'activada',
    off: 'desactivada',
    configured: 'configurado',
    needsSetup: 'requiere configuración',
    models: '{count, plural, one {# modelo} other {# modelos}}',
    count: '{count, plural, one {# elemento} other {# elementos}}',
  },
})
export const defaultNodePaletteLabels: NodePaletteLabels = nodePaletteLabels.bundles.en

/** Device storage for which sections are open; failures are silent. */
export interface PaletteStorage {
  get(key: string): string | null
  set(key: string, value: string): void
}

const safeLocalStorage: PaletteStorage = {
  get(key) {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // storage unavailable (private mode, quota): the default is used next time
    }
  },
}

interface PaletteItem {
  key: string
  payload: PalettePayload
  name: string
  description?: string
  icon?: IconComponent
  tone: string
  extra?: ReactNode
  onActivate?: () => void
}

/** Drag items for a palette entry: the JSON payload plus a plain-text fallback. */
export function paletteDragItems(payload: PalettePayload) {
  return [{ [PALETTE_MEDIA_TYPE]: JSON.stringify(payload), 'text/plain': payload.label }]
}

function Items({ label, items, onPlace, emptyText, dragLabel }: { label: string; items: PaletteItem[]; onPlace?: NodePaletteProps['onPlace']; emptyText: string; dragLabel: (name: string) => string }) {
  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => items.filter((i) => keys.has(i.key)).flatMap((i) => paletteDragItems(i.payload)),
    getAllowedDropOperations: () => ['copy'],
  })
  return (
    <GridList
      aria-label={label}
      className="fk-flow-palette__list"
      items={items}
      dragAndDropHooks={dragAndDropHooks}
      renderEmptyState={() => <p className="fk-flow-palette__empty">{emptyText}</p>}
      onAction={(key) => {
        const item = items.find((i) => i.key === key)
        if (!item) return
        if (item.onActivate) item.onActivate()
        else onPlace?.(item.payload.kind, item.payload)
      }}
    >
      {(item) => {
        const Icon = item.icon
        return (
          <GridListItem id={item.key} textValue={item.name} className="fk-flow-palette__item">
            <AriaButton slot="drag" className="fk-flow-palette__grip" aria-label={dragLabel(item.name)}>
              <GripVertical aria-hidden="true" focusable="false" />
            </AriaButton>
            <span className="fk-flow-palette__bubble" data-tone={item.tone} aria-hidden="true">
              {Icon ? <Icon focusable="false" /> : null}
            </span>
            <span className="fk-flow-palette__text">
              <span className="fk-flow-palette__name">{item.name}</span>
              {item.description ? <span className="fk-flow-palette__description">{item.description}</span> : null}
            </span>
            {item.extra ? <span className="fk-flow-palette__extra">{item.extra}</span> : null}
          </GridListItem>
        )
      }}
    </GridList>
  )
}

interface SectionProps {
  id: string
  title: string
  icon?: IconComponent
  count: number
  addLabel?: string
  onAdd?: () => void
  expanded: boolean
  onExpandedChange: (open: boolean) => void
  children: ReactNode
}

function Section({ id, title, icon: Icon, count, addLabel, onAdd, expanded, onExpandedChange, children }: SectionProps) {
  const { locale } = useFlowLocale()
  const l = useLabels(nodePaletteLabels, undefined)
  return (
    <Disclosure id={id} className="fk-flow-palette__section" isExpanded={expanded} onExpandedChange={onExpandedChange}>
      <div className="fk-flow-palette__header">
        <Heading level={3} className="fk-flow-palette__heading">
          <AriaButton slot="trigger" className="fk-flow-palette__trigger">
            <ChevronRight className="fk-flow-palette__chevron" aria-hidden="true" focusable="false" />
            {Icon ? <Icon className="fk-flow-palette__section-icon" aria-hidden="true" focusable="false" /> : null}
            <span>{title}</span>
            <span className="fk-flow-palette__count">{fill(l.count, { count }, locale)}</span>
          </AriaButton>
        </Heading>
        {onAdd && addLabel ? <Button variant="quiet" size="compact" iconOnly accessibleLabel={addLabel} leadingIcon={<Plus />} onPress={onAdd} /> : null}
      </div>
      <DisclosurePanel className="fk-flow-palette__panel">{children}</DisclosurePanel>
    </Disclosure>
  )
}

export interface NodeKindListProps {
  /** Kinds to list, in order (defaults to the catalog minus experimental, deprecated and picker kinds). */
  kinds?: string[]
  onPlace?: (kind: string, payload: PalettePayload) => void
  emptyMessage?: string
  store?: NodeKindCatalogStore
  /** Filters by label (the palette's search). */
  query?: string
  /** Accessible name of the list. */
  label?: string
}

/** Step kinds of the catalog that the palette offers. */
export function placeableKinds(store: NodeKindCatalogStore = nodeKindCatalog): NodeKindEntry[] {
  return store.kinds()
    .map((k) => store.entry(k)!)
    .filter((e) => !e.experimental && !e.deprecated && !PICKER_KINDS.includes(e.kind) && e.kind !== 'data-source')
}

function useCatalogVersion(store: NodeKindCatalogStore) {
  return useSyncExternalStore(store.subscribe, store.getVersion, store.getVersion)
}

function kindItems(entries: NodeKindEntry[], store: NodeKindCatalogStore, catalog: ReturnType<typeof useRenderCatalog>): PaletteItem[] {
  return entries.map((e) => ({
    key: `kind:${e.kind}`,
    name: e.label,
    ...(e.description ? { description: e.description } : {}),
    icon: catalog.icon(e.kind),
    tone: catalog.tone(e.kind),
    payload: { kind: e.kind, label: e.label, ...(store.createDefaultConfig(e.kind) ? { config: store.createDefaultConfig(e.kind)! } : {}) },
  }))
}

/** The draggable list of step kinds alone, for hosts that compose their own palette. */
export function NodeKindList({ kinds, onPlace, emptyMessage, store = nodeKindCatalog, query = '', label }: NodeKindListProps) {
  const l = useLabels(nodePaletteLabels, undefined)
  const catalog = useRenderCatalog()
  useCatalogVersion(store)
  const entries = (kinds ? kinds.map((k) => store.entry(k)).filter((e): e is NodeKindEntry => !!e) : placeableKinds(store)).filter((e) => e.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
  return <Items label={label ?? l.palette} items={kindItems(entries, store, catalog)} {...(onPlace ? { onPlace } : {})} emptyText={emptyMessage ?? (store.isLoaded() ? l.noResults : l.emptySteps)} dragLabel={(name) => fill(l.dragItem, { name })} />
}

export interface NodePaletteProps {
  agents?: PaletteAgent[]
  rules?: PaletteRule[]
  entities?: PaletteEntity[]
  modelProviders?: PaletteProvider[]
  onCreateAgent?: () => void
  onCreateRule?: () => void
  onCreateDataSource?: () => void
  onAddModelProvider?: () => void
  onConfigureProvider?: (providerId: string) => void
  /** Placement by keyboard or tap: the host places the node and focuses it. */
  onPlace?: (kind: string, payload: PalettePayload) => void
  kinds?: string[]
  store?: NodeKindCatalogStore
  storage?: PaletteStorage
  /** Storage key prefix for open sections. */
  storageKey?: string
  labels?: Partial<NodePaletteLabels>
  className?: string
}

export function NodePalette(props: NodePaletteProps) {
  const { agents = [], rules = [], entities = [], modelProviders = [], onPlace, store = nodeKindCatalog, storage = safeLocalStorage, storageKey = 'fk-flow-palette' } = props
  const l = useLabels(nodePaletteLabels, props.labels)
  const { locale } = useFlowLocale()
  const catalog = useRenderCatalog()
  useCatalogVersion(store)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const isOpen = (id: string) => open[id] ?? storage.get(`${storageKey}:${id}`) !== 'closed'
  const toggle = (id: string) => (next: boolean) => {
    setOpen((o) => ({ ...o, [id]: next }))
    storage.set(`${storageKey}:${id}`, next ? 'open' : 'closed')
  }
  const q = query.trim().toLocaleLowerCase()
  const match = (s: string) => !q || s.toLocaleLowerCase().includes(q)

  const sections = useMemo(() => {
    const out: Array<{ id: string; title: string; icon?: IconComponent; items: PaletteItem[]; addLabel?: string; onAdd?: () => void; empty: string }> = []
    out.push({
      id: 'agents',
      title: l.agents,
      icon: Bot,
      items: agents.filter((a) => match(a.name)).map((a) => ({
        key: `agent:${a.id}`,
        name: a.name,
        ...(a.role ? { description: a.role } : {}),
        icon: Bot,
        tone: catalog.tone('agent'),
        payload: { kind: 'agent', label: a.name, entityId: a.id, config: { agentRef: a.id } },
        ...(a.tier ? { extra: <span className="fk-flow-palette__tag">{a.tier}</span> } : {}),
      })),
      ...(props.onCreateAgent ? { addLabel: l.addAgent, onAdd: props.onCreateAgent } : {}),
      empty: l.emptyAgents,
    })
    out.push({
      id: 'rules',
      title: l.rules,
      icon: Scale,
      items: rules.filter((r) => match(r.name)).map((r) => ({
        key: `rule:${r.id}`,
        name: r.name,
        icon: Scale,
        tone: catalog.tone('rule'),
        payload: { kind: 'rule', label: r.name, entityId: r.id, config: { ruleId: r.id } },
        extra: <span className="fk-flow-palette__state" data-on={r.enabled || undefined}>{r.enabled ? l.on : l.off}</span>,
      })),
      ...(props.onCreateRule ? { addLabel: l.addRule, onAdd: props.onCreateRule } : {}),
      empty: l.emptyRules,
    })
    out.push({
      id: 'data-sources',
      title: l.dataSources,
      icon: Database,
      items: entities.filter((e) => match(e.name)).map((e) => ({
        key: `datasource:${e.id}`,
        name: e.name,
        ...(e.dialect ? { description: e.dialect } : {}),
        icon: Database,
        tone: catalog.tone('datasource'),
        payload: { kind: 'datasource', label: e.name, entityId: e.id, config: { sourceId: e.id } },
      })),
      ...(props.onCreateDataSource ? { addLabel: l.addDataSource, onAdd: props.onCreateDataSource } : {}),
      empty: l.emptyDataSources,
    })
    out.push({
      id: 'providers',
      title: l.providers,
      icon: Server,
      items: modelProviders.filter((p) => match(p.name)).map((p) => ({
        key: `provider:${p.id}`,
        name: p.name,
        description: `${p.configured ? l.configured : l.needsSetup} · ${fill(l.models, { count: p.modelCount }, locale)}`,
        icon: Server,
        tone: 'neutral',
        payload: { kind: 'provider', label: p.name, entityId: p.id },
        ...(props.onConfigureProvider ? { onActivate: () => props.onConfigureProvider!(p.id) } : {}),
      })),
      ...(props.onAddModelProvider ? { addLabel: l.addProvider, onAdd: props.onAddModelProvider } : {}),
      empty: l.emptyProviders,
    })
    const allowed = props.kinds ? new Set(props.kinds) : null
    const byCategory = new Map<string, NodeKindEntry[]>()
    for (const e of placeableKinds(store)) {
      if (allowed && !allowed.has(e.kind)) continue
      if (!match(e.label)) continue
      if (!byCategory.has(e.category)) byCategory.set(e.category, [])
      byCategory.get(e.category)!.push(e)
    }
    // Categories in catalog order, including those with no match (they show their empty message while searching).
    for (const g of store.byCategory()) {
      const entries = byCategory.get(g.category) ?? []
      if (!g.entries.some((e) => placeableKinds(store).includes(e))) continue
      out.push({ id: `category:${g.category}`, title: g.category, items: kindItems(entries, store, catalog), empty: l.noResults })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agents, rules, entities, modelProviders, q, l, store, catalog, props.kinds, props.onCreateAgent, props.onCreateRule, props.onCreateDataSource, props.onAddModelProvider, props.onConfigureProvider, locale])

  const total = sections.reduce((n, s) => n + s.items.length, 0)

  return (
    <section className={['fk-flow-palette', props.className].filter(Boolean).join(' ')} aria-label={l.palette}>
      <TextField mode="search" label={l.search} value={query} onChange={setQuery} />
      <p className="fk-visually-hidden" role="status" aria-live="polite">
        {q ? fill(l.results, { count: total }, locale) : ''}
      </p>
      {q && total === 0 ? <p className="fk-flow-palette__no-results">{l.noResults}</p> : null}
      {sections.map((s) => (
        <Section key={s.id} id={s.id} title={s.title} {...(s.icon ? { icon: s.icon } : {})} count={s.items.length} {...(s.addLabel && s.onAdd ? { addLabel: s.addLabel, onAdd: s.onAdd } : {})} expanded={q ? true : isOpen(s.id)} onExpandedChange={toggle(s.id)}>
          <Items label={s.title} items={s.items} {...(onPlace ? { onPlace } : {})} emptyText={q ? l.noResults : s.empty} dragLabel={(name) => fill(l.dragItem, { name })} />
        </Section>
      ))}
    </section>
  )
}
