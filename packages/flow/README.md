# @fakhir/flow

Accessible React 19 canvases for Fakhir, the research platform: a **W3C PROV
provenance graph viewer** with a synced keyboard list, a **DAG workflow
editor** for analyses (including a generic decision step), run inspection
(panel and drawer, timeline, trace, replay and rewind), and the forms and
dialogs around them. Built on `@fakhir/ui` and React Aria
Components, styled with plain CSS in `@layer fakhir.components`. No Tailwind.
Licence: FSL-1.1-ALv2 (Functional Source License, Version 1.1, Apache 2.0
Future License), Copyright 2026 Natalia Mesquita; see `LICENSE`.

```sh
npm run build -w @fakhir/flow          # dist/index.js, index.d.ts, styles.css
npm run typecheck -w @fakhir/flow
npm test -w @fakhir/flow               # vitest + Testing Library + axe-core
npm run gallery -w @fakhir/flow        # http://localhost:3320 (provenance, DAG editor, components)
npm run gallery:build -w @fakhir/flow  # static gallery in dist-gallery/
```

## Usage

```tsx
import '@fakhir/ui/styles.css'
import '@fakhir/flow/styles.css'
import { FakhirProvider } from '@fakhir/ui'
import { ProvenanceGraph, FlowEditor } from '@fakhir/flow'

<FakhirProvider locale="pt-BR">
  <ProvenanceGraph items={items} statements={statements} defaultFocusId="as-reg-position" defaultHops={3} />
</FakhirProvider>
```

## What is inside

- **Provenance** (`ProvenanceGraph`, `ProvenanceTree`, `ProvenanceInspector`,
  `ProvenanceFilters`, `ProvenanceLegend`, model helpers): query → retrieval →
  source → assertion → record → analysis/edition → manuscript sentence, with
  `wasDerivedFrom`, `used`, `wasGeneratedBy` and `wasAttributedTo` relations;
  focus N hops backward/forward/both; filters by kind, actor and proof state;
  proof-state border styles and the person/agent/system actor language of the
  design direction (§2.11); an APG tree view synced with the canvas, so the
  canvas is never the only way in.
- **Research steps** (`StepPalette`, `AddStepPicker`, `StepCard`,
  `IssueBar`, `FlowSidePanel`, `StepListView`, `ShapeChip`, `stepToolItems`,
  typed wiring helpers): steps shelved by research verb (input, prepare,
  analyse, decide, output; engine primitives on a folded "advanced" shelf),
  each with typed ports (records, table, number, chart, decision). A step is
  added after a step ("+" under it or the A key), inside a link ("+" on the
  link), from the palette (tap, Enter or drag) or from the dock; every way
  links and lays the flow out. Mismatched links are marked on the step and in
  a status bar with a one-press repair (swap the step, insert a bridge, or
  unlink). The list view is the keyboard view of the canvas.
- **Editor** (`FlowEditor`, `FlowEditorProvider`, `AutosaveController`,
  `CanvasCommandBar`, `CanvasContextMenus`, `NodePalette`, `FlowOutline`,
  `FlowPreview`, `FlowSwitcherBar`, `SaveStatus`, `RunControls`, editor
  shortcuts, selection arrange, alignment guides).
- **Nodes and connectors** (`GraphNodeCard`, `GenericNode`, `AgentNode`,
  `RuleNode`, `NoteNode`, `GroupNode`, `DataSourceNode`, `DecisionNode`,
  `NodeRunIndicator`, `ConnectionPorts`, `ConditionalConnector`,
  `ConnectorInsertMenu`, `ConnectionPreviewLine`, `AgentIdentity`).
- **Runs** (`RunViews` with `RunPreviewPanel` and `RunDrawer`, `RunPanel`,
  `ExecutionTimeline`, `VariableInspector`, `VersionHistoryPanel`,
  `RunInputDialog`, `RunReplayDialog`, `RunRewindDialog`, run state and
  lineage/diff helpers).
- **Forms and dialogs** (schema-driven and per-kind node forms, the decision
  form, `ExpressionBuilder`, `TraceTree`, `RuleEditor` with the rule action
  catalog, `NodeConfigDialog`, `FlowSettingsDialog`, definition export and
  import, `AgentEditorDialog`, `AgentCreationWizard`).
- **Assistant** (`useAssistantSession`, `AssistantConversation`,
  `AssistantVisualBlock`, `ConversationShell`, `ReportView`).
- **Foundations**: `CanvasSurface` (pan, zoom, pinch, marquee, node drag,
  connection drawing, overview map), `autoLayout` (dagre), `NodeKindCatalog`,
  `FlowPaletteTokens` (`kindTone`, `kindTokens`, `connectorTokens`),
  `nodeStateAttributes`, `createFlowEditorStore` and the dialog stack.

## Canvas tools in the bottom dock

`canvasToolItems({ zoom, mode, onModeChange, onZoomIn, onZoomOut,
onZoomReset, onFit, onAutoLayout, onToggleListView, onSearch, locale })`
returns the canvas tools as dock items (select, pan, zoom out, zoom level as a
percentage, zoom in, fit, auto-layout, list view, find a node), each with a
label, icon, toggle state and `aria-keyshortcuts`. Hand them to the design
system's bottom dock, or render them with `CanvasToolbar`. The flow editor
uses `stepToolItems` instead: select, move | add a step (A), rearrange, fit |
show as list, find a step; `FlowEditor` passes them to `renderTools`, so a host
can place the dock at sheet level.

## Languages and direction

Every visible string is a label. Components ship English, Brazilian
Portuguese and Spanish bundles (`defineLabels`), resolved from the React Aria
locale that `FakhirProvider` sets; hosts add any language through
`<FlowMessagesProvider messages={{ ComponentKey: {...} }}>` or per-component
`labels`. Templates use an ICU MessageFormat subset (plural, select, number).
Numbers, dates and durations go through `Intl` with the provider locale.
Styles use logical properties only; in right-to-left locales panels and
toolbars mirror, directional glyphs flip, logical port sides mirror and a
horizontal auto-layout runs right to left (each canvas has a `keepLtr` option).
Node titles clamp by lines, never by characters.

## Accessibility

Canvases are labelled groups whose nodes sit in reading order in the DOM;
every operation has a keyboard path (list or tree alternative, "Connect to…",
context menus by Shift+F10); Escape leaves the canvas; colour is never the
only carrier (words, icons, line styles); 44 px hit areas; reduced motion,
reduced transparency and forced colours are handled in every stylesheet.

## Records

`CLEAN-ROOM.md` (process and inputs), `PROVENANCE.md` (per component),
`THIRD_PARTY_NOTICES.md`, `LICENSE`.
