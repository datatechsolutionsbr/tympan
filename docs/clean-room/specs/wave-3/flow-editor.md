# FlowEditor and FlowEditorProvider

Wave 3 · canvas · Status: specified

## Purpose
An editable canvas where a person builds a directed flow of typed steps (nodes) joined by connections, with autosave, undo and keyboard shortcuts.

## Anatomy
- **Provider**: optional context that can load a flow and its reference data (agents, models, rules) by flow id from the host's backend.
- **Canvas area**: pannable, zoomable surface with an optional dot grid and an optional overview map.
- **Nodes**: rendered by kind (see GenericNode, AgentNode, RuleNode, NoteNode, GroupNode, DataSourceNode).
- **Connectors**: ConditionalConnector between ports (ConnectionPorts).
- **CanvasCommandBar**: floating tools (mode, zoom, fit, undo, redo, view toggles, layout, shortcut list).
- **CanvasContextMenus**: node, selection and empty-area menus.
- **Editing dialogs**: NodeConfigDialog, AgentEditorDialog (host may supply its own), data source form.
Implementation note: a third-party graph-canvas library may back the surface (the implementation uses its own pointer-event surface; see `packages/ui/src/flow/PROVENANCE.md`).

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| flowId | string | none | when set and reference data is missing, the provider loads it |
| initialGraph | Graph or null | null | nodes, connectors and viewport to hydrate once |
| agents, models, rules, entities, dataSources | arrays | [] | reference data for node cards and palettes |
| modelProviders | array | [] | forwarded to the agent editor |
| onGraphChange | (graph) => void | none | called after edits settle (debounced) and immediately when the page is hidden or unloaded |
| onLoadTables, onLoadSchema | async loaders | return empty | used by the data-source form |
| onEditRule, onToggleRule | (rule) => void | none | rule node actions delegated to the host |
| isCreatingAgent | boolean | false | opens the agent editor in create mode |
| onCancelCreateAgent, onAgentSaved | () => void | none | agent editor outcomes |
| extraNodeKinds | map kind → renderer | none | host-supplied node renderers merged with built-ins |
| renderAgentEditor, renderNodeEditor | render functions | built-in | replace the built-in editing dialogs |
| locale, messages | string, object | host i18n | strings for the editor |

## States
Empty; hydrated; editing (dirty, autosave pending); dragging; connecting (connection preview visible, invalid targets refuse drop); locked (read-only while a past run is shown: no toolbars, no delete, no resize); modal open; loading reference data (canvas still usable); load failure (canvas renders with whatever props exist and reports the failure to the host).

Connection rules: no self-connection; notes never connect; a start node is never a target; end and answer nodes are never sources; a rule node is never a source; the iteration-start node accepts input only from its iteration node.

## Keyboard and ARIA
No APG pattern covers a node graph and there is no RAC primitive; custom. Requirements:
- The canvas region has an accessible name; nodes are focusable and announce kind, label and run state.
- Shortcuts active only when focus is not in a text field: V pointer mode, H hand mode, G grid, M overview map, Esc clears selection, Delete or Backspace removes selection, Shift+1 zoom 100, Shift+5 zoom 50; with the platform modifier: Z undo, Shift+Z or Y redo, C copy, V paste, D duplicate, A select all, G group, Shift+G ungroup, 1 or Shift+F fit, plus and minus zoom.
- Esc with nothing selected moves focus out of the canvas to the next landmark (design direction §5: focus must never be trapped).
- Keyboard alternative: every operation (add, connect, configure, delete, reorder) is also reachable from a list or tree view of the flow offered next to the canvas.

## Responsive, touch, motion, forced colours
- Below 1024 px the command bar and palettes collapse to a toolbar and drawers; pinch zoom and two-finger pan work.
- All on-canvas controls have 44 px hit areas.
- Reduced motion: no animated connector flow, no animated fit; view changes jump.
- Reduced transparency: glass panels opaque (§2.5). Forced colours: nodes, ports and connectors drawn in system colours; selection shown with outline, not colour alone.

## Acceptance tests
- Given an initial graph, when the editor mounts, then all nodes and connectors appear and the view fits the graph, refitting when the container resizes.
- Given an edit, when edits stop for the debounce period, then onGraphChange receives the serialised graph once.
- Given pending edits, when the page becomes hidden, then onGraphChange is called immediately.
- Given a note node, when the person drags a connection to it, then the connection is refused.
- Given focus in a text field inside a node, when the person presses V, then the text receives the character and the mode does not change.
- Given the canvas is locked, when the person hovers a node, then no edit, duplicate or delete tools appear.
- Given a node is dropped from the palette, when the drop completes, then a node of that kind appears at the drop point and one undo removes it.

## Open questions
- The fork's shortcut list mentions an L key for layout mode that the handler does not implement; the new editor should either implement it or drop it from the list.
