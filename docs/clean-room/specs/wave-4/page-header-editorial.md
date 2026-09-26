# PageHeader editorial variant

Wave 4 · layout · Status: specified · Extends `wave-1/page-header.md`

Written by the implementer from the approved storyboards and design direction
§2.1, §2.2, §3.5. No fork counterpart.

## Purpose
The page head used inside the research shell's sheet: a quiet mono
breadcrumb line, a serif title, an optional lead paragraph, actions on the
end side and a divider below. It replaces the top bar's breadcrumbs.

## Anatomy
- **Trail line**: the breadcrumb levels in mono `meta`, separated by a
  slash-like glyph drawn in CSS, inside a breadcrumb `nav`.
- **Title**: h1, serif (`h1` token).
- **Lead** (optional): `body-lg`, max 68ch.
- **Actions** (optional): end-aligned, at most one primary.
- **Divider**: a hairline under the block.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| variant | 'standard' \| 'editorial' | 'standard' | Chooses this variant. |
| trail | Array<{ label; href? }> | none | Mono breadcrumb line; the last level is the current page. |
| lead | string or node | none | Lead paragraph. |
| divider | boolean | true (editorial) | Hairline below. |
| other wave-1 props | | | title, headingLevel, actions, meta, children… |

## Keyboard and ARIA
- The trail is a `nav` labelled "Breadcrumb" with an ordered list; the last
  level has `aria-current="page"` and is not a link.
- Actions follow the title in DOM order.
- The divider is decorative (a border), not a `separator` role.

## Responsive, touch, motion, forced colours
- Below 640 px the actions move below the lead and span the width.
- Trail levels truncate with an ellipsis except the last one; each link keeps
  a 44 px hit height.
- No motion. Forced colours: divider uses `CanvasText`.

## Acceptance tests
- Given variant editorial with a trail of three levels, then a breadcrumb navigation precedes the h1 and the last level is marked current and is not a link.
- Given a lead, then it follows the title and the stylesheet limits it to 68ch.
- Given actions, then they come after the title in DOM order.
- Given `divider` false, then no divider is drawn.
