# ConnectionPorts

Wave 3 · canvas · Status: specified

## Purpose
The input and output points on a node where connectors start and end, positioned according to the current layout direction.

## Anatomy
- **Port**: a small round point on a node side; input ports receive connectors, output ports emit them.
- **Port set**: several ports spread evenly along one side (for example one input per incoming branch, one output per configured case).
- **Floating surfaces**: in floating-connection mode (NodeKindCatalog), invisible strips along each border start connections and the whole card accepts a drop while a connection is being dragged.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| direction | 'input' or 'output' | required | receive or emit |
| side | 'start', 'end', 'top', 'bottom' | required | preferred side |
| id | string | required | stable id stored on connectors |
| tone | kind tone or branch tone | neutral | colour of the point (categorical tokens §2.3) |
| offset | percentage | centred | position along the side |
| count, idPrefix | number, string | n/a | port set: ids are prefix plus index, spaced evenly |
| keys | string[] | none | stable keys for a port set whose items can be reordered |
| label | string | none | branch label shown beside an output |

Direction mapping: in top-down layout, start-side ports move to the top and end-side ports move to the bottom; in left-right and free layout they stay as declared. Port ids never change with the layout, so saved connectors keep resolving.

## States
Idle; hover (enlarged hit area highlighted); connecting-valid target; connecting-invalid target (refuses drop, shows a not-allowed mark); connected; hidden (floating mode: invisible, still present).

## Keyboard and ARIA
No APG pattern; no RAC primitive; custom. Ports are not individual tab stops. Keyboard connection is offered from the focused node: a "Connect to…" command (context menu or shortcut) opens a RAC ComboBox listing valid targets by name, and branch outputs are chosen from a list. Ports have accessible names ("output true of Check stock") for screen reader exploration.

## Responsive, touch, motion, forced colours
- Visible point may be small, but each port's hit area is 44 px on touch.
- Reduced motion: no pulse on valid targets. Forced colours: ports drawn with system colours and a border; branch tone accompanied by its label.

## Acceptance tests
- Given layout top-down, when a node with a start-side input renders, then the input sits on the top side with the same id.
- Given a port set of three, when rendered, then ports sit at one, two and three quarters of the side with ids prefix-0 to prefix-2.
- Given floating mode, when a connection drag is in progress, then dropping anywhere on a valid node connects to it.
- Given floating mode and no drag in progress, when the card is clicked, then the node's own click behaviour runs.
- Given the keyboard "Connect to" command, when a target is chosen, then a connector is created exactly as by dragging.
