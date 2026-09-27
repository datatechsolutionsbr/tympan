# ChatBubble

Wave 5 · conversation · Status: specified

Behaviour reference: shadcn/ui (MIT), read by the spec writer only.

## Purpose
The framed surface of a conversational message: text, a short structured answer, a quoted reply, a suggestion chip, or an error. Scoped to the surface only; names, avatars, times and message actions belong to Message.

## Anatomy
- **Bubble**: sized to its content up to a readable maximum share of the row; the unframed appearance may span the full row.
- **Content**: text or rich content; can itself be a link or a button (a suggestion, a quoted message that jumps to the original).
- **Reactions row** (optional): small overlapping chips at the top or bottom edge, start or end.
- **BubbleGroup**: consecutive bubbles from one sender, tightly stacked; corners adjacent to a neighbour in the same group are less rounded so the group reads as one.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| appearance | 'strong' \| 'neutral' \| 'quiet' \| 'tinted' \| 'outlined' \| 'plain' \| 'danger' | 'neutral' | Strong: the current user. Neutral: standard. Quiet: low emphasis. Tinted: accent-soft. Outlined: rich content. Plain: unframed assistant text. Danger: failed content (always with words that say what failed). |
| align | 'start' \| 'end' | inherits from Message | Side; normally set on Message. |
| as | 'surface' \| 'link' \| 'button' | 'surface' | Makes the content interactive (with `href` or `onPress`). |
| href / onPress | string / handler | none | For link and button bubbles. |
| reactions | { emoji or icon; count; label; pressed?; onPress? }[] | none | Reaction chips. |
| reactionsSide | 'top' \| 'bottom' | 'bottom' | Edge. |
| reactionsAlign | 'start' \| 'end' | 'end' | Position along the edge. |
| collapsedLines | number | none | Long content is clamped and a Disclosure "Show more" appears. |
| children | node | required | Content. |

## States
Default; hover and pressed and focus-visible (link or button bubbles); collapsed and expanded; grouped position (first, middle, last, only).

## Keyboard and ARIA
- Surface bubbles have no role; semantics come from content and the surrounding Message.
- Link and button bubbles use RAC `Link` or `Button`; the accessible name is the bubble text; text inside stays start-aligned.
- Read-only reactions: the whole row is one image-like element (`role="img"`) with a summary label ("Thumbs up 8, heart 2"), so glyphs and "+8" are not read one by one.
- Interactive reactions: each chip is a RAC `ToggleButton` named "{reaction}, {count}" with `aria-pressed` for the user's own reaction.
- Show more follows Disclosure.

## Responsive, touch, motion, forced colours
- Maximum width is a share of the row (a readable measure, `--ty-measure-prose` at most), narrower on end-aligned rows; on narrow screens the share grows.
- Radius `--ty-radius-card`; group-adjacent corners use `--ty-radius-control`. Strong: `--ty-accent` with `--ty-on-cta` text. Neutral: `--ty-surface-raised`. Quiet: `--ty-surface-sunken`. Tinted: `--ty-accent-soft` with `--ty-on-accent-soft`. Outlined: `--ty-line` border. Danger: `--ty-danger-soft` with `--ty-on-danger-soft` and an error icon.
- Reaction chips overlap the edge; the host leaves room so they cover no text.
- Interactive bubbles change fill on hover with `--ty-dur-instant`, instant under reduced motion; no lift or glow.
- Forced colours: every framed appearance has a `CanvasText` border; plain has none; danger keeps its icon and words.

## Acceptance tests
- Given `appearance="danger"`, then an error icon is present and the text states the failure (colour is not the only signal).
- Given `as="button"` with `onPress`, when activated with Enter, then it fires and its name equals the bubble text.
- Given read-only reactions 👍 8 and ❤ 2, then one element is exposed with the label "Thumbs up 8, heart 2" (names from i18n or host).
- Given interactive reactions, when the user's reaction chip is pressed, then `aria-pressed` toggles and its `onPress` fires.
- Given a BubbleGroup of three end-aligned bubbles, then inner corners on the end side are less rounded than outer ones.
- Given `collapsedLines` 6 and long content, then 6 lines show with a Show more control.
- Given `appearance="plain"`, then no frame is drawn and the content may span the full row.
