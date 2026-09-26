# StageStrip

Wave 4 · navigation · Status: specified

Written by the implementer from the overview storyboard ("da busca ao
manuscrito") and design direction §3.5 (flow in five stages). No fork
counterpart.

## Purpose
A pipeline of research stages from search to manuscript, each with its
counts and a link to the module, joined by arrows; shows where the research
is and what is pending.

## Anatomy
- **Title** (optional).
- **Stage**: name, one or two figures in `meta`, a status (done, current,
  upcoming, attention) shown by icon and word, optional link.
- **Arrow** between stages (decorative).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| stages | Array<{ id; label; href?; status: 'done' \| 'current' \| 'upcoming' \| 'attention'; figures?: string[] }> | required | Stages in order. |
| label | string | required | Name of the list. |

## Keyboard and ARIA
- An ordered list labelled by `label`; each stage is a list item; linked
  stages are links; the current stage has `aria-current="step"`.
- Status is announced by its word; arrows are `aria-hidden`.

## Responsive, touch, motion, forced colours
- Horizontal row ≥ 1024 px with arrows; below, a vertical list with arrows
  pointing down (§3.5 mobile).
- Links keep a 44 px hit area. No motion.
- Forced colours: current stage has a 2 px system border.

## Acceptance tests
- Given five stages, then an ordered list with five items is rendered in order.
- Given the current stage, then it has `aria-current="step"` and the word for "current".
- Given an attention stage, then an icon and the word for attention are present.
- Given hrefs, then each stage name is a link.
