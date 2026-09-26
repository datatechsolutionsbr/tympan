# VersionHistoryPanel

Wave 3 · data display · Status: specified

## Purpose
A side panel that lists the published versions of a flow and lets the person preview a version read-only or restore it as the working draft.

## Anatomy
- Panel header: title, close control.
- Body region with one of four contents: loading skeleton, error message with retry, empty message, version list.
- Version entry: version number (monospace metadata, design direction §2.2), "current" marker when it matches the live version, publication date and time, publisher (as an ActorChip, §2.11, placed before the date), node and connector counts, actions.
- Entry actions: Preview (always), Restore (hidden on the current version).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| open | boolean | required | Panel is rendered only when true; loading starts each time it becomes true. |
| onClose | () => void | required | Close request (button or Escape). |
| flowId | string | required | Flow whose versions are listed. |
| currentVersion | number | required | Version treated as live; marked and not restorable. |
| loadVersions | (flowId: string) => Promise<Version[]> | optional | Host loader; without it the panel shows the empty state. |
| onPreview | (version: Version) => void | required | Open the version read-only (host decides how). |
| onRestore | (version: Version) => void | required | Replace the draft with this version. The host is expected to confirm first. |
| labels | object of strings | required | Title, close, retry, empty, current, published-by, nodes, connectors, preview, restore. |

Version = { number: number; publishedAt: ISO string; publishedBy: actor; nodeCount: number; connectorCount: number }.

## States
- loading: skeleton rows with `aria-busy` on the list region and a status message (§2.12).
- error: message in plain words plus Retry; retry re-runs the loader.
- empty: one sentence saying no version has been published yet.
- populated: newest first; the current entry has the accent-soft background and the word "current" (colour is not the only signal).
- entry hover and focus-within: surface change only, no lift.

## Keyboard and ARIA
- APG pattern: Disclosure-free list inside a complementary landmark; panel is a `region`/`complementary` labelled by its title. No RAC primitive for the panel; actions use RAC Button.
- List is a semantic list; each entry is a list item containing ordinary buttons (Tab order: Preview, Restore).
- Escape inside the panel calls onClose and returns focus to the control that opened it.
- Timestamps are formatted with the host locale and exposed as machine-readable date values.
- Loading and error changes are announced through a polite live region.

## Responsive, touch, motion, forced colours
- Width follows the evidence-panel rules of §2.8 (column at wide widths, drawer below, full-screen sheet on phones).
- Action buttons keep a 44 px hit area even when visually compact (§2.10).
- Opening uses the base duration token; with reduced motion it appears without sliding.
- Reduced transparency: opaque surface. Forced colours: the current entry keeps a visible system-colour border in addition to the word.

## Acceptance tests
- Given the panel opens with a loader, when the loader resolves with three versions, then three entries appear with number, date, publisher and counts.
- Given the loader rejects, when the panel renders, then an error message and a Retry button are shown; when Retry is activated, then the loader is called again.
- Given the current version is 4, when the list renders, then entry 4 shows "current" and has no Restore action.
- Given no loader is supplied, when the panel opens, then the empty message is shown.
- Given focus is inside the panel, when Escape is pressed, then onClose is called.
- Given entry 2, when Restore is activated, then onRestore receives version 2.

## Open questions
- The fork restored without confirmation inside the panel; the spec expects the host to confirm with ConfirmService. Decide whether the panel should confirm itself.
