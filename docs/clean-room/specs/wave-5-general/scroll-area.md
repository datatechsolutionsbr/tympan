# ScrollArea

Wave 5 · layout · Status: specified

Behaviour reference: shadcn/ui (MIT), read by the spec writer only.

## Purpose
A bounded region whose content scrolls, with native scrolling (no scroll hijacking), themed thin scrollbars, optional edge fades that show more content exists, and keyboard access when the content has no focusable elements.

## Anatomy
- **Viewport**: the scrolling element (native scrolling).
- **Content**.
- **Scrollbars**: the platform scrollbars, themed thin where the platform allows.
- **Edge fades** (optional): soft cut at the edges that still have hidden content.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| orientation | 'vertical' \| 'horizontal' \| 'both' | 'vertical' | Scroll axes. |
| label | string | required when focusable | Name of the region. |
| focusable | 'auto' \| true \| false | 'auto' | Auto: the viewport joins the tab order only when it overflows and contains no focusable element. |
| fades | boolean | false | Edge fades on overflowing edges. |
| scrollbar | 'auto' \| 'thin' \| 'hidden' | 'thin' | Hidden keeps scrolling but hides the bar (use only with visible fades or controls). |
| stableGutter | boolean | true | Reserves scrollbar space so content does not shift when overflow appears. |
| maxBlockSize / maxInlineSize | size token or layout value from the host | none | Bounds. |
| onScrollEdgeChange | ({ start, end }) => void | none | Reports which edges can still scroll. |
| children | node | required | Content. |

## States
Fits (no overflow), overflowing at start, middle or end, focused (focus-visible), scrolling.

## Keyboard and ARIA
- No RAC primitive needed; native scroll container.
- When focusable: `role="region"` named by `label`, `tabindex` 0; arrow keys, Page Up and Down, Home and End, and Space scroll natively.
- Scroll position is exposed as a data state for styling (`start`, `end`), never announced.
- Content order, find-in-page and text selection behave natively.

## Responsive, touch, motion, forced colours
- Touch and trackpad scrolling are native, with momentum; overscroll is contained so scrolling the region does not scroll the page behind it.
- Thin scrollbar thumb colour `--ty-line-strong` on a transparent track; focus ring `--ty-focus-ring`.
- Fades blend to the surface colour behind the region; they are removed at an edge with no hidden content.
- Programmatic scrolling uses smooth behaviour only when motion is allowed.
- Forced colours: fades are removed (they would hide text), scrollbars use system colours.

## Acceptance tests
- Given content taller than the region and no focusable children, then the viewport is in the tab order and named by `label`.
- Given content with a link inside, then the viewport is not an extra tab stop in `auto` mode.
- Given content that fits, then no fade shows and the viewport is not focusable.
- Given the region scrolled to the top, then only the bottom fade shows; at the bottom, only the top fade.
- Given `stableGutter`, when content grows to overflow, then the content width does not change.
- Given the region focused, when Page Down is pressed, then it scrolls by one page.
- Given forced colours, then no fade is drawn.
