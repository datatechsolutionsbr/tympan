# ProductFeatureSection

Wave 5 · commerce · content · Status: specified

## Purpose
Explain a product in depth below its purchase area: technical specifications as a term and value list, and feature stories that pair a short text with an image. One component, several arrangements: a specification list with an optional image, feature stories in tabs, alternating text and image rows, an image grid with captions, and a split layout.

## Anatomy
- **Header**: title and an intro paragraph.
- **Specification list** (optional): a description list of term and value pairs (material, dimensions, origin, care). Values are plain text or short lists.
- **Feature items** (optional): each has a title, text and host media.
- **Tabs** (tabbed arrangement): Tabs (wave 1) whose tabs are feature groups; each panel holds one or more feature items.
- **Decorative media** (optional): one image behind or beside the header, hidden from assistive tech.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| title / intro | string | title required | Header. |
| headingLevel | 2 to 3 | 2 | Level of the title; feature titles are one level below. |
| specs | { term; value: string \| string[] }[] | none | Specification list. |
| features | { id; title; body; media?: Media }[] | none | Feature items. |
| groups | { id; label; features: feature[] }[] | none | Used by the tabbed arrangement. |
| arrangement | 'specs' \| 'tabs' \| 'alternating' \| 'grid' \| 'split' | 'specs' | Specs: list with optional side or background image. Alternating: rows swap text and image sides. Grid: images in a grid, each with caption. Split: text column beside one tall image. |
| specColumns | 1 \| 2 | 2 | Specification list columns on wide screens. |
| backgroundMedia | Media | none | Decorative image for the specs arrangement. |
| defaultGroup / group / onGroupChange | id / id / handler | first | Tab state (uncontrolled or controlled). |
| renderMedia | (media) => node | none | Host image renderer. |

## States
Static; loading (Skeleton lines and media frames); tabbed: selected tab; media missing (neutral frame, text still shown).

## Keyboard and ARIA
- `section` labelled by the title.
- Specification list uses description-list semantics (term and definition), not a table, since pairs have no shared columns.
- Tabs: APG **Tabs** with automatic activation (RAC `Tabs`); arrow keys move between tabs; Home and End jump; the panel is labelled by its tab.
- Feature media carries host alternative text; decorative background media is hidden.
- Alternating order is visual only: the DOM order is always title, text, then media, so reading order is stable.

## Responsive, touch, motion, forced colours
- All arrangements become one column on narrow screens with text before media.
- Tabs scroll horizontally on narrow screens rather than wrapping, with the selected tab scrolled into view.
- Background media fades behind the header only through a token-based overlay, never reduces text contrast.
- No motion beyond the tab panel crossfade (opacity only, removed under reduced motion).
- Forced colours: specification rows separated by system-colour rules; the selected tab has a system-colour indicator besides colour.
- Right-to-left: alternating rows start with media on the left side for the first row, mirroring the left-to-right order.

## Acceptance tests
- Given specs, then a description list with one term and one definition per pair renders.
- Given `arrangement="tabs"` with three groups, when Right Arrow is pressed on the first tab, then the second tab is selected and its panel shown.
- Given `arrangement="alternating"`, then the DOM order inside every row is title, text, media.
- Given a narrow container, then every arrangement is a single column.
- Given decorative background media, then it is hidden from assistive tech.

## Composition notes
Reuses Tabs, Heading, Text, Skeleton (wave 1). ProductDetail's collapsible detail sections are a different, compact pattern (see product-detail).
