Wave 2 · Layout · Status: specified

# LegalDocumentFrame

## Purpose
A reading layout for long policy documents (terms, privacy) with a generated table of contents.

## Anatomy
- **Top bar slot**: host-supplied brand and home link.
- **Document header**: title (h1) and "last updated" line.
- **Contents navigation**: list of links to each second-level heading of the document; a side rail on wide screens, a collapsible disclosure above the text on narrow screens.
- **Prose column**: the document body, typeset per §2.2 (prose at most 68ch).
- **Footer slot**: host-supplied copyright and links.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| title | string | required | Document title. |
| updatedAt | string | required | Pre-formatted update line. |
| children | ReactNode | required | Document body (may be pre-rendered HTML). |
| topBar | ReactNode | none | Brand slot; nothing rendered when absent. |
| footer | ReactNode | none | Footer slot. |
| contentsLabel | string | from i18n | Heading of the contents navigation. |

## States
Contents empty (document without second-level headings: navigation hidden); disclosure open or closed on narrow screens; current section (the link of the section in view is marked `aria-current="location"`).

## Keyboard and ARIA
- Contents is a `nav` landmark labelled by `contentsLabel`; the body is an `article` inside `main`.
- APG pattern: "Disclosure" for the narrow-screen contents; RAC `Disclosure` (or native details/summary).
- Headings without an id receive a stable slug id derived from their text; ids must be unique (suffix on collision) and must not depend on non-ASCII stripping alone (use a transliteration or fallback index).
- Following a contents link moves focus to the target heading (made programmatically focusable) and the heading is not hidden under a sticky top bar (scroll margin per §2.6).

## Responsive, touch, motion, forced colours
- Two columns at ≥ 1024 px, one column below (§2.8 breakpoints). Contents links have 44 px tall targets on touch.
- Smooth scrolling only when reduced motion is off.
- Forced colours: links keep underline; current section marked with a border, not colour only.

## Acceptance tests
- Given a body with three second-level headings, when mounted, then the contents lists three links in document order.
- Given a heading without id, when mounted, then it receives an id and its link targets it.
- Given two headings with the same text, when mounted, then their ids differ.
- Given a 375 px viewport, when the contents disclosure is toggled with Enter, then its list is shown and `aria-expanded` is true.
- Given a contents link is activated, then focus lands on the heading and the heading top is below the sticky bar.
- Given no top-bar slot, then no empty landmark is rendered.
