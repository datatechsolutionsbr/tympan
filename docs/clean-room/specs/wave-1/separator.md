# Separator

Wave 1 · layout · Status: specified

## Purpose
Draws a thin rule between groups of content, optionally with a short centred caption.

## Anatomy
- **Rule**: the line.
- **Caption** (optional): short text centred on the rule (for example "or" between sign-in methods).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| orientation | 'horizontal' \| 'vertical' | 'horizontal' | Direction of the rule. |
| emphasis | 'regular' \| 'soft' | 'regular' | Line strength: `--fk-line` or a fainter step (§2.3). |
| caption | node | none | Text on the rule. |
| semantic | boolean | false | When true, exposes a separator role; when false it is decorative. |
| spacing | 'none' \| 'regular' \| 'roomy' | 'regular' | Margin from the spacing scale (§2.1). |

## States
Static.

## Keyboard and ARIA
- APG: not a widget; the non-focusable **separator** role applies only when `semantic` is true.
- RAC primitive: `Separator`.
- Decorative rules are hidden from assistive tech. A captioned rule keeps the caption readable as plain text; the line parts are decorative.
- Vertical semantic separators expose `aria-orientation="vertical"`.

## Responsive, touch, motion, forced colours
- Full width of the container; vertical ones take the height of their row.
- No motion.
- Forced colours: the rule uses `CanvasText` so it does not disappear.

## Acceptance tests
- Given default props, when rendered, then no separator role is exposed and nothing is announced.
- Given `semantic`, when rendered, then the element has role separator.
- Given `orientation="vertical"` and `semantic`, then `aria-orientation` is vertical.
- Given `caption="or"`, when rendered, then "or" is readable text and the lines are hidden from assistive tech.
- Given `emphasis="soft"`, when rendered, then the fainter line token is used.
- Given forced colours, then the line is visible.
