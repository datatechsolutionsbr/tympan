# Tag

Wave 1 · data display · Status: specified

## Purpose
A small label for static metadata (category, role, count, filter value), optionally clickable or removable.

## Anatomy
- **Root** pill.
- **Leading icon** or **colour square** (optional, decorative).
- **Text**.
- **Remove button** (optional) at the end.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| tone | 'neutral' \| 'accent' \| 'category' | 'neutral' | Neutral ink, accent-soft, or a categorical colour square from §2.3 (categorical colours only as a small square, never as the fill in tables). |
| categoryIndex | number | none | Which categorical token to use when `tone="category"`. |
| size | 'small' \| 'regular' \| 'large' | 'regular' | Text step; smallest never below the 12 px floor (§2.2). |
| icon | node | none | Decorative icon before the text. |
| onPress | () => void | none | Makes the tag a button. |
| href | string | none | Makes the tag a link. |
| removable | boolean | false | Shows the remove button. |
| onRemove | () => void | required when removable | Remove action. |
| removeLabel | string | from I18n ("Remove {text}") | Accessible name of the remove button; must include the tag text. |
| children | node | required | Text. |

## States
Static; interactive tags add hover, pressed, focus-visible. Removable tags: remove button hover/focus. Disabled is not supported.

## Keyboard and ARIA
- Static: no role.
- Pressable: APG **Button**; link: APG **Link**. RAC `Button` / `Link`.
- Removable tags in a set follow APG guidance for a **Grid**-like tag group: RAC `TagGroup` + `Tag` with `onRemove`; Delete or Backspace on a focused tag removes it, arrows move between tags.
- Tags do not announce as live status; changing state belongs to StatusPill.

## Responsive, touch, motion, forced colours
- Pill radius (§2.4). Remove button and interactive tags get a 44 × 44 px hit area.
- Long text truncates with ellipsis and full text as tooltip.
- No motion beyond the instant hover transition; none under reduced motion.
- Reduced transparency: opaque fill.
- Forced colours: 1 px `CanvasText` border; the category square keeps a border so it is visible.

## Acceptance tests
- Given a static tag, when rendered, then it is inline text with no interactive role.
- Given `onPress`, when clicked or activated with Enter/Space, then it fires.
- Given `href`, when rendered, then it is a link.
- Given `removable` with text "São Paulo", when inspected, then the remove button's name contains "São Paulo".
- Given a tag group with removable tags, when a tag is focused and Delete is pressed, then `onRemove` fires for that tag and focus moves to a neighbour.
- Given `size="small"`, when measured, then text is at least 12 px.
