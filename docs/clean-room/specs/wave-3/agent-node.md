# AgentNode

Wave 3 · canvas · Status: specified

## Purpose
A node that places a configured AI agent in a flow and shows who it is: name, role and model family.

## Anatomy
- GraphNodeCard (wide).
- **Agent body**: agent avatar (AgentIdentity: square shape and dashed border for agents per §2.11, never round), name, role (hidden when compact), model family mark with the full model id available on request, extra badges.
- **Remove action**: removes the node from the canvas (does not delete the agent).
- **Ports**: inputs on the start and top sides; outputs on the end and bottom sides; a separate "rule" output for attaching rules.
- NodeRunIndicator.
- **Missing state**: when the referenced agent no longer exists, a problem card with the stored label and a "not found" explanation, ports kept so existing connectors remain.

The agent body is shared with the agent gallery outside the canvas (host supplies actions there).

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| id | string | required | node id |
| agent | { name, role?, avatar?, modelId? } or null | required | referenced agent |
| label | string | 'Agent' | fallback title when the agent is missing |
| density | 'detailed' or 'compact' | 'detailed' | compact hides role |
| onOpen | () => void | none | opens the agent editor |
| onRemove | (id) => void | none | shows the remove action |
| actions | node | none | extra header actions (gallery use) |

## States
Default, hover, selected, focus-visible, compact, missing agent (problem look), avatar failed to load (falls back to a generated deterministic avatar, then to an agent glyph), locked.

## Keyboard and ARIA
APG Button pattern (RAC Button) for opening the editor, name "agent: name, role". Remove is a separate real button (not nested) named "Remove name from canvas". The model family mark has text (provider name), not only a logo; brand logos are not used (see INVENTORY dropped items).

## Responsive, touch, motion, forced colours
- Remove action 44 px hit area. Text at least 12 px.
- Reduced motion: no hover transitions. Forced colours: avatar border and problem look remain visible.

## Acceptance tests
- Given an agent with a role, when rendered detailed, then name and role are shown; compact shows only the name.
- Given no avatar, when rendered, then a deterministic avatar derived from the name is shown, identical across renders.
- Given the agent is missing, when rendered, then the problem card shows the label and "not found", with ports present.
- Given onRemove, when the remove button is activated, then onRemove receives the node id and onOpen is not called.
- Given a model id, when the model mark is focused or hovered, then the full model id is available.
