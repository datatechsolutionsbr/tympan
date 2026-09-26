# NodeConfigDialog

Wave 3 · overlay · Status: specified

## Purpose
The single modal that edits a selected node's configuration, choosing the right form for the node kind from the node catalog.

## Anatomy
- SectionedModal (wave 2) with node kind icon and tone (from NodeKindCatalog), title from the node kind, subtitle with the node's label, and an eyebrow "Node configuration".
- Optional experimental warning (InlineNotice, warning tone) when the node kind is marked experimental: its configuration is saved but the engine may pass inputs through unchanged.
- Body: exactly one form, chosen by the catalog's form kind:
  - compute → ComputeNodeForm; simulation → SimulationNodeForm; start → StartNodeForm; agent → AgentNodeForm; rule → RuleNodeForm; report output → ReportOutputNodeForm; group → GroupNodeForm;
  - schema (default) → SchemaConfigForm generated from the catalog's config schema.
- The chosen form owns its Save and Cancel footer.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| onSave | (nodeId: string, config: NodeConfig) => void | required | Persist the edited configuration. |
| dataSources | DataSource[] | [] | Passed to forms that pick a data source. |
| loadTables | (dataSourceId: string) => Promise<string[]> | optional | Passed through. |
| loadColumns | (dataSourceId: string, table: string) => Promise<Column[]> | optional | Passed through. |
| runDryRun | (request) => Promise<result> | optional | Enables the compute form's dry run; when absent the action is hidden. |
| labels | object of strings | required | Titles per node kind, eyebrow, experimental warning. |

Open state, node id, label, current config and the list of referable upstream values come from the editor's dialog state (FlowEditorState); Cancel and Escape close through that state.

## States
- closed; open with a known kind; open with an unknown kind and no catalog entry (renders nothing and logs a warning, as a missing catalog is a host error); experimental.

## Keyboard and ARIA
- APG pattern: Dialog (Modal). RAC: Modal + Dialog. Title is the accessible name; the node label is the description.
- Focus moves to the first field of the chosen form; Escape cancels; focus returns to the node on the canvas.
- Ctrl/Cmd+Enter saves from anywhere in the form (consistent with SectionedModal).

## Responsive, touch, motion, forced colours
- Full-screen on phones; wide modal otherwise.
- 44 px targets throughout (enforced by the forms).
- Reduced motion: no scale-in. Reduced transparency: opaque. Forced colours: kind tone is not the only identifier; the kind name is in the title.

## Acceptance tests
- Given a compute node is being edited, when the dialog opens, then the compute form is shown.
- Given a node kind whose catalog form kind is schema, when the dialog opens, then a schema-generated form is shown.
- Given an experimental node kind, when the dialog opens, then the warning notice is visible above the form.
- Given the form saves config X for node n1, when Save is activated, then onSave receives n1 and X.
- Given no dry-run runner, when a compute node is edited, then no dry-run action is visible.
- Given the dialog closes, when focus settles, then it is on the edited node.
