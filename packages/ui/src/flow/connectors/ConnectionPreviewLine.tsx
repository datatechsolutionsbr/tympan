// ConnectionPreviewLine: the temporary line from a port to the pointer while a
// connection is dragged. Decorative (aria-hidden); the surface announces the
// hovered target in its live region.

import { connectorCurve, facingSide } from '../geometry/curve'
import type { Point, Side } from '../model/types'
import type { ConnectValidity } from '../surface/types'

export interface ConnectionPreviewLineProps {
  from: Point & { side: Side }
  to: Point & { side?: Side }
  validity?: ConnectValidity
}

export function ConnectionPreviewLine({ from, to, validity = 'unknown' }: ConnectionPreviewLineProps) {
  const toSide = to.side ?? facingSide(from, to)
  const { d } = connectorCurve({ point: from, side: from.side }, { point: to, side: toSide })
  return (
    <g className="ty-connection-preview" data-validity={validity} aria-hidden="true">
      <path className="ty-connection-preview__path" d={d} />
      <circle className="ty-connection-preview__dot" cx={to.x} cy={to.y} r={4} />
      {validity === 'invalid' ? (
        // Not-allowed glyph: a ring with a bar, drawn beside the pointer so a finger does not hide it.
        <g className="ty-connection-preview__refusal" transform={`translate(${to.x + 14} ${to.y - 14})`}>
          <circle r={7} />
          <line x1={-5} y1={5} x2={5} y2={-5} />
        </g>
      ) : null}
    </g>
  )
}
