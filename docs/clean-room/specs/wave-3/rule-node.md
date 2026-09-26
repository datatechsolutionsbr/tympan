# RuleNode

Wave 3 · canvas · Status: specified

## Purpose
A node representing a business rule applied in the flow, either a stored rule (with an adjustment and an on/off state) or an inline rule-engine step.

## Anatomy
- GraphNodeCard with a rule icon.
- **Stored rule mode**: rule name, adjustment summary (signed percentage, signed fixed amount, or "formula"), priority, categories, enabled switch.
- **Engine mode**: label (or the localised "rule engine" name), count of context variables, name of the output variable.
- **Remove action**.
- **Ports**: one input, one output. A rule is never the source of a connection to another step (connection rule in FlowEditor); its output feeds only rule attachment.
- **Missing state**: problem card when neither a stored rule nor an engine configuration exists.
- NodeRunIndicator.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| id | string | required | node id |
| rule | StoredRule or null | none | stored rule mode |
| config | RuleEngineConfig or null | none | engine mode |
| label | string | localised | title fallback |
| density | 'detailed' or 'compact' | 'detailed' | compact hides meta row |
| onOpen | (rule or id) => void | none | opens the rule editor |
| onToggleEnabled | (rule) => void | none | shows the enabled switch |
| onRemove | (id) => void | none | shows the remove action |

Adjustment display: positive values carry a plus sign, negative values their minus sign, zero no sign; percentage values end with a percent sign.

## States
Default, hover, selected, focus-visible, compact, enabled or disabled rule (disabled shows the word "off" beside the switch), missing, locked.

## Keyboard and ARIA
Card is a RAC Button (APG Button). The enabled switch is a RAC Switch (APG Switch) named "rule name enabled", placed as a sibling of the card button so toggling never opens the editor. Remove is a separate RAC Button.

## Responsive, touch, motion, forced colours
Switch and remove have 44 px hit areas. Reduced motion: switch thumb moves without animation. Forced colours: switch state visible by position and system colours.

## Acceptance tests
- Given a stored rule with a +10 percent adjustment, when rendered, then "+10%" is shown.
- Given a fixed adjustment of −5, when rendered, then "−5" is shown without a plus sign.
- Given the switch is toggled, when activated, then onToggleEnabled fires and onOpen does not.
- Given engine mode with two context variables and output "score", when rendered detailed, then "2 variables" and the output name are shown; compact hides them.
- Given neither rule nor config, when rendered, then the problem card appears.
