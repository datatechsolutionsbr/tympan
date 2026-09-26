# HistoryList

Wave 2 · data display · Status: specified

## Purpose
A vertical list of past entries (assertion history, recent activity, audit trail) where each entry shows a header and summary and can expand to reveal details.

## Anatomy
- **List**: ordered list of entries, newest first by host choice.
- **Entry header**: disclosure button with a start part (usually ActorChip then date, per design direction §2.11), an optional end part (status, count) and an optional one-line summary under it.
- **Chevron**: indicates expanded or collapsed.
- **Details region**: content revealed under the header.
- **Loading state**: skeleton rows (§2.12). **Empty state**: one sentence.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| items | `{ id: string; start: node; end?: node; summary?: node; details?: node }[]` | required | Entries. |
| loading | boolean | false | Show skeleton rows instead of entries. |
| loadingLabel | string | required | Status text announced while loading. |
| emptyLabel | string | required | Text when there are no entries. |
| expansion | `'single' \| 'multiple'` | `'single'` | Whether opening one entry closes the other. |
| expandedIds / defaultExpandedIds | string[] | `[]` | Controlled or uncontrolled open entries. |
| onExpandedChange | `(ids: string[]) => void` | undefined | Fires on toggle. |

## States
- Collapsed, expanded, hover, focus-visible, loading, empty.
- An entry without details renders a static header (no button, no chevron).

## Keyboard and ARIA
- APG Disclosure pattern for each entry; backed by RAC `Disclosure` / `DisclosureGroup`.
- Header button has `aria-expanded` and `aria-controls` pointing to the details region.
- Enter and Space toggle. Tab moves between headers and into open details.
- Loading region has `aria-busy` and a `role="status"` with `loadingLabel`.

## Responsive, touch, motion, forced colours
- Each header is at least 44 px tall on touch.
- Expand and collapse: height change within `--fk-dur-quick` (§2.7); instant under reduced motion.
- Forced colours: dividers and focus ring remain visible; chevron uses system text colour.
- Details content never exceeds 68ch for prose (§2.2).

## Acceptance tests
- Given three entries, when the second header is activated, then its details appear and `aria-expanded` is true.
- Given `single` expansion with entry one open, when entry two is opened, then entry one closes.
- Given `multiple`, when two entries are opened, then both stay open.
- Given an entry without details, when rendered, then it has no button role.
- Given loading, when rendered, then a status with `loadingLabel` exists and no entries are shown.
- Given no items and not loading, when rendered, then `emptyLabel` is shown.
