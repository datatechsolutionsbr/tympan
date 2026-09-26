# ExpressionBuilder

Wave 3 · form · Status: specified

## Purpose
Compose a computation or a yes/no condition as a tree of operations without writing code; used by ComputeNodeForm, SimulationNodeForm and RuleEditor.

## Anatomy
- Operation picker: two linked single-choice pickers, family then operation.
- Operand slots: one per operand the chosen operation takes, each labelled with the operand key in monospace.
- Operand kind switch (for expression slots): SegmentedControl with three options: nested operation, reference, literal.
- Nested builder: the same component, one level deeper, visually offset with a depth cue.
- Reference picker: quick-pick chips of available references plus a free-text path field.
- Literal field: a text field whose content is read as structured data when it parses, else as plain text.
- Parameter field: plain value or, for known sub-vocabularies (comparison kind, arithmetic kind, sort order), a select with friendly names.
- List slot: numbered items, each an operand with a remove action, and an "add item" action with an item count Tag.
- Raw slot: structured-text area for operands the builder cannot shape (maps, case tables), with inline parse error.
- Notices: "unknown operation" (caution) and "depth limit reached" (caution, replaces the subtree with a raw slot).

## Vocabulary (concepts)
- The set of operations is owned by NodeKindCatalog, never hard-coded; the builder only groups and describes it.
- Twelve families: aggregation, list shaping, set algebra, object shaping, arithmetic, text, logic, type conversion, date and time, pattern matching, utility, and a catch-all core family that also receives any catalog operation the grouping does not know.
- Operand slot kinds: single expression, ordered list of expressions, plain parameter, raw structured value.
- Some expression slots bind loop variables (current item, index, and for folds an accumulator); these names are added to the reference chips inside that subtree and explained by a hint line.
- Arithmetic operations appear flattened as first-class verbs (add, subtract, …) instead of a two-step pick; the emitted tree is the same.
- In predicate mode only boolean-yielding operations are offered (comparisons, combinators, negation, pattern test, emptiness and type tests, membership).
- A maximum nesting depth mirrors the engine's limit.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| value | `ExpressionNode \| undefined` | required | `{ operation, …operands }`, `{ ref }` or `{ value }`. |
| onChange | `(next: ExpressionNode) => void` | required | Full replacement on every edit. |
| references | `string[]` | `[]` | Upstream references offered as chips. |
| mode | `'expression' \| 'predicate'` | `'expression'` | Palette filter. |
| depth | `number` | 0 | Internal recursion depth. |
| labels | `ExpressionBuilderLabels` | from i18n adapter | Family names, verb names, hints. |

## States
- Empty (no operation): only the picker. Picking an operation reseeds the node with that operation's starter operands. Changing family selects that family's first operation.
- Catalog loading: picker hint "loading operations".
- Unknown operation: caution notice; operands still editable.
- Switching operand kind replaces the operand with a starter of that kind.

## Keyboard and ARIA
- Pickers: APG select-only combobox (RAC `Select`). Kind switch: APG Radio Group (RAC `RadioGroup` styled as SegmentedControl). Chips: toggle buttons with `aria-pressed` (RAC `ToggleButton`) inside a labelled group.
- Each nested level is a `group` labelled "‹operand key›, level ‹n›" so screen reader users hear depth.
- Removing a list item moves focus to the next item's kind switch or to "add item".

## Responsive, touch, motion, forced colours
- Depth cue is an indent plus a leading rail; indentation is capped on narrow screens and the level number is shown as text, so depth never relies on colour (§2.3 categorical use only).
- 44 px targets for chips, switches, remove and add.
- No motion.

## Acceptance tests
- Given no value, when an operation is picked, then `onChange` receives that operation with its starter operands.
- Given an operation from family A, when family B is picked, then B's first operation is emitted.
- Given an expression slot, when the kind switch is set to reference, then the operand becomes a reference to the first available reference.
- Given predicate mode, then only boolean-yielding operations are offered.
- Given a list slot with two items, when item 1 is removed, then the list has one item.
- Given a tree at the depth limit, then a caution notice and a raw slot are shown.
- Given an operation not in the catalog, then a caution notice is shown and operands remain editable.
- Given a fold operation's body slot, then accumulator, item and index appear as reference chips.
