# FlagSetPicker

Wave 2 · form · Status: specified

## Purpose
Edit a set of named on/off options, optionally by first choosing a preset that fills them all at once.

## Anatomy
- Preset row (optional): one card per preset with a name and a short description.
- Option list: one labelled checkbox per option, each with an optional description.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| values | Record<string, boolean> | required | Current state of each option. |
| onChange | (values: Record<string, boolean>) => void | required | Receives the full map after any change. |
| labels | Record<string, string> | required | Visible label per option key; also defines order and which keys exist. |
| descriptions | Record<string, string> | none | Help text per option. |
| presets | { id: string; label: string; description?: string; values: Record<string, boolean> }[] | [] | Named bundles. |
| presetId | string or null | none | The active preset. |
| onPresetChange | (id: string or null) => void | none | Reports the active preset; `null` when the person edits an option by hand. |
| label | string | required | Name of the whole set. |

## Behaviour
- Choosing a preset replaces all values with the preset's values and reports its id.
- Changing any single option merges that change into the map and reports `null` as the preset, because the set no longer matches a preset.

## States
Preset rest, hover, focus-visible, selected (accent-soft, accent border, check). Option checkbox states per the Checkbox spec.

## Keyboard and ARIA
- Presets: APG Radio Group via RAC `RadioGroup` (a preset is one choice among several; none may be selected after manual edits).
- Options: APG Checkbox via RAC `CheckboxGroup`/`Checkbox`, labels and descriptions wired through the field description slot.
- The whole component is a group named by `label`.

## Responsive, touch, motion, forced colours
- Presets in a row that wraps; one column below 640. Every target at least 44 × 44.
- No motion besides colour.
- Forced colours: selected preset has a system-highlight border.

## Acceptance tests
- Given labels {a, b} and no presets, When rendered, Then two checkboxes appear and no preset group.
- Given option a is toggled on, Then onChange receives the previous map with a set to true, and onPresetChange receives null.
- Given a preset "Strict" with {a: true, b: true}, When chosen, Then onChange receives exactly that map and onPresetChange receives "Strict".
- Given a preset is active, When an option is edited, Then the preset is reported as null.
- Given descriptions, When a checkbox is inspected, Then its description is its accessible description.
