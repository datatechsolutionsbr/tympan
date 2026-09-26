# AutoLayout

Wave 3 · utility · Status: specified

## Purpose
A pure function that arranges the nodes of a directed graph in ranked layers so connections read in one direction.

## Contract
- Input: a list of nodes (id, kind, position, optional measured size, optional parent id), a list of connectors (source, target), and a direction: left-right or top-down.
- Output: a new node list, same order, where every laid-out node has a new top-left position; all other fields unchanged; input is not mutated.
- Excluded from layout (positions untouched): nodes inside a group (having a parent) and note nodes.
- Connectors whose ends are not both laid-out nodes are ignored.
- Node size comes from the measured size; when missing a default card size is assumed. Callers that know the real size per kind should pass it, otherwise nodes of different widths will not centre on their connectors.
- Spacing between ranks is larger than spacing within a rank; a margin surrounds the whole layout. Exact values come from design direction §2.1 (use the spacing scale).
- Deterministic: the same input yields the same output.
- Implementation note: an MIT layered-graph layout library (Sugiyama style, for example dagre or elkjs) may be used.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| nodes | LayoutNode[] | required | nodes to arrange |
| connectors | LayoutEdge[] | required | directed pairs |
| direction | 'left-right' or 'top-down' | required | rank direction |
| returns | LayoutNode[] | n/a | nodes with updated positions |

## States
not applicable

## Keyboard and ARIA
not applicable. Consumers that offer a keyboard alternative (a list or tree of nodes) should order that list by rank, then by position within the rank, so reading order matches the picture.

## Responsive, touch, motion, forced colours
not applicable for the function. Consumers animating the move to new positions must skip the animation under reduced motion.

## Acceptance tests
- Given a chain A→B→C and direction left-right, when laid out, then x(A) < x(B) < x(C).
- Given the same chain and top-down, then y(A) < y(B) < y(C).
- Given a note node and a grouped child, when laid out, then both keep their original positions.
- Given a connector from a laid-out node to a note, when laid out, then it does not influence ranks.
- Given the same input twice, when laid out, then outputs are identical and the input list is unchanged.
- Given nodes with measured sizes, when laid out, then each node's centre sits on its rank line.
