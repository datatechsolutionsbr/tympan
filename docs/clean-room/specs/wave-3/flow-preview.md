# FlowPreview

Wave 3 · canvas · Status: specified

## Purpose
A read-only picture of a flow, used in chat replies, run inspection and live previews, optionally showing each node's run state.

## Anatomy
- **Surface**: pannable, scroll-zoomable canvas with no chrome of its own.
- **Node cards**: the same visual vocabulary as the editor (agent card, data-source card, generic card) drawn only from data embedded in the graph.
- **Status mark**: a small state mark on each node when statuses are supplied.
- **Connectors**: plain, unlabelled, non-animated.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| graph | Graph | required | nodes and connectors to draw |
| nodeStatuses | record nodeId → RunStatus | none | when given, nodes without an entry are dimmed as "not run" |
| selectedNodeId | string or null | null | node drawn as currently inspected |
| onNodeActivate | (nodeId) => void | none | called on click or Enter on a node |
| layout | 'auto' or 'preserve' | 'auto' | auto re-lays out with AutoLayout; preserve keeps saved positions |
| direction | 'top-down' or 'left-right' | 'top-down' | direction for auto layout |
| imperative handle | zoomIn, zoomOut, fit | n/a | lets a host toolbar drive the view |

RunStatus: running, completed, failed, skipped, restored, served-from-history, unknown.

## States
Static (no statuses); run overlay (statuses, dimmed unrun nodes); selected node; catalog not loaded (fallback icons per kind); live run (nodes also show NodeRunIndicator from shared run state).

Layout and fit are recomputed only when the graph changes, never when selection or statuses change, so the view does not jump while someone clicks through nodes.

## Keyboard and ARIA
No RAC primitive; custom. The surface is a labelled group; when onNodeActivate is set, nodes are focusable in reading order (layout order), announce "kind: label, state", and activate with Enter or Space. Status is conveyed by an icon and a word in the accessible name, never colour alone. Esc leaves the surface. When the preview stands in for a run inspection, a list of the same nodes is offered as the keyboard alternative.

## Responsive, touch, motion, forced colours
- Fits the container and refits when the container resizes.
- Pinch zoom disabled inside chat bubbles so page scrolling is not hijacked; drag pans.
- Focusable nodes have 44 px hit areas at the default zoom.
- Reduced motion: fit happens without animation. Forced colours: status marks carry a glyph; dimming uses a pattern or text, not opacity alone.

## Acceptance tests
- Given a graph with an agent, a data source and a generic node, when rendered, then each shows its rich card.
- Given statuses for one of two nodes, when rendered, then the other node is marked "not run".
- Given layout 'preserve', when rendered, then nodes keep their saved positions.
- Given onNodeActivate, when a node is clicked or activated with Enter, then the callback receives its id.
- Given a new selectedNodeId, when it changes, then node positions and zoom stay the same.
