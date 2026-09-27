# Tooltip

Wave 5 · overlays · Status: specified

Behaviour reference: shadcn/ui (MIT), read by the spec writer only.

## Purpose
A short, non-interactive text hint that names or explains a control when the control is hovered or focused. Tympan already uses the behaviour internally; this spec makes it a public component.

## Anatomy
- **Trigger**: any focusable element (usually an icon-only Button). The tooltip never makes a non-focusable element focusable on its own; the host must pass a focusable trigger.
- **Bubble**: a small floating surface holding plain text (one or two short lines).
- **Arrow** (optional): points at the trigger.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| content | string or short text node | required | Hint text. No links, buttons or fields inside. |
| children | focusable element | required | The trigger. |
| placement | 'top' \| 'bottom' \| 'start' \| 'end' | 'top' | Preferred side; flips when there is no room. |
| showArrow | boolean | true | Shows the arrow. |
| delay | 'default' \| 'immediate' | 'default' | Default uses the RAC warm-up delay; immediate opens without it (for dense toolbars where the user is already scanning). |
| disabled | boolean | false | Never opens (used when a visible label already shows the same text, for example an expanded navigation rail). |
| open / defaultOpen / onOpenChange | controlled pair | uncontrolled | Rare; for tours and tests. |
| role | 'label' \| 'description' | 'description' | `label`: the tooltip is the trigger's accessible name (icon-only buttons with no other name). `description`: it adds a description to an already-named trigger. |

## States
Closed, opening (warm-up), open, closing (cool-down). When one tooltip in a group has just closed, the next hovered trigger opens without the warm-up delay (RAC shared warm-up).

## Keyboard and ARIA
- RAC `TooltipTrigger` + `Tooltip`; APG **Tooltip** pattern.
- Opens on keyboard focus (focus-visible) and on hover; never on touch press alone.
- Escape closes the open tooltip without moving focus and without closing an enclosing dialog or popover.
- The bubble has `role="tooltip"` and is referenced by the trigger with `aria-describedby` (role `description`) or supplies the name through `aria-labelledby` (role `label`).
- The bubble itself is never focusable and contains no interactive content.

## Responsive, touch, motion, forced colours
- Touch: a tooltip does not open on tap; long-press opens it only if the platform does so for native hints. Information needed on touch must also be reachable some other way (visible label, details popover).
- Stays inside the viewport; collides and flips.
- Surface uses `--ty-surface-raised-solid` and `--ty-ink`, radius `--ty-radius-control`, shadow `--ty-shadow-floating`, stacking `--ty-z-popover`.
- Entrance and exit use opacity only, with `--ty-dur-quick` and `--ty-ease`; under reduced motion the duration is zero.
- Stays readable while the pointer moves from the trigger onto the bubble (WCAG 1.4.13 hoverable and persistent) and until Escape, blur or pointer leave.
- Forced colours: bubble border in `CanvasText`, text in `CanvasText` on `Canvas`.

## Acceptance tests
- Given an icon-only button with a tooltip "Delete", when it receives keyboard focus, then after the warm-up the tooltip is shown and the button's description is "Delete".
- Given `role="label"`, when rendered, then the button's accessible name equals the tooltip text even while the tooltip is closed.
- Given an open tooltip, when Escape is pressed, then it closes and focus stays on the trigger.
- Given an open tooltip inside a dialog, when Escape is pressed once, then only the tooltip closes.
- Given two adjacent triggers, when the pointer moves from the first (open) to the second, then the second opens without the warm-up delay.
- Given the pointer moves from the trigger onto the bubble, then the tooltip stays open.
- Given `disabled`, when hovered or focused, then nothing opens.
- Given a touch tap on the trigger, then the trigger's action runs and no tooltip opens.
- Given reduced motion, when it opens, then no transform is animated.

## Open questions
- Should a disabled Button with a tooltip stay focusable so the hint is reachable? Recommended: yes, through Button's `focusableWhenDisabled`.
