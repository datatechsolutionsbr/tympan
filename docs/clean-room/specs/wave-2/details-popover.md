# DetailsPopover

Wave 2 · overlay · Status: specified

## Purpose
An information button that opens a small, non-modal card explaining one recorded change: who did it, when, what value changed from and to, and an optional note. Used in history lists and table cells.

## Anatomy
- **Trigger**: an icon-only information button.
- **Card**: floating surface (§2.5 level 3) with a pointer toward the trigger.
- **Header**: optional icon and a title (for example "Status changed").
- **Actor line**: ActorChip-style block (avatar or agent mark per §2.11, name, secondary line such as e-mail or model).
- **Timestamp line**: optional icon and the formatted time.
- **Comparison block**: label, then "from" label and value, a direction mark, "to" label and value.
- **Note block**: label and free text.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| triggerLabel | string | required | Accessible name of the trigger ("Details of the change"). |
| title | string | required | Card header. |
| headerIcon | ReactNode | none | Decorative. |
| tone | 'neutral' \| 'success' \| 'pending' \| 'error' | 'neutral' | Header treatment using semantic colours of §2.3 with icon and word. |
| actor | { kind: 'person' \| 'agent' \| 'system'; name: string; detail?: string; initials?: string } | none | Who acted. |
| timestamp | string \| Date | none | When (formatted through the I18nAdapter). |
| comparison | { label: string; fromLabel: string; fromValue: string; toLabel: string; toValue: string } | none | What changed. |
| note | { label: string; value: string } | none | Free text. |
| placement | 'top' \| 'bottom' \| 'start' \| 'end' | 'top' | Preferred side; flips when there is no room. |
| open / onOpenChange | boolean / (open: boolean) => void | uncontrolled | Optional control. |

## States
Closed, open, trigger hover and focus-visible, flipped placement.

## Keyboard and ARIA
- APG Dialog (non-modal) pattern, as used for disclosure popovers. RAC `DialogTrigger` + `Button` + `Popover` + `Dialog` (non-modal).
- The trigger has `aria-expanded` and `aria-haspopup="dialog"`. Opening moves focus into the card (to the card itself, labelled by the title). Escape or a click outside closes and returns focus to the trigger.
- The comparison is read as a sentence: "Status: from Pending to Proved" (the arrow is decorative and hidden).
- Actor and time are text, not only avatars or icons.

## Responsive, touch, motion, forced colours
- Trigger target at least 44 × 44 px even if the icon is smaller.
- Card width fits within the viewport minus the 16 px gutter; on screens under 640 it opens as a bottom Drawer instead.
- Fade and small offset in `--fk-dur-quick`; reduced motion: fade only.
- Reduced transparency: opaque card. Forced colours: card border and pointer in `CanvasText`.

## Acceptance tests
- Given a trigger labelled "Details of the change", when activated with Enter, then a dialog named by the title opens and focus is inside it.
- Given the card is open, when Escape is pressed, then it closes and focus returns to the trigger.
- Given a comparison from "Pending" to "Proved", then assistive technology reads both values with their labels in order.
- Given an actor of kind 'agent', then the agent mark and the word "agent" are shown, not round initials.
- Given only a title and a note, then no empty actor, time or comparison blocks are rendered.
