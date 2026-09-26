# SchemaConfigForm

Wave 3 · form · Status: specified

## Purpose
Render a node's configuration form entirely from the field schema served by the node kind catalog, so most node kinds need no hand-written form; also defines the shared form footer used by every node form.

## Anatomy
- Field list: one control per schema property, in schema order.
- Field label: derived from the property key by splitting words and capitalising (for example "output variable"), with a required marker when listed as required.
- Hint: the property's description, shown under the label.
- Empty message: shown when the schema has no properties.
- Footer: a divider, then cancel (secondary) and save (primary) aligned to the end; save may be disabled by the parent.

Control chosen per property:
| schema shape | control |
|---|---|
| has an enumeration | NativeSelect with a leading "none" option |
| number | numeric TextField; empty means "unset" |
| boolean | Switch (yes/no) |
| array or object | TextArea in monospace for structured text (JSON); keeps the last valid value while the text is invalid |
| string, known long-text key (prompt, template, body, instructions, input, code) | TextArea |
| any other string or reference | TextField |

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| value | `Record<string, unknown>` | required | Current node configuration. |
| schema | `{ properties?: Record<string, FieldSchema>; required?: string[] }` | required | Field schema from NodeKindCatalog. |
| onSave | `(value: Record<string, unknown>) => void` | required | Emits original value merged with edited values; keys not in the schema (including the kind discriminator) are preserved. |
| onCancel | `() => void` | required | Discards edits. |
| saveDisabled | `boolean` | false | Footer save state (used by other forms). |
| labels | `{ save; cancel; none; yes; no; empty }` | from i18n adapter | Strings. |

## States
- Per structured field: valid, invalid text (inline error under the field naming the parse problem; the old value is kept), empty (value removed).
- Required field empty: marker plus error after blur; save stays enabled unless the host sets `saveDisabled` (the engine is the authority).

## Keyboard and ARIA
- Each control follows its wave-1 spec (RAC `TextField`, `Select`, `Switch`). Labels are real labels; hints and errors are linked with `aria-describedby`.
- Required fields expose `aria-required`; the visual marker is hidden from assistive tech to avoid double reading.
- Footer: Enter in a single-line field does not submit; save is an explicit button. Escape is handled by the enclosing dialog.

## Responsive, touch, motion, forced colours
- One column; labels above fields (design direction §2.10); 44 px targets.
- Structured-text areas scroll horizontally inside themselves, never the page.
- No motion.

## Acceptance tests
- Given a schema with an enum property, then a select with a "none" option plus each enum value is rendered.
- Given a number property cleared by the user, when saved, then that key is absent from the emitted value.
- Given an object property, when the user types invalid structured text, then an inline error appears and the previously valid value is still emitted on save.
- Given a value with a kind discriminator not in the schema, when saved, then the discriminator is unchanged.
- Given an empty schema, then only the empty message and the footer are shown.
- Given the key "systemPrompt", then a multi-line area is rendered.
- Given `saveDisabled`, then the save button is disabled and cancel still works.
