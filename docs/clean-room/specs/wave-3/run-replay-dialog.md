# RunReplayDialog

Wave 3 · overlay · Status: specified

## Purpose
A modal that re-executes a past run, pre-filled with that run's inputs, and sends only the inputs the person changed.

## Anatomy
- SectionedModal with title and an explanation that untouched inputs keep their original value.
- One row per original input: key (monospace), type tag (text, number, true/false, structured), a Reset control shown only after the row was edited, and an editor matching the type: text field, number field, two-option SegmentedControl for true/false, multi-line text area for structured values (pretty-printed).
- Empty message when the run had no inputs (replay runs as is).
- Error notice (InlineNotice, error tone).
- Footer: short run and flow identifiers (monospace), Cancel, Replay (primary, busy state).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| open | boolean | required | Visibility; rows re-seed on every open. |
| onClose | () => void | required | Dismiss. |
| runId | string | required | Shown shortened. |
| flowId | string | required | Shown shortened. |
| originalInputs | Record<string, unknown> | required | Source of rows; value type decides the editor. |
| onReplay | (overrides: Record<string, unknown>) => Promise<void> | required | Receives only touched keys, converted back to their original type; empty object means verbatim replay. |
| labels | object of strings | required | All visible strings, including type names and Reset. |

## Behaviour rules
- Null or missing originals are treated as text.
- On submit, numbers must be finite, structured values must parse (blank parses to null); any failure blocks submission and shows one error naming the key.
- Reset restores the original value and marks the row untouched.
- A rejection from onReplay shows its message in the error notice and keeps the dialog open; success closes it.

## States
- untouched, touched, invalid on submit, submitting, empty.

## Keyboard and ARIA
- APG patterns: Dialog (Modal); Radio Group for the true/false SegmentedControl. RAC: Modal, Dialog, TextField, NumberField, ToggleButtonGroup or RadioGroup.
- The whole body is a form; Enter in a single-line field submits.
- Each editor is labelled by its key; the type tag is part of its description.
- The error notice receives focus (or is announced assertively) when submission fails.

## Responsive, touch, motion, forced colours
- Full-screen on phones; rows stack label above editor.
- 44 px targets. Standard modal motion; none under reduced motion.
- Forced colours: touched rows marked by the visible Reset control, not colour.

## Acceptance tests
- Given original inputs { amount: 10, name: "a" }, when only amount is changed to 12, then onReplay receives { amount: 12 }.
- Given no row is edited, when Replay is activated, then onReplay receives an empty object.
- Given a structured row edited to invalid text, when Replay is activated, then onReplay is not called and an error names that key.
- Given a boolean row, when the dialog renders, then a two-option control shows the original value selected.
- Given an edited row, when Reset is activated, then the original value returns and Reset disappears.
- Given onReplay rejects with "conflict", when submission ends, then "conflict" is shown and the dialog stays open.
