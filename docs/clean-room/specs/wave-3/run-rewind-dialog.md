# RunRewindDialog

Wave 3 · overlay · Status: specified

## Purpose
A modal that forks a corrected re-run from a chosen completed node: everything up to and including that node keeps its recorded output, everything after it runs again.

## Anatomy
- SectionedModal with title and subtitle (warning-to-danger tone family, since the action is consequential).
- Cut-point picker (NativeSelect or ListboxSelect) listing only completed nodes as "identifier, kind".
- Optional reason text field.
- Preview: two lists side by side (stacked on phones): "Kept from this run" and "Will re-execute", each with a count badge and node rows (identifier and kind), or an empty word.
- Warning notice instead of the form when no node is completed.
- Error notice for a failed fork.
- Footer: shortened run identifier, Cancel, Confirm (primary; disabled without a cut point; busy while submitting).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| open | boolean | required | Visibility; state re-seeds on open. |
| onClose | () => void | required | Dismiss. |
| runId | string | required | Shown shortened. |
| nodes | { nodeId: string; nodeKind: string; status: string }[] | required | The run's timeline in stored execution order. |
| initialNodeId | string | optional | Pre-selected cut point if it is eligible; otherwise the first eligible node. |
| labels | object of strings | required | Title, subtitle, picker, reason, reason placeholder, kept heading, rerun heading, no eligible nodes, cancel, confirm. |
| onRewind | (input: { resetToNode: string; reason?: string }) => Promise<void> | required | Fork; blank reason is omitted; rejection shows an error. |

## Behaviour rules
- Eligible = status normalised to "completed" (see RunLineageAndDiff).
- Kept = completed nodes at or before the cut point in stored order; re-execute = every node after it, whatever its status.
- Success closes the dialog.

## States
- no eligible nodes; cut point chosen; submitting; failed.

## Keyboard and ARIA
- APG pattern: Dialog (Modal). RAC: Modal, Dialog, Select, TextField.
- The two preview lists are labelled lists; their counts are part of the heading text.
- When the cut point changes, a polite live region announces the new kept and re-execute counts.

## Responsive, touch, motion, forced colours
- Preview lists side by side from the medium breakpoint, stacked below.
- 44 px targets. No preview animation; none under reduced motion.
- Forced colours: kept and re-execute distinguished by heading and icon, not colour.

## Acceptance tests
- Given nodes a (completed), b (completed), c (failed), when the dialog opens without initialNodeId, then a is selected.
- Given cut point b, when the preview renders, then kept lists a and b and re-execute lists c.
- Given initialNodeId c (not completed), when the dialog opens, then the first completed node is selected instead.
- Given no completed node, when the dialog opens, then only the warning notice and Cancel are available.
- Given a blank reason, when Confirm is activated, then onRewind receives only resetToNode.
- Given onRewind rejects, when submission ends, then the message appears and the dialog stays open.
