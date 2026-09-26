# NodeStateStyles

Wave 4 · utility (token API) · Status: specified

## Purpose
One place that decides how a canvas node's frame looks in each interaction state (rest, hover, selected, focused, running, succeeded, failed, locked, dimmed), so GraphNodeCard, GenericNode, AgentNode, RuleNode, NoteNode, GroupNode and DataSourceNode never compose their own border and ring rules. It replaces exported class-name constants and a helper that returned class strings.

## Anatomy
- **State attribute**: nodes expose their state as data attributes on the root (`data-selected`, `data-hovered` by CSS hover, `data-run-state` with `idle | running | succeeded | failed | skipped`, `data-locked`, `data-dimmed`). The stylesheet maps attributes to tokens; components never pass style strings.
- **Frame tokens** (in the token stylesheet, both themes):
  - `--fk-node-border` (rest): `--fk-line`; per-kind rest border uses the kind tone from FlowPaletteTokens at low strength.
  - `--fk-node-border-hover`: `--fk-line-strong`.
  - `--fk-node-ring-selected`: `--fk-accent` (design direction §3.13: selection ring uses the accent, not the former indigo).
  - `--fk-node-ring-running`, `--fk-node-ring-succeeded`, `--fk-node-ring-failed`: the semantic colours of §2.3 (pending, success, error).
  - Focus: the global focus ring of §2.6, drawn outside the selection ring so both are visible together.
- **Border style per proof state** (graph of provenance, §3.13): the node border line style follows §2.11 (solid, dashed, double, dotted) when a proof state is set, via `data-proof-state`.
- **Helper**: `nodeStateAttributes({ selected, runState, locked, dimmed, proofState })` returns the attribute map; it is the only exported helper.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| nodeStateAttributes | (state) => Record<string, string> | | Attribute map for a node root. |
| NodeRunState | 'idle' \| 'running' \| 'succeeded' \| 'failed' \| 'skipped' | 'idle' | Normalised run state (RunExecutionState provides it). |

## States
Precedence when several apply: failed over running over succeeded for the ring; selected ring always shown in addition to a run ring (selection outside, run state inside); dimmed lowers opacity of content but never of the ring or state word.

## Keyboard and ARIA
- The state must also be in the node's accessible description (for example "selected", "running", "failed"); styles are never the only carrier (§2.3). GraphNodeCard composes the words from labels.

## Responsive, touch, motion, forced colours
- The running state may pulse the ring opacity; under reduced motion it is a static ring plus NodeRunIndicator's word.
- `forced-colors: active`: selected uses a thick `Highlight` border; run states use `CanvasText` borders of different line styles (solid succeeded, dashed running, double failed) so they stay distinguishable.

## Acceptance tests
- Given selected and failed, when rendered, then both the accent selection ring and the error ring are visible and the description contains both words.
- Given hover without selection, then the border moves to the strong line token and nothing else changes size.
- Given a proof state pending, then the border line is dashed.
- Given forced colours and running, then the border is dashed in the system text colour.
- Given the helper with no arguments, then it returns attributes for idle, not selected, not locked, not dimmed.
