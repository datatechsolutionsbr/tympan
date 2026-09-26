# PasswordStrength

Wave 2 · feedback · Status: specified

## Purpose
Show, under a new-password field, how strong the typed password is against a policy and, optionally, which requirements are still unmet.

## Anatomy
- Meter: four segments filled according to the level, with the level word beside it.
- Requirement checklist (optional): one line per rule with a met or unmet glyph and the rule text.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| password | string | required | The value being evaluated. |
| policy | { minLength?: number; uppercase?: boolean; lowercase?: boolean; digit?: boolean; symbol?: boolean } | minimum length 8 with upper, lower and digit; symbol not required | Rules to check. |
| showRequirements | boolean | false | Shows the checklist. |
| levelLabels | [string, string, string, string] | host i18n "Weak", "Fair", "Good", "Strong" | Level words. |
| ruleLabels | per-rule strings, length rule receives the count | host i18n | Checklist text. |

## Behaviour
- Empty password: nothing is rendered.
- Level 1 to 4 is derived mostly from the share of policy rules met, with a smaller bonus for length; only a password that meets every rule and is reasonably long reaches level 4.
- The meter is advisory; the form still validates the policy on submit.

## States
Hidden (empty), levels 1 to 4. Levels use the semantic colours of §2.3 (error for 1, pending for 2, success for 3 and 4) and always show the word.

## Keyboard and ARIA
- APG pattern: Meter. Backed by RAC `Meter` with value 1 to 4 and `valueLabel` set to the level word.
- The checklist is a list; each item's glyph is hidden and the text is prefixed with a hidden "met" or "not met".
- The component is referenced from the password field's `aria-describedby`; level changes are announced politely and debounced, not on every keystroke.
- Not focusable.

## Responsive, touch, motion, forced colours
- Full width of the field.
- Segment fill transition at `--fk-dur-quick`; instant with reduced motion.
- Forced colours: filled segments use CanvasText and empty ones an outline, so the level stays readable; the word is always present.

## Acceptance tests
- Given an empty password, Then nothing is rendered.
- Given "abc", Then the level word is "Weak".
- Given the default policy and a lowercase-only password of eight letters, Then the level is "Fair".
- Given a password meeting all default rules except uppercase, Then the level is "Good".
- Given a long password meeting all rules, Then the level is "Strong".
- Given showRequirements and minLength 12, Then the length rule text mentions 12.
- Given policy.symbol true and a password with "!", Then the symbol rule is marked met.
- Given any non-empty password, Then the meter has exactly four segments and exposes the level word as its value text.
