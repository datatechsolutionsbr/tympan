// Overview map in the bottom end corner: every node as a small box in its
// kind tone plus the visible area. Pointer convenience only (aria-hidden);
// the keyboard reaches everything through the canvas and the list view.

import type { PointerEvent as ReactPointerEvent } from 'react'
import { enclosingRect, growRect } from '../geometry/rect'
import { visibleArea } from '../geometry/viewport'
import type { Point, Rect, Size, Viewport } from '../model/types'
import type { SurfaceNode } from './types'

const MAP_W = 184
const MAP_H = 128

export function OverviewMap({ nodes, rects, viewport, container, onCentre }: { nodes: readonly SurfaceNode[]; rects: ReadonlyMap<string, Rect>; viewport: Viewport; container: Size; onCentre: (canvasPoint: Point) => void }) {
  const seen = visibleArea(viewport, container)
  const world = growRect(enclosingRect([...rects.values(), seen]) ?? seen, 40)
  const scale = Math.min(MAP_W / world.width, MAP_H / world.height)
  const toMap = (r: Rect) => ({ x: (r.x - world.x) * scale, y: (r.y - world.y) * scale, width: Math.max(2, r.width * scale), height: Math.max(2, r.height * scale) })
  const pick = (e: ReactPointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    onCentre({ x: world.x + (e.clientX - box.left) / scale, y: world.y + (e.clientY - box.top) / scale })
  }
  const v = toMap(seen)
  return (
    <svg
      className="fk-surface__overview"
      data-fk-surface-chrome=""
      aria-hidden="true"
      focusable="false"
      width={MAP_W}
      height={MAP_H}
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      onPointerDown={(e) => {
        e.stopPropagation()
        pick(e)
      }}
      onPointerMove={(e) => {
        if (e.buttons === 1) pick(e)
      }}
    >
      {nodes.map((n) => {
        const r = rects.get(n.id)
        if (!r) return null
        const m = toMap(r)
        return <rect key={n.id} className="fk-surface__overview-node" data-tone={n.tone ?? 'neutral'} x={m.x} y={m.y} width={m.width} height={m.height} rx={2} />
      })}
      <rect className="fk-surface__overview-view" x={v.x} y={v.y} width={v.width} height={v.height} rx={3} />
    </svg>
  )
}
