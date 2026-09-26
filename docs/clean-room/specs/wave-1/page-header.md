# PageHeader

Wave 1 · layout · Status: specified

## Purpose
The single top-of-page block that names the page: optional breadcrumbs, eyebrow, title, reading summary, metadata and page actions. The same component, at a smaller scale, heads large banners and editor screens where the title is editable.

## Anatomy
- **Breadcrumbs** (optional): see Breadcrumbs.
- **Eyebrow** (optional): short uppercase context line above the title (`eyebrow` style, §2.2).
- **Leading icon** (optional): decorative icon in a neutral or accent-soft container.
- **Title**: the page's h1 (or a lower level when used inside a section); editable variant renders a text input that looks like the title.
- **Summary** (optional): one or two sentences in `body-lg`, max 60ch, saying what the screen shows.
- **Metadata row** (optional): items of icon plus short text (owner, date, count).
- **Actions** (optional): at most one primary button plus secondary buttons, aligned to the end.
- **Extra content** (optional): free slot below, for tags, tabs or filters.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| title | string | required | page title |
| headingLevel | 1 \| 2 \| 3 | 1 | heading level |
| scale | 'page' \| 'display' \| 'section' | 'page' | page uses `h1` style; display uses `display` style (login, public page only); section uses `h3` style |
| eyebrow | string | none | context line |
| summary | string | none | reading summary |
| icon | icon component | none | decorative leading icon |
| breadcrumbs | Array<{ label; href }> | none | rendered above the title |
| meta | Array<{ icon?: icon; text: string }> | none | metadata row |
| actions | node | none | page actions |
| children | node | none | extra content |
| headingId | string | generated | id for `aria-labelledby` of the page region |
| editableTitle | { value: string; onChange: (v: string) => void; placeholder: string; label: string } | none | renders the title as an input |

## States
- static; editable title: idle, hover, focus-visible, empty (placeholder shown), invalid (host-provided message under the title).
- Long titles wrap (never truncated on the page header); metadata items wrap to new lines.

## Keyboard and ARIA
- APG: no widget pattern. RAC: `Heading`; editable title uses `TextField` + `Input` with a visually hidden `Label` from `editableTitle.label`.
- Exactly one level-1 heading per page; the header provides it by default.
- Metadata icons are decorative; metadata text is plain text in reading order.
- Actions are in DOM order after the title so Tab reaches them after the breadcrumbs.

## Responsive, touch, motion, forced colours
- Spacing from design direction §2.1: top of page to h1 40/32/24 px by breakpoint; heading to content 16/16/12.
- Title uses `h1` token (30/38, mobile 24/32, serif), eyebrow sans (§2.2).
- Below 640 px actions move below the summary and span the width; each action at least 44 px tall.
- Only one primary (gradient) action per view (§2.10).
- No motion. Forced colours: editable title shows a system-colour border on focus.

## Acceptance tests
- Given title "Sources", Then there is one h1 with text "Sources".
- Given `headingLevel` 2 and scale section, Then the title is an h2.
- Given eyebrow, summary and meta, Then they render in the order eyebrow, title, summary, meta.
- Given breadcrumbs, Then a breadcrumb navigation precedes the title in DOM order.
- Given `editableTitle`, When the person types, Then `onChange` receives the new value and the input is named by `editableTitle.label`.
- Given a width below 640 px, Then actions render below the summary.
