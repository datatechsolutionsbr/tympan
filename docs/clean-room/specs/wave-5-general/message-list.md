# MessageList

Wave 5 · conversation · Status: specified

Behaviour reference: shadcn/ui (MIT), read by the spec writer only.

## Purpose
The scrolling transcript of a conversation. It decides when the view moves and when it stays still: it anchors each new turn near the top with a glimpse of the previous one, follows streamed output only while the reader is at the live edge, keeps the reader's place when history loads above or content changes size, opens a saved thread at the last meaningful turn, and offers "jump to latest" and programmatic jumps. It owns no messages, transport or model state. Guiding rule: the view changes position only when the reader has asked for it, directly or by staying at the live edge.

## Anatomy
- **Frame**: fills its height-bounded parent.
- **Viewport**: the native scroll container.
- **Content**: the ordered rows.
- **Row**: wraps each direct child (a Message, a ConversationMarker, a typing indicator, a "load earlier" row, a date separator). Rows may have a stable **id** and may be marked as a **turn anchor**.
- **Spacer**: invisible room at the end that lets an anchored new turn sit near the top even when little content follows it.
- **Jump button(s)**: "Jump to latest" (end) and optionally "Jump to start"; hidden and inert when there is nothing to scroll toward.
- **Unseen indicator** (optional): the jump button shows a dot or count while new rows or streamed text arrive out of view.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| followOutput | boolean | false | While the reader is at the live edge, keep growing content in view. Any wheel, touch, keyboard scroll, scrollbar drag, text selection or explicit jump releases it; returning to the edge (or pressing Jump to latest) re-engages it. |
| openAt | 'start' \| 'end' \| 'last-anchor' | 'last-anchor' | Opening position, applied once on the first non-empty render. `last-anchor` shows the last anchored turn at the top with its reply below; it falls back to `end` when there is no anchor or the last turn already fits. |
| edgeTolerance | layout size from tokens | small | Distance from an edge that still counts as "at the edge". |
| anchorMargin | layout size from tokens | none | Space kept above an aligned target. |
| previousPeek | layout size from tokens | a few lines | Extra part of the previous row kept visible above a newly anchored turn. |
| preserveOnPrepend | boolean | true | Keeps the first visible row fixed when older rows are added above. |
| label | string | from i18n ("Messages") | Name of the scroll region. |
| busy | boolean | false | A turn is streaming; announcements wait until the row completes. |
| rows | ordered children, each with `id` and optional `anchor` | required | Transcript. |
| onReachStart | () => void | none | Called near the start, to load earlier history. |
| commands (hook) | `scrollToRow(id, { align, behaviour, margin })`, `scrollToEnd()`, `scrollToStart()` | — | Imperative jumps; each returns whether it ran or was queued. A jump to a row not yet mounted is queued only until the first rows mount; after that an unknown id returns false. |
| scroll state (hook) | `{ canScrollStart, canScrollEnd }` | — | For custom controls and status. |
| visibility (hook) | `{ currentAnchorId, visibleRowIds }` | — | Which turn the reader is in (stays set after its anchor scrolls above) and which rows are on screen, in order. Computed only while something subscribes. |

## States
Pending open position (the viewport stays visually hidden, not removed, until the opening position is applied, so no jump is seen); following; released (reader scrolled away); jumping (programmatic scroll in progress); at start; at end; loading earlier.

## Keyboard and ARIA
- Viewport: `role="region"` named by `label`, focusable (`tabindex` 0) so keyboard users can scroll it with arrows, Page Up and Down, Home and End.
- Content: `role="log"` with `aria-relevant="additions"`: new rows are announced; streamed text changes inside a row are not announced token by token. With `busy`, the content is `aria-busy` and the completed row is announced once.
- Jump buttons are real RAC `Button`s named "Jump to latest" and "Jump to start"; when inactive they are `inert` and out of the tab order.
- Keyboard focus is never moved by new content. A keyboard scroll key inside the viewport releases following.
- Rows that the host marks as unread can be reached with `scrollToRow` and receive focus only when the jump was user-initiated from a link or outline item.

## Responsive, touch, motion, forced colours
- Touch scrolling and momentum are native; overscroll is contained.
- Rows far outside the view may skip rendering work (content-visibility style optimisation) but stay in the document for selection, copy, find-in-page and assistive tech.
- The jump button floats at the end edge, centred, with a `--ty-control-target` hit area, `--ty-surface-raised-solid` fill and `--ty-shadow-floating`; it appears and disappears with opacity and a small shift using `--ty-dur-quick` and `--ty-ease-out`; under reduced motion only opacity, and programmatic scrolls jump instead of gliding.
- Row entrance animations, if the host adds them, must use opacity and transform only (never height or spacing) and are skipped under reduced motion.
- Optional edge fade at the end while more content is below, removed in forced colours.
- Forced colours: jump button border in `ButtonText`.

## Composition notes
- Mark the row that starts an exchange as the anchor: usually the user's message in a one-to-one assistant chat; in group chats the message that asks for a reply or a "joined" marker. Typing indicators and "load earlier" rows are never anchors.
- Give message rows stable ids so prepend preservation and jumps target the right row.
- Stopping, retrying, regenerating or an error must not move the view.

## Acceptance tests
- Given a thread with the reader at the end and `followOutput`, when the streaming reply grows, then the view keeps the growing end visible.
- Given the reader scrolls up by one line during streaming, then the view stops following and new text arrives without moving the view.
- Given the reader released following, when Jump to latest is pressed, then the view moves to the end and follows again.
- Given a new anchored user row is appended, then it is placed near the top of the viewport with part of the previous row still visible above it, and the reply grows below.
- Given `openAt="last-anchor"` and a stored thread whose last turn is taller than the viewport, then the view opens with that turn's anchor at the top; given the last turn fits, then it opens at the end.
- Given the opening position is pending, then the viewport is visually hidden but present in layout, and it shows once positioned.
- Given 20 older rows are prepended while the reader looks at row X, then row X stays at the same place on screen.
- Given an image inside a visible row finishes loading and grows, then the row the reader is reading does not move.
- Given the view is at the end, then the Jump to latest button is inert and not in the tab order.
- Given new rows arrive while the reader is away from the end, then the jump button shows the unseen indicator.
- Given `scrollToRow("m42")` for a mounted row, then it aligns to the start with `anchorMargin` and following is released.
- Given `scrollToRow("unknown")` after rows have mounted, then it returns false.
- Given a subscriber to visibility, when the reader scrolls past an anchor, then `currentAnchorId` is that anchor until the next one crosses the reading line.
- Given a streamed reply with `busy`, then the screen reader hears the completed reply once, not each chunk.
- Given the viewport focused, when Page Up is pressed, then it scrolls and following is released.
