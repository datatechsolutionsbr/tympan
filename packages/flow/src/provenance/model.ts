// Provenance model (W3C PROV-DM concepts, design direction §3.13).
//
// Items are PROV entities and activities of the research trail (query,
// retrieval, source, assertion, record, analysis, edition, manuscript
// sentence). Statements are PROV relations written the PROV way round:
// `subject relation object`, e.g. "assertion wasDerivedFrom source",
// "analysis used edition", "retrieval wasGeneratedBy query",
// "assertion wasAttributedTo coder".
//
// Who acted is carried on each item (`actor`), because every card and row
// shows it (§2.11). A `wasAttributedTo` statement may also point at an actor
// id; those actors can be drawn as their own nodes on request, so attribution
// stays a real PROV edge and is not only decoration.
//
// Drawing: time runs from origins (left) to results (right). A statement
// becomes a directed pair `object → subject` for layout and hop counting, and
// the arrowhead is drawn at the object end, as PROV diagrams do (the arrow
// points back to what something came from). "Backward" therefore walks
// towards origins, "forward" towards what was made from the item.

import { layerIndex, topologicalOrder, withinHops, type DirectedPair, type HopDirection } from '../model/graph'

export const PROV_KINDS = ['query', 'retrieval', 'source', 'assertion', 'record', 'analysis', 'edition', 'manuscript'] as const
export type ProvKind = (typeof PROV_KINDS)[number]

export const PROV_RELATIONS = ['wasDerivedFrom', 'used', 'wasGeneratedBy', 'wasAttributedTo'] as const
export type ProvRelation = (typeof PROV_RELATIONS)[number]

export type ProvProofState = 'proved' | 'pending' | 'refuted' | 'not_disclosed'
/** Proof filter keys: the four states plus "no proof". */
export type ProofKey = ProvProofState | 'none'
export const PROOF_KEYS: readonly ProofKey[] = ['proved', 'pending', 'refuted', 'not_disclosed', 'none']

export type ProvActorKind = 'person' | 'agent' | 'system'
export const ACTOR_KINDS: readonly ProvActorKind[] = ['person', 'agent', 'system']

export interface ProvActor {
  /** Needed only when statements attribute items to this actor. */
  id?: string
  kind: ProvActorKind
  name: string
  email?: string
  /** Agent key (mono metadata). */
  agentKey?: string
  /** Model and version the agent ran on (mono metadata). */
  model?: string
}

export interface ProvDetail {
  label: string
  value: string
  mono?: boolean
}

export interface ProvItem {
  id: string
  kind: ProvKind
  title: string
  /** Identifiers shown in mono under the title: hash, key = value, edition date. */
  meta?: string[]
  actor?: ProvActor
  proofState?: ProvProofState | null
  /** When the act happened (ISO 8601). */
  at?: string
  /** Who verified the proof, and the verifier rule, for the evidence block. */
  verifiedBy?: string
  rule?: string
  summary?: string
  details?: ProvDetail[]
}

export interface ProvStatement {
  id?: string
  subject: string
  relation: ProvRelation
  object: string
}

export interface ProvFilters {
  /** Kinds to keep; empty keeps all. */
  kinds: ProvKind[]
  actorKinds: ProvActorKind[]
  /** Case-insensitive part of the actor name; empty keeps all. */
  actorName: string
  proofStates: ProofKey[]
  /** Draw attributed actors as nodes with wasAttributedTo edges. */
  actorsAsNodes: boolean
}

export const EMPTY_FILTERS: Readonly<ProvFilters> = Object.freeze({ kinds: [], actorKinds: [], actorName: '', proofStates: [], actorsAsNodes: false })

export function activeFilterCount(f: ProvFilters): number {
  return (f.kinds.length ? 1 : 0) + (f.actorKinds.length ? 1 : 0) + (f.actorName.trim() ? 1 : 0) + (f.proofStates.length ? 1 : 0) + (f.actorsAsNodes ? 1 : 0)
}

export const proofKeyOf = (item: Pick<ProvItem, 'proofState'>): ProofKey => item.proofState ?? 'none'

/** Does an item pass the filters (actor-node switch aside)? */
export function passesFilters(item: ProvItem, f: ProvFilters): boolean {
  if (f.kinds.length && !f.kinds.includes(item.kind)) return false
  if (f.proofStates.length && !f.proofStates.includes(proofKeyOf(item))) return false
  if (f.actorKinds.length && (!item.actor || !f.actorKinds.includes(item.actor.kind))) return false
  const needle = f.actorName.trim().toLocaleLowerCase()
  if (needle && !(item.actor?.name ?? '').toLocaleLowerCase().includes(needle)) return false
  return true
}

/** A drawable link: the pair runs from the older end (object) to the newer (subject). */
export interface ProvLink extends DirectedPair {
  id: string
  relation: ProvRelation
}

export function linkOf(s: ProvStatement, index: number): ProvLink {
  return { id: s.id ?? `${s.subject}~${s.relation}~${s.object}~${index}`, source: s.object, target: s.subject, relation: s.relation }
}

/** A node on the canvas or in the tree: an item, or an actor drawn as a node. */
export type ProvVertex = { type: 'item'; id: string; item: ProvItem } | { type: 'actor'; id: string; actor: ProvActor & { id: string } }

export interface ProvView {
  vertices: ProvVertex[]
  links: ProvLink[]
  /** Hop distance from the focus (focus 0); absent when no focus. */
  distance: ReadonlyMap<string, number>
  /** Rank (layer) of each vertex, origins first. */
  layer: ReadonlyMap<string, number>
  /** The focus is hidden by the filters. */
  focusFiltered: boolean
  /** The focus has no links at all in the whole graph. */
  focusIsolated: boolean
}

