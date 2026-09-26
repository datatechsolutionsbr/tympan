# ReportOutputNodeForm

Wave 3 · form · Status: specified

## Purpose
Configure the terminal step that publishes a report: either point to a report produced by an earlier step, or author a fixed report definition inline, with an optional live preview.

## Anatomy
- Source switch: two options, "from an earlier step" and "inline definition".
- Reference field (reference mode): a path to an upstream value, with hint.
- Definition field (inline mode): monospace TextArea for the report definition as structured text, with parse error line or hint.
- Preview toggle: shows or hides a preview area.
- Preview area: in inline mode, a ReportView of the current draft (updated as the user types) or an EmptyState when the draft is empty or does not parse; in reference mode, an EmptyState explaining that the preview needs a run.
- Footer: cancel and save.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| value | `{ from?: string; report?: object }` | required | Existing config; presence of `report` selects inline mode on open. |
| validate | `(spec) => Issue[]` | ReportView's validator | Used to decide whether the preview has content. |
| onSave | `(value: { kind; from } \| { kind; report }) => void` | required | Emits only the fields of the active mode. Blank inline text saves an empty definition. |
| onCancel | `() => void` | required | Discards. |
| labels | `ReportOutputNodeFormLabels` | from i18n adapter | Strings. |

## States
- Reference mode, inline mode.
- Inline text invalid at save: save is blocked and the parse error is shown under the field.
- Preview open or closed; inline preview empty, invalid, or rendering.

## Keyboard and ARIA
- Source switch: APG Radio Group (RAC `RadioGroup`), not two unrelated buttons.
- Preview toggle: disclosure button (APG Disclosure; RAC `Disclosure`), `aria-expanded` and `aria-controls`.
- Preview region labelled "Preview"; updates are not announced on each keystroke.

## Responsive, touch, motion, forced colours
- Preview sits below the fields at all widths and may scroll internally.
- 44 px targets; no motion; selected source indicated by the radio mark, not colour.

## Acceptance tests
- Given a config with an inline report, when opened, then inline mode is selected and the text shows the report.
- Given reference mode with "  step1.report  ", when saved, then `onSave` receives `from` "step1.report" and no `report`.
- Given inline text that does not parse, when save is pressed, then `onSave` is not called and the error is shown.
- Given inline mode and preview open, when valid text with content is typed, then a ReportView renders it.
- Given reference mode and preview open, then an empty state says a run is needed.
