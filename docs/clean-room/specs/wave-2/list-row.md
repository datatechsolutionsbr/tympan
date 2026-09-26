# ListRow

Wave 2 · data display · Status: specified

## Purpose
A standard row describing one item: icon, title, subtitle, a short set of label and value pairs, and up to a few text actions on the trailing side.

## Anatomy
- **Summary**: the SummaryRow parts (icon tile, title, subtitle, metadata pairs).
- **Actions**: a trailing group of text buttons; one may be destructive.
- **Container**: one of four treatments (see `variant`).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| title | ReactNode | required | Main line. |
| subtitle | ReactNode | none | Second line. |
| icon | ReactNode | none | Leading visual. |
| metadata | { label: string; value: ReactNode }[] | [] | Label and value pairs. |
| actions | { label: string; onPress: () => void; tone?: 'neutral' \| 'danger'; disabled?: boolean }[] | [] | Trailing text buttons. |
| variant | 'surface' \| 'compact' \| 'card' \| 'emphasised' | 'surface' | Surface: sheet background; compact: no background, tight vertical space; card: raised card; emphasised: accent-soft background (§2.3) to mark the current or recommended item. |

## States
Default, emphasised, action hover, action focus-visible, action disabled.

## Keyboard and ARIA
- The row itself is not interactive; each action is an APG Button (RAC `Button`) and a separate tab stop in visual order.
- A destructive action carries a word, not only colour; if it removes data it should go through ConfirmService.
- When several rows with identical action labels appear, each action's accessible name includes the item title (for example "Remove, Survey A") via a visually hidden suffix.
- The emphasised state is also conveyed in text (for example a tag "Current"), never by background alone.

## Responsive, touch, motion, forced colours
- Under 640 the actions move below the summary and stretch to at least 44 px tall.
- Action targets are at least 44 × 44 px (padding or hit area).
- No motion. Forced colours: actions keep visible borders on focus; emphasised row gets a system-colour border.

## Acceptance tests
- Given a row with two actions, when the user tabs, then focus reaches the two actions in order and nothing else in the row.
- Given a disabled action, then it is exposed as disabled and does not call its handler.
- Given two rows titled "A" and "B" each with "Edit", then the actions are announced "Edit, A" and "Edit, B".
- Given variant 'emphasised', then a textual indicator is present in addition to the background.
- Given a width of 375, then the actions sit below the summary and each is at least 44 px tall.
