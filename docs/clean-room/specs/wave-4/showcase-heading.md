# ShowcaseHeading (with Kicker and Lead)

Wave 4 · primitive · Status: specified

## Purpose
The opening text block of a public, showcase-style page (the login page and the public page of a research project, the only places where design direction §2.2 allows the `display` step): a kicker line, a large title and a lead paragraph. Inside the authenticated app, use Heading and PageHeader instead.

## Anatomy
- **Kicker** (optional): a short line above the title that names the topic or section. Uses the `eyebrow` step of §2.2 and the accent colour of §2.3. It is not part of the heading text.
- **Title**: the heading element. Serif family, `display` step on wide screens stepping down to `h1` on narrow screens (§2.2).
- **Lead** (optional): one reading paragraph under the title, `body-lg` step of §2.2, measure limited to the reading width of §2.2.

The three parts are exported separately (ShowcaseHeading, Kicker, Lead) so a page can place a Kicker above other content, but ShowcaseHeading also accepts `kicker` and `lead` directly.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| level | 1 \| 2 \| 3 | 1 | Document outline level of the title. |
| kicker | string | none | Kicker text. |
| lead | node | none | Lead paragraph content. |
| align | 'start' \| 'center' | 'start' | Horizontal alignment of the whole block. |
| id | string | auto | Id of the title, for `aria-labelledby` on the enclosing section. |
| children | node | required | Title text. |

Kicker and Lead standalone: `children` only, plus `as` for Lead (paragraph by default).

## States
Static text only. No colour variants: the title uses `--fk-ink`, the lead `--fk-ink-2`, the kicker `--fk-accent`. A dark surface is handled by the theme, not by a per-instance switch.

## Keyboard and ARIA
- Title is a real heading at `level`; the kicker is outside the heading element and is referenced by the enclosing region label only if the host asks (it is not read as part of the heading by default).
- No interactive parts; nothing focusable.

## Responsive, touch, motion, forced colours
- The title steps down one size below the 640 breakpoint (§2.8); lines are balanced so a single word is not left alone.
- No entrance animation.
- Forced colours: all text uses `CanvasText`; the kicker keeps its weight so it is still distinct.

## Acceptance tests
- Given level 2, when rendered, then exactly one h2 contains the title text and the kicker text is outside it.
- Given a lead longer than the reading measure, when rendered, then the paragraph wraps at the reading width.
- Given align center, when rendered, then kicker, title and lead are all centred.
- Given no kicker and no lead, when rendered, then only the heading element is produced.

## Composition notes
Pairs with ShowcaseBackdrop, HighlightStat and FeatureTile on public pages. Design direction §6 still applies: one primary button per view, no decorative dashes in copy.
