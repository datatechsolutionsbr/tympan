# PageDots

Wave 2 · navigation · Status: specified

## Purpose
Row of small dots that shows which page of a carousel, onboarding sequence or slide deck is visible, and optionally lets people jump to a page.

## Anatomy
- **Row**: horizontal group of dots.
- **Dot**: small circle; the current one is emphasised either by fill (appearance `dot`) or by stretching into a short pill (appearance `pill`).
- Optional **counter** text ("3 of 7") for long sequences.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| count | number | required | Number of pages. |
| currentIndex | number | required | Zero-based visible page. |
| onSelect | `(index: number) => void` | undefined | Makes dots selectable. |
| appearance | `'dot' \| 'pill'` | `'dot'` | Emphasis style for the current page. |
| size | `'small' \| 'medium' \| 'large'` | `'medium'` | Visual size only; hit area is unaffected. |
| contrast | `'onSurface' \| 'onLight' \| 'onDark'` | `'onSurface'` | Adapts colours to the background (for use over imagery). |
| label | string | i18n "pages" | Accessible name of the group. |
| dotLabel | `(n: number, total: number) => string` | i18n "page n of total" | Accessible name per dot. |
| maxDots | number | 9 | Above this, show the counter instead of individual dots. |

## States
- Current, other, hover and focus-visible (selectable only), disabled (not selectable).

## Keyboard and ARIA
- Selectable: APG Tabs pattern is appropriate only when dots control tab panels; for carousels use the APG Carousel pattern's "picker" (a group of buttons with `aria-current="true"` on the current one). RAC `ToggleButtonGroup` with single selection, or plain `Button`s. Left/Right arrows move between dots when implemented as a roving group.
- Not selectable: a single element with text "page n of total"; individual dots are `aria-hidden`.
- The fork uses tab roles without panels; this spec avoids that.

## Responsive, touch, motion, forced colours
- Each selectable dot has a hit area of at least 44 × 44 px on touch (24 px minimum on pointer-fine devices), independent of the visible size.
- Emphasis change is instant under reduced motion; otherwise a short width or opacity change within `--fk-dur-instant` (§2.7), no spring.
- Forced colours: current dot uses system highlight, others a system text outline.

## Acceptance tests
- Given count 5 and current 2 with `onSelect`, when rendered, then five buttons exist and the third has `aria-current="true"`.
- Given focus on a dot, when Enter is pressed, then `onSelect` receives its index.
- Given no `onSelect`, when rendered, then no dot is focusable and the text "page 3 of 5" is exposed.
- Given count 12 and `maxDots` 9, when rendered, then a counter replaces the dots.
- Given size small on a touch device, when measuring a dot's hit area, then it is at least 44 × 44 px.
