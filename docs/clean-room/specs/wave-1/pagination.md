# Pagination

Wave 1 · navigation · Status: specified

## Purpose
Move through a paged collection, showing where the reader is and, optionally, choosing how many items per page.

## Anatomy
- **Range summary**: "items a to b of total" text.
- **Previous / Next buttons**.
- **Page buttons**: first, last, the current page and its neighbours, with **ellipsis gaps** between non-adjacent numbers.
- **Compact indicator** (narrow screens): "page n of m" between Previous and Next.
- **Page size selector** (optional).

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| page | number (1-based) | required | current page |
| pageCount | number | required | total pages |
| totalItems | number | required | used for the range summary |
| pageSize | number | required | items per page |
| onPageChange | (page: number) => void | required | requested page |
| pageSizeOptions | number[] | none | when present, shows the page size selector |
| onPageSizeChange | (size: number) => void | none | requested size; host resets to page 1 |
| siblingCount | number | 1 | neighbours shown on each side of the current page |
| busy | boolean | false | disables all controls while a page is loading |
| labels | { navigation, previous, next, pageSize, range(from,to,total), page(n) } | from I18nAdapter | all visible and accessible strings |
| hideWhenSinglePage | boolean | true | renders nothing when there is one page and no size selector |

## States
- Previous disabled on the first page, Next disabled on the last.
- Current page button marked current; others idle, hover, focus-visible, pressed.
- busy: controls disabled and region `aria-busy`.

## Keyboard and ARIA
- APG: no dedicated pattern; follow the landmark guidance. Container is a `navigation` landmark labelled by `labels.navigation`. RAC: `Button` for each control, `Select` (or NativeSelect) for page size.
- Current page button has `aria-current="page"`; each number button's accessible name reads "Page n".
- Ellipsis is decorative and hidden from assistive tech.
- Tab moves through the enabled controls in visual order. Focus stays on the activated control after the page changes; if it becomes disabled, focus moves to the other arrow.
- After a page change, the host should move focus or announce the new range; the component exposes the range summary as a polite status.

## Responsive, touch, motion, forced colours
- Below 640 px only Previous, the compact indicator and Next show.
- Every button has a 44 × 44 px hit area; in the compact table density the visible size may be smaller (§2.10) but the hit area is not.
- Numbers use tabular figures (§2.2). Current page uses `--fk-accent-soft` and `--fk-accent` text (§2.3).
- No motion. Forced colours: current page has a system-colour border.

## Acceptance tests
- Given page 1 of 10, Then Previous is disabled, pages 1, 2, …, 10 are shown and page 1 has `aria-current="page"`.
- Given page 5 of 10, Then the buttons show 1, gap, 4, 5, 6, gap, 10.
- Given page 3 of 3, When Next is inspected, Then it is disabled.
- Given page 2, When page 3 is activated, Then `onPageChange(3)` is called.
- Given page size options, When 50 is chosen, Then `onPageSizeChange(50)` is called.
- Given `busy`, Then all page buttons are disabled.
- Given one page and no size options, Then nothing is rendered.
- Given a width below 640 px, Then "Page 2 of 10" is visible and number buttons are not.
