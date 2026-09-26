# StartNodeForm

Wave 3 · form · Status: specified

## Purpose
The configuration form for a flow's start node: the list of input variable names a run needs, and an optional default value for each.

## Anatomy
- VariableListEditor (numbered, editable, success tone) labelled "Input variables", with an add action.
- "Default values" group, shown when at least one variable exists: one text field per variable, labelled with the variable name (monospace), placeholder "Default value".
- Form footer (Cancel, Save), shared with the other node forms.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| config | { inputVariables?: string[]; inputDefaults?: Record<string, string> } | required | Current configuration. |
| onSave | (config: StartConfig) => void | required | Receives the full config with kind start. |
| onCancel | () => void | required | Discard edits. |
| labels | object of strings | required | Group labels, placeholders, add, cancel, save. |

## Behaviour rules
- Edits are local until Save.
- On save, defaults are pruned: only variables still present and with a non-empty default are kept (renamed or removed variables lose their defaults).
- The emitted config keeps any unknown keys already present in the incoming config.
- Duplicate or blank variable names are flagged by VariableListEditor; Save stays enabled but blank names are dropped (new rule; the fork did not guard).

## States
- no variables (defaults group hidden); with variables; editing.

## Keyboard and ARIA
- Defaults are a `group` labelled "Default values"; each field's label is the variable name.
- APG patterns: none beyond form fields; RAC TextField and Button.
- After adding a variable, focus goes to its name field (VariableListEditor rule).

## Responsive, touch, motion, forced colours
- Default fields in two columns from the medium breakpoint, one column below.
- 44 px targets; no motion; forced colours use system borders.

## Acceptance tests
- Given variables amount and term with default amount = 10, when Save is activated, then onSave receives both variables and defaults { amount: "10" }.
- Given a variable with a default is removed, when saved, then its default is gone.
- Given a default cleared to empty, when saved, then that key is absent from defaults.
- Given no variables, when rendered, then the defaults group is not shown.
- Given Cancel is activated after edits, then onCancel is called and onSave is not.
