# ConnectionPreviewLine

Wave 3 · canvas · Status: specified

## Purpose
The temporary line drawn from a port to the pointer while a person drags a new connection, so they can see where it will land.

## Anatomy
- **Preview path**: a dashed curve from the origin port to the pointer, using the same curve family as ConditionalConnector.
- **End dot**: a small filled circle at the pointer end.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| from | { x, y, side } | required | origin port position and side |
| to | { x, y, side? } | required | current pointer position (and side of a hovered target) |
| validity | 'unknown', 'valid', 'invalid' | 'unknown' | whether the hovered target would accept the connection |

The line uses the accent token (§2.3) when valid or unknown and the error semantic with a not-allowed mark when invalid.

## States
Dragging over empty canvas; over a valid target; over an invalid target; released (line disappears).

## Keyboard and ARIA
not applicable as an element (decorative, aria-hidden). The keyboard way to connect is the "Connect to…" command described in ConnectionPorts; during a pointer drag, a polite live region announces the hovered target name and whether it is valid.

## Responsive, touch, motion, forced colours
- Works with touch drags; the end dot stays visible above the finger by offsetting the label, not the line.
- Reduced motion: no dash animation.
- Forced colours: line in Highlight; invalid state adds a glyph, not only colour.

## Acceptance tests
- Given a drag from an output port, when the pointer moves, then a dashed line follows the pointer from the port.
- Given the pointer over a note node, when hovering, then the line shows the invalid look and the live region says the target cannot be connected.
- Given the drag ends, when released anywhere, then the preview disappears.
- Given reduced motion, when dragging, then the dashes do not move.
- Given forced colours, when dragging over an invalid target, then a not-allowed glyph is visible.
- Given a touch drag, when the finger moves, then the preview follows the touch point.
- Given the drag started from an input port, when drawn, then the line runs from that port to the pointer in the same way.
