# AgentNodeForm

Wave 3 · form · Status: specified

## Purpose
The configuration form for an agent node on the canvas: it references a saved agent and holds the per-run user prompt; all other agent settings live on the saved agent.

## Anatomy
- Legacy notice (warning tone) when the node still carries inline agent settings and no saved-agent reference.
- Load error notice (error tone) when loading saved agents fails.
- Agent picker (select) with a first option "Choose a saved agent", or a loading line with an inline spinner while agents load.
- Summary of the chosen agent: its model identifier in monospace, and an ActorChip of kind agent (§2.11).
- Link to the agents area: "New agent" when there are none, "Manage agents" otherwise.
- User prompt text area (several lines) accepting template references to upstream values.
- Form footer (Cancel, Save).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| config | { agentRef?: string; userPrompt?: string; legacy inline fields? } | required | Current node configuration; an older reference field is accepted as agentRef. |
| onSave | (config: { kind: 'agent'; agentRef?: string; userPrompt?: string }) => void | required | Emits only the reference and prompt (blank values omitted). |
| onCancel | () => void | required | Discard. |
| agents | { id: string; name: string; model?: string }[] | optional | Pre-loaded saved agents; when given, no loading happens. |
| loadAgents | () => Promise<Agent[]> | optional | Used only when agents is not given. |
| agentsHref | string | required | Where "New agent" / "Manage agents" navigate, through RouterAdapter (the fork hard-coded a path and bypassed the router). |
| labels | object of strings | required | All visible strings. |

## States
- loading, load error, no agents, agent chosen, legacy inline.
- Loading is cancelled if the form unmounts or its inputs change.

## Keyboard and ARIA
- RAC Select (APG Listbox / Select-only Combobox) and TextField; the navigation action is a Link, not a button.
- Loading line is a status region; error notice is announced.
- Legacy notice is linked to the picker as its description.

## Responsive, touch, motion, forced colours
- Single column; the prompt area grows with content up to a maximum, then scrolls.
- 44 px targets; spinner static under reduced motion; forced colours use system borders.

## Acceptance tests
- Given agents are supplied, when rendered, then no loader is called and the picker lists them.
- Given only loadAgents, when rendered, then a loading line appears until it resolves.
- Given loadAgents rejects with "offline", when rendered, then the error notice includes "offline".
- Given a node with inline model settings and no reference, when rendered, then the legacy notice is visible.
- Given agent a1 and prompt "Summarise {{source.text}}", when saved, then onSave receives kind agent, agentRef a1 and that prompt, and no inline settings.
- Given no agents exist, when rendered, then the link reads "New agent".
