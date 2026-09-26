# Surface

Wave 1 · layout · Status: specified

## Purpose
A bounded container at a chosen elevation that groups related content, optionally pressable as a whole, with header, body and footer regions.

## Anatomy
- **Root**: the container.
- **Header** with **title** (heading) and **description**.
- **Body**.
- **Footer** (actions).
- **Inner divider** between regions (see separator.md).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| elevation | 'sheet' \| 'raised' \| 'floating' \| 'flat' | 'sheet' | Level 1, 2, 3 or 0 of §2.5. Only one blurred level may be nested inside another (§2.5 rule). |
| padding | 'none' \| 'regular' \| 'roomy' | 'regular' | Internal padding from §2.1. |
| as | 'section' \| 'article' \| 'div' \| 'li' | 'section' | Semantics; a section with a title becomes a labelled region. |
| onPress | () => void | none | Makes the whole surface a single press target. |
| href | string | none | Makes the whole surface a link (router adapter). |
| selected | boolean | false | For selectable surfaces; shows the accent-soft state. |
| titleLevel | 2 \| 3 \| 4 | 3 | Heading level of the header title. |

## States
Rest; for pressable surfaces also hover (border strengthens, no lift per §2.7), pressed, focus-visible (§2.6), selected, disabled.

## Keyboard and ARIA
- No APG widget pattern for static surfaces. Pressable surfaces follow **Button** or **Link**.
- RAC: pressable mode uses the "card with a single primary link" technique: the title is the RAC `Link` or `Button` and its hit area stretches over the surface; nested interactive children stay independently focusable.
- A titled section is exposed as a region labelled by its title.
- Never nest a pressable surface inside another pressable element.

## Responsive, touch, motion, forced colours
- Radius per nesting rule of §2.4; padding steps per §2.1 at each breakpoint.
- No hover lift, no spring; pressed feedback uses opacity only under reduced motion.
- Reduced transparency: opaque surface, shadow still marks the level.
- Forced colours: a 1 px `CanvasText` border replaces shadow and blur.

## Acceptance tests
- Given a surface with a title, when rendered as a section, then it is a region named by the title.
- Given `onPress`, when the surface is clicked anywhere outside nested controls, then `onPress` fires once.
- Given `onPress`, when Tab reaches the title control and Enter is pressed, then `onPress` fires.
- Given a nested button inside a pressable surface, when that button is clicked, then only the button's handler fires.
- Given `href`, when clicked, then the router adapter navigates.
- Given forced colours, when rendered, then the boundary is visible.

## Open questions
- The fork made pressable surfaces clickable divisions without keyboard access; this spec requires a real focusable control.
