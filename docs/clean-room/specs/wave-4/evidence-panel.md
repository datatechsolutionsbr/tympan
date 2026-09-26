# EvidencePanel

Wave 4 · layout · Status: specified

Written by the implementer from design direction §2.8, §3.7, §3.13 and the
storyboards (base = facet sidebar + table + evidence panel; provenance =
canvas + inspector; instrument = queue + item + source panel). No fork
counterpart.

## Purpose
A side inspector showing the evidence of what is selected: title, proof
state, actor, source and quotation, history. Docked on the end side on wide
screens, an overlay drawer on medium screens, a bottom sheet on narrow ones.

## Anatomy
- **Head**: title (h2 style `h3`), optional subtitle in `meta`, close button.
- **Proof band** (optional): ProofBadge `block`.
- **Body**: host content (sections with dividers, no inner cards).
- **Footer** (optional): actions.
- **Resize handle** (docked only, optional): see ResizableSplit.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| title | string | required | Heading and accessible name. |
| subtitle | string | none | Meta line. |
| open / onOpenChange | boolean / (open) => void | required | Visibility. |
| placement | 'auto' \| 'docked' \| 'overlay' \| 'sheet' | 'auto' | auto: docked ≥ 1280, overlay 1024–1279, sheet < 1024. |
| width | number | 420 | Docked width, clamped to 340–420. |
| onWidthChange | (px) => void | none | Makes the docked panel resizable. |
| proof | ProofBadge props | none | Proof band. |
| footer | node | none | Actions. |
| children | node | required | Body. |

## States
Closed; docked; overlay (modal); sheet (modal, 80% height); empty body
(host shows an EmptyState).

## Keyboard and ARIA
- Docked: `complementary` landmark labelled by its title; not modal; the
  close button returns focus to the element that opened it when the host
  passes `returnFocusRef`.
- Overlay and sheet: RAC Modal + Dialog, focus trapped, Escape closes, focus
  returns to the trigger.
- Resize handle: APG Window Splitter (`separator` role, `aria-valuenow`,
  min 340, max 420, arrow keys by 8 px, Home/End to the ends).

## Responsive, touch, motion, forced colours
- Entry in `--fk-dur-base`; reduced motion: instant.
- Glass level 1 when docked (sits next to the sheet), level 4 when modal.
- Forced colours: 1 px `CanvasText` boundary.

## Acceptance tests
- Given open at 1440 px, then a complementary region named by the title is in the page and nothing is modal.
- Given open at 1100 px, then a modal dialog named by the title opens; Escape calls `onOpenChange(false)`.
- Given open at 800 px, then the dialog is a bottom sheet.
- Given `onWidthChange` and focus on the handle, when Left Arrow is pressed, then the width grows by 8 px up to 420; End sets 420.
- Given `proof`, then the block ProofBadge renders first in the body.
