# ComputeNodeForm

Wave 3 · form · Status: specified

## Purpose
Configure a compute step whose logic is one expression tree, edited visually or as structured text, and optionally test it against sample data before saving.

## Anatomy
- Editor mode switch: SegmentedControl "visual" / "structured text".
- Visual editor: ExpressionBuilder in expression mode, with references = flow inputs placeholder plus ancestor node ids.
- Text editor: monospace TextArea with label, hint, inline error or a success notice ("valid").
- Reference panel (text mode only), a second SegmentedControl with three views:
  - Operations: search field and operations grouped by family (same families as ExpressionBuilder, count per family); activating one inserts that operation's starter at the caret, or replaces a blank document.
  - References: chips for flow inputs and ancestors; activating one inserts a reference at the caret.
  - Examples: a short list of named example expressions (authored for Fakhir, not copied); activating one inserts it.
- Test panel (only when a dry-run callback is supplied): toggle to show or hide; two structured-text areas (sample flow inputs, sample upstream outputs); run action; result shown as TraceTree; danger notice on failure; caution notice when the expression is not valid.
- Footer: cancel and save (save disabled while invalid).

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| value | `ComputeNodeConfig` | required | Kind discriminator plus the expression's root. Obsolete script keys are dropped on load. |
| references | `string[]` | `[]` | Ancestor node ids. |
| onDryRun | `(req: { config; inputs?; nodeOutputs? }) => Promise<{ result; trace: TraceResult }>` | undefined | Enables the test panel. See TraceTree for the client helper. |
| onSave / onCancel | callbacks | required | Save emits kind plus expression. |
| labels | `ComputeNodeFormLabels` | from i18n adapter | Strings, family names, example names. |

Validation: text must parse to an object with a non-empty operation; once the catalog is loaded the operation must belong to it. Errors: empty (no message), unparseable (message with parser detail), missing operation, unknown operation.

## States
- Visual and text views edit the same model; switching keeps content. Invalid text keeps the last valid model.
- Test: idle, running (run action disabled and labelled "running"), success (trace shown, survives a mode switch), error.
- Blank document without an operation seeds a pass-through operation.

## Keyboard and ARIA
- Mode switches: APG Radio Group / RAC `RadioGroup` (or RAC `Tabs` when views are panels).
- Insertion keeps focus in the text area with the caret after the inserted fragment.
- Validation message is linked to the text area and announced politely; test results region has `aria-live="polite"` and `aria-busy` while running.

## Responsive, touch, motion, forced colours
- Reference panel stacks under the editor below the large breakpoint.
- 44 px targets for all chips and buttons; monospace only in the editor and references.
- No motion; running state uses Spinner rules.

## Acceptance tests
- Given text mode with unparseable text, then save is disabled and the error names the parse problem.
- Given an operation outside the loaded catalog, then the unknown-operation error is shown.
- Given the caret in the middle of the text, when a reference chip is activated, then the reference is inserted at the caret and focus returns to the editor.
- Given no `onDryRun`, then no test panel exists.
- Given valid expression and sample inputs that do not parse, when run is pressed, then a danger notice appears and `onDryRun` is not called.
- Given `onDryRun` resolves, then a TraceTree is rendered; when the mode is switched, it remains.
- Given a legacy config with script keys, when loaded and saved, then those keys are absent.
