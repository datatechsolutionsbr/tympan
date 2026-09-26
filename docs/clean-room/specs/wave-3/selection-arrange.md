# SelectionArrange

Wave 3 · utility · Status: specified

## Purpose
Arrange several selected nodes: group them into a frame, ungroup frames, align edges or centres, and distribute evenly.

## Contract
`useSelectionArrange({ nodes, setNodes, snapshot, groupHandlers })` returns:
- `group()`: needs at least two selected nodes. Takes a snapshot; creates a group frame whose box is the bounding box of the selection plus inner padding and a header band; default name from the i18n adapter ("Group"), neutral tone, expanded; the selected nodes become children of the frame with positions made relative to it and constrained to it; everything is deselected; the frame is placed first so it renders behind its children.
- `ungroup()`: for each selected group frame, removes the frame and converts its children back to absolute positions and no parent. No-op when no frame is selected.
- `align(direction)`: needs at least two selected. `left`/`top` move all to the smallest x/y; `right`/`bottom` align right or bottom edges to the largest edge; `centerHorizontal`/`centerVertical` align centres to the midpoint between the extreme centres.
- `distribute(axis)`: needs at least three selected. Sorts by position on the axis, keeps the first and last in place, and makes the gaps between neighbours equal.
- `measure(node)`: returns the rendered size, else the declared size, else a default card size.

Every mutating action takes one snapshot first, so each is a single undo step.

## Properties and events
Arguments: `nodes`, `setNodes` (value or updater), `snapshot()`, `groupHandlers` (edit, expand toggle, remove, passed to the new frame). Returns the five functions listed in Contract. `align` directions: left, right, top, bottom, centerHorizontal, centerVertical. `distribute` axes: horizontal, vertical.

## States
- Selection too small for the action: no-op, no snapshot, and the menu item is disabled (see CanvasContextMenus).
- Locked canvas: all actions refused.

## Keyboard and ARIA
- Not applicable to the hook. The actions are exposed through CanvasContextMenus (selection menu) and EditorShortcuts (Mod+G, Mod+Shift+G). After an action, a polite announcement states the result ("4 nodes aligned left").

## Responsive, touch, motion, forced colours
- Not applicable. Node moves are applied instantly; no animated transition (§2.7).

## Acceptance tests
- Given one selected node, when `group()` runs, then nothing changes and no snapshot is taken.
- Given nodes at x 10, 50, 90, when aligned left, then all have x 10.
- Given widths 100, 100 at x 0 and 300, when aligned right, then both right edges are at 400.
- Given three nodes of equal width at x 0, 50, 400, when distributed horizontally, then the middle node moves so both gaps are equal and the ends are unchanged.
- Given two nodes grouped then ungrouped, then their absolute positions equal the originals.
- Given any action, when undo runs, then the previous layout is restored in one step.
