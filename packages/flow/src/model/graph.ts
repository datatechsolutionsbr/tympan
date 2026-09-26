// Pure graph queries over node ids and directed pairs. Nothing here knows about
// React, the DOM or a particular node kind.

export interface DirectedPair {
  source: string
  target: string
}

interface Adjacency {
  out: Map<string, string[]>
  into: Map<string, string[]>
}

function adjacency(ids: Iterable<string>, pairs: readonly DirectedPair[]): Adjacency {
  const out = new Map<string, string[]>()
  const into = new Map<string, string[]>()
  for (const id of ids) {
    out.set(id, [])
    into.set(id, [])
  }
  for (const { source, target } of pairs) {
    if (!out.has(source) || !into.has(target)) continue
    out.get(source)!.push(target)
    into.get(target)!.push(source)
  }
  return { out, into }
}

/**
 * Kahn ordering that keeps the given id order as the tie-break, so the result
 * is stable. Ids left over by a cycle are appended in their original order.
 */
export function topologicalOrder(ids: readonly string[], pairs: readonly DirectedPair[]): string[] {
  const { out, into } = adjacency(ids, pairs)
  const remaining = new Map(ids.map((id) => [id, into.get(id)!.length]))
  const rankOf = new Map(ids.map((id, i) => [id, i]))
  const ready = ids.filter((id) => remaining.get(id) === 0)
  const ordered: string[] = []
  const placed = new Set<string>()
  while (ready.length) {
    ready.sort((a, b) => rankOf.get(a)! - rankOf.get(b)!)
    const id = ready.shift()!
    ordered.push(id)
    placed.add(id)
    for (const next of out.get(id)!) {
      const left = remaining.get(next)! - 1
      remaining.set(next, left)
      if (left === 0) ready.push(next)
    }
  }
  for (const id of ids) if (!placed.has(id)) ordered.push(id)
  return ordered
}

/** Longest-path layer of each id (sources are layer 0); cycles fall back to 0. */
export function layerIndex(ids: readonly string[], pairs: readonly DirectedPair[]): Map<string, number> {
  const order = topologicalOrder(ids, pairs)
  const { into } = adjacency(ids, pairs)
  const layer = new Map<string, number>()
  for (const id of order) {
    let best = 0
    for (const parent of into.get(id)!) {
      const l = layer.get(parent)
      if (l !== undefined) best = Math.max(best, l + 1)
    }
    layer.set(id, best)
  }
  return layer
}

export type HopDirection = 'backward' | 'forward' | 'both'

/**
 * Ids reachable from `focus` within `hops` steps. `backward` follows pairs
 * against their direction (towards what the focus was derived from),
 * `forward` along them. Returns a map id → distance (focus is 0).
 */
export function withinHops(focus: string, pairs: readonly DirectedPair[], hops: number, direction: HopDirection): Map<string, number> {
  const forward = new Map<string, string[]>()
  const backward = new Map<string, string[]>()
  for (const { source, target } of pairs) {
    if (!forward.has(source)) forward.set(source, [])
    if (!backward.has(target)) backward.set(target, [])
    forward.get(source)!.push(target)
    backward.get(target)!.push(source)
  }
  const found = new Map<string, number>([[focus, 0]])
  const walk = (links: Map<string, string[]>) => {
    let frontier = [focus]
    for (let step = 1; step <= hops && frontier.length; step++) {
      const next: string[] = []
      for (const id of frontier) {
        for (const n of links.get(id) ?? []) {
          if (found.has(n) && found.get(n)! <= step) continue
          found.set(n, step)
          next.push(n)
        }
      }
      frontier = next
    }
  }
  if (direction !== 'forward') walk(backward)
  if (direction !== 'backward') walk(forward)
  return found
}

/** Every id that can reach `id` (its ancestors), nearest first. */
export function ancestorsOf(id: string, pairs: readonly DirectedPair[]): string[] {
  const within = withinHops(id, pairs, Number.POSITIVE_INFINITY, 'backward')
  within.delete(id)
  return [...within.entries()].sort((a, b) => a[1] - b[1]).map(([k]) => k)
}

/** Direct predecessors and successors of `id`. */
export function neighboursOf(id: string, pairs: readonly DirectedPair[]): { incoming: string[]; outgoing: string[] } {
  const incoming: string[] = []
  const outgoing: string[] = []
  for (const p of pairs) {
    if (p.target === id) incoming.push(p.source)
    if (p.source === id) outgoing.push(p.target)
  }
  return { incoming, outgoing }
}
