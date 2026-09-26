# Provenance

Author: Natalia Mesquita. Per component: the spec it implements, the sources
used, and the decisions taken where the spec left room. Specs live in
`docs/clean-room/specs/`; "DD" is the design direction
(`docs/infra/design-direction-fakhir.md`); RAC is React Aria Components (used
from its documentation and published type definitions); APG is the WAI-ARIA
Authoring Practices Guide. No fork or commercial template material was used
for any row. Every test file includes axe-core checks and stylesheet
assertions for reduced motion and forced colours where the component moves or
draws state.

## Foundations (coordinating implementer)

| Part | Spec | Sources | Decisions |
|---|---|---|---|
| Graph model, `topologicalOrder`, `layerIndex`, `withinHops` | none (infrastructure) | Kahn ordering, longest-path layering | Stable tie-break by input order; cycles appended |
| Geometry (`rect`, `viewport`, `curve`, `guides`, `arrange`) | wave-3 alignment-guides, selection-arrange (arithmetic) | Bernstein cubic, ray/box intersection | Own zoom ladder (0.2–2.5); "centre horizontally" shares x |
| `autoLayout` | wave-3/auto-layout | @dagrejs/dagre (MIT) | Rank gap 64, sibling 32, margin 24 (§2.1); `right-left` rank direction for RTL |
| NodeKindCatalog, icon registry, RenderCatalog | wave-3/node-kind-catalog | lucide icons (§4.4) | Picker kinds (agent, rule, datasource) have no default config |
| FlowPaletteTokens (`kindTone`, `kindTokens`, `connectorTokens`) | wave-4/flow-palette-tokens | DD §2.3; WCAG contrast (static test) | Resting connector uses `--fk-input` (≥ 3:1) instead of `--fk-line-strong` (≈ 2:1), per WCAG 1.4.11 |
| NodeStateStyles (`nodeStateAttributes`, frame CSS) | wave-4/node-state-styles | DD §2.6, §2.11, §3.13 | Selection ring outside, run ring inside; proof state as border line style |
| FlowEditorState, dialog stack | wave-3/flow-editor-state | own minimal external store + `useSyncExternalStore` | One store per provider; paste cascades via the clipboard |
| CanvasSurface | wave-3/flow-editor, flow-preview (surface parts) | Pointer Events, ResizeObserver (MDN) | Own engine instead of @xyflow/react: DOM reading order, jsdom-testable geometry, logical RTL port sides; `minFitZoom` keeps text readable |
| ConnectionPreviewLine | wave-3/connection-preview-line | — | Not-allowed glyph beside the pointer end |
| GraphNodeCard | wave-3/graph-node-card | RAC Button, TextField; APG Button | Title button stretched over the card; siblings above it; clamps by lines |
| Canvas tools, CanvasToolbar, CanvasNodeSearch | brief (dock toolbar); wave-4/floating-action-bar (item shape) | RAC Toolbar, ToggleButton, Autocomplete, SearchField, ListBox; APG Toolbar | Tools are data so the DS dock can render them; `aria-keyshortcuts` set through a ref (RAC does not forward it) |
| Labels, `FlowMessagesProvider`, ICU subset, `useFlowLocale` | user requirement (i18n) | RAC `useLocale`; ICU syntax; `Intl.PluralRules` | en complete; pt-BR and es shipped; host catalogue per component key |
| SectionedModal, DockedPanel, ConfirmProvider (internal) | stand-ins for wave-2 SectionedModal and ConfirmService | DS ModalDialog, Tabs, Button | Replace with the DS components when wave 2 lands |

## Components by group

