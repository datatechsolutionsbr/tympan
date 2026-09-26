# AgentOutputCard

Wave 2 · data display · Status: specified

## Purpose
A small read-only card summarising what one agent produced in a run: who the agent is, how long it took, the outcome and a short excerpt of its output.

## Anatomy
- **Actor line**: ActorChip in its agent form (square avatar, the word "agent", §2.11), followed by the duration in `meta` type.
- **Outcome mark**: icon plus word for the result (completed, failed, pending) using the semantic colours of §2.3.
- **Excerpt**: output text, clamped to a few lines, body type.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| agentName | string | required | Agent display name. |
| agentKey | string | undefined | Machine key shown in mono meta. |
| avatarUrl | string | undefined | Agent image; decorative. |
| duration | string | required | Human-readable duration (formatted by host). |
| outcome | `'completed' \| 'failed' \| 'pending'` | `'completed'` | Result state. |
| output | string | required | Text excerpt. |
| maxLines | number | 4 | Clamp; full text available through `onOpen`. |
| onOpen | `() => void` | undefined | Makes the card open the full output. |

## States
- Read-only; or interactive (hover, focus-visible) when `onOpen` is given.
- Outcome states as above.

## Keyboard and ARIA
- Read-only: an `article` labelled by the agent name.
- With `onOpen`: the agent name is a link or button (RAC `Link` or `Button`); the whole card may be clickable via an expanded hit area, but only one tab stop.
- Outcome word is real text, not only an icon.
- No APG pattern beyond Button/Link.

## Responsive, touch, motion, forced colours
- All text at least 12 px (§2.2; the fork's smaller text is a defect fixed here).
- Target at least 44 px tall when interactive.
- No transitions besides focus.
- Forced colours: card border visible; outcome icon remains.

## Acceptance tests
- Given agent "Coder" and outcome completed, when rendered, then an article named "Coder" shows the word "agent" and a completed mark with text.
- Given a long output and `maxLines` 4, when rendered, then the text is clamped and the full text remains available via `onOpen`.
- Given `onOpen`, when Tab is pressed, then exactly one element in the card is focusable and Enter calls `onOpen`.
- Given any text inside, when computed, then no font size is below 12 px.
