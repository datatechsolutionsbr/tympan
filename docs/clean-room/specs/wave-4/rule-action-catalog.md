# RuleActionCatalog

Wave 4 · form · Status: specified · Resolves the open question of `wave-3/rule-editor.md`

## Purpose
Defines where the action kinds of a rule come from. Decision: **the host supplies the catalog; the library ships a default generic set** so RuleEditor is useful with no configuration. The generic set is domain-neutral (nothing tied to commerce or to any one product) and fits a research workflow: change a value, tag, ask a person to review, notify, route, stop, plus the free-form custom kind that already exists.

## Anatomy
- **ActionKind**: `{ kind; labelKey; descriptionKey?; icon?; params: ParamSpec[]; validate?: (params) => ParamError[] }`.
- **ParamSpec**: `{ key; labelKey; type; required?; default?; hintKey? }` with `type` one of:
  - `text`, `number` (with optional min, max, step), `boolean`;
  - `choice` with `options: { value; labelKey }[]` or `optionsFrom: 'branches' | 'roles' | 'statuses'` (filled from context supplied by the host);
  - `reference`: a flow variable reference picked with the same reference list RuleEditor passes to the condition builder;
  - `duration`: a whole number with a unit (minutes, hours, days).
- **Default generic set** (`defaultRuleActions`), in this order:
  1. **Set value**: `target` (reference, required), `value` (text, required; read as number or boolean when the target's declared type says so).
  2. **Add tag**: `tag` (text, required).
  3. **Request review**: `role` (choice from roles, required), `reason` (text, required), `dueIn` (duration, optional). Creates a human task (in Fakhir, the verification queue of design direction §3.9).
  4. **Notify**: `recipient` (choice from roles, required), `message` (text, required).
  5. **Route**: `branch` (choice from branches of the rule node, required).
  6. **Stop**: `outcome` (choice: completed or failed, required), `reason` (text, optional).
  7. **Custom**: free key and value rows (already specified in RuleEditor); always last.
- **Context**: RuleEditor receives `actionContext = { branches?; roles?; statuses? }` to fill `optionsFrom` choices; a choice with no options shows an inline notice and blocks saving.

## Properties and events
Additions to RuleEditor (wave 3):

| Name | Type | Default | Meaning |
|---|---|---|---|
| actionCatalog | ActionKind[] \| undefined | undefined → `defaultRuleActions` | When given, exactly these kinds are offered (the host can spread `defaultRuleActions` to extend it). |
| allowCustom | boolean | true | Whether the custom kind is appended. |
| actionContext | { branches?; roles?; statuses? } | {} | Option sources. |
| onValidate | (errors: ParamError[]) => void | none | Reports current parameter errors. |

Exports: `defaultRuleActions`, `defineRuleAction(kind)` (validates a host kind: unique key, known param types, label keys present in the I18nAdapter in development).

Behaviour: changing the kind resets parameters to that kind's defaults (unchanged from wave 3); a stored rule whose kind is not in the catalog is shown read-only with its raw parameters as key and value rows and a notice "this action is not available here", and the person can switch it to an available kind.

The catalog is a UI description only: the engine must implement every kind offered. A host that adds a kind is responsible for the engine side; the library does not execute actions.

## States
Kind selected; parameters valid; parameter errors (inline, per field, with `aria-describedby`); unknown stored kind (read-only notice); empty option source (notice, save blocked).

## Keyboard and ARIA
- Kind picker: RAC `Select` (APG Listbox in a popup) with the description as the option's description.
- Parameters: fields per wave-1 specs (TextField, NumberField, Switch, Select, reference picker as ListboxSelect with search, duration as NumberField plus unit Select grouped in a fieldset).
- Errors announced when the field loses focus, not on every keystroke.

## Responsive, touch, motion, forced colours
As RuleEditor: parameters in two columns from the medium breakpoint, one below; 44 px targets; no motion.

## Acceptance tests
- Given no actionCatalog, when the kind picker opens, then it lists the seven generic kinds in order, custom last.
- Given actionCatalog with one host kind and allowCustom false, then only that kind is offered.
- Given Request review and no roles in context, then a notice appears and saving is blocked.
- Given Set value with a numeric target and value "5", then the stored parameter is the number 5.
- Given a stored rule with an unknown kind, when opened, then its parameters are shown read-only with the notice.
- Given a host kind with a duplicate key, when defined, then `defineRuleAction` throws.
- Given switching from Notify to Route, then Notify's parameters are cleared and Route's defaults applied.
