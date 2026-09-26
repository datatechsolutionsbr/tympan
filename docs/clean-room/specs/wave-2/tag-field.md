# TagField

Wave 2 · form · Status: specified

## Purpose
A field where the person types short values that become removable pills (tags, allowed values, header names, ids), optionally restricted to or assisted by a suggestion list.

## Anatomy
- Label above the field.
- Field box containing the list of committed pills (each with text and a remove control) followed by the text entry.
- Suggestion popup (only when suggestions exist): list of matching options.
- Helper text below the field; error text below that.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| value | string[] | required | Committed values (controlled). |
| onChange | (next: string[]) => void | required | Fired after an add or a removal. |
| label | string | none | Visible label; if absent, `ariaLabel` is required. |
| ariaLabel | string | none | Accessible name without a visible label. |
| placeholder | string | none | Hint in the entry. |
| suggestions | string[] | none | Known values; turns the entry into a combobox. |
| suggestionLabels | Record<string, string> | none | Display text per value, used in the popup and on pills. |
| allowFreeText | boolean | true | When false, only values present in `suggestions` are accepted. |
| validate | (raw: string) => string or null | none | Normalises an entry, or rejects it with null. Runs after trimming. |
| max | number | none | Maximum pills; entry becomes disabled at the limit. |
| disabled | boolean | false | Disables entry and every remove control. |
| tone | neutral, accent or categorical token | neutral | Pill tint. |
| helperText | string | none | Linked as description of the entry. |
| errorText | string | none | Marks the field invalid and is linked as description. |
| removeLabel | (display: string) => string | host i18n "Remove {value}" | Name of each remove control. |

## Behaviour
- Enter or comma commits the draft (or the highlighted suggestion). Empty drafts are ignored.
- Values are trimmed, passed through `validate`, and rejected if they duplicate an existing value ignoring case, exceed `max`, or (with `allowFreeText` false) are not in `suggestions`.
- Backspace in an empty entry removes the last pill. Removing a pill returns focus to the entry.
- Suggestions exclude values already chosen and match the draft against value and display text.

## States
Empty, with pills, focus-visible (on entry and on each remove control), popup open, option highlighted, at max, disabled, invalid.

## Keyboard and ARIA
- Without suggestions: a RAC `TextField` plus a RAC `TagGroup` for the pills (APG pattern: none dedicated; list of buttons).
- With suggestions: APG Combobox with list autocomplete. Backed by RAC `ComboBox` (with `allowsCustomValue` mirroring `allowFreeText`) and `TagGroup`. ArrowDown and ArrowUp move the highlight with wrap-around; Enter commits the highlighted option; Escape closes the popup without committing; focus stays in the entry (active descendant).
- The popup closes when focus leaves the field, without losing a pointer choice made on an option.

## Responsive, touch, motion, forced colours
- Remove controls have 44 × 44 hit areas; the entry keeps a usable minimum width and wraps to a new line when pills fill a row.
- Popup opens with `--fk-dur-quick` opacity only; instant with reduced motion.
- Reduced transparency: popup opaque (§2.5 level 3).
- Forced colours: pills outlined; highlighted option uses system highlight.

## Acceptance tests
- Given value [], When "alpha" is typed and Enter pressed, Then onChange receives ["alpha"].
- Given value ["Alpha"], When " alpha " is committed, Then onChange is not called.
- Given validate returns null for "bad", When "bad" is committed, Then onChange is not called.
- Given max 2 and two values, When rendered, Then the entry is disabled; When one is removed, Then it is enabled again.
- Given suggestions and allowFreeText false, When "zzz" is committed, Then it is rejected.
- Given suggestions, When ArrowUp is pressed with no highlight, Then the last option is highlighted.
- Given the popup is open, When Escape is pressed, Then it closes and value is unchanged.
- Given helperText, When the entry is inspected, Then its description includes the helper text.
