# Heading

Wave 1 · primitive · Status: specified

## Purpose
Renders a section title whose visual size and document level can be set independently.

## Anatomy
- **Heading element**: h1 to h6.
- **Eyebrow** (optional): small uppercase label above the heading, not part of the heading text.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| level | 1 \| 2 \| 3 \| 4 \| 5 \| 6 | 1 | Document outline level. |
| appearance | 'display' \| 'h1' \| 'h2' \| 'h3' \| 'label' | derived from level (1→h1, 2→h2, 3+→h3) | Visual step from the type scale of §2.2, decoupled from `level`. |
| eyebrow | string | none | Text of the eyebrow (§2.2 eyebrow token), rendered before the heading and associated through the section's label. |
| id | string | auto | Stable id so sections and dialogs can reference it via `aria-labelledby`. |
| children | node | required | Heading text. |

A convenience **Subheading** is the same component with `level` 2 and `appearance` 'h3'.

## States
Static.

## Keyboard and ARIA
- No APG widget pattern; follows document outline rules (one h1 per page, no skipped levels in library composites).
- RAC primitive: `Heading` (used inside dialogs so the dialog picks up its title).
- The eyebrow is not inside the heading element so the heading's accessible name stays short.

## Responsive, touch, motion, forced colours
- Serif family for h1 to h3, sans for label appearance (§2.2); the h1 step shrinks on narrow screens as listed in §2.2.
- Long titles wrap with balanced lines; never truncated without a tooltip.
- No motion.
- Forced colours: `CanvasText`.

## Acceptance tests
- Given no props, when rendered, then an h1 is produced.
- Given `level={3}`, when rendered, then an h3 is produced.
- Given `level={2}` and `appearance="h1"`, when rendered, then the element is h2 but uses the h1 visual step.
- Given `eyebrow`, when rendered, then the eyebrow text is outside the heading element and the heading text alone is its accessible name.
- Given Subheading with no props, when rendered, then an h2 is produced.
- Given a page composed from library composites, when an outline checker runs, then no heading level is skipped.
