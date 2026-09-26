# RunInputDialog

Wave 3 · overlay · Status: specified

## Purpose
A modal that collects values for the flow's declared input variables before a run starts.

## Anatomy
- ModalDialog (wave 1) with title and one-line explanation.
- One field per declared input variable of the start node, in declaration order. Each field has a humanised label (identifier split on case changes, underscores and hyphens, first letter capitalised) and the raw identifier as the hint in monospace.
- Field kind per variable: currency field, whole-number field or plain text field (see Behaviour rules).
- Empty message when the flow declares no inputs.
- Footer: Cancel (quiet emphasis) and Run (primary; the one primary of the view).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| open | boolean | required | Dialog visibility. |
| onClose | () => void | required | Dismiss without running. |
| onRun | (inputs: Record<string, string or number or boolean or null>) => void | required | Called with one entry per declared variable, then the dialog closes. |
| classifyVariable | (name: string) => 'currency' or 'count' or 'text' | text for all | Host hook deciding the field kind from the name. |
| currencySymbol | string | from host locale | Symbol shown on currency fields. |
| labels | object of strings | required | Title, subtitle, empty, value placeholder, cancel, run. |

Reads the start node's declared inputs and saved defaults from FlowEditorState.

## Behaviour rules
- Each time the dialog opens, fields are pre-filled from the start node's saved defaults; nothing typed in a previous session survives a close.
- Declared inputs that arrive as objects with a name are reduced to the name; other non-string entries are stringified, so malformed definitions never crash the form.
- Variables with no value are sent as empty strings.
- Submitting resets the fields and closes the dialog.

## States
- empty (no declared inputs): message and an enabled Run.
- filled, editing; field-level invalid state from the field components (e.g. non-numeric text in a count field).

## Keyboard and ARIA
- APG pattern: Dialog (Modal). RAC primitive: Modal + Dialog, focus trapped, first field focused on open, focus returned to the invoking control on close.
- Enter in a single-line field submits; Escape cancels.
- Every field has a visible label above it and its identifier hint linked by `aria-describedby`.

## Responsive, touch, motion, forced colours
- Full-screen sheet on phones, centred modal otherwise (§2.8, level 4 elevation §2.5).
- Fields and buttons at least 44 px tall on touch.
- Open and close use the base duration; no scale or slide under reduced motion.
- Reduced transparency: opaque surface and backdrop. Forced colours: field borders use system colours.

## Acceptance tests
- Given a start node declaring "loanAmount" with default "1000", when the dialog opens, then a field labelled "Loan amount" with hint "loanAmount" shows 1000.
- Given the person edits a value and presses Cancel, when the dialog reopens, then the saved default is shown again.
- Given classifyVariable returns 'count' for "nSteps", when the dialog renders, then that field accepts whole numbers only.
- Given two declared inputs and one left blank, when Run is activated, then onRun receives both keys and the blank one is an empty string.
- Given the flow declares no inputs, when the dialog opens, then the empty message is shown and Run still works.

## Open questions
- The fork guessed currency and count fields from words in the variable name (language-specific). The spec moves that guess to the host through classifyVariable; the contract should eventually carry types for start inputs.
