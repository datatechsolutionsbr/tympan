Wave 2 · Data display · Status: specified

# SwipeRow

## Purpose
A list row that reveals contextual actions when swiped horizontally on touch, with the same actions reachable without a gesture.

## Anatomy
- **Row content**: the host's row, draggable horizontally.
- **Leading actions**: revealed by swiping towards the end edge.
- **Trailing actions**: revealed by swiping towards the start edge.
- **Action button**: icon plus word; tone set per action.
- **Actions menu button** (non-gesture alternative): an overflow button inside the row that opens the same actions in an ActionMenu.
- **Preset actions**: delete (danger tone), archive (pending tone), edit (neutral), favourite (neutral), each with localised words.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| children | ReactNode | required | Row content. |
| leadingActions | SwipeAction[] | [] | `{ label: string; icon?: ReactNode; tone: 'neutral' or 'danger' or 'pending' or 'positive'; onAction: () => void }`. |
| trailingActions | SwipeAction[] | [] | Same shape. |
| fullSwipe | boolean | true | Swiping past a fraction of the row width fires the first action of that side. |
| fullSwipeFraction | number (0–1) | a mid value | Threshold for full swipe. |
| onRevealChange | (side: 'none' or 'leading' or 'trailing') => void | none | Notifies reveal state. |

## States
Resting; dragging; revealed leading; revealed trailing; full-swipe armed (haptic once, via Haptics); action committing.

## Keyboard and ARIA
- The gesture is an enhancement only (WCAG 2.5.1): every action is also available from the actions menu button, which is a real button with a name like "Actions for <row>".
- Revealed action buttons are focusable only while revealed; otherwise hidden from the accessibility tree.
- Escape closes a revealed row and returns focus to the row.
- APG "Menu Button" for the alternative; RAC `MenuTrigger` + `Menu`. Gesture itself: no RAC primitive; custom (use RAC `usePress`/`useMove` hooks).
- Destructive full swipe asks for confirmation through ConfirmService unless the host supplies undo.

## Responsive, touch, motion, forced colours
- Each action is at least 44 × 44 px.
- Vertical scrolling wins over horizontal drag when the initial movement is mostly vertical.
- Reduced motion: row snaps to positions without spring or slide; action commit is instant.
- Forced colours: action buttons have borders and text; tone never the only cue.
- On pointer devices without touch, the swipe is disabled and only the actions menu remains.

## Acceptance tests
- Given trailing actions, when the actions menu button is activated with the keyboard, then all trailing and leading actions are listed.
- Given a swipe past half an action width, when released, then the side's actions are revealed and focusable.
- Given a small swipe, when released, then the row returns to rest.
- Given full swipe enabled, when released beyond the fraction, then the first action of that side fires once.
- Given a revealed row, when Escape is pressed, then it closes.
- Given a mostly vertical drag, then the list scrolls and the row does not move.
- Given reduced motion, then no animated transition occurs.

## Open questions
- The fork has no keyboard alternative; the actions menu button is new and required.
