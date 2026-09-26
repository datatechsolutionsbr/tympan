# ResizableSplit

Wave 4 · layout · Status: specified

Written by the implementer from the APG Window Splitter pattern. No fork
counterpart.

## Purpose
Two panes side by side with a draggable, keyboard-operable divider, used for
queue + item, canvas + inspector and table + evidence layouts.

## Anatomy
- **Primary pane** and **secondary pane**.
- **Splitter**: a thin line with a wider invisible hit area (44 px).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| primary / secondary | node | required | Pane contents. |
| size / defaultSize / onSizeChange | number (px of the secondary pane) | 360 | Controlled or not. |
| min / max | number | 240 / 640 | Clamp. |
| secondarySide | 'start' \| 'end' | 'end' | Which side the sized pane is on. |
| step | number | 8 | Arrow key step. |
| label | string | required | Splitter name. |
| stackBelow | number | 1024 | Below this width the panes stack and the splitter disappears. |

## Keyboard and ARIA
APG Window Splitter: `role="separator"`, `aria-orientation="vertical"`,
`aria-valuenow/min/max` (the secondary pane size), `aria-controls` the
secondary pane, focusable; Left/Right arrows change the size by `step`
(direction follows `secondarySide` and reading direction), Home and End go
to min and max, Enter toggles between the current size and min.

## Responsive, touch, motion, forced colours
- Pointer drag with pointer capture; touch works the same way.
- No animation while dragging. Forced colours: splitter in `CanvasText`,
  focus in `Highlight`.

## Acceptance tests
- Given the splitter focused, when Left Arrow is pressed with the secondary pane at the end, then the size grows by `step`.
- Given Home, then the size is `min`; End, `max`.
- Given a drag of 40 px towards the start, then the size grows by 40 px within the clamp.
- Given a width below `stackBelow`, then no separator is rendered and the panes stack.
