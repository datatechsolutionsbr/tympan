# FeatureShowcaseCard

Wave 4 · data display · Status: specified

## Purpose
A large card for public showcase pages that pairs an illustration or product capture with a kicker, a title and a short description, laid out in an uneven mosaic of cards of different widths (for example one wide card next to one narrow card). It explains one capability of the product.

## Anatomy
- **Card**: elevation level 2 (§2.5), `--fk-radius-card` (§2.4), clipping its content.
- **Media area**: top part, fixed aspect chosen by the host, holding any node (image, capture, small diagram). The area has a sunken background (`--fk-surface-sunken`) while media loads.
- **Edge fades** (optional): a fade from the card surface over the top and/or bottom of the media, so a capture blends into the card.
- **Kicker**: `eyebrow` step (§2.2) in the accent colour.
- **Title**: `h3` step, serif (§2.2).
- **Description**: `body` step, measure limited to the reading width.
- **Link** (optional): makes the whole card a single link to a detail page.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| media | node | required | Content of the media area. |
| mediaAlt | string | none | Text alternative when the media carries information; omit for decorative media. |
| kicker | string | required | Short topic label. |
| title | string | required | Card title. |
| description | node | required | One or two sentences. |
| fade | ('top' \| 'bottom')[] | [] | Which edges of the media fade into the card. |
| href | string | none | Whole-card link target (through RouterAdapter). |
| headingLevel | 2 \| 3 \| 4 | 3 | Level of the title element. |
| span | 'narrow' \| 'wide' | 'narrow' | Hint for the mosaic grid (columns taken at wide widths). |

## States
Rest; with `href`: hover (border moves to `--fk-line-strong`, no lift), focus-visible (focus ring of §2.6 around the whole card), pressed.

## Keyboard and ARIA
- Without `href`: an `article` labelled by its title; nothing focusable.
- With `href`: the title contains the link, and the link's hit area is stretched over the card, so there is one tab stop whose name is the title (not the whole card text). The description stays readable as normal text (APG Link pattern; RAC `Link`).
- Media with `mediaAlt` is exposed as an image with that name; otherwise it is hidden.

## Responsive, touch, motion, forced colours
- In the mosaic, `wide` spans two thirds and `narrow` one third from the 1024 breakpoint; below it every card is full width and stacked (§2.8).
- No hover lift, no hover scale, no entrance animation (§2.7).
- Edge fades are removed under forced colours; the card keeps a 1 px `CanvasText` border.
- Whole card is at least 44 px tall as a target (always true given its size).

## Acceptance tests
- Given `href`, when the page is tabbed through, then the card has exactly one tab stop and its name equals the title.
- Given no `href`, when tabbed through, then the card has no tab stop.
- Given `mediaAlt`, when inspected, then an image with that name is present; without it, the media is hidden from the accessibility tree.
- Given fade top, when forced colours are active, then no fade is drawn.
- Given a viewport under 1024 with two wide cards, when rendered, then both are full width and stacked.

## Composition notes
Design direction §6 forbids a row of three identical cards; the mosaic's mixed spans are what keep this component within the rule. Use only on public pages.
