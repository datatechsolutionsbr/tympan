import { describe, expect, it } from 'vitest'
import { topologicalOrder, withinHops } from '../model/graph'
import { alignBoxes, distributeBoxes, frameAround } from './arrange'
import { connectorCurve } from './curve'
import { findGuides } from './guides'
import { absoluteRect, exitPoint, pointOnSide } from './rect'
import { fitBounds, ladderStep, revealRect, zoomAt } from './viewport'

describe('graph helpers', () => {
  it('orders topologically, keeping input order as tie-break and appending cycles', () => {
    expect(topologicalOrder(['C', 'B', 'A'], [{ source: 'A', target: 'B' }, { source: 'B', target: 'C' }])).toEqual(['A', 'B', 'C'])
    expect(topologicalOrder(['X', 'Y', 'Z'], [{ source: 'X', target: 'Y' }, { source: 'Y', target: 'X' }])).toEqual(['Z', 'X', 'Y'])
  })

  it('finds ids within N hops backward and forward', () => {
    const pairs = [
      { source: 'q', target: 'r' },
      { source: 'r', target: 's' },
      { source: 's', target: 'a' },
      { source: 'a', target: 'm' },
    ]
    expect([...withinHops('s', pairs, 1, 'backward').keys()].sort()).toEqual(['r', 's'])
    expect([...withinHops('s', pairs, 2, 'both').keys()].sort()).toEqual(['a', 'm', 'q', 'r', 's'])
    expect(withinHops('s', pairs, 2, 'forward').get('m')).toBe(2)
  })
})

describe('geometry', () => {
  it('resolves grouped positions to absolute boxes', () => {
    const g = { id: 'g', kind: 'group', position: { x: 100, y: 50 }, data: {}, size: { width: 400, height: 300 } }
    const c = { id: 'c', kind: 'code', position: { x: 10, y: 20 }, data: {}, parentId: 'g', size: { width: 100, height: 40 } }
    const byId = new Map([
      ['g', g],
      ['c', c],
    ])
    expect(absoluteRect(c, byId)).toEqual({ x: 110, y: 70, width: 100, height: 40 })
  })

  it('places points on sides and on the border towards a target', () => {
    const r = { x: 0, y: 0, width: 100, height: 50 }
    expect(pointOnSide(r, 'top', 0.25)).toEqual({ x: 25, y: 0 })
    expect(exitPoint(r, { x: 500, y: 25 })).toEqual({ point: { x: 100, y: 25 }, side: 'end' })
    expect(exitPoint(r, { x: 50, y: -300 }).side).toBe('top')
  })

  it('draws a cubic whose midpoint lies between its ends', () => {
    const g = connectorCurve({ point: { x: 0, y: 0 }, side: 'end' }, { point: { x: 200, y: 0 }, side: 'start' })
    expect(g.d.startsWith('M0,0 C')).toBe(true)
    expect(g.mid.x).toBeCloseTo(100)
    expect(g.arrival.x).toBeGreaterThan(0)
  })

  it('fits bounds, zooms around a pivot and steps the zoom ladder', () => {
    const v = fitBounds({ x: 0, y: 0, width: 400, height: 200 }, { width: 800, height: 600 }, 0, { min: 0.1, max: 4 }, 4)
    expect(v.zoom).toBe(2)
    const z = zoomAt({ x: 0, y: 0, zoom: 1 }, 2, { x: 100, y: 100 })
    expect(z).toEqual({ x: -100, y: -100, zoom: 2 })
    expect(ladderStep(1, 1)).toBe(1.1)
    expect(ladderStep(1, -1)).toBe(0.9)
    const revealed = revealRect({ x: 0, y: 0, zoom: 1 }, { x: 900, y: 10, width: 100, height: 40 }, { width: 800, height: 600 }, 20)
    expect(revealed.x).toBe(-220)
  })

  it('finds the closest alignment guide per axis within the threshold', () => {
    const moving = { x: 102, y: 0, width: 50, height: 20 }
    const m = findGuides(moving, [
      { id: 'far', rect: { x: 105, y: 400, width: 10, height: 10 } },
      { id: 'near', rect: { x: 100, y: 300, width: 10, height: 10 } },
    ])
    expect(m.vertical).toBe(100)
    expect(m.verticalWith).toBe('near')
    expect(m.horizontal).toBeNull()
  })

  it('aligns, distributes and frames boxes', () => {
    const boxes = [
      { id: 'a', rect: { x: 10, y: 0, width: 100, height: 20 } },
      { id: 'b', rect: { x: 50, y: 30, width: 100, height: 20 } },
      { id: 'c', rect: { x: 90, y: 60, width: 100, height: 20 } },
    ]
    expect([...alignBoxes(boxes, 'left').values()].map((p) => p.x)).toEqual([10, 10, 10])
    const right = alignBoxes([{ id: 'a', rect: { x: 0, y: 0, width: 100, height: 10 } }, { id: 'b', rect: { x: 300, y: 0, width: 100, height: 10 } }], 'right')
    expect([...right.values()].map((p) => p.x + 100)).toEqual([400, 400])
    const spread = distributeBoxes(
      [
        { id: 'a', rect: { x: 0, y: 0, width: 20, height: 10 } },
        { id: 'b', rect: { x: 50, y: 0, width: 20, height: 10 } },
        { id: 'c', rect: { x: 400, y: 0, width: 20, height: 10 } },
      ],
      'horizontal',
    )
    expect(spread.get('a')!.x).toBe(0)
    expect(spread.get('c')!.x).toBe(400)
    expect(spread.get('b')!.x - 20).toBeCloseTo(400 - (spread.get('b')!.x + 20))
    expect(frameAround(boxes, 10, 30)).toEqual({ x: 0, y: -40, width: 200, height: 130 })
  })
})
