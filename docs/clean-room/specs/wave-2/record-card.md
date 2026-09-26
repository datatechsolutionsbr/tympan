Wave 2 · Data display · Status: specified

# RecordCard

## Purpose
A uniform card that summarises one record (an agent, a data source, a rule, a member) in a grid or list, with an optional footer of record actions.

## Anatomy
- **Container**: a Surface (wave 1) at elevation level 2 of design direction §2.5.
- **Accent strip** (optional): a thin categorical marker along the top edge; decorative.
- **Header**: leading visual (icon, avatar or colour square), title, secondary line (identifier, e-mail), and a state marker on the trailing side.
- **Body**: free content (metadata pairs, tags).
- **Footer** (optional): separated from the body by a divider; holds actions.
- **Record actions** (companion part): an "edit" and a "delete" button pair, delete optionally gated by a confirmation.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| title | ReactNode | required | Record name; also the accessible name when the card is interactive. |
| secondary | ReactNode | none | Second line under the title. |
| leading | ReactNode | none | Icon, avatar or marker before the title. |
| state | boolean or ReactNode | none | `true`/`false` renders a StatusPill "active"/"inactive" (words from i18n); a node renders as given. |
| accent | categorical token name | none | Selects a `--fk-categorical-*` token for the strip (§2.3). |
| children | ReactNode | none | Body. |
| footer | ReactNode | none | Footer content, usually record actions. |
| onOpen | () => void | none | Makes the whole card activatable. |
| standalone | boolean | false | When false the card announces itself as a list item and expects a list parent. |
| dragHandlers | drag event callbacks | none | Pass-through for host drag-and-drop reordering. |
| Record actions: editLabel, deleteLabel | string | required | Visible labels. |
| Record actions: onEdit, onDelete | () => void, () => void or Promise | required | Callbacks. |
| Record actions: confirmDeleteTitle | string | none | When set, deletion first asks via ConfirmService. |

## States
Rest; hover (surface tint only, no lift, §2.7); focus-visible (ring per §2.6); pressed; dragging (reduced opacity plus outline); disabled actions while a delete promise is pending.

## Keyboard and ARIA
- Interactive card: one focusable element with role `article` or, preferably, a real link/button wrapping only the title so inner action buttons stay separately focusable (APG "Card" guidance is informal; follow the "Button" pattern for the activation target). Enter and Space call `onOpen`.
- Non-interactive in a grid: `listitem`, parent grid has `list` role; `standalone` removes the list semantics.
- RAC: `GridList` with `GridListItem` when the host needs keyboard navigation across cards; otherwise plain `Button`/`Link` inside the card.
- Delete button names include the record title ("Delete <title>") through `aria-label` or visually hidden text.

## Responsive, touch, motion, forced colours
- Title truncates on one line with the full value in the tooltip/title; secondary line wraps at most twice.
- Footer buttons keep a 44 × 44 px hit area even at small visual size.
- No hover elevation or scale animation (§2.7). Reduced motion: no transition at all.
- Reduced transparency: opaque surface. Forced colours: 1 px `CanvasText` border; the accent strip becomes invisible without loss of meaning (it is decorative).

## Acceptance tests
- Given `state=true`, when rendered, then a status element reads the localised "active" word, not only a colour.
- Given `onOpen`, when the card is focused and Enter is pressed, then `onOpen` is called once.
- Given `onOpen` and a footer delete button, when the delete button is activated, then `onOpen` is not called.
- Given `confirmDeleteTitle`, when delete is activated and the confirmation is cancelled, then `onDelete` is not called.
- Given several cards inside a list container, when audited with axe, then no "required parent" violation is reported; given `standalone`, the same holds without a list parent.
- Given a long title, when rendered at 375 px width, then it truncates and the full title is available to assistive technology.

## Open questions
- Whether the whole-card click target is kept or only the title link (preferred for nested actions).
