# MarkdownView

Wave 2 · data display · Status: specified

## Purpose
Safely renders a small, product-relevant subset of Markdown written by people or produced by models, without ever interpreting raw HTML.

## Supported subset
- **Blocks**: paragraphs (consecutive non-empty lines joined), unordered lists (`-` or `*` bullets), ordered lists (number followed by `.` or `)`), headings of levels 1 to 4, fenced code blocks with optional language tag. Blank lines separate blocks. CRLF is normalised.
- **Inline**: code spans, strong, emphasis, links of the form text-in-brackets followed by URL-in-parentheses.
- Everything else is shown as literal text.

## Safety rules
- Output is built as elements, never by injecting an HTML string. Angle brackets and entities render literally.
- Links are created only for `http` and `https` URLs; any other scheme (javascript, data, file, relative) renders as plain text.
- External links open in a new tab with no opener and no referrer, and carry a visually hidden "opens in a new tab" suffix.
- An unclosed code fence absorbs the rest of the input as code.
- No images, no raw HTML, no tables in this version.

## Anatomy
- Prose container limited to 68ch (§2.2).
- Headings: rendered as real headings at a level offset by `headingBase` (so a document heading 1 becomes the host's chosen level), styled with the serif scale.
- Code blocks: sunken surface (§2.3 `--fk-surface-sunken`), mono text, horizontal scroll inside the block only, language tag shown as meta when present.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| text | string | required | Markdown source. |
| headingBase | 2 to 6 | 3 | Level used for a Markdown level-1 heading; deeper levels follow, capped at 6. |
| density | `'regular' \| 'compact'` | `'regular'` | Spacing between blocks. |

## States
- Static. Empty text renders nothing.

## Keyboard and ARIA
- Links are the only focusable elements (plus code blocks, which are focusable scroll regions with a label when they overflow).
- Lists use list semantics; code blocks use `pre`/`code` semantics.
- No APG pattern; no RAC primitive except `Link`.

## Responsive, touch, motion, forced colours
- Long words and URLs wrap; no page-level horizontal scroll at 320 px.
- Link targets at least 24 px line height inline; standalone links 44 px.
- Forced colours: links keep underline; code blocks keep a border.

## Acceptance tests
- Given `# Title`, when rendered with base 3, then an `h3` "Title" exists.
- Given lines `- a` and `* b`, when rendered, then one unordered list with two items exists.
- Given `1) x` and `2) y`, when rendered, then an ordered list exists.
- Given a fence with language `sql`, when rendered, then a code block with the tag "sql" exists.
- Given `[x](javascript:alert(1))`, when rendered, then no link is created.
- Given `<b>hi</b>`, when rendered, then the angle brackets appear as text.
- Given `**bold** and *em* and a code span`, when rendered, then strong, emphasis and code elements exist with surrounding text kept.
- Given an https link, when rendered, then it opens in a new tab with no opener.

## Open questions
- The fork renders headings as bold paragraphs, which loses document structure; this spec requires real headings with an offset.
