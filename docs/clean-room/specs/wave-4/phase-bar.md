# PhaseBar

Wave 4 · data display · Status: specified

Written by the implementer from the overview storyboard ("phase bar") and
design direction §3.5 (stacked proof-state bar with texture and a textual
legend). No fork counterpart.

## Purpose
One horizontal bar split into segments by share (proof states of the
research, or the phases of an instrument), with a textual legend, so the
distribution reads at a glance and in words.

## Anatomy
- **Bar**: segments proportional to their values; proof segments use the
  proof colours plus the §2.11 textures (stripes, cross-hatch, dots).
- **Legend**: each segment's word and count, as text.
- **Caption** (optional): the reading sentence under the bar.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| segments | Array<{ id; label; value: number; tone: ProofState \| 'none' \| 'accent' \| 'neutral' }> | required | Segments in order. |
| label | string | required | Name of the bar. |
| caption | node | none | Reading sentence. |
| locale | string | adapter | Number formatting. |

## Keyboard and ARIA
- The bar is an image (`role="img"`) whose name lists every segment with its
  count; the legend is a list with the same facts, so nothing depends on
  colour or texture.

## Responsive, touch, motion, forced colours
- Segments narrower than 2 px are drawn at 2 px so they stay visible.
- No motion. Forced colours: segments drawn with system colours and
  borders; textures stay.

## Acceptance tests
- Given three segments, then the image name includes each label and count.
- Given values 3 and 1, then the first segment's share is 75 %.
- Given a zero total, then the bar renders an empty track and the legend still lists zeros.
