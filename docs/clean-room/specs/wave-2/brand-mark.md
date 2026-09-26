Wave 2 · Primitive · Status: specified

# BrandMark

## Purpose
The Fakhir logo as a component: icon badge plus wordmark, in three sizes, and the brand constants other components read (product id, logo files for light and dark).

## Anatomy
- **Badge**: the icon (open book on a badge) on the CTA gradient of §2.3.
- **Wordmark**: the product name, or a custom wordmark node.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| size | 'small' or 'medium' or 'large' | 'medium' | Scales badge and wordmark together. |
| showWordmark | boolean | true | Icon-only when false. |
| wordmark | ReactNode | product name text | Custom wordmark. |
| label | string | product name | Accessible name when used as a link or icon-only. |
| Brand constants | { productId, logoFiles: { icon, logo, logoDark } } | Fakhir | Read-only data module. |

## States
Static. When wrapped in a link (home), the link carries hover and focus states, not the mark.

## Keyboard and ARIA
- Decorative badge (`aria-hidden`) when the wordmark text is visible; when icon-only, the badge is an image with `label` as its accessible name.
- No APG pattern.

## Responsive, touch, motion, forced colours
- When used as a home link, the link target is 44 px tall.
- Wordmark text must meet 4.5:1 contrast on both themes; gradient text is not allowed for the wordmark (text uses `--fk-ink`).
- Forced colours: badge shows an outline, icon uses `CanvasText`.

## Acceptance tests
- Given icon-only, then the element has an accessible name equal to the label.
- Given the wordmark visible, then the product name is read once.
- Given dark theme, then the dark logo file is chosen when the image form is used.
- Given each size, then badge and text scale together without overlap.
