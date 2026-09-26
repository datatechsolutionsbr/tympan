# DeltaIndicator

Wave 2 · data display · Status: specified

## Purpose
Shows the direction and size of a change (growth, variation, difference between editions) as an arrow plus signed value.

## Anatomy
- **Direction glyph**: up, down, or flat.
- **Value** (optional visibility): signed number or percentage.
- **Container**: either inline text or a small pill (§2.4 pill).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| value | number or null | required | Change; null renders nothing. |
| unit | `'percent' \| 'number'` | `'percent'` | Formatting of the value via Formatters and current locale. |
| format | `(value: number, unit) => string` | undefined | Custom formatter. |
| showValue | boolean | true | Show the number next to the glyph. |
| hideWhenZero | boolean | false | Render nothing for zero when the value is hidden. |
| appearance | `'inline' \| 'pill'` | `'inline'` | Bare text or pill. |
| size | `'small' \| 'medium'` | `'small'` | Scale. |
| polarity | `'higher-is-better' \| 'lower-is-better' \| 'neutral'` | `'higher-is-better'` | Maps direction to success or error tone; `neutral` uses ink colours only. |

## States
- Positive, negative, zero. Tone follows polarity; zero is always neutral.

## Keyboard and ARIA
- Not interactive. Not a live region by default (the fork marks it as a status on every render; this spec does not, to avoid noise).
- Accessible text spells the direction: a visually hidden word ("up", "down", "no change") from i18n precedes the value; the glyph is `aria-hidden`.
- No APG pattern; no RAC primitive; custom.

## Responsive, touch, motion, forced colours
- Minimum text 12 px (§2.2). Colour never alone: glyph and sign always present.
- No animation.
- Forced colours: pill border visible; glyph remains.

## Acceptance tests
- Given 12.34 percent, when rendered, then "+12.3%" (locale formatted) and an up glyph appear and the accessible text includes "up".
- Given −3 as number, when rendered, then "−3" and a down glyph appear.
- Given 0 with `hideWhenZero` and `showValue` false, when rendered, then nothing is rendered.
- Given null, when rendered, then nothing is rendered.
- Given polarity lower-is-better and a positive value, when rendered, then the error tone is used.
- Given pill appearance in forced colours, when rendered, then a border is visible.
