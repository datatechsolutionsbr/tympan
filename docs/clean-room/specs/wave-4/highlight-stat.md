# HighlightStat

Wave 4 · data display · Status: specified

## Purpose
One headline figure with its label on a public showcase page (for example the number of documented cases of a public research project). It is the public-page counterpart of StatTile (wave 2), which remains the component for the authenticated app.

## Anatomy
- **Container**: either no surface (figure sits on the section, separated by RuledGrid rules) or elevation level 2 (§2.5). Never a filled gradient: the CTA gradient is reserved (§2.3).
- **Value**: serif, the KPI step of §2.2, tabular numerals; optionally a RevealNumber.
- **Label**: what the figure counts, `body` step.
- **Source line** (optional): `meta` step saying where the figure comes from (edition, date), with a link when available. Design direction §3.5: every number is traceable.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| value | number or string | required | Figure; a number may be revealed. |
| label | string | required | What is counted. |
| reveal | boolean | false | Render the value through RevealNumber (numbers only). |
| format | (n: number) => string | Formatters default | Used for numbers. |
| source | { text: string; href?: string } | none | Source line. |
| surface | 'none' \| 'raised' | 'none' | Whether to draw a card. |

## States
Static; revealing (when `reveal`); with source link (the link has its own hover and focus states).

## Keyboard and ARIA
- A `figure`-like group: name = label, description = value and source. The value is read as its final value (see RevealNumber).
- Only the source link is focusable.

## Responsive, touch, motion, forced colours
- No hover effects, no scale, no entrance fade (§2.7). Counting only through RevealNumber and only without reduced motion.
- Several HighlightStats in a row are laid out in RuledGrid, never as a row of identical cards (§6).
- Forced colours: plain text; raised surface keeps a system border.

## Acceptance tests
- Given value 94 and label "cases", when read by a screen reader, then it hears the label and 94 once.
- Given reveal and reduced motion, when rendered, then the final value shows at once.
- Given a source with href, when tabbed, then the only tab stop is the source link.
- Given surface none, when rendered, then no card border or shadow is drawn.
