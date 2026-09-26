# SectionHeading

Wave 1 · layout · Status: specified

## Purpose
Head a section inside a page or a sheet: title, optional subtitle, optional icon, and trailing actions or controls for that section only.

## Anatomy
- **Leading icon** (optional, decorative).
- **Title**: h2 (sheet level) or h3 (inside a sheet).
- **Subtitle** (optional): one line of `meta` text.
- **Trailing slot** (optional): section actions, a count, a toggle or a link.
- **Extra content** (optional): slot under the heading row.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| title | string | required | section name |
| level | 2 \| 3 \| 4 | 2 | heading level; visual style follows `h2` or `h3` tokens (§2.2) |
| subtitle | string | none | supporting line |
| icon | icon component | none | decorative icon |
| trailing | node | none | section actions |
| children | node | none | extra content |
| id | string | generated | heading id, so the section can be `aria-labelledby` it |

## States
- static. Title truncates only when `truncate` is requested by the host (full text stays accessible and in a title tooltip); by default it wraps.

## Keyboard and ARIA
- APG: no widget pattern. RAC: `Heading`.
- The heading id is exposed so the enclosing section can be a region labelled by it.
- Trailing controls follow the title in DOM order.

## Responsive, touch, motion, forced colours
- Between heading and content: 16 px (12 px below 768 px), per §2.1.
- Below 640 px the trailing slot wraps under the title when it does not fit; touch targets inside remain 44 px.
- No motion; forced colours: nothing relies on colour; icon uses `CanvasText`.

## Acceptance tests
- Given title "Members" and level 3, Then an h3 "Members" exists.
- Given `trailing` with a button, Then the button follows the heading in tab order.
- Given the component's `id`, When a section uses `aria-labelledby` with it, Then the section is named "Members".
- Given a subtitle, Then it is rendered as text after the title and is not a heading.
- Given a narrow container, Then the trailing slot wraps without overlapping the title.
