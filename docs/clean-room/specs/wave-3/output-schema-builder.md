# OutputSchemaBuilder

Wave 3 · form · Status: specified

## Purpose
A visual editor for the structured-output schema of an agent node, restricted to the object-with-fields subset of JSON Schema the engine validates.

## Anatomy
- Empty state: a sentence explaining that without a schema the agent's text is returned raw, and an "Add output schema" button.
- Unsupported state: a sentence saying the top level must be an object, with a "Reset to object" action.
- Editor: heading "Top-level fields", "Remove schema" action, list of field rows, "Add field" button.
- Field row: name field, type select (text, number, integer, true/false, nested object, list of objects), Required checkbox, Remove action, optional description field; for nested types, an indented nested builder labelled "Nested fields" or "Item shape".
- Depth notice: at the nesting limit, nested types show a sentence that deeper levels must be edited as raw schema.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| value | Schema or undefined | undefined | Stored schema; undefined shows the empty state. |
| onChange | (next: Schema or undefined) => void | required | Emits the whole schema after each edit; undefined removes it. |
| depth | number | 0 | Current nesting level; the builder offers one nested level below the top. |
| labels | object of strings | required | All visible strings (the fork hard-coded English; the new one must not). |

## Behaviour rules
- Rows derive from the schema's properties in order; required comes from the schema's required list.
- Changing a type to nested object or list of objects creates an empty object sub-schema; changing to a primitive drops any sub-schema.
- Emitted schema: type object, properties from rows with a non-blank trimmed name (blank rows are kept in the editor but not emitted), description only when non-empty, required only when non-empty.
- A new schema is an object with no properties.
- Round trip: any schema within the subset renders and re-emits unchanged.

## States
- empty, unsupported top level, editing, at depth limit; field invalid when two rows share a name (new rule: show an error on the duplicate name).

## Keyboard and ARIA
- Each row is a `group` labelled by its field name (or "New field"). Controls use RAC TextField, Select, Checkbox, Button (APG: Listbox for select, Checkbox).
- Remove actions are labelled with the field name ("Remove field amount").
- Adding a field moves focus to its name; removing moves focus to the next row's name or to Add field.
- Nested builders are regions labelled "Nested fields of X".

## Responsive, touch, motion, forced colours
- Row controls wrap into a stacked layout on narrow widths.
- 44 px targets. No motion. Forced colours: nesting shown by indentation and a system-colour rule, not tint.

## Acceptance tests
- Given no value, when Add output schema is activated, then onChange receives an empty object schema.
- Given a field "price" of type number marked required, when emitted, then properties has price as number and required lists price.
- Given a row with a blank name, when emitted, then it is absent from properties.
- Given a field changed to list of objects, when emitted, then it has type array with an object item schema.
- Given depth at the limit, when a nested type is chosen, then the depth notice replaces the nested builder.
- Given Remove schema is activated, then onChange receives undefined.
- Given a schema whose top-level type is array, when rendered, then the unsupported state is shown.
