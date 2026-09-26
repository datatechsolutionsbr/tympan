# WizardPage

Wave 2 · layout · Status: specified

## Purpose
Full page frame for a multi-step creation flow (new research project, new instrument): heading that reflects the current step, a StepList, the step's content and back/next navigation.

## Anatomy
- **Header sheet**: eyebrow label with icon, close button, `h1` equal to the current step title (or the flow title), description of the current step (or flow subtitle), StepList (markers).
- **Aside slot** (optional): content placed beside or above the step body (for example a draft save indicator).
- **Step body**: host content for the current step.
- **Navigation row**: secondary button ("cancel" on the first step, "previous" otherwise) and primary button ("next", or the submit label on the last step).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| title | string | required | Flow title; also names the StepList. |
| subtitle | string | undefined | Fallback description. |
| eyebrow | string | required | Short label above the title. |
| icon | node | required | Icon next to the eyebrow. |
| steps | `{ id; title; description?; icon? }[]` | required | Steps. |
| currentIndex | number | required | Current step. |
| onStepChange | `(index: number) => void` | required | Navigate between steps. |
| onSubmit | `() => void` | required | Called from the last step. |
| onCancel | `() => void` | required | Close or cancel. |
| canAdvance | boolean | true | Enables the primary button. |
| submitting | boolean | false | Primary shows a Spinner and "submitting"; both buttons disabled. |
| submitLabel | string | i18n "submit" | Last-step primary label. |
| aside | node | undefined | Extra header content. |

## Behaviour
- Previous on the first step calls `onCancel`; next on the last step calls `onSubmit`.
- Completed steps in the StepList are selectable and call `onStepChange`.
- On step change, focus moves to the new `h1` so screen-reader users hear the new step; the document title updates to include the step name.
- Unsaved changes: the host decides; the close button calls `onCancel` only.

## States
- First, middle, last step; cannot advance; submitting.

## Keyboard and ARIA
- The close button has an accessible name from i18n ("close"), never a hard-coded English word.
- Navigation row is a group; primary is a submit button when the step body is a form.
- StepList per its spec. No other APG pattern; no RAC primitive beyond `Button`.

## Responsive, touch, motion, forced colours
- Buttons stack full-width under 640 px with the primary first visually and last in reading order consistent with FormActions.
- Step transition is a cross-fade within `--fk-dur-quick` (§2.7); no horizontal slide; instant under reduced motion.
- Primary uses the CTA gradient (§2.3), the only one on the page.
- Forced colours: header sheet bordered.

## Acceptance tests
- Given step 0, when previous is activated, then `onCancel` fires.
- Given the last step, when primary is activated, then `onSubmit` fires and its label is `submitLabel`.
- Given `canAdvance` false, when rendered, then primary is disabled.
- Given step change from 0 to 1, when rendered, then focus is on the `h1` with step 2's title.
- Given `submitting`, when rendered, then both buttons are disabled and a busy indication is announced.
