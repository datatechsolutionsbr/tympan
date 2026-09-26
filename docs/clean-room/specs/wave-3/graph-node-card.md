# GraphNodeCard

Wave 3 · canvas · Status: specified

## Purpose
The shared card shell and header parts every node on a canvas is drawn with, so all node kinds (and non-workflow graphs such as the provenance graph) look and behave alike.

Used today by `apps/platform` in the provenance canvas: the app draws each provenance item as a card with a header (kind icon in a bubble, item label as title, kind name as description) and a footer row with a proof state badge (§2.11), the actor and the date. The replacement must support that composition without the workflow editor.

## Anatomy
- **Card**: the bordered surface of a node, with selected, hover and problem looks.
- **Icon bubble**: a small tile holding the kind icon, tinted by the kind's categorical colour (§2.3, categorical tokens are allowed on graph nodes).
- **Header**: icon bubble, title, optional one-line description; title can be renamed in place.
- **Meta row**: secondary content under the header (badges, counts); hidden in compact density.
- **Badge**: small neutral or kind-toned label.
- **Delete action**: optional icon button in the header.
- **Branch label**: small label next to an output port.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| kind | string | required | node kind, used for the categorical tone and test hooks |
| selected | boolean | false | selected look |
| problem | boolean | false | "missing or not configured" look: dashed border plus a warning icon and text |
| density | 'detailed' or 'compact' | 'detailed' | compact hides description and meta row |
| width | 'narrow', 'standard', 'wide' | 'standard' | three card widths |
| onActivate | () => void | none | when set the card is an interactive button (opens configuration) |
| header.icon, header.title, header.description | node, string, string | required title | header content |
| header.onRename | (title) => void | none | enables in-place rename |
| badge.tone | 'neutral' or a kind | 'neutral' | badge tone |
| onDelete | () => void | none | shows the delete action |

## States
Default; hover (border strengthens, no lift per §2.7); selected (accent outline, §2.3 accent, never a colour reserved for proof states); focus-visible (§2.6 outline); problem; renaming (title replaced by a text field); compact.

## Keyboard and ARIA
- Interactive card: APG Button pattern, RAC Button; Enter or Space activates; accessible name is "kind: title" plus state.
- Rename: double-click or F2 on a focused card enters rename; the field is a RAC TextField; Enter commits only a non-empty changed value, Esc cancels, blur commits; key presses inside the field never reach canvas shortcuts.
- Delete action is a real button (RAC Button) with an accessible name that includes the node title; it is not nested inside the interactive card element (siblings, to avoid nested interactive content).
- Non-interactive card: role group with the same name.

## Responsive, touch, motion, forced colours
- Delete action and card activation have 44 px hit areas.
- Text never below 12 px (§2.2); title truncates with the full value available as the accessible name.
- Reduced motion: no transitions on hover or selection. Reduced transparency: opaque surface. Forced colours: selection shown by a thicker system-colour outline; problem look keeps its dashed border and text.

## Acceptance tests
- Given onActivate, when the card is focused and Enter is pressed, then onActivate fires once.
- Given onRename, when the title is double-clicked, typed to "New" and Enter is pressed, then onRename receives "New".
- Given renaming, when the value is cleared or unchanged and the field blurs, then onRename is not called.
- Given renaming, when V is typed, then canvas shortcuts do not run.
- Given density compact, when rendered, then description and meta row are absent.
- Given problem, when rendered, then a warning icon and text explain the problem.
- Given the provenance composition, when a proof badge is placed in the meta row, then it renders unchanged.

## Open questions
- The fork uses a focusable non-button element for delete; the new card must use a real button.
