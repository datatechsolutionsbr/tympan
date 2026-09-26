# AttentionList

Wave 4 · data display · Status: specified

Written by the implementer from the overview storyboard and design direction
§2.11, §3.5 ("o que falta provar"). No fork counterpart.

## Purpose
The short list of things that need the person now: each row has a proof
state, a title, one line of detail and one action.

## Anatomy
- **Heading** slot and optional "see all" link.
- **Row**: ProofBadge (compact or inline), title (`body`, semibold), detail
  (`meta`), action (a quiet button or link), separated by dividers.
- **Empty**: one sentence (host copy).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| items | Array<{ id; proof: ProofState \| 'none'; title; detail?; action?: { label; href?; onPress? } }> | required | Rows. |
| label | string | required | List name. |
| emptyText | string | from adapter | Shown when no rows. |
| maxRows | number | none | Truncates and shows the "see all" link. |
| seeAllHref / seeAllLabel | string | none | Link after the list. |

## Keyboard and ARIA
- A list (`ul`) labelled by `label`; each row a list item; the action's
  accessible name includes the row title ("Verificar: TAMM").
- Rows are not focusable themselves; only the action is.

## Responsive, touch, motion, forced colours
- Below 640 px the action moves under the detail. Actions keep 44 px hit
  areas. No motion. Forced colours: dividers in `CanvasText`.

## Acceptance tests
- Given two items, then a labelled list with two items is rendered, each with the state word, title and detail.
- Given an action, then its accessible name includes the row title, and pressing it calls onPress.
- Given no items, then the empty text is shown.
- Given maxRows 2 and four items, then two rows and the "see all" link are rendered.
