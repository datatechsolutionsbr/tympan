# AutosaveController

Wave 3 · utility · Status: specified

## Purpose
A wrapper around FlowEditor that forwards every graph change both to an optional snapshot listener and to the host's autosave handler.

## Contract
- Accepts every property of FlowEditor except its graph-change callback, which it owns.
- Additional properties:

| Name | Type | Default | Meaning |
|---|---|---|---|
| onAutosave | (graph: FlowGraph) => void | required | Called on every committed graph change; the host debounces and persists. |
| onSnapshot | (graph: FlowGraph) => void | optional | Called first, with the same graph, for local mirrors (e.g. an unsaved-changes guard). |

- Call order per change: onSnapshot, then onAutosave, synchronously, with the same graph value.
- It does not debounce, retry or show state; pair it with SaveStatus and the host's persistence.
- It must not re-mount the editor when the host re-renders with new callback identities.

## States
not applicable (no visual output of its own).

## Keyboard and ARIA
not applicable; the wrapped editor owns interaction.

## Responsive, touch, motion, forced colours
not applicable.

## Acceptance tests
- Given both callbacks, when a node is moved, then onSnapshot and then onAutosave are called with equal graphs.
- Given only onAutosave, when a connector is added, then onAutosave is called once.
- Given the host re-renders with new callback functions, when the next change happens, then the new callbacks are used and the canvas keeps its viewport and selection.

## Open questions
- Debounce and "error" status could move into this controller so every host behaves the same; the fork left both to the host.
