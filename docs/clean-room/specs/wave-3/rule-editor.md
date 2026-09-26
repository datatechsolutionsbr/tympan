# RuleEditor

Wave 3 · form · Status: specified

## Purpose
Author a saved rule end to end: identity, priority and activity, a yes/no condition, one action, and optional schedule, lifecycle and tags. Three parts are exported: the full form, the condition builder and the action builder, plus a loader that converts old condition shapes.

## Anatomy
- Basics grid: name (required), priority (non-negative integer), active switch, description.
- Condition section: heading with a Tag naming the root operation (or "reference", "value"); condition builder.
- Condition builder: SegmentedControl "visual" / "structured text"; visual = ExpressionBuilder in predicate mode; text = monospace TextArea with inline error (unparseable, or not an object).
- Action section: heading with a Tag naming the action kind; action builder.
- Action builder: action kind picker; parameter fields specific to the kind; a "custom" kind that shows free key/value rows (add, edit, remove), where values are read as boolean or number when they look like one, else text.
- Advanced disclosure: valid from, valid until (local date-time, stored as UTC instants), lifecycle status picker, tags (TagField). Opens by default when any of these already has a value.

## Vocabulary (concepts)
- Condition: a predicate expression tree (see ExpressionBuilder, predicate mode). Default: an equality comparison between a flow input reference and an empty literal.
- Legacy loader `normalizeRuleCondition(value)`: pass-through when the value already has an operation; non-object becomes a literal "never matches"; old simple comparisons, thresholds, pattern matches, time windows and and/or/not groups are rewritten into the equivalent predicate tree; the old "truthy" test becomes "not null, not false, not empty text" to keep old semantics. Must stay identical to the engine's normalizer; covered by shared fixtures.
- Action kinds and their parameters come from a host-supplied action catalog; the component ships only the "custom" kind.
- Lifecycle statuses come from a catalog; fallback: draft, active, paused, archived.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| value | `RuleValue` | `defaultRule()` | `{ id?, name, description?, enabled, priority, status?, validFrom?, validUntil?, tags?, condition, action: { kind, params? }, recurrence? }` |
| onChange | `(next: RuleValue) => void` | required | Every edit. |
| actionCatalog | `ActionKind[]` | `[]` | `{ kind, label, params: { key, label, type: 'number'\|'text', default?, step? }[] }`. |
| statuses | `string[]` | fallback list | Lifecycle options. |
| references | `string[]` | flow input placeholder | Offered to the condition builder. |
| labels | `RuleEditorLabels` | from i18n adapter | All strings (the fork hard-codes English; not acceptable). |

Changing the action kind resets its parameters to that kind's defaults.

## States
- Condition text invalid: error, last valid condition kept.
- Advanced open or closed. Invalid date text: field error, value becomes null.

## Keyboard and ARIA
- Fields per wave-1 specs (RAC `TextField`, `NumberField` for priority, `Switch`, `Select`, `DatePicker` with time for validity).
- Advanced section: APG Disclosure (RAC `Disclosure`).
- Custom parameter rows: each row a fieldset "Parameter ‹n›"; remove has an accessible name with the key.
- Section headings are real headings (h3) so the form is navigable by heading.

## Responsive, touch, motion, forced colours
- Basics in two columns from the medium breakpoint, one below. 44 px targets. No motion.

## Acceptance tests
- Given `defaultRule()`, then name is empty, enabled true, priority 0, status active, the condition is an equality comparison and the action kind is the first catalog kind (or custom).
- Given a legacy condition "field x equals 3", when loaded, then the visual builder shows a comparison with a reference to x and literal 3.
- Given a legacy truthy test, then the normalized tree is an "and" of three inequality comparisons.
- Given a non-object condition, then the normalized value never matches.
- Given the custom kind, when a row with key "limit" and value "5" is added, then params contain the number 5.
- Given valid-from typed as a local date-time, then the stored value is the matching UTC instant.
- Given tags exist, when the form opens, then the advanced section is expanded.

## Open questions
- The fork ships a fixed list of commerce-specific action kinds; the clean version moves all non-custom kinds to `actionCatalog`. Fakhir must decide which actions its rules need.
