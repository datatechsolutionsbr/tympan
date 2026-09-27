# PromoBanner

Wave 5 · commerce · content · Status: specified

## Purpose
Carry one promotional message (a sale, a new collection, a seasonal campaign) with a headline, a short text and one call to action, optionally supported by images, a row of short offers, or customer quotes. Used on the storefront and at the top or bottom of category pages.

## Anatomy
- **Message block**: optional eyebrow, headline, supporting text, primary call to action (Button, wave 1, as a link), optional secondary link.
- **Visual** (by arrangement): a background image with a scrim; a mosaic of several host images overlapping the message edge; a split image beside the message; or none.
- **Offer strip** (optional): a navigation list of two to four short offers, each a link with a title and one line (for example an app discount or a returns promise), shown above or below the message.
- **Quotes** (optional): a list of customer quotes (TestimonialList) with the quote text and an attribution line.
- **Promo code** (optional): a code shown in a CopyIdentifier (wave 2) so the shopper can copy it.
- **Validity line** (optional): end date or conditions, supplied by the host, formatted by Formatters.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| headline | string | required | Main message. |
| eyebrow / body | string | none | Supporting text. |
| headingLevel | 1 to 3 | 2 | Level 1 only when the banner is the page's hero. |
| cta | { label; href or onPress } | none | Primary action. |
| secondaryLink | { label; href } | none | Second destination. |
| arrangement | 'background' \| 'tiles' \| 'split' \| 'text-only' | 'background' | Visual arrangement. |
| media | Media[] | [] | One image for background and split, three to seven for tiles. |
| offers | { id; title; description?; href }[] | none | Offer strip. |
| offersPlacement | 'above' \| 'below' | 'above' | Offer strip position. |
| quotes | { id; text; attribution }[] | none | Customer quotes. |
| promoCode | string | none | Copyable code. |
| validUntil | ISO date | none | Shown with the date formatter. |
| tone | 'accent' \| 'neutral' \| 'inverse' | 'neutral' | Surface role. Inverse uses the ink roles for a dark band in both modes; never adds hues beyond the theme. |
| size | 'hero' \| 'section' \| 'compact' | 'section' | Vertical presence. |
| renderMedia | (media) => node | none | Host image renderer. |
| labels | object | from I18nAdapter | Offers region name, copy code, copied, valid until. |

## States
Static; loading (Skeleton block with the same arrangement); expired (when `validUntil` is past, the host usually hides the banner; if shown, the CTA is replaced by an "ended" StatusPill, wave 1); code copied (CopyIdentifier feedback).

## Keyboard and ARIA
- `section` labelled by the headline.
- Background and tile images are decorative (empty alternative) because they support, not carry, the message; the host can mark one as informative.
- Offer strip: `nav` labelled "Offers" (from i18n), a list of links; each link's name is its title plus description.
- Quotes: each quote is a `figure` with a `blockquote` and a `figcaption` holding the attribution; the quote glyph is decorative.
- One primary call to action per banner; the design direction's single-primary rule applies across the view (§2.3).

## Responsive, touch, motion, forced colours
- Split and tiles stack on narrow screens (message first, visuals after); tiles collapse to at most three visible images, the rest hidden.
- Offer strip becomes a vertical list on narrow screens or a horizontally scrolling row if the host chooses.
- Background media never scrolls at a different speed from the page; no autoplaying media, no carousels.
- Text over media sits on a scrim from the backdrop token and meets AA at every width.
- Forced colours: scrim removed, text on `Canvas`; offer links get system borders.
- Right-to-left: split and tiles mirror; the offer strip starts on the right.

## Acceptance tests
- Given a headline and a CTA, then a region named by the headline contains exactly one primary link.
- Given `arrangement="split"` in a narrow container, then the message comes before the image in reading and visual order.
- Given three offers, then a navigation region named "Offers" lists three links.
- Given quotes, then each is a figure with its attribution as caption.
- Given `promoCode`, when the copy control is activated, then the code is copied and "copied" is announced.
- Given `validUntil` in the past and the banner still rendered, then the CTA is replaced by an ended status with a word, not only a colour.
- Given forced colours, then all text is readable without the scrim.

## Composition notes
Reuses Button, Link, Heading, Text, StatusPill, Skeleton (wave 1), CopyIdentifier and Formatters (wave 2). ShowcaseHeading and ShowcaseBackdrop (wave 4) are for the product's own public pages; PromoBanner is for merchandise campaigns and uses only theme tokens.
