# AgentCreationWizard

Wave 3 · layout · Status: specified

## Purpose
A full-page, five-step flow for creating a new agent, built from WizardPage, StepList and the standard form fields, with the active step mirrored in the address.

## Anatomy
- Page header (PageHeader) whose title and subtitle change per step, with a StepList below showing the five steps and a "Step n of 5" counter.
- One surface holding the current step's fields.
- Footer: Cancel (quiet), Back (secondary, hidden on step 1), Next or Create (primary on the last step), plus an error notice if creation fails.
- Step 1, Starting point: a ChoiceGrid of presets (each a FilterTile with name and role) plus "Custom"; choosing a preset fills name, role, system prompt, sampling, output limit and framework.
- Step 2, Identity: avatar choice (ChoiceTile set of glyphs), name (required), role, description.
- Step 3, Model: provider connection picker (or an inline model field when the host has no connections), agent framework picker (host-provided list), model picker (with an empty option when there are no models), optional output schema as raw structured text.
- Step 4, Behaviour and metadata: system prompt, user prompt, temperature, nucleus sampling, top-k, output limit, difficulty (beginner to expert), tags (TagField).
- Step 5, Review: read-only summary grouped by step, each group with an "Edit" link that jumps to its step.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| labels | object of strings | required | Every visible string. |
| models | Model[] | required | Selectable models. |
| connections | { id: string; name: string; provider?: string }[] | required | Empty array means no credential system (inline model field). |
| presets | Preset[] | built-in empty | Host-provided starting points (the fork hard-coded them). |
| frameworks | { id: string; label: string }[] | [] | Host list; the picker is hidden when empty. |
| initialStep | number | 1 | Clamped to 1..5; changes after mount (back/forward navigation) move the wizard. |
| onStepChange | (step: number) => void | optional | Host updates the address. |
| onSubmit | (input: NewAgentInput) => Promise<void> | required | Receives trimmed values; blanks omitted; name falls back to the preset name, then to a localised "Untitled agent". |
| onCancel | () => void | required | Called after confirmation when anything was touched. |

## Behaviour rules
- Only step 2 blocks progress: Next is disabled until the name is non-blank, with a field error on attempt.
- The first model is selected by default so the review never shows an empty model.
- Clicking a completed step in the StepList jumps to it; future steps are reachable only through Next.
- Cancel after any edit asks for confirmation (ConfirmService); without edits it cancels immediately.
- Creation failure shows the error message (or the host fallback) and keeps all values.

## States
- per step; untouched or touched; step 2 invalid; submitting; failed.

## Keyboard and ARIA
- The page has one main heading (the step title); the StepList follows the APG pattern for a step list as an ordered list with `aria-current="step"` (RAC has no stepper; custom on RAC Link/Button).
- Enter advances (or creates on the last step) only when focus is not in a text field, select or button; Escape triggers Cancel with confirmation. Ctrl/Cmd+Enter creates from anywhere on the last step.
- On step change, focus moves to the new step heading.
- Preset and avatar choices use RAC RadioGroup semantics (APG Radio Group).

## Responsive, touch, motion, forced colours
- Footer sticks to the bottom on phones, respecting SafeAreaInset.
- 44 px targets; step transitions have no slide under reduced motion.
- Forced colours: current step marked by outline and text, not fill.

## Acceptance tests
- Given initialStep 9, when rendered, then step 5 is active.
- Given step 2 with an empty name, when Next is activated, then the wizard stays on step 2 and shows a name error.
- Given a preset is chosen, when step 2 opens, then name and role are pre-filled.
- Given step 5, when Edit on the model group is activated, then step 3 is shown and onStepChange receives 3.
- Given untouched fields, when Escape is pressed, then onCancel is called without a confirmation.
- Given onSubmit rejects with "quota exceeded", when creation ends, then that message is shown and values are kept.
- Given focus on a non-field element in step 1, when Enter is pressed, then step 2 is shown.
