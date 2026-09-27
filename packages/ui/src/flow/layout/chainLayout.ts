// Chain placement for flows that read downwards: each step sits in its first
// parent's column, a parent's later children step toward the inline end, and
// a step that would overlap one already placed in its row moves along until
// it fits. The main chain therefore stays on one straight line. Pure.

import type { Point, Size } from '../model/types'

export interface ChainOptions {
  rankGap: number
  siblingGap: number
  margin: number
  rtl?: boolean
}

/** Top-left corners by id for `sizes` (insertion order breaks ties). */
export function placeChain(sizes: ReadonlyMap<string, Size>, links: ReadonlyArray<{ source: string; target: string }>, o: ChainOptions): Map<string, Point> {
  const ids = [...sizes.keys()]
  const kids = new Map<string, string[]>(ids.map((id) => [id, []]))
  const parents = new Map<string, string[]>(ids.map((id) => [id, []]))
  for (const { source, target } of links) {
    if (source === target || !sizes.has(source) || !sizes.has(target)) continue
    kids.get(source)!.push(target)
    parents.get(target)!.push(source)
  }
  // Row = longest path from a start (cycles are cut by the visit guard).
  const row = new Map<string, number>()
  const depth = (id: string, seen: Set<string>): number => {
    if (row.has(id)) return row.get(id)!
    if (seen.has(id)) return 0
    seen.add(id)
    const d = Math.max(-1, ...parents.get(id)!.map((p) => depth(p, seen))) + 1
    row.set(id, d)
    return d
  }
  ids.forEach((id) => depth(id, new Set()))
  const rows = Math.max(0, ...row.values()) + 1
  const rowHeight = Math.max(0, ...[...sizes.values()].map((s) => s.height)) + o.rankGap
  const used: Array<Array<[number, number]>> = Array.from({ length: rows }, () => [])
  const x = new Map<string, number>()
  const fits = (r: number, from: number, w: number) => used[r]!.every(([a, b]) => from + w + o.siblingGap <= a || from >= b + o.siblingGap)
  let rootEnd = 0
  for (let r = 0; r < rows; r++) {
    for (const id of ids.filter((i) => row.get(i) === r)) {
      const w = sizes.get(id)!.width
      const first = parents.get(id)!.find((p) => x.has(p))
      let want: number
      if (first === undefined) {
        want = rootEnd
      } else {
        const order = kids.get(first)!.indexOf(id)
        want = x.get(first)! + order * (w + o.siblingGap)
      }
      while (!fits(r, want, w)) want += 8
      x.set(id, want)
      used[r]!.push([want, want + w])
      if (first === undefined) rootEnd = want + w + o.siblingGap
    }
  }
  const right = Math.max(0, ...ids.map((id) => x.get(id)! + sizes.get(id)!.width))
  const out = new Map<string, Point>()
  for (const id of ids) {
    const left = o.rtl ? right - x.get(id)! - sizes.get(id)!.width : x.get(id)!
    out.set(id, { x: left + o.margin, y: row.get(id)! * rowHeight + o.margin })
  }
  return out
}
