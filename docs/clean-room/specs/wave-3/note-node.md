# NoteNode

Wave 3 · canvas · Status: specified

## Purpose
A free-text sticky note placed on the canvas to annotate a flow; it never takes part in execution or connections.

## Anatomy
- **Note surface**: sized box with a small note icon and the note text.
- **Editor**: multi-line text field replacing the text while editing.
- **Placeholder**: shown when the text is empty.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| id | string | required | node id |
| text | string | '' | note content |
| tone | one of five note tones | first tone | background tint from the categorical tokens (§2.3) |
| width, height | number (canvas units) | standard note size | size; unknown tone falls back to the default tone |
| onTextChange | (text) => void | required | persists edits into the flow (one undo step per editing session) |
| placeholder | string | i18n | empty-state text |

## States
Viewing; empty (placeholder); editing; selected; locked (no editing).

## Keyboard and ARIA
- Focusable as a group named "note" plus the first words of the text.
- Double-click, Enter or F2 enters editing; the field is a RAC TextArea (APG has no pattern; native multi-line text).
- Esc leaves editing and returns focus to the note; blur leaves editing; both commit the text.
- Keys typed while editing never trigger canvas shortcuts.
- Notes expose no ports; assistive technology is told "annotation, not a step".

## Responsive, touch, motion, forced colours
- On touch, a tap on a selected note enters editing. Text at least 12 px, prose width limits of §2.2 do not apply inside the note.
- Tone is decorative: meaning never depends on it. Forced colours: note boundary drawn in system colour.

## Acceptance tests
- Given empty text, when rendered, then the placeholder is shown.
- Given a double-click, when the note enters editing, then the text field has focus with the current text.
- Given editing, when Esc is pressed, then editing ends and onTextChange receives the edited text.
- Given editing, when "a" is typed, then no canvas shortcut runs.
- Given an unknown tone, when rendered, then the default tone is used.
- Given a connection drag onto the note, when dropped, then no connector is created.

## Open questions
- In the fork, edits stay in local state and are not written back to the flow; the new note must persist via onTextChange.
