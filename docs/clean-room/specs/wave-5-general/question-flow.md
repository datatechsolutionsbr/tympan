# QuestionFlow

Wave 5 · forms · Status: specified

Behaviour reference: shadcn/ui (MIT), read by the spec writer only.

## Purpose
Ask a short series of questions one at a time, inside a card, dialog, drawer or chat turn: agent clarification prompts, onboarding, intake and surveys. Each question offers fixed answers (one or several), an optional freeform answer, and may be skipped when optional. Answers are submitted as a native form.

## Anatomy
- **Form** (the flow root).
- **Progress**: "Question 2 of 5" text, exposed as a progress bar.
- **Question** (one visible at a time): **title**, optional **description**, **choices** (radios or checkboxes, each with label, optional description and an optional **shortcut hint**), optional **freeform input**, **error**.
- **Actions**: Previous, Skip (optional questions only), Next, Submit (last question).

## Properties and events
QuestionFlow:
| Name | Type | Default | Meaning |
|---|---|---|---|
| questions | { name; title; description?; required?; multiple?; disabled?; choices: { value; label; description?; disabled? }[]; freeform?: { label; placeholder? } }[] | required | Ordered questions. `name` is unique and is the form field name. |
| current / defaultCurrent / onCurrentChange | question name | first enabled | Which question is visible. |
| defaultAnswers | map of name to value(s), text, or "skipped" | none | Resume a draft. |
| shortcuts | 'none' \| 'letters' \| 'numbers' | 'none' | Letters A–Z or digits 1–9 for enabled fixed choices, in order. |
| onSubmit | (formData, statuses) => void | required | Runs after every enabled question validates. Skipped questions are absent from the data; `statuses` tells skipped from unanswered. |
| onReset | () => void | none | Reset restores the starting question, defaults, skip marks and validation. |
| onStatusChange | (name, 'unanswered' \| 'answered' \| 'skipped') => void | none | Observe progress. |
| invalid | set of names | none | External validation: marks questions invalid; the host moves `current` to the first. |
| errorText | (name) => string | from i18n ("Choose an answer to continue") | Error message. |
| labels | Previous, Skip, Next, Submit, progress format | from i18n | Strings. |

## States
Per question: unanswered, answered, skipped, invalid, disabled (excluded from progress, navigation, validation and submission). Flow: first, middle, last, submitting.

## Keyboard and ARIA
- Built on RAC `Form`, `RadioGroup` or `CheckboxGroup`, `TextField`, `ProgressBar` and `Button`; each question is a `fieldset` whose legend is the title; description and active error are linked by `aria-describedby`; invalid questions and their controls have `aria-invalid`.
- Hidden questions and inapplicable actions are hidden and `inert`.
- Tab and Shift+Tab move between answer controls and visible actions.
- Arrow Up and Down move between answers (radios also select), including from an empty freeform input.
- Arrow Left goes to the previous question and Arrow Right to the next (only when the current one is answered or skipped), when focus is not in a radio or text entry.
- Space selects or toggles; Enter continues from a selected choice or filled input; Mod+Enter validates and continues from anywhere, or submits on the last question.
- Shortcut letters or digits select the matching choice (they do not advance); shortcuts and arrow navigation pause while typing in the freeform input. Shortcuts are exposed with `aria-keyshortcuts` and shown with KeyboardKey.
- Moving to a question focuses its fieldset; failed validation focuses the first available answer and announces the error.
- Actions stay enabled by default so that pressing Next or Submit can reveal the error; hosts may disable them from the status.
- The flow never closes itself: closing a surrounding dialog cancels the flow, which is distinct from Skip.

## Responsive, touch, motion, forced colours
- Choice rows and actions at least `--ty-control-target` high on touch; the actions row keeps Previous at the start and Skip, Next or Submit at the end.
- Choice rows `--ty-surface-raised` with `--ty-line`, selected `--ty-accent-soft` plus the radio or check indicator; error `--ty-danger` with icon.
- The entering question may fade or slide in (`--ty-dur-base`, `--ty-ease-out`) while progress and actions stay still; the leaving question hides at once; under reduced motion there is no movement.
- Forced colours: selected choices in `Highlight` / `HighlightText`; indicators remain visible.

## Acceptance tests
- Given a required first question with no answer, when Next is pressed, then the error shows, the question stays, and focus is on the first choice.
- Given an optional question, when Skip is pressed, then it is marked skipped, the next question shows, and `onStatusChange(name, "skipped")` fires.
- Given a required question, then no Skip action is visible.
- Given `multiple`, then choices are checkboxes and the submitted data has every chosen value under the name.
- Given `shortcuts="letters"`, when "B" is pressed, then the second enabled choice is selected and the question does not advance.
- Given focus in the freeform input, when "B" is typed, then the letter goes into the input.
- Given the last question answered, when Mod+Enter is pressed, then `onSubmit` fires with the answers and statuses, and skipped questions are absent from the form data.
- Given a question disabled because of an earlier answer, then the progress total excludes it and navigation skips it.
- Given `defaultAnswers` and a later reset, then the draft answers and starting question are restored.
- Given progress on question 2 of 5, then a progress bar named from i18n exposes value 2 of 5 and the text "Question 2 of 5".
