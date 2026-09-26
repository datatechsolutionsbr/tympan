# AlignmentGuides

Wave 3 · canvas · Status: specified

## Purpose
While a node is dragged, show a horizontal and/or vertical guide line when one of its edges or centre lines aligns with another node, to help tidy layouts.

## Contract
- **Guide detection**: for the dragged node (or dragged group of nodes, using the node under the pointer as reference), compare its left, centre and right against every other node's left, centre and right, and its top, middle and bottom against every other node's top, middle and bottom. Nodes being dragged are excluded from comparison.
- A match counts when the distance is within a small snapping threshold (a few canvas units; value set by the implementer, not visual); the closest match per axis wins.
- Output: at most one horizontal guide position and one vertical guide position, or none.
- Guides clear when the drag stops.
- Missing sizes fall back to a default node size.
- **Guide overlay**: draws the two guides across the whole canvas as thin dashed lines in the accent token (§2.3); draws nothing when both positions are empty.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| createDragHandler | (allNodes) => (event, node, draggedNodes) => void | n/a | attach to node drag |
| onDragStop | () => void | n/a | clears guides |
| guides | { horizontal: number or null, vertical: number or null } | both null | current guide positions |
| overlay props | same shape | required | positions to draw |

## States
No guides; horizontal only; vertical only; both.

## Keyboard and ARIA
Overlay is decorative (aria-hidden). When nodes are moved by keyboard (arrow keys on a focused node), the same detection runs, and a polite announcement says "aligned with <node name>" when a guide appears.

## Responsive, touch, motion, forced colours
Works with touch drags. No animation. Forced colours: guides drawn in Highlight.

## Acceptance tests
- Given two nodes with equal left edges within the threshold, when one is dragged, then a vertical guide appears at that x.
- Given a node whose middle is within the threshold of another's top, when dragged, then a horizontal guide appears at the other's top.
- Given two candidate matches on one axis, when dragged, then the closer one is used.
- Given several selected nodes dragged together, when compared, then none of them produces a guide against another dragged node.
- Given the drag stops, when it ends, then both guides clear.
- Given both positions empty, when the overlay renders, then nothing is drawn.
- Given a node moved with arrow keys into alignment, when the guide appears, then "aligned with" and the other node's name are announced.
