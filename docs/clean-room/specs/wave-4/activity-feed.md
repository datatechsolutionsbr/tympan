# ActivityFeed

Wave 4 · data display · Status: specified

Written by the implementer from the overview storyboard and design direction
§2.11 (ActorChip before the date), §3.5. No fork counterpart.

## Purpose
Recent acts on the research (asserted, verified, ran, froze), each with who
did it, what happened and when, in a calm list.

## Anatomy
- **Entry**: ActorChip (compact), text (body; may contain a link to the
  object), meta line in mono (time, id, rule).
- Optional "see trail" link after the list.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| entries | Array<{ id; actor: { kind; name; agentKey?; model? }; text: node; at: string \| Date; meta?: string }> | required | Entries, newest first. |
| label | string | required | Feed name. |
| locale | string | adapter | Relative time formatting. |
| now | Date | current time | Reference for relative time (tests). |
| moreHref / moreLabel | string | none | Link after the list. |

## Keyboard and ARIA
- An ordered list labelled by `label` (newest first), each entry a list item.
- Time rendered in a `time` element with `datetime`; its text is relative
  ("há 5 minutos") and the absolute date is in the `title`.
- ActorChip comes before the time in reading order (§2.11).

## Responsive, touch, motion, forced colours
- The meta line wraps under the text below 640 px. No motion.

## Acceptance tests
- Given three entries, then an ordered list of three items in the given order is rendered.
- Given an agent actor, then the word "agent" is visible in the entry.
- Given an entry 5 minutes before `now`, then a `time` element with the ISO datetime and a relative text is shown.
- Given the entry, then the actor name comes before the time in DOM order.
