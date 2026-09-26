# SectionPanel

Wave 2 · layout · Status: specified

## Purpose
A titled block of a page (a "sheet" in design direction §2.5) with a header that can carry an eyebrow, icon, title, subtitle and actions, an optional toolbar and tag row, and a body that may collapse.

## Anatomy
- **Header**: eyebrow (with optional extra content such as a count), leading icon, title, subtitle, trailing slot for status and action buttons, and a disclosure chevron when collapsible.
- **Accent stripe** (optional): a decorative strip along the top edge; carries no meaning.
- **Toolbar** (optional): search, filters or a create action, between header and body.
- **Tag row** (optional): active tags or filters, below the toolbar.
- **Body**: the content; can be unpadded for tables that run edge to edge.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| title | string | required | Heading text. |
| eyebrow | string | none | Small label above the title (§2.2 `eyebrow`). |
| eyebrowAside | ReactNode | none | Content next to the eyebrow (a count, a tag). |
| subtitle | ReactNode | none | One-sentence summary under the title (§2.2 `body-lg`, max 60ch). |
| icon | ReactNode | none | Decorative icon beside the title. |
| scale | 'section' \| 'surface' \| 'banner' \| 'display' | 'section' | Typographic and spacing scale; `banner` is the page-top form, `display` only for login and public pages. |
| headingLevel | 2 \| 3 \| 1 | 2 | Rendered heading level; `banner` pages usually use 1. |
| actions | ReactNode | none | Buttons in the header trailing slot. |
| aside | ReactNode | none | Status content placed before the actions. |
| toolbar | ReactNode | none | Row between header and body. |
| tags | ReactNode | none | Row of tags below the toolbar. |
| elevation | 'sheet' \| 'raised' \| 'flat' | 'sheet' | Surface level from §2.5. |
| accentStripe | boolean | false | Shows the decorative stripe using the CTA gradient token. |
| padded | boolean | true | Pads the body. |
| collapsible | boolean | false | Header becomes a disclosure button. |
| open / defaultOpen / onOpenChange | boolean / boolean / (open: boolean) => void | — / true / — | Controlled or uncontrolled disclosure state. |

## States
Expanded, collapsed (toolbar, tags and body hidden), header hover and focus-visible when collapsible.

## Keyboard and ARIA
- The panel is a `section` labelled by its heading.
- When collapsible: APG pattern Disclosure. RAC primitive: `Disclosure` with `DisclosurePanel`. The whole header is the trigger button with `aria-expanded` and `aria-controls`; the body is a region labelled by the title. Enter and Space toggle.
- Action buttons in the header must not be nested inside the trigger button: they sit outside it so each stays a separate tab stop.
- The accent stripe and icon are hidden from assistive technology.

## Responsive, touch, motion, forced colours
- Padding and spacing follow §2.1 per breakpoint; header actions wrap below the title under 640.
- The collapsible trigger spans the header and is at least 44 px tall.
- Chevron rotation and body reveal use `--fk-dur-quick`; with reduced motion the change is instant.
- Reduced transparency: surface becomes opaque (§2.5). Forced colours: the panel keeps a 1 px system border.

## Acceptance tests
- Given a panel with title "Sources", then a region/section is exposed with accessible name "Sources" and a heading of the requested level.
- Given `collapsible` and `defaultOpen` false, when the user presses Enter on the header, then `aria-expanded` becomes true and the body, toolbar and tags appear.
- Given collapsible with actions, when the user tabs, then focus visits the trigger and each action separately.
- Given controlled `open`, when the header is activated, then `onOpenChange` receives the new value and the view does not change until the prop does.
- Given reduced motion, when toggled, then no rotation animation runs.

## Open questions
- The fork puts the actions inside the toggle button when collapsible (nested interactive content). The new component must keep them outside.
