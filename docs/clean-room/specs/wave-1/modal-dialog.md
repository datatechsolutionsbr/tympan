# ModalDialog

Wave 1 · overlay · Status: specified

## Purpose
Interrupts the current task with a focused, modal window for a decision or a short form, then returns the person where they were.

## Anatomy
- **Backdrop** covering the page.
- **Panel** (elevation level 4, §2.5) containing:
- **Title** (required), **description** (optional), **body** (scrolls when long), **actions** row (primary last on the end side), optional **close button**.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| isOpen | boolean | required | Visibility (controlled). |
| onOpenChange | (open: boolean) => void | required | Called with false on Escape, close button, or backdrop press when allowed. |
| width | 'narrow' \| 'regular' \| 'wide' \| 'xwide' | 'regular' | Maximum panel width step. |
| role | 'dialog' \| 'alertdialog' | 'dialog' | Use `alertdialog` for destructive or blocking confirmations. |
| dismissOnBackdrop | boolean | true for dialog, false for alertdialog | Whether pressing outside closes. |
| showCloseButton | boolean | true for dialog | Visible close control. |
| initialFocus | 'first' \| 'title' \| ref | 'first' | Where focus lands on open; `alertdialog` defaults to the least destructive action. |
| title | node | required | Accessible name. |
| description | node | none | Accessible description. |
| actions | node | none | Buttons. |
| busy | boolean | false | Disables closing while an action is pending. |

## States
Closed, opening, open, closing, busy (close disabled, `aria-busy` on panel), with scrolling body (header and actions stay visible).

## Keyboard and ARIA
- APG patterns: **Dialog (Modal)** and **Alert Dialog**.
- RAC primitives: `ModalOverlay`, `Modal`, `Dialog` with `Heading slot="title"`.
- Focus moves into the panel on open, is trapped while open, and returns to the invoking element on close.
- Escape closes (unless `busy`); Tab/Shift+Tab cycle within.
- Title labels the dialog; description describes it. Content behind is inert and page scroll is locked.

## Responsive, touch, motion, forced colours
- Below 640 px the panel fills the width with the design-direction gutter (§2.1) and may anchor to the bottom; actions stack full width with the primary first visually and in reading order.
- Close button and actions have 44 × 44 px hit areas.
- Enter/exit with the base duration and easings of §2.7 (fade plus small scale); reduced motion: fade only or instant.
- Reduced transparency: opaque panel and backdrop without blur.
- Forced colours: panel border in `CanvasText`; backdrop not relied on for separation.

## Acceptance tests
- Given `isOpen` false, then nothing is rendered in the accessibility tree.
- Given it opens, then focus is inside the panel and the dialog is named by the title.
- Given open, when Escape is pressed, then `onOpenChange(false)` is called and focus returns to the trigger.
- Given open, when Tab is pressed from the last control, then focus wraps to the first.
- Given `role="alertdialog"`, when the backdrop is pressed, then it does not close.
- Given `busy`, when Escape is pressed, then it stays open.
- Given an action button, when pressed, then its handler runs (the dialog does not close unless the host changes `isOpen`).
- Given a long body on a small screen, when scrolled, then the title and actions remain reachable.
- Given axe, when open, then no violations are reported.
