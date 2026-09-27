# ReviewSummary and ReviewList

Wave 5 · commerce · data display · Status: specified

## Purpose
Show what buyers think of a product: an aggregate (average rating, total count, distribution by star level) with an invitation to add one's own review, and the individual reviews (rating, optional title, text, author, date, optional avatar). Two components that are usually placed together, with several arrangements for the list.

## Anatomy
- **ReviewSummary**:
  - average as RatingDisplay plus the written average and the total number of ratings;
  - distribution: one row per star level (highest first) with the level, a meter (ProgressBar, wave 1) of its share, and the share written as a percentage; a row may be a filter button;
  - call to action: a heading, one line, and a "review this product" Button supplied by the host.
- **ReviewList**:
  - optional list heading;
  - each **Review**: RatingDisplay (without count), optional title, body text, author name, optional Avatar (wave 1) with host image or initials, date (a `time` element formatted by Formatters), optional "verified purchase" Tag, optional variant bought, optional helpful votes (two buttons with counts), optional merchant reply (indented block with its own author line);
  - load more or Pagination (wave 1) at the end.
- **Sort and filter** (optional): a NativeSelect for sort (most recent, highest, lowest, most helpful: labels from the host) and the distribution rows acting as a filter by star level; active filter shown as FilterChips (wave 2).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| summary | { average; count; distribution: { stars; count }[] } | required (ReviewSummary) | Aggregate. |
| onWriteReview | () => void or href | none | Call to action; hidden when absent. |
| distributionAsFilter | boolean | false | Rows become toggle buttons that filter the list. |
| starFilter / onStarFilterChange | number[] / handler | none | Controlled filter. |
| reviews | { id; rating; title?; body; author; avatar?: Media; date: ISO; verified?; variantLabel?; helpful?: { up; down; voted? }; reply?: { author; body; date } }[] | required (ReviewList) | Reviews. |
| arrangement | 'stacked' \| 'columns' \| 'with-avatars' \| 'split-meta' | 'stacked' | Stacked: one per row. Columns: grid of review cards. With-avatars: avatar and author line on top. Split-meta: author and date in a side column on wide screens. |
| sortOptions / sort / onSortChange | list / value / handler | none | Sorting. |
| onHelpfulVote | (id, 'up' \| 'down') => void | none | Enables helpful buttons. |
| pagination | Pagination props or { onLoadMore; hasMore; loadingMore } | none | Paging. |
| bodyFormat | 'text' \| 'markdown' | 'text' | Markdown goes through MarkdownView; raw HTML is never rendered. |
| truncateBody | number of lines or none | none | Long bodies clamp with a "read more" Disclosure. |
| status | 'ready' \| 'loading' \| 'empty' \| 'error' | 'ready' | List state. |
| labels | object | from I18nAdapter | Ratings in total, share at N stars, review this product, helpful, verified purchase, read more, read less, reply from, no reviews yet. |

## States
Ready; loading (Skeleton reviews); empty ("no reviews yet" EmptyState with the write-review call to action); error (ErrorState with retry); filtered with no match (EmptyState "no reviews with N stars" and a clear filter action); helpful vote pending and recorded (count increments, button pressed); body expanded or clamped; loading more (in-button spinner on "load more").

## Keyboard and ARIA
- ReviewSummary is a `section` labelled by its heading. Distribution rows form a list; each meter is a RAC `ProgressBar` with `aria-valuetext` "{share} of reviews gave {stars} stars" (from i18n) so the bar is never the only carrier. As filters, rows are toggle buttons with `aria-pressed`.
- ReviewList is a `section`; reviews are a list of `article` elements labelled by the title (or the author when no title), each with the rating's accessible name first.
- Dates use `time` with a machine-readable value.
- Helpful buttons: `aria-pressed` once voted, with the count in the name ("Helpful, 12").
- Read more: APG **Disclosure** that reveals the rest of the text; focus stays on the button.
- Load more: after new items load, focus moves to the first new review and the count loaded is announced politely.

## Responsive, touch, motion, forced colours
- Summary and list sit side by side on wide screens (summary as a narrow column) and stack on narrow screens.
- Columns arrangement reflows from three to one column by container width; split-meta moves the author line above the body on narrow screens.
- No motion beyond meters filling once on first render, removed under reduced motion.
- Forced colours: meters draw track and fill with system colours; star glyphs use `CanvasText` with filled and outlined shapes distinguishing states.
- Right-to-left: meters fill from the right; star rows fill from the right.

## Acceptance tests
- Given a distribution of five levels, then five rows render, highest first, each with a written percentage that sums to one hundred within rounding.
- Given a level with zero reviews, then its meter is empty and its percentage reads zero.
- Given `distributionAsFilter` and the row for four stars pressed, then `onStarFilterChange` fires with four and the row reports pressed.
- Given a review body with markup characters and `bodyFormat="text"`, then they render as text.
- Given `truncateBody` and a long body, when read more is activated, then the full text is shown and the button's expanded state is true.
- Given `onLoadMore` resolves with five new reviews, then focus moves to the first new review.
- Given no reviews, then an empty state with the write-review action is shown.
- Given a date and locale pt-BR, then the date is written in Brazilian order; given en, in English order.
- Given axe, then no violations; every meter has a value text.

## Composition notes
Reuses RatingDisplay (commerce primitives), ProgressBar, Avatar, Tag, Button, NativeSelect, Pagination, Skeleton, EmptyState, ErrorState (wave 1), FilterChips, Formatters, MarkdownView (wave 2). Writing a review is a host form (FormLayout, TextArea, SwatchGroup-like rating input) and is out of scope.

## Open questions
- A rating input (choose one to five stars) for the host's review form: specify here or as a separate primitive?
