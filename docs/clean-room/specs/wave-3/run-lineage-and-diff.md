# RunLineageAndDiff

Wave 3 · utility · Status: specified

## Purpose
Pure functions that read how a run was derived from another and compare two runs node by node, for the run comparison view and the rewind flow.

## Contract
**Lineage.** The engine writes a "triggered by" text on derived runs in the form `kind:baseRunId`, and for approvals `approval:baseRunId:nodeId`. Kinds: reset (rewind and correct), replay, resume (after failure), fork (resume from an edited state), signal, timer, approval.
- parseLineage(triggeredBy: string or null or undefined) → { kind; baseRunId: string; nodeId?: string } or null.
  - null for empty input, no separator, separator at position zero, unknown kind, or empty remainder (root runs: users, webhooks, schedules).
  - for approval, the text after the first separator is split once more; without a second part the node id is absent.
- findForkPoint(entries: { nodeId: string; restored?: boolean }[]) → string or null: the last entry, in stored order, marked restored; null when none.

**Status normalisation.** normaliseStatus(status: string) → lower-case words joined by underscores, so upper-case wire values, lower-case legacy values and camel-case values compare equal (e.g. "PausedForApproval" → "paused_for_approval").

**Canonical encoding.** canonicalEncode(value: unknown) → string: structured-data text with object keys sorted at every depth, arrays kept in order; used for all equality checks.

**Timeline diff.** diffTimelines(a: Entry[], b: Entry[]) → NodeDiff[] where Entry = { nodeId; nodeKind; status; durationMs: number or null; outputs?: object or null; error?: string or null; restored?: boolean }.
- Order: run A's order, then nodes only in B in B's order.
- diff = onlyA, onlyB, identical or diverged. Diverged when normalised status differs, error differs (absent equals null), or any top-level output key's canonical value differs.
- changedKeys lists those differing top-level output keys (empty for onlyA and onlyB).

**Variable diff.** diffVariables(a?: object, b?: object) → { key; diff; a; b }[] with one row per key in either map, in first-seen order (A's keys, then B's new keys).

## States
not applicable.

## Keyboard and ARIA
not applicable. Views rendering the diff must express identical, diverged, only-in-A and only-in-B with a word and an icon, never colour alone (§2.11).

## Responsive, touch, motion, forced colours
not applicable.

## Acceptance tests
- Given "reset:r1", when parsed, then kind is reset and base run is r1.
- Given "approval:r1:review", when parsed, then base run is r1 and node is review.
- Given "user:alice" or "reset:", when parsed, then the result is null.
- Given entries x (restored), y (restored), z, when the fork point is sought, then it is y.
- Given "COMPLETED" and "completed", when normalised, then both equal "completed".
- Given objects with the same keys in different order, when canonically encoded, then the texts are equal.
- Given node n in both runs with output total 1 versus 2, when diffed, then n is diverged with changedKeys ["total"].
- Given node m only in run B, when diffed, then m is last with diff onlyB.
- Given maps {a:1} and {a:1, b:2}, when variables are diffed, then a is identical and b is onlyB.
