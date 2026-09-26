# ConversationShell

Wave 3 · layout · Status: specified

## Purpose
A full-screen assistant workspace: conversation history on one side, the dialogue in the centre, and a live canvas panel that appears when the assistant builds or opens a flow.

## Anatomy
- History side panel: "new conversation" action, favourites filter toggle, date-grouped list (today, yesterday, last 7 days, older; empty groups hidden), empty and no-results messages.
- History row: title (truncated), metadata line (short id chip and up to three agent Tags plus "+n"), favourite toggle, delete action (confirmation names the conversation).
- Centre: optional header banner slot, then AssistantConversation in the `full` variant.
- Live canvas panel: heading, short flow id chip, close action, body rendered by a host render function or, by default, FlowPreview of the latest graph.
- Helper `groupByDate(conversations, now?)`: buckets by local midnight; unparsable dates go to "older".
- Helper component `ConversationMetaLine`: the metadata line, reused by any history list.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| chat | AssistantChat state | required | Conversation state. |
| labels | `AssistantLabels` | from i18n adapter | All strings. |
| conversations | `{ id; title; updatedAt; agents?; boundFlowId?; boundFlowName? }[]` | required | Newest first. |
| onSelect / onDelete / onNew | `(id) => void` / `(id) => Promise<void>` / `() => void` | required | History actions. |
| suggestions | `string[]` | `[]` | Starter prompts. |
| renderCanvas | `(artifact: { toolCallId; flowId?; graph }) => ReactNode` | preview | Real editor mount. |
| banner | `ReactNode` | none | Slot above the dialogue. |
| appMark | `ReactNode` | none | Empty-state mark. |
| favourites | `{ ids: string[]; onChange }` | device storage | Favourites persistence; storage failures are silent. |

Canvas rule: the latest successful graph-producing tool result (create, edit, add, connect, remove, update, read a flow) is the artifact; the panel opens for it; closing hides it until a newer artifact arrives; the composer's "open canvas" reopens it.

## States
- History empty, filtered empty, populated; active conversation marked.
- Canvas open, dismissed, absent.

## Keyboard and ARIA
- History is a `nav` landmark labelled "Conversation history" containing a list; each row's main action is a link or button with `aria-current="page"` for the active one; favourite is a RAC `ToggleButton` (`aria-pressed`); delete uses ConfirmService.
- Canvas panel is a `complementary` region labelled "Live canvas"; close returns focus to the composer.
- Row actions are always visible (not hover-only) so keyboard and touch users can reach them.

## Responsive, touch, motion, forced colours
- Below the small breakpoint the history becomes a Drawer opened from a header button; below the medium breakpoint the canvas opens as a full-screen Drawer instead of a side column (the fork hides both; not acceptable).
- 44 px targets; active row marked by shape and weight, not only tint; no motion beyond Drawer rules.

## Acceptance tests
- Given conversations updated today, yesterday, 3 days ago and 30 days ago, then four groups appear in that order.
- Given an invalid date, then that conversation is in "older".
- Given the favourites filter on and no favourites, then the no-results message shows.
- Given delete on "Budget", then the confirmation names "Budget"; when confirmed, `onDelete` is called.
- Given a tool result carrying a graph, then the canvas panel opens; when closed, it stays closed until a newer graph result arrives.
- Given the canvas is closed with an artifact available, then the composer shows "open canvas", which reopens it.
- Given a narrow viewport, then the history is reachable through a Drawer.
