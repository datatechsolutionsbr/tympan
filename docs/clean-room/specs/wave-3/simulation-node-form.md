# SimulationNodeForm

Wave 3 · form · Status: specified

## Purpose
Configure a repeated-sampling simulation step: how many runs, how many steps per run, the starting state, the step transition, and which values to track.

## Anatomy
Four expression fields, each an "expression field editor" (label, hint, visual / structured-text switch, ExpressionBuilder or monospace TextArea, inline error or "valid" notice):
1. Number of runs.
2. Steps per run.
3. Initial state.
4. Step transition (can reference the current state, the run index and the step index in addition to flow inputs and ancestors).
- Tracking field: structured-text list of values to record per step, with inline error when it is not a list.
- Footer: cancel and save.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| value | `SimulationNodeConfig` | required | `{ runs, steps, initialState, step, tracking }`, each expression field an expression node or a bare literal. |
| references | `string[]` | `[]` | Ancestor node ids. |
| defaults | `{ runs; steps; initialState; step }` | from NodeKindCatalog | Seed values when a field is missing. |
| onSave / onCancel | callbacks | required | Save emits kind plus the four expressions and tracking list; other keys preserved. |
| labels | `SimulationNodeFormLabels` | from i18n adapter | Strings. |

Seeding rule: a field that is already an operation tree is used as is; any other value (a literal, a reference, missing) is wrapped as the single candidate of a "first non-empty value" operation so the visual builder always has a root operation. The emitted value is semantically identical.

## States
- Per field: visual or text; valid, invalid text (keeps last valid), empty.
- Tracking invalid: error shown; save emits the last valid list.

## Keyboard and ARIA
- Each field is a `group` labelled by its label; the mode switch follows APG Radio Group (RAC `RadioGroup`).
- Errors linked with `aria-describedby` and announced politely.
- ExpressionBuilder rules apply inside each field.

## Responsive, touch, motion, forced colours
- One column; 44 px targets; no motion.

## Acceptance tests
- Given a config where runs is a bare number, when opened, then the visual builder shows a first-non-empty operation whose only candidate is that number.
- Given the step field, then state, run index and step index appear as reference chips.
- Given tracking text that is an object, then an error is shown.
- Given valid edits, when saved, then `onSave` receives kind "simulation" with all four expressions and the tracking list, and unrelated keys are preserved.
- Given text mode with unparseable content, then the last valid expression is what save emits.