export interface ViewQuery {
  focusId: string | null
  hops: number
  direction: HopDirection
  filters: ProvFilters
}

/**
 * The subgraph to show: filters first, then N hops from the focus in the
 * chosen direction (over the filtered graph), in reading order (rank, then
 * the order items were given).
 */
export function provenanceView(items: readonly ProvItem[], statements: readonly ProvStatement[], actors: readonly ProvActor[], q: ViewQuery): ProvView {
  const byId = new Map(items.map((i) => [i.id, i]))
  const allowed = new Set(items.filter((i) => passesFilters(i, q.filters)).map((i) => i.id))
  const itemLinks = statements.map(linkOf).filter((l) => l.relation !== 'wasAttributedTo' && byId.has(l.source) && byId.has(l.target))
  const focusIsolated = !!q.focusId && !itemLinks.some((l) => l.source === q.focusId || l.target === q.focusId)
  const focusFiltered = !!q.focusId && byId.has(q.focusId) && !allowed.has(q.focusId)
  const kept = itemLinks.filter((l) => allowed.has(l.source) && allowed.has(l.target))

  let visible: Set<string>
  let distance = new Map<string, number>()
  if (q.focusId && allowed.has(q.focusId)) {
    distance = withinHops(q.focusId, kept, q.hops, q.direction)
    visible = new Set(distance.keys())
  } else if (q.focusId && byId.has(q.focusId)) {
    visible = new Set()
  } else {
    visible = allowed
  }

  const links = kept.filter((l) => visible.has(l.source) && visible.has(l.target))
  const vertices: ProvVertex[] = items.filter((i) => visible.has(i.id)).map((item) => ({ type: 'item', id: item.id, item }))

  if (q.filters.actorsAsNodes) {
    const actorById = new Map(actors.filter((a): a is ProvActor & { id: string } => !!a.id).map((a) => [a.id, a]))
    statements.forEach((s, i) => {
      if (s.relation !== 'wasAttributedTo' || !visible.has(s.subject)) return
      const actor = actorById.get(s.object)
      if (!actor) return
      if (!vertices.some((v) => v.id === actor.id)) vertices.push({ type: 'actor', id: actor.id, actor })
      links.push(linkOf(s, i))
    })
  }

  const ids = vertices.map((v) => v.id)
  const layer = layerIndex(ids, links)
  const order = topologicalOrder(ids, links)
  const rankOf = new Map(order.map((id, i) => [id, i]))
  vertices.sort((a, b) => (layer.get(a.id)! - layer.get(b.id)!) || rankOf.get(a.id)! - rankOf.get(b.id)!)
  return { vertices, links, distance, layer, focusFiltered, focusIsolated }
}

/** Direct neighbours of a vertex in a view: `back` = what it came from, `ahead` = what was made from it. */
export function relationsOf(id: string, links: readonly ProvLink[]): { back: ProvLink[]; ahead: ProvLink[] } {
  return { back: links.filter((l) => l.target === id), ahead: links.filter((l) => l.source === id) }
}

/** Every item in reading order (rank of the whole graph), for pickers. */
export function readingOrder(items: readonly ProvItem[], statements: readonly ProvStatement[]): ProvItem[] {
  const view = provenanceView(items, statements, [], { focusId: null, hops: 0, direction: 'both', filters: { ...EMPTY_FILTERS } })
  return view.vertices.flatMap((v) => (v.type === 'item' ? [v.item] : []))
}

/** Views larger than this, or deeper than DEEP_HOPS, show the "reduce hops" warning. */
export const DEEP_VIEW_SIZE = 40
export const DEEP_HOPS = 6

export function isDeep(view: ProvView, hops: number): boolean {
  return view.vertices.length > DEEP_VIEW_SIZE || (hops > DEEP_HOPS && view.distance.size > 0)
}

/** Tree rows for the list alternative: the focus as root (or the origins without focus), children follow links. */
export interface ProvTreeRow {
  /** Unique path key (a DAG item may appear under several parents). */
  key: string
  id: string
  /** Relation to the parent row, read from the parent: "back" (came from) or "ahead" (made from it). */
  via?: { relation: ProvRelation; way: 'back' | 'ahead' }
  children: ProvTreeRow[]
}

export function provenanceTree(view: ProvView, focusId: string | null, direction: HopDirection): ProvTreeRow[] {
  const ids = new Set(view.vertices.map((v) => v.id))
  const build = (id: string, path: string, seen: Set<string>, via?: ProvTreeRow['via']): ProvTreeRow => {
    const next = new Set(seen).add(id)
    const children: ProvTreeRow[] = []
    const { back, ahead } = relationsOf(id, view.links)
    const wantBack = focusId !== null && direction !== 'forward'
    const wantAhead = focusId === null || direction !== 'backward'
    if (wantBack && (via?.way ?? 'back') === 'back') {
      for (const l of back) if (!next.has(l.source)) children.push(build(l.source, `${path}/${l.source}`, next, { relation: l.relation, way: 'back' }))
    }
    if (wantAhead && (via?.way ?? 'ahead') === 'ahead') {
      for (const l of ahead) if (!next.has(l.target)) children.push(build(l.target, `${path}/${l.target}`, next, { relation: l.relation, way: 'ahead' }))
    }
    return { key: path, id, ...(via ? { via } : {}), children }
  }
  if (focusId && ids.has(focusId)) return [build(focusId, focusId, new Set())]
  const roots = view.vertices.filter((v) => !view.links.some((l) => l.target === v.id))
  return roots.map((r) => build(r.id, r.id, new Set()))
}

/** Every row key of the tree (to expand all). */
export function treeKeys(rows: readonly ProvTreeRow[]): string[] {
  return rows.flatMap((r) => [r.key, ...treeKeys(r.children)])
}
