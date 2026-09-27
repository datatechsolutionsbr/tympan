# BenefitStrip

Wave 5 · commerce · content · Status: specified

## Purpose
State the store's service promises (delivery, returns, warranty, secure payment, local pickup) near decisions to buy: on the storefront, under a cart, beside a product. Each benefit is a short title with one supporting line and an icon or host illustration. One component, several arrangements.

## Anatomy
- **Header** (optional): title and a short paragraph, placed above the items or beside them (`headerPlacement`), optionally with one host media item next to the header.
- **Items**: each has a visual (icon from the library's icon set, or host media), a title and a description; an item may carry a link ("learn more") to a policy page.
- **Container**: plain, or a tinted band using the surface-sunken role.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| items | { id; title; description?; icon?: IconName; media?: Media; href?: string; linkLabel?: string }[] | required | Benefits, two to six. |
| title / intro | string | none | Optional header. |
| headingLevel | 2 to 4 | 2 | Level of the header; item titles are one level below. |
| headerPlacement | 'above' \| 'beside' | 'above' | Beside puts header and items in two columns on wide screens. |
| headerMedia | Media | none | Host illustration next to the header. |
| arrangement | 'row' \| 'grid' \| 'inline' | 'row' | Row: one line of equal columns. Grid: two by two. Inline: compact, icon on the start side of the text, used under carts and in footers. |
| align | 'start' \| 'centre' | 'start' | Text alignment inside items. |
| tone | 'plain' \| 'band' | 'plain' | Band uses a tinted background. |
| labels | object | from I18nAdapter | Default "learn more" wording. |

## States
Static. Loading (Skeleton items) when the host fetches the policies. An item with a link has hover and focus-visible states on the link only.

## Keyboard and ARIA
- `section` labelled by the header when present, or an `aria-label` from labels ("Our benefits") when not; items are a list.
- Icons and illustrations are decorative. Titles are headings one level below the header, or plain strong text in `inline` arrangement so compact strips do not flood the heading outline (`itemTitlesAsHeadings`, default true except inline).
- Links name their destination ("Learn more about returns"), built from the item title.

## Responsive, touch, motion, forced colours
- Row becomes a single column on narrow screens; grid becomes one column; inline wraps.
- Beside header stacks above the items on narrow screens.
- No motion.
- Forced colours: band background removed, a system border outlines the strip; icons use `CanvasText`.
- Right-to-left: the inline icon sits on the right.

## Acceptance tests
- Given three items and no header, then a list of three renders inside a region with the default label.
- Given `arrangement="inline"`, then item titles are not headings.
- Given an item with `href`, then its link's accessible name includes the item title.
- Given a narrow container, then items stack in one column.
- Given `tone="band"` in forced colours, then the strip keeps a visible boundary.

## Composition notes
Reuses Heading, Text, Link, Skeleton (wave 1). The same strip serves the policy grid of cart pages and the policy list of product pages (see page-compositions).
