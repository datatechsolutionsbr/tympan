# ConversationMarker

Wave 5 · conversation · Status: specified

Behaviour reference: shadcn/ui (MIT), read by the spec writer only.

## Purpose
A light inline row inside a conversation that is not a message: a status ("Thinking…", "Running search"), a system note ("Marcus joined", "Conversation handed to Support"), a labelled divider ("Today", "New messages"), or a small action ("Show 3 earlier steps").

## Anatomy
- **Row** in one of three layouts: inline (icon plus text), bordered (inline with a line under the row), divider (centred text between two lines).
- **Icon** (optional, decorative) or a Spinner for live status.
- **Text**: optionally with a streaming shimmer while the status is live.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| layout | 'inline' \| 'bordered' \| 'divider' | 'inline' | Presentation. |
| intent | 'note' \| 'status' \| 'action' | 'note' | Semantics (see Keyboard and ARIA). |
| live | boolean | false | Status is in progress: shows a Spinner or shimmer. |
| icon | icon | none | Decorative icon. |
| text | string | required | Visible text. |
| href / onPress | string / handler | none | Required when `intent="action"`. |
| tone | 'neutral' \| 'danger' \| 'success' | 'neutral' | Tone for outcomes ("Search failed"), with icon and word. |

## States
Static; live (animated indicator); interactive (hover, pressed, focus-visible).

## Keyboard and ARIA
- `note`: plain text, no role.
- `status`: `role="status"` so the change is announced politely; when `live` ends, the final text replaces the live text and is announced once.
- `action`: RAC `Link` or `Button` whose name is the text.
- `divider`: the text is ordinary content; the two lines are decorative. It never uses the separator role, because a separator's content would not be read.
- The icon is hidden from assistive tech; an icon-only marker is not allowed.

## Responsive, touch, motion, forced colours
- Actions have a hit area of at least `--ty-control-target`.
- Text `--ty-ink-2` at meta size; lines `--ty-line-soft`; danger and success tones use `--ty-danger` and `--ty-success` with icons.
- Shimmer and Spinner stop under reduced motion; the text stays.
- Forced colours: divider lines in `CanvasText`; shimmer removed.

## Acceptance tests
- Given `intent="status"` and `live`, then the row has the status role and shows a Spinner.
- Given the live status text changes from "Searching" to "Found 12 results" and `live` becomes false, then the final text is announced once.
- Given `layout="divider"` and text "Today", then "Today" is read as text and no separator role is present.
- Given `intent="action"` with `onPress`, when activated with Space, then it fires.
- Given reduced motion and `live`, then no shimmer moves.
- Given `intent="action"` without `href` or `onPress`, then a development warning is raised.
