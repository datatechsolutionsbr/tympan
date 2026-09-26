# GroupedDisclosureList

Wave 2 · data display · Status: specified

## Purpose
Renders items in named groups whose bodies can be collapsed and expanded independently (for example records grouped by state or by source).

## Anatomy
- **Group**: header button (host-provided header content and a chevron) followed by the group body.
- **Group body**: the items of the group, each rendered by a host function.
- Groups are separated by dividers, not nested cards (§2.5).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| groups | `{ key: string; header: node; items: T[]; meta?: M }[]` | required | Groups in display order. |
| renderItem | `(item: T, group) => node` | required | Renders one item. |
| getItemKey | `(item: T) => string` | required | Stable key per item. |
| collapsedKeys / defaultCollapsedKeys | string[] | `[]` (all open) | Controlled or uncontrolled collapsed groups. |
| onCollapsedChange | `(keys: string[]) => void` | undefined | Fires on toggle. |
| headingLevel | 2 to 6 | 3 | Heading level wrapping each group header button. |

## States
- Expanded (default), collapsed, hover, focus-visible on the header.
- Collapsed bodies are removed from the accessibility tree and tab order (not just visually shrunk).

## Keyboard and ARIA
- APG Accordion pattern with multiple panels allowed open; RAC `DisclosureGroup` with `allowsMultipleExpanded`.
- Each header button sits inside a heading of `headingLevel`, has `aria-expanded` and `aria-controls`.
- Enter and Space toggle. Optional: Up and Down arrows move between group headers, Home and End to first and last.

## Responsive, touch, motion, forced colours
- Header target at least 44 px tall.
- Height transition within `--fk-dur-quick` (§2.7), none under reduced motion; chevron rotation is also suppressed under reduced motion.
- Forced colours: header boundary and chevron visible in system colours.

## Acceptance tests
- Given two groups, when rendered, then both bodies are visible and both headers report expanded.
- Given group A expanded, when its header is activated, then A's items leave the accessibility tree and `onCollapsedChange` receives A's key.
- Given A collapsed, when Tab moves from A's header, then focus goes to B's header, not into A's hidden items.
- Given `headingLevel` 4, when rendered, then each header button is inside an `h4`.
- Given reduced motion, when toggling, then no transition runs.

## Open questions
- The fork hides collapsed bodies only by shrinking them; hidden items may remain focusable. This spec requires removal from the tab order.
