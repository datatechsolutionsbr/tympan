# RuleNodeForm

Wave 3 · form · Status: specified

## Purpose
Configure a rule step on the flow canvas by pointing it at one saved rule and choosing whether the step is active, without authoring the rule inline.

## Anatomy
- Rule picker: a single-choice list of the saved rules available to the project.
- Loading line: a short status message shown while the rule list is fetched.
- Load-error notice: an inline notice (tone "danger") when the list cannot be fetched.
- Legacy notice: an inline notice (tone "caution") when the step still carries an old inline condition and no saved-rule reference.
- Rule summary: a read-only block naming the chosen rule and a one-line summary of its condition (top combinator and number of clauses).
- Manage-rules action: a secondary action that leads to the rule authoring screen; its label reads "new rule" when the list is empty and "manage rules" otherwise.
- Step activity switch: turns this step on or off for runs, independent of the saved rule's own activity.
- Form footer: cancel and save actions (see SchemaConfigForm, "footer").

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| value | `{ ruleId?: string; enabled?: boolean }` | required | Current step configuration. |
| rules | `SavedRuleSummary[] \| undefined` | undefined | Pre-fetched list (`{ id, name, condition? }`). When given, no fetch happens. |
| loadRules | `() => Promise<SavedRuleSummary[]>` | undefined | Host fetch used only when `rules` is absent. |
| onManageRules | `() => void` | required | Host navigation to the rule authoring screen. The form never navigates by itself. |
| onSave | `(value: { kind: 'rule'; ruleId?: string; enabled: boolean }) => void` | required | Emits only the reference and the activity flag; any legacy inline keys are dropped. |
| onCancel | `() => void` | required | Discards edits. |
| labels | `RuleNodeFormLabels` | from i18n adapter | All visible strings. |

## States
- Loading: picker replaced by the loading line; save stays enabled only if a reference already exists.
- Loaded empty: picker shows only the placeholder option; manage action reads "new rule".
- Load failed: danger notice with the host message; the picker remains usable with any already-known id.
- Rule chosen: summary block visible.
- Legacy: caution notice until a saved rule is picked; saving migrates the step to the reference form.
- Unmount during fetch: a late response must be ignored.

## Keyboard and ARIA
- Picker follows the APG Listbox (collapsible, "select-only combobox") pattern; back with RAC `Select`.
- Activity switch follows APG Switch; back with RAC `Switch` (not a two-option select as in the source).
- Notices use `role="status"` (caution) or `role="alert"` (danger) per InlineNotice.
- Loading line is inside a region with `aria-busy="true"` and a polite live status.
- Tab order: picker, manage action, activity switch, cancel, save.

## Responsive, touch, motion, forced colours
- Single column at all widths; every control has a 44 px target.
- No motion beyond the Spinner's reduced-motion rules.
- Summary block must keep a visible boundary in forced colours.

## Acceptance tests
- Given `rules` is provided, when the form mounts, then `loadRules` is not called.
- Given only `loadRules`, when it resolves with two rules, then both appear as options labelled "name (id)".
- Given `loadRules` rejects, when the form renders, then a danger notice shows the error text.
- Given a step with an inline condition and no id, when rendered, then the legacy notice is shown; when a rule is picked and saved, then `onSave` receives only `kind`, `ruleId`, `enabled`.
- Given the list is empty, when rendered, then the manage action label is the "new rule" string; when activated, then `onManageRules` is called once.
- Given the activity switch is off, when saved, then `enabled` is false.
- Given the form is unmounted before `loadRules` resolves, then no state update or warning occurs.

## Open questions
- The source navigates with a hard-coded path; the clean version requires `onManageRules`.
