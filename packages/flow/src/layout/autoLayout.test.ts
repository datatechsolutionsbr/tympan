import { describe, expect, it } from 'vitest'
import { autoLayout, type LayoutNode } from './autoLayout'

const node = (id: string, kind = 'code', extra: Partial<LayoutNode> = {}): LayoutNode => ({ id, kind, position: { x: 0, y: 0 }, ...extra })
const chain = [node('A'), node('B'), node('C')]
const links = [
  { source: 'A', target: 'B' },
  { source: 'B', target: 'C' },
]

describe('AutoLayout', () => {
  it('left-right: x(A) < x(B) < x(C)', () => {
    const out = autoLayout(chain, links, 'left-right')
    const x = Object.fromEntries(out.map((n) => [n.id, n.position.x]))
    expect(x.A).toBeLessThan(x.B!)
    expect(x.B).toBeLessThan(x.C!)
  })

  it('top-down: y(A) < y(B) < y(C)', () => {
    const out = autoLayout(chain, links, 'top-down')
    const y = Object.fromEntries(out.map((n) => [n.id, n.position.y]))
    expect(y.A).toBeLessThan(y.B!)
    expect(y.B).toBeLessThan(y.C!)
  })

  it('keeps notes and grouped children where they are', () => {
    const note = node('N', 'note', { position: { x: 7, y: 9 } })
    const child = node('K', 'code', { position: { x: 3, y: 4 }, parentId: 'G' })
    const out = autoLayout([...chain, note, child], links, 'top-down')
    expect(out.find((n) => n.id === 'N')!.position).toEqual({ x: 7, y: 9 })
    expect(out.find((n) => n.id === 'K')!.position).toEqual({ x: 3, y: 4 })
  })

  it('ignores connectors to a note when ranking', () => {
    const note = node('N', 'note', { position: { x: 7, y: 9 } })
    const withNote = autoLayout([...chain, note], [...links, { source: 'C', target: 'N' }], 'top-down')
    const without = autoLayout(chain, links, 'top-down')
    expect(withNote.slice(0, 3).map((n) => n.position)).toEqual(without.map((n) => n.position))
  })

  it('is deterministic and does not mutate its input', () => {
    const input = structuredClone(chain)
    const a = autoLayout(input, links, 'left-right')
    const b = autoLayout(input, links, 'left-right')
    expect(a).toEqual(b)
    expect(input).toEqual(chain)
    expect(a.map((n) => n.id)).toEqual(['A', 'B', 'C'])
  })

  it('centres nodes of different sizes on their rank line', () => {
    const sized = [node('A', 'code', { measured: { width: 100, height: 40 } }), node('B', 'code', { measured: { width: 300, height: 120 } })]
    const out = autoLayout(sized, [{ source: 'A', target: 'B' }], 'top-down')
    const centreX = (i: number) => out[i]!.position.x + sized[i]!.measured!.width / 2
    expect(centreX(0)).toBeCloseTo(centreX(1), 5)
  })
})
