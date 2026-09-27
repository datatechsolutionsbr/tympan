# HoverCard

Wave 5 · overlays · Status: specified

Behaviour reference: shadcn/ui (MIT), read by the spec writer only.

## Purpose
A rich, read-only preview that appears when a pointer rests on (or keyboard focus reaches) a link or name: a person's profile summary, a record's key facts, a link's destination. It is a convenience for sighted pointer users; the same information must be reachable by following the link.

## Anatomy
- **Trigger**: a Link or a focusable name element.
- **Card**: floating surface with any read-only content (avatar, title, lines of text, small stats).
- **Arrow** (optional).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| trigger | Link or focusable node | required | The element being previewed. |
| children | node | required | Card content; must not be required to complete a task. |
| placement | 'top' \| 'bottom' \| 'start' \| 'end' | 'bottom' | Preferred side; flips. |
| openDelay / closeDelay | 'default' \| 'short' | 'default' | Named delays mapped to the motion tokens, not numbers. |
| open / defaultOpen / onOpenChange | controlled pair | uncontrolled | Rare. |
| showArrow | boolean | false | Arrow. |
| disabled | boolean | false | Never opens. |

## States
Closed, pending open (pointer resting), open, pending close (pointer left, grace period), closed.

## Keyboard and ARIA
- RAC `Popover` opened by a hover and focus preview trigger (non-modal); there is no single APG pattern; it follows the non-modal dialog guidance without moving focus.
- Opens on pointer rest and on keyboard focus of the trigger (after the open delay). Focus never moves into the card on open.
- Escape closes it and keeps focus on the trigger.
- The card has `role="dialog"` with `aria-modal` false only when it contains interactive elements; otherwise it is a described region linked to the trigger by `aria-describedby` so a screen reader user hears a short summary. Interactive content inside is discouraged; if present, Tab from the trigger moves into the card and Tab past its end closes it.
- The trigger keeps its own role (link) and action; pressing it follows the link.

## Responsive, touch, motion, forced colours
- Touch: the card never opens on tap (tap follows the link). Hosts that need touch access offer a separate details action.
- The card stays open while the pointer travels from the trigger to the card (a safe triangle or grace period) and while the pointer is on the card (WCAG 1.4.13).
- Surface `--ty-surface-raised-solid`, shadow `--ty-shadow-floating`, radius `--ty-radius-card`, stacking `--ty-z-popover`; glass variant uses `--ty-glass-blur-floating` and becomes opaque under reduced transparency.
- Opacity-only entrance with `--ty-dur-quick`, zero under reduced motion.
- Forced colours: card border in `CanvasText`.

## Acceptance tests
- Given a link with a hover card, when the pointer rests on it, then after the open delay the card appears and focus stays where it was.
- Given the card open, when the pointer moves from the link onto the card, then it stays open.
- Given the card open, when the pointer leaves both, then it closes after the close delay.
- Given keyboard focus reaches the link, then the card opens and the link's description includes the card summary.
- Given the card open, when Escape is pressed, then it closes and focus is on the link.
- Given a touch tap on the link, then navigation happens and no card opens.
- Given `disabled`, then it never opens.
