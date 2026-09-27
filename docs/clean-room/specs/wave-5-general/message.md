# Message

Wave 5 · conversation · Status: specified

Behaviour reference: shadcn/ui (MIT), read by the spec writer only.

## Purpose
Lay out one message row in any conversation (people chat, support thread, assistant transcript): who sent it, which side it sits on, the content surface, and metadata or actions around it. Message owns the row; ChatBubble owns the content surface; MessageList owns scrolling. The assistant surface in the flow package can be rebuilt on these parts.

## Anatomy
- **Row**, aligned to the start (others, assistant) or the end (the current user).
- **Avatar slot** (optional), on the aligned side, anchored to the bottom of the content surface (not of the footer).
- **Content column**:
  - **Header** (optional): sender name, role tag, time. Always start-aligned within the column.
  - **Body**: one or more ChatBubbles, or unframed rich content (MarkdownView, tool activity, AssistantVisualBlock, Attachments).
  - **Footer** (optional): delivery status, time, and message actions (copy, retry, feedback, more). Aligned to the row's side.
- **MessageGroup**: consecutive messages from the same sender stacked tightly; only the last message shows the avatar, earlier ones keep an empty avatar slot so content lines up; only the first shows the header.

## Properties and events
Message:
| Name | Type | Default | Meaning |
|---|---|---|---|
| align | 'start' \| 'end' | 'start' | Side of the row. |
| sender | { name; kind: 'person' \| 'agent' \| 'system'; avatar? } | none | Fills the header and the avatar; also the accessible sender name. |
| showAvatar | boolean | true | Avatar slot visible (empty slot kept inside a group). |
| header / footer | node | none | Custom header or footer content. |
| timestamp | Date | none | Formatted by the host formatters; shown in the header or footer (`timestampPlacement`). |
| timestampPlacement | 'header' \| 'footer' | 'footer' | Where the time goes. |
| status | 'sending' \| 'sent' \| 'delivered' \| 'read' \| 'failed' | none | Delivery state in the footer (icon plus word). |
| actions | { id; label; icon; onPress }[] | none | Footer actions. |
| actionsVisibility | 'always' \| 'hover' | 'always' | `hover` reveals actions on pointer hover or focus within, but they are always visible on touch and to keyboard users once focus is inside. |
| children | node | required | Body. |

MessageGroup: `sender`, `align`, children Messages.

## States
Default, hover (actions revealed), focus-within, sending, failed (footer shows the failure and a retry action).

## Keyboard and ARIA
- Each message is an `article` (inside MessageList it is a row of the log) labelled by the sender name and time ("Ana, 10:42"); agent senders are labelled as agents.
- Actions are RAC `Button`s with names that include the target ("Copy message", "Retry sending"); icon-only actions carry a Tooltip.
- Tab reaches actions in order; hidden-on-hover actions become visible as soon as focus enters the message.
- A failed status is announced assertively once, by the MessageList live region, not by the Message itself.

## Responsive, touch, motion, forced colours
- End-aligned rows leave a start gutter so they never span the full width; on narrow screens the avatar slot may hide on end-aligned rows (host choice).
- Action hit areas at least `--ty-control-target`.
- Header text `--ty-ink-2` at meta size; footer text `--ty-ink-3`; failed state uses `--ty-danger` plus an icon and word.
- No entrance animation of its own (MessageList decides); reveal-on-hover actions fade with `--ty-dur-quick`, instant under reduced motion.
- Forced colours: status icons remain visible; actions keep `ButtonText` borders on focus.

## Acceptance tests
- Given `align="end"`, then the avatar and footer sit on the end side and the header stays start-aligned in the column.
- Given a MessageGroup of three messages, then only the first shows the header and only the last shows the avatar, with the others keeping the space.
- Given `status="failed"` and a retry action, then the footer shows the failure word and icon and a "Retry sending" button.
- Given `actionsVisibility="hover"`, when focus moves into the message by Tab, then the actions are visible.
- Given a touch device, then actions are visible without hover.
- Given a sender and timestamp, then the article is named "Ana, 10:42" (formatted by the host locale).
- Given right-to-left direction and `align="end"`, then the row sits on the left.
