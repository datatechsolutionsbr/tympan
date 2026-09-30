# AspectFrame

Wave 5 · layout · Status: specified

Behaviour reference: shadcn/ui (MIT), read by the spec writer only.

## Purpose
A box that keeps a fixed width-to-height ratio at any width, for images, video, maps and embeds, so that layout does not jump while media loads.

## Anatomy
- **Frame**: sized by its width; height follows the ratio.
- **Content**: fills the frame (image, video, iframe, map, placeholder).
- **Placeholder** (optional): shown until the content reports it has loaded (Skeleton fill or a neutral surface with an icon).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| ratio | number or named ('square' \| 'landscape' \| 'widescreen' \| 'portrait') | 'landscape' | Width divided by height. Named ratios map to fixed numbers in the implementation, not per use. |
| fit | 'cover' \| 'contain' | 'cover' | How media fills the frame. |
| rounded | boolean | true | Rounds the frame corners. |
| placeholder | 'none' \| 'skeleton' \| 'icon' | 'skeleton' | Shown until `loaded`. |
| loaded | boolean | true | Host or child reports load; hides the placeholder. |
| children | node | required | Content. |

## States
Loading (placeholder), loaded, failed (host swaps content; the frame keeps its size).

## Keyboard and ARIA
- Purely presentational; no role of its own. The content carries its own semantics (image alt text, iframe title, video captions).
- The placeholder is hidden from assistive tech; when loading is meaningful the host places a Spinner or status text elsewhere.

## Responsive, touch, motion, forced colours
- The frame never exceeds its container width; when a maximum height is set by the host, the width shrinks to keep the ratio.
- Radius `--ty-radius-card` when rounded; placeholder fill `--ty-surface-sunken` and SkeletonFill shimmer, which stops under reduced motion.
- Forced colours: a `CanvasText` outline so an empty frame is still visible.

## Acceptance tests
- Given `ratio="square"` and a container width, then the rendered height equals the width.
- Given ratio 16/9 inside a narrower container, then the height shrinks proportionally.
- Given `loaded` false, then the placeholder shows and is hidden from assistive tech; given true, it is gone.
- Given `fit="contain"` with a tall image in a landscape frame, then the whole image is visible.
- Given reduced motion, then the placeholder does not animate.
