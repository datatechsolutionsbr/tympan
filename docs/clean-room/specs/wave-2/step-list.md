# StepList

Wave 2 · navigation · Status: specified

## Purpose
Shows progress through an ordered set of steps (wizard, onboarding, security setup, a process lifecycle) and optionally lets people jump back to a completed step.

## Anatomy
- **Navigation wrapper** with an accessible name.
- **Ordered list of steps**; each step has a marker (number, custom icon, or a check when complete), a short eyebrow ("step 2 of 4") and a name.
- **Connectors** between markers (appearance `markers`) or a progress edge per step (appearance `bar`: along the top on wide screens, along the start edge when stacked on narrow screens).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| steps | `{ id: string; name: string; description?: string; icon?: node; href?: string; status?: 'complete' \| 'current' \| 'upcoming' }[]` | required | Steps in order. |
| currentIndex | number | derived from statuses | Zero-based current step; when given, earlier steps are complete and later ones upcoming. |
| label | string | required | Accessible name of the navigation. |
| appearance | `'markers' \| 'bar'` | `'markers'` | Numbered markers with connectors, or bordered segments. |
| onStepSelect | `(index: number) => void` | undefined | Enables jumping to completed steps. |
| allowForward | boolean | false | Also allow selecting upcoming steps. |

## States
- Per step: complete (check icon and the word "completed" for assistive tech), current, upcoming, hover and focus-visible when selectable, disabled when not selectable.
- Colours: accent for current and complete (§2.3); upcoming uses ink-3. Status never conveyed by colour alone (icon, weight, hidden text).

## Keyboard and ARIA
- `nav` with `label`, containing an `ol`. The current step has `aria-current="step"`.
- Selectable steps are links (when `href`) or buttons (RAC `Link` / `Button`); non-selectable steps are plain text, not disabled buttons in the tab order.
- Each step's accessible name includes position and status ("Step 2 of 4, Identity, completed").
- No dedicated APG pattern; follows Breadcrumb-like navigation semantics.

## Responsive, touch, motion, forced colours
- Under 640 px the `markers` appearance shows markers only, with the current step name below the list; `bar` stacks vertically.
- Selectable steps have a 44 px target.
- Marker state changes are instant; no animated connector fill under reduced motion.
- Forced colours: current marker uses system highlight; complete marker keeps the check glyph.

## Acceptance tests
- Given four steps and currentIndex 1, when rendered, then step 1 is complete, step 2 has `aria-current="step"`, steps 3 and 4 are upcoming.
- Given `onStepSelect`, when the completed step 1 is activated, then `onStepSelect(0)` fires.
- Given no `allowForward`, when Tab moves through the list, then upcoming steps are not focusable.
- Given steps with `href` and `onStepSelect`, when clicked, then the handler fires and the link still supports opening in a new tab.
- Given a 375 px viewport, when rendered, then no horizontal scroll occurs and the current step name is visible.
