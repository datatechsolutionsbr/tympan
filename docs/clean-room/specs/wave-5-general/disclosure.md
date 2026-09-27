# Disclosure

Wave 5 · layout · Status: specified

Behaviour reference: shadcn/ui (MIT), read by the spec writer only.

## Purpose
Show or hide one block of content with one trigger, anywhere: "Show more" under a long message, "Advanced options" in a form, a collapsible list of extra items. Unlike SectionPanel it carries no panel chrome; unlike Accordion it is a single item.

## Anatomy
- **Trigger**: any Button-like element (text, icon, or both) that the host places.
- **Panel**: the content to show or hide.
- Optional **preview mode**: the panel is partly visible (clamped) while closed, with a fade at the cut.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| isExpanded / defaultExpanded / onExpandedChange | boolean | false | Controlled or not. |
| trigger | node or render function receiving `{ isExpanded }` | required | Lets the label change ("Show more" / "Show less"). |
| children | node | required | Panel content. |
| preview | 'none' \| 'lines' | 'none' | `lines` keeps the first lines visible while closed. |
| previewLines | number | 3 | Lines kept visible in preview mode. |
| triggerPlacement | 'before' \| 'after' | 'before' | Whether the trigger sits above or below the panel (below is usual for "Show more"). |
| keepMounted | boolean | true | Keep the closed panel in the DOM, hidden. |
| disabled | boolean | false | Trigger inert. |

## States
Closed, open, opening, closing; in preview mode, "no overflow" (content fits, so the trigger is not rendered).

## Keyboard and ARIA
- RAC `Disclosure`, `Button` (slot trigger) and `DisclosurePanel`; APG **Disclosure (Show/Hide)** pattern.
- Trigger is a `button` with `aria-expanded` and `aria-controls`.
- Enter and Space toggle; focus stays on the trigger after toggling.
- Closed panel is hidden from assistive tech (`hidden="until-found"` where supported). In preview mode the visible part stays readable and the whole content is read once expanded; the clamped remainder is hidden from assistive tech until expanded.
- When expanding moves the trigger below new content (`triggerPlacement="after"`), focus stays on the trigger and the page does not jump.

## Responsive, touch, motion, forced colours
- Trigger hit area at least `--ty-control-target`.
- Height animates with `--ty-dur-base` and `--ty-ease-out`; zero under reduced motion. The preview fade uses the surface colour behind it and disappears when open.
- Forced colours: no fade (fades are invisible in forced colours); the cut is marked by the trigger alone.

## Acceptance tests
- Given a closed disclosure, when its trigger is pressed, then the panel is visible and `aria-expanded` is true.
- Given a render-function trigger, when opened, then its label switches to the "Show less" text.
- Given preview mode with 3 lines and content of 2 lines, then no trigger is rendered.
- Given preview mode with 10 lines of content, then 3 lines are visible and the trigger is present.
- Given `triggerPlacement="after"` and an expand, then focus remains on the trigger.
- Given `disabled`, then the trigger does not toggle.
- Given reduced motion, then opening has no height transition.
