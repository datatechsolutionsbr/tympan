# Drawer

Wave 1 · overlay · Status: specified

## Purpose
A modal panel that slides in from an edge of the viewport to hold a secondary task (details, a short form, a list of actions) without leaving the page.

## Anatomy
- **Backdrop**: dims the page behind; pressing it dismisses.
- **Panel**: the surface, anchored to the bottom edge (sheet) or the end edge (side panel).
- **Grab handle** (bottom placement only, optional): a visual affordance showing the panel can be dragged down.
- **Title**: names the drawer; also its accessible name.
- **Body**: scrollable content region.
- **Close button**: always present in the header (see Open questions).
- **Bottom inset spacer**: keeps content above the device safe area on bottom placement.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| open | boolean | required | whether the drawer is shown |
| onOpenChange | (open: boolean) => void | required | called with false on any dismissal (backdrop, Escape, close button, drag) |
| title | string | required | visible heading and accessible name |
| placement | 'bottom' \| 'end' | 'bottom' | edge the panel attaches to; 'end' follows reading direction |
| width | 'medium' \| 'large' \| 'wide' | 'medium' | maximum width of an end-placed panel |
| maxHeight | string (viewport fraction) | 'most of viewport' | maximum height of a bottom-placed panel |
| showHandle | boolean | true | shows the grab handle (bottom placement only) |
| dismissible | boolean | true | when false, backdrop press and drag do not close (Escape still does unless a form is dirty and the host intercepts) |
| children | node | none | body content |

## States
- closed, opening, open, dragging (panel follows the pointer), closing.
- While dragging, backdrop opacity decreases with distance; releasing past a distance or velocity threshold closes, otherwise the panel returns.
- Body overflow scrolls inside the panel; the page behind does not scroll.

## Keyboard and ARIA
- APG pattern: **Dialog (Modal)**. RAC primitive: `ModalOverlay` + `Modal` + `Dialog` with `Heading slot="title"`.
- On open, focus moves to the first focusable element in the panel (or the panel itself if none); focus is trapped; on close, focus returns to the element that opened it.
- Escape closes. Tab/Shift+Tab cycle inside the panel.
- The page behind is inert (`aria-modal` semantics provided by the primitive).
- Dragging is never the only way to close: the close button and Escape always work.

## Responsive, touch, motion, forced colours
- Below 1024 px an end-placed drawer may switch to bottom placement if the host asks (design direction §2.8 evidence panel rule).
- Close button and handle area are at least 44 × 44 px.
- Surfaces use elevation level 4 and the modal backdrop of design direction §2.5; radius `--fk-radius-sheet` on the attached edge only.
- Entry uses `--fk-dur-base` with `--fk-ease`, exit uses `--fk-ease-out` (§2.7). With reduced motion the panel appears and disappears without sliding (opacity only or instant).
- Reduced transparency: panel and backdrop become opaque.
- Forced colours: panel has a 1 px system-colour border; backdrop may disappear, but the panel edge stays visible.

## Acceptance tests
- Given a closed drawer, When `open` becomes true, Then a dialog named by `title` is present and focus is inside it.
- Given an open drawer, When Escape is pressed, Then `onOpenChange(false)` is called and focus returns to the opener.
- Given an open drawer, When the backdrop is pressed, Then `onOpenChange(false)` is called.
- Given `dismissible` false, When the backdrop is pressed, Then the drawer stays open.
- Given a bottom drawer, When the panel is dragged down past the threshold and released, Then `onOpenChange(false)` is called; When released before it, Then the panel returns and stays open.
- Given reduced motion, When the drawer opens, Then no translation animation is applied.
- Given an open drawer, Then axe reports no violations and elements behind it are not reachable with Tab.

## Open questions
- The fork has no visible close button and relies on backdrop, Escape and drag; the new component must always render one.
