# Text

Wave 1 · primitive · Status: specified

## Purpose
Renders running text in the type scale of the design direction, with inline strong emphasis and inline code.

## Anatomy
- **Paragraph**: block of running text.
- **Strong**: inline emphasis with semantic importance.
- **Code**: inline monospace fragment for identifiers, keys and hashes.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| size | 'body-lg' \| 'body' \| 'meta' | 'body' | Maps to the text tokens of §2.2. |
| tone | 'default' \| 'muted' \| 'danger' \| 'success' | 'default' | Ink level (§2.3 ink, ink-2, ink-3) or a semantic colour; semantic tones need a word or icon nearby. |
| as | 'p' \| 'span' \| 'div' | 'p' | Element semantics. |
| measure | 'none' \| 'prose' \| 'summary' | 'none' | Maximum line length (prose and summary widths in §2.2). |
| truncate | boolean \| number | false | Single-line ellipsis, or clamp to N lines; the full text is available as a tooltip/title. |
| numeric | boolean | false | Tabular figures for numbers (§2.2). |
| children | node | required | Content. |

Strong takes `children` only. Code takes `children` and optional `copyable` (boolean, default false) which delegates to the Copy Identifier behaviour in wave 2.

## States
Static. Truncated text exposes the full value on hover and focus when the host makes it focusable.

## Keyboard and ARIA
- No APG widget pattern; plain document semantics.
- No RAC primitive; custom (native elements).
- Strong uses the strong element, Code uses the code element; neither adds roles.
- Truncation must not hide content from assistive tech: the full text remains in the accessible tree.

## Responsive, touch, motion, forced colours
- Never below the 12 px floor of §2.2; honours user font scaling up to 200 % without clipping.
- Mono family only for identifiers (§2.2).
- No motion.
- Forced colours: text uses `CanvasText`; muted tone must still meet contrast because the system colours override it.

## Acceptance tests
- Given default props, when rendered, then a paragraph with body size is produced.
- Given `as="span"`, when rendered, then no block element is created.
- Given `truncate={2}` and long text, when rendered, then only two lines are visible and the full string is still in the accessible name/text.
- Given Strong, when rendered, then a strong element wraps the content.
- Given Code, when rendered, then a code element in the mono family wraps the content.
- Given `tone="muted"` on the light and dark surfaces, when contrast is measured, then it is at least 4.5:1.
