# GroupNode

Wave 3 · canvas · Status: specified

## Purpose
A container that visually groups several nodes, can be collapsed to a compact card, resized, and optionally opened in a focused view.

## Anatomy
- **Expanded container**: header bar (group icon, name, optional description, controls) above a child area where member nodes sit; resize handles when selected.
- **Collapsed card**: GraphNodeCard showing the name, description (or a default description), a "group" badge and controls.
- **Controls**: expand or collapse, enter focused view (optional), delete group (optional).
- **Ports**: one input, one output, so the group can be wired as a unit.
- NodeRunIndicator (aggregate state of members).

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| id | string | required | node id |
| name, description | string | localised default | header text |
| tone | one of the group tones | neutral | categorical tint; unknown tone falls back to neutral |
| expanded | boolean | true | container or collapsed card |
| autoFit | boolean | true | container tracks the bounds of its members |
| size | { width, height } | standard | manual size; resizing turns autoFit off |
| onToggleExpanded | (id) => void | required | collapse or expand; hides or shows members and their connectors |
| onConfigure | (id) => void | none | opened by double-clicking the header |
| onEnterFocus | (id) => void | none | shows the focused-view control |
| onRemove | (id) => void | none | shows the delete control |

Auto-fit: the container keeps a padding around its members and never shrinks below a minimum size; when members move, the container moves and resizes so the padding stays equal, without moving members on screen. Manual resize cannot go below the members' bounds.

## States
Expanded; collapsed; selected (resize handles); resizing; auto-fit on or off; locked (no resize, no auto-fit, no controls that change the flow).

## Keyboard and ARIA
- Container is a labelled group (role group, name = group name, description = member count); members follow in reading order.
- Controls are RAC Buttons with names including the group name; the expand control exposes aria-expanded.
- Collapsed card: APG Button (RAC Button) to configure; Enter on the expand control expands.
- Resize by keyboard: with the container focused, Shift plus arrow keys change size in grid steps.
- Esc from a member moves focus to the group.

## Responsive, touch, motion, forced colours
- Controls always visible on touch (not hover-only) and 44 px.
- Reduced motion: expand and collapse are instant. Forced colours: container border and header remain visible; tone is decorative.

## Acceptance tests
- Given an expanded group, when collapse is activated, then members and their connectors are hidden and the card shows the name.
- Given a collapsed group, when expand is activated, then members reappear at their previous positions.
- Given autoFit and a member dragged outward, when the drag ends, then the container grows to keep equal padding.
- Given a manual resize, when it ends, then autoFit becomes false and the new size is stored.
- Given no onRemove, when rendered, then no delete control exists.
- Given the canvas is locked, when selected, then no resize handles appear.
