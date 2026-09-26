# AuthFrame

Wave 2 · layout · Status: specified

## Purpose
Page frame for sign-in, code entry, recovery, reset and invitation screens: one centred form surface, with an optional brand panel beside it on wide screens.

## Anatomy
- **Root**: fills the viewport; background is the app background with the AmbientBackdrop (design direction §2.5).
- **Brand side** (optional): a BrandPanel occupying one half of the width on wide screens only.
- **Form side**: vertically and horizontally centred column.
- **Mark slot** (optional): the product mark above the form surface.
- **Form surface**: a Surface at elevation level 1 (§2.5) holding the host's form.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| children | node | required | The authentication form. |
| brandPanel | BrandPanel properties or undefined | undefined | When given, renders the brand side. |
| width | `'narrow' \| 'regular' \| 'wide'` | `'regular'` | Maximum width of the form surface (reading widths from §2.8, narrowest step suitable for a single-column form). |
| mark | node | undefined | Product mark shown above the surface. |
| mainLabel | string | undefined | Optional accessible name for the main landmark. |

## States
- With brand panel, ≥ 1024 px: two columns, brand left, form right.
- With brand panel, < 1024 px: brand side is not rendered at all (not merely hidden visually); form column takes full width.
- Without brand panel: single centred column at every width.

## Keyboard and ARIA
- The form side is the `main` landmark; the brand side is `complementary` with an accessible name from its title, or `aria-hidden` when it carries no information beyond decoration.
- Focus order: mark (if focusable), then the form. The brand side never receives focus before the form.
- No APG pattern; landmark regions only. No RAC primitive; custom layout.
- The page title (`h1`) belongs to the form, not to the brand panel; the brand panel title is a lower heading level or not a heading.

## Responsive, touch, motion, forced colours
- Side gutter 16 px under 768 px (§2.1); form surface never causes horizontal scroll at 320 px.
- Uses `display` type (§2.2) only for the page title on this frame.
- No entrance animation. With reduced transparency the surface is opaque.
- Forced colours: the form surface keeps a visible 1 px border in system text colour.
- Content scrolls when taller than the viewport (virtual keyboard open on phones); the surface is never clipped.

## Acceptance tests
- Given a brand panel and a 1440 px viewport, when rendered, then two columns are visible and the form is inside `main`.
- Given a brand panel and a 375 px viewport, when rendered, then the brand content is absent from the accessibility tree and the form fills the width minus 16 px gutters.
- Given no brand panel, when rendered at any width, then the form surface is centred.
- Given `width` narrow, when rendered, then the form surface is narrower than with regular.
- Given a mark, when rendered, then it appears before the form surface in reading order.
- Given a 320 px viewport with the keyboard open, when the user scrolls, then every field and the submit button can be reached.
- axe: no violations in light and dark themes.

## Open questions
- The fork uses a heading level 1 inside the brand panel as well as in the form; this spec requires a single `h1` on the page.
