# InsightCard

Wave 4 · data display · Status: specified

## Purpose
A compact card that presents one proposed value produced by an agent or a rule, with the measures that support it and the actions a person can take on it (accept, adjust, dismiss). In Fakhir it shows, for example, an agent's suggested coding of a record field awaiting human review. It is generic: the kind of proposal, its measures and its actions are all supplied by the host.

## Anatomy
- **Header**: source line with an ActorChip (§2.11: the proposer, agent or system, always named) and a short title of what is proposed.
- **Proposed value**: the headline, tabular numerals when numeric; serif only if it is a number used as a KPI (§2.2).
- **Change marker** (optional): a DeltaIndicator (wave 2) comparing the proposal with the current value.
- **Measures**: a short list of label and value pairs (for example confidence, coverage). A measure may carry a meter: a determinate bar (ProgressBar, wave 1) with its value also written as text.
- **Actions**: a row of buttons supplied by the host; at most one uses the primary emphasis and only when the view has no other primary button (§2.3).
- **Footnote** (optional): `meta` line naming what constrained the proposal (for example the rules applied), with an optional link.
- **Outcome line**: after an action resolves, a status sentence replaces the actions (accepted by whom and when, dismissed, adjusted).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| actor | ActorRef | required | Who proposed (rendered with ActorChip). |
| title | string | required | What is proposed. |
| value | node | required | Proposed value, already formatted. |
| delta | DeltaIndicator props | none | Change versus current. |
| measures | { id; label; value: string; meter?: number (0 to 1) }[] | [] | Supporting figures. |
| actions | { id; label; icon?; emphasis?: 'primary' \| 'secondary' \| 'quiet'; tone?: 'neutral' \| 'danger' }[] | [] | Buttons. |
| onAction | (id: string) => void \| Promise<void> | none | Called with the action id; a returned promise puts the card in pending state. |
| footnote | { text: string; href?: string } | none | Constraint note. |
| outcome | { text: string } | none | When set, shows the outcome line instead of the actions. |
| proofState | ProofState | none | Optional ProofBadge (§2.11) when the proposal has been verified or refuted. |
| labels | object of strings | from I18nAdapter | Group name, pending text. |

## States
Idle; action pending (all actions disabled, the pressed one shows the in-button spinner, the only spinner allowed by §2.12); resolved (outcome line); failed (InlineNotice inside the card with the API error text and the actions re-enabled); with proof badge.

## Keyboard and ARIA
- The card is an `article` labelled by its title and described by the proposer.
- Actions form a group named from labels; each is a RAC `Button`. Tab order: actions, then footnote link.
- Meters use RAC `ProgressBar` with `aria-valuetext` equal to the written value.
- When the outcome appears, focus moves to the outcome line (made focusable with tabindex minus one) and it is announced politely.

## Responsive, touch, motion, forced colours
- Text never below 12 px (§2.2 floor). Action targets 44 px on touch.
- Actions wrap onto a second line on narrow cards rather than shrinking.
- No motion except the in-button spinner (stopped under reduced motion, replaced by the pending word).
- Forced colours: meter keeps a system border and fill; delta keeps its sign and word.

## Acceptance tests
- Given an agent actor, when rendered, then the ActorChip shows the square agent avatar and the word for agent.
- Given two actions and onAction returning a pending promise, when the first is pressed, then both are disabled until it settles.
- Given the promise rejects, when it settles, then an error notice appears and the actions are enabled again.
- Given outcome text, when set, then the actions disappear, the outcome is announced and receives focus.
- Given a measure with meter 0.82 and value "82 %", when inspected, then the progress bar reports "82 %" as its value text.
- Given two actions both marked primary, when rendered, then only the first keeps primary emphasis and a development warning is logged.

## Open questions
- Whether "adjust" opens an inline editor or a dialog is left to the host; the card only reports the action id.