| Group | Components (spec) | Tests | Sources | Decisions |
|---|---|---|---|---|
| Provenance | ProvenanceGraph (question bar and five views), ProvenanceTree, ProvenanceInspector, ProvenanceFilters, ProvenanceLegend, ProvenanceNode, HashCheck, model helpers (`provenanceView`, `proofPath`, `bandLayout`, `bandGeometryFrom`) (no spec; brief priority 1 and the author's storyboards) | 44 | W3C PROV-O/PROV-DM; DD §2.11, §3.7, §3.13; RAC ComboBox, Tree, Popover; APG Combobox, Tree View | Bands stacked top to bottom in research order, only bands with items; proof path down column 0, off-path dimmed with the word "off the proof path", focus halo, "only the proof path" hides the rest; relation shown by line style (derived solid, used dashed, attributed dotted, generated dash-dot) with the word in the legend, inspector and tree, not on the line (it covered cards between close bands); arrows point back to origins as in PROV diagrams; band sizes read from `--fk-flow-*` tokens; steps back and forward are separate; tree is the default below 1024 px and the inspector opens on selection there; Enter in the tree shows the node in the graph |
| Provenance side views | ProvenanceTimeline, ProvenanceCertificate, EditionCompare, NumberTrace (storyboards; types in `proofTypes.ts`) | 19 | RAC Tree; DS ActorChip, ProofBadge, SegmentedControl; APG Tree View, Radio Group, Disclosure | Timeline: one lane per actor, close events stacked in rows, axis inset so no event hangs over an edge; certificate states the verifier is deterministic and uses no language model; comparison marks changes by icon, word and border style and shows before/after cards; number trace opens a non-modal region and returns focus to the number |
| Nodes | GenericNode, AgentNode, RuleNode, NoteNode, GroupNode, DataSourceNode (wave-4), NodeRunIndicator, ConnectionPorts, AgentIdentity, AlignmentGuides, DecisionNode (B-002) | 48 + 10 | RAC Button, Toolbar, Switch, TextField, ComboBox; DD §2.3, §2.11 | Agent avatar is a geometric mark from a hash of the name (no external service); source marks from a local registry with a database glyph fallback, dialect always text; decision probabilities as text plus bar, "needs review" word |
| Connectors | ConditionalConnector, ConnectorInsertMenu, `splitConnector`, Connect to command | 18 | RAC Button, Autocomplete, ListBox, Popover; DS Drawer; APG Combobox | Branch word is the focusable handle (Delete removes, Enter opens insert); true solid, false dashed, loop dotted; bottom drawer below 640 px |
| Editor | FlowEditor, FlowEditorProvider, AutosaveController, EditorShortcuts, SelectionArrange, CanvasContextMenus, CanvasCommandBar, NodePalette, FlowOutline, FlowPreview, FlowSwitcherBar, SaveStatus, RunControls | 19 + 42 | DS ActionMenu; RAC Toolbar, Popover, GridList (drag and drop), Disclosure, SearchField; APG Toolbar, Menu, Dialog | Shortcuts listen in the capture phase scoped to the canvas; Escape clears then leaves to the toolbar; the L key is not implemented (auto-layout is a tool); step list as keyboard alternative, open by default below 1024 px |
| Runs | useFlowExecution, applyRunEvent, useRunProjection, RunPanel, RunPreviewPanel, RunDrawer, RunViews (wave-4 run-view-modes), RunInputDialog, RunReplayDialog, RunRewindDialog, lineage and diff helpers, ExecutionTimeline, VariableInspector, VersionHistoryPanel | 43 | RAC Tabs, ListBox, Disclosure, Dialog; DS ActorChip, StatusPill; DD §2.8, §3.10 | Default timeline selection is the first failed step; a failed run forces the drawer on the failing node; the version panel does not confirm restores (host does) |
| Expressions | ExpressionBuilder, ExpressionField, TraceTree (+ `runDryRun`), ComputeNodeForm, SimulationNodeForm, RuleEditor (+ condition and action builders, `normalizeRuleCondition`, `defaultRule`), rule action catalog (wave-4), RuleNodeForm | 14 + 9 + 33 | RAC Tree, NumberField, Disclosure, RadioGroup; APG Tree View, Radio Group, Disclosure | Operation vocabulary comes from a host catalog; simulation wraps bare values in `coalesce`; legacy rule shapes are this package's own reading and must be checked against the engine normaliser; native date-time input until the DS has a DatePicker |
| Forms | SchemaConfigForm (+ NodeFormFooter), VariableListEditor, ToolServerListField, StartNodeForm, AgentNodeForm, DataSourceNodeForm, ReportOutputNodeForm, GroupNodeForm, OutputSchemaBuilder, DecisionNodeForm (B-002) | 71 | RAC RadioGroup, ListBox; DS fields, CheckboxGroup, Switch; APG Tabs, Radio Group, Listbox | No vendor logos; `maxLimit` prop for the row limit; decision needs two unique options and an input reference |
| Dialogs | NodeConfigDialog, FlowSettingsDialog, DefinitionExportDialog, DefinitionImportDialog | 40 | RAC DropZone, FileTrigger, Modal, Dialog, Switch; APG Dialog | Export file name keeps Unicode letters; copy failure is reported (not claimed as success) |
| Agents | AgentEditorDialog, AgentCreationWizard (with local StepList, ChoiceTiles, TagInput) | 18 | RAC Slider, ToggleButtonGroup, Tabs (vertical), RadioGroup, Disclosure; APG Dialog, Tabs, Slider, Radio Group | Capability tiers and presets come from props; slider value text names the tier; wizard Enter advances only outside fields |
| Assistant and report | useAssistantSession, AssistantConversation, MarkdownView, AssistantVisualBlock (+ `parseAssistantVisual`, `envelopeToReport`), ConversationShell (+ `groupThreadsByDay`, ThreadMetaLine), ReportView | 39 | RAC TextField, ToggleButton; DS Drawer, Skeleton; APG log region | Composer stays editable while busy; pt, en and es payload key aliases; currency only when the host gives a code; date groups by calendar day in a time zone |

Total: 508 tests in 36 files (Vitest count; the per-group numbers above count `it` blocks).

## Similarity rework

After the coordinator's outside audit, 23 files were restructured with
their own vocabulary and decomposition (reducers and lookup tables instead
of chained state and switches, extracted pure helpers and subcomponents):
run lineage, run data, run types, the run input, replay and rewind dialogs,
the number input, the assistant hook and conversation shell, announcer,
confirm, render catalog, schema and start forms, variable list, agent
parts, expression builder, compute form, trace client, flow settings,
autosave, auto-layout and the provenance legend. Behaviour and tests were
kept.

## Ambiguities resolved (summary)

- **Canvas library.** Own pointer-event surface instead of @xyflow/react (see
  `THIRD_PARTY_NOTICES.md`).
- **Right to left.** Canvas geometry keeps a physical origin; logical port
  sides and the horizontal rank direction mirror; everything else uses
  logical CSS. Identifiers, hashes and code stay left to right.
- **Languages.** Strings ship in en, pt-BR and es; other locales (for example
  ar and ja in the gallery) get English labels until the host supplies a
  catalogue through `FlowMessagesProvider`, while data, numbers and dates
  already follow the locale.
- **Connector contrast.** `--fk-input` for resting connectors (≥ 3:1).

## Tokens to upstream into @fakhir/tokens

`--fk-flow-tone-{categorical-1…8,neutral}` with `-ink`, `-soft`, `-text`
variants and the `[data-tone]` mapping; `--fk-flow-connector`, `-active`,
`-true`, `-false`, `-rule`, `-width`, `-width-active`; node frame tokens
`--fk-flow-node-border`, `-border-hover`, `-surface`, `-radius`,
`--fk-flow-ring-selected`, `-running`, `-succeeded`, `-failed`; canvas
`--fk-flow-plane`, `--fk-flow-grid-dot`, `--fk-flow-guide`,
`--fk-flow-marquee`; provenance bands `--fk-flow-band` (96px),
`--fk-flow-band-label` (130px), `--fk-flow-node-h` (72px), `--fk-flow-node-w`
(236px), `--fk-flow-col-gap` (56px). All are defined in `src/tokens.css` on existing `--fk-*`
roles.

## Gallery data

Project rule: no invented research data. The gallery uses neutral
placeholders (Caso A, Fonte 1, [hash], [trecho citado], [modelo], Opção A,
Fonte de dados A) under a visible "Dados de exemplo / Sample data" label.
The only real values are those of the census edition 2026-09-20: record
`ae-tamm-4-0`, retrieval `r115b`, assertion
`governance.operator_regulatory_position = confirmed_primary`, original
coder `deep-research/middle-east-africa`, and the edition manifest (857
hashes); they are shown without proof ("no proof"), because the verifier
(G7a) does not exist yet.

## Similarity rework, round 2

`useAssistantChat` became `useAssistantSession` with a new vocabulary
(renames listed at the end of `wave-3/assistant-chat.md` and
`wave-3/conversation-shell.md`); ConversationShell was split into
`threadDays`, `ThreadHistory`, `LiveCanvasPanel` and a layout shell; the
rewind dialog moved its logic to `rewindPlan.ts`; ExpressionBuilder moved its
levels into `expressions/builder/`; ComputeNodeForm into `computeDraft`,
`ComputeInsertPanel` and `ComputeTrial`; VariableListEditor into
`nameListModel` and a parts table. Behaviour and tests unchanged.
