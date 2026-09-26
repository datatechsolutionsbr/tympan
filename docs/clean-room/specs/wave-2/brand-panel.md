# BrandPanel

Wave 2 · layout · Status: specified

## Purpose
Decorative, informative half-screen panel that presents the product (mark, headline, short claim, a few figures) next to an authentication form.

## Anatomy
- **Panel**: full-height region on the start side of AuthFrame.
- **Mark slot**: product mark at the top.
- **Headline block**: a glass sheet (§2.5 level 1) with a title and a one-to-two sentence subtitle.
- **Figure row**: two to four small tiles, each a value and a label.
- **Footnote** (optional): one line of meta text at the bottom (§2.2 `meta`).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| mark | node | required | Product mark. |
| title | string | required | Headline. |
| subtitle | string | required | Supporting sentence. |
| figures | `{ value: string; label: string }[]` | `[]` | Figure tiles, in order. |
| footnote | string | undefined | Bottom line (copyright, institution). |

## States
- Static; no interactive states. Hidden entirely below 1024 px (AuthFrame decides).

## Keyboard and ARIA
- Not focusable; contains no interactive elements.
- Rendered as a `complementary` region labelled by the title. Title is a heading one level below the page `h1`.
- Figures are a list: each item reads value then label as one phrase.
- Decorative layers (glows, patterns, light sweeps) are `aria-hidden` and carry no text.
- No APG pattern; no RAC primitive; custom.

## Responsive, touch, motion, forced colours
- Title uses `h1`-size serif type from §2.2 visually while keeping the lower heading level semantically.
- Accent limited to the brand teal (§2.3); no violet, fuchsia or extra orbs; at most the two calm orbs of the AmbientBackdrop.
- No animation of any kind.
- Reduced transparency: headline block and tiles become opaque surfaces.
- Forced colours: tiles and headline block show a 1 px border; decorative layers disappear.
- Text on the panel meets 4.5:1 contrast against the actual composited background in both themes.

## Acceptance tests
- Given title, subtitle and three figures, when rendered, then a complementary region named by the title contains a list of three items.
- Given the panel, when tabbing through the page, then no element inside the panel receives focus.
- Given no footnote, when rendered, then no empty footer line exists.
- Given forced colours, when rendered, then each figure tile has a visible border.
- Given dark theme, when checked with axe colour contrast, then there are no failures.
