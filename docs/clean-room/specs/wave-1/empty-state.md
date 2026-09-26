# EmptyState

Wave 1 · feedback · Status: specified

## Purpose
Explain that a region has nothing to show, why, and what the person can do next; distinguishes true emptiness from "no results for these filters" and from being offline.

## Anatomy
- **Icon**: one icon (24 px per §2.12) in `--fk-ink-3`, decorative.
- **Title**: one sentence saying what is missing.
- **Description**: one sentence saying what to do.
- **Primary action** (optional): one button, shown only when the person may act.
- **Secondary action** (optional): such as "Clear filters".

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| reason | 'no-data' \| 'no-results' \| 'offline' \| 'custom' | 'no-data' | selects the default icon and default copy keys from the I18nAdapter |
| title | string | from reason | first sentence |
| description | string | from reason | second sentence |
| icon | icon component | from reason | overrides the default icon |
| action | { label: string; onPress: () => void } | none | primary action |
| secondaryAction | { label: string; onPress: () => void } | none | e.g. clear filters (default for no-results when `onClearFilters` given) |
| onClearFilters | () => void | none | shortcut that adds the clear-filters action for 'no-results' |
| onRetry | () => void | none | adds a retry action for 'offline' |
| framing | 'inline' \| 'section' \| 'page' | 'section' | inline inside a list or table cell, section inside a sheet, page fills the content area |
| headingLevel | 2 \| 3 \| 4 | 3 | level of the title |

## States
- static; action idle, hover, focus-visible, pressed.
- No illustration and no entrance animation.

## Keyboard and ARIA
- APG: no widget pattern. RAC: `Button` for actions; container is a plain region.
- Page framing: the container is a region labelled by the title. Section and inline framing: no landmark.
- When the empty state replaces content after a user action (such as filtering), the host announces it through a polite status; the component offers an `announce` option that wraps the title in `role="status"`.
- Icon hidden from assistive tech.

## Responsive, touch, motion, forced colours
- Centred, text max 60ch (§2.2); action buttons at least 44 px tall.
- Follows the button hierarchy of §2.10: the primary action uses the primary button only if no other primary exists in the view.
- No motion. Forced colours: nothing depends on colour.

## Acceptance tests
- Given reason no-results and `onClearFilters`, Then the text says no records match the filters and a "Clear filters" button calls `onClearFilters`.
- Given reason no-data and an action, When the action is pressed, Then `action.onPress` is called once.
- Given no action, Then no button is rendered.
- Given page framing with title "No sources yet", Then a region named "No sources yet" exists.
- Given `announce`, When the empty state appears, Then its title is inside a status element.
- Given `headingLevel` 2, Then the title is an h2.
