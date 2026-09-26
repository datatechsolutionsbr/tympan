# AgentEditorDialog

Wave 3 · overlay · Status: specified

## Purpose
A large modal for creating or editing a saved agent (identity, capability and model, instructions, tools), saving automatically as the person edits.

## Anatomy
- SectionedModal in sidebar layout: a navigation rail with three sections, an identity card at the top of the rail, an autosave status at the bottom of the rail, and one content pane.
- Identity card (always visible): agent avatar (square, agent style of §2.11, never round; editable image address or glyph), editable name shown as the heading, active/inactive StateSwitch, description text area, TagField for tags.
- Section "Engine":
  - Capability control: a slider over a host-defined capability rating with named tiers; moving it selects the model at the matching position in the catalogue's models ordered from least to most capable, and adjusts the sampling default of that tier.
  - Autonomy bar: four named levels (low, medium, high, full) as a toggle group; choosing one jumps the capability rating to that level's band.
  - Derived summary: chosen model, its context size and output limit, the provider that serves it ("served via", with connected or needs-setup status), or a notice that no configured provider serves the model family.
  - Override disclosure "Advanced": manual model picker; generation parameters shown only when the chosen model supports them (maximum output length, nucleus and top-k sampling); list of provider credentials with status and a link to manage them at account level.
- Section "Instructions" (the fork called it the brain): sampling control (temperature slider with named ranges, precise to creative) or, for reasoning models, a reasoning-effort segmented control (low, medium, high, very high); system prompt text area; optional OutputSchemaBuilder.
- Section "Tools": ToolServerListField.
- Unsaved-changes notice (warning tone) when a save fails, with Retry.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| onPersist | (payload: AgentPayload) => Promise<void> | optional | Called by autosave with the full canonical payload (identity, status, tags, model, provider, sampling, reasoning effort, limits, prompt, output schema, cleaned tool servers). Rejection shows the unsaved notice. |
| onSaved | () => void | optional | Legacy hook after an explicit save; not called by autosave. |
| models | Model[] | required | Catalogue with capability metadata (output limit, context size, family, supported parameters, reasoning flag). |
| providers | Provider[] | required | Configured providers with the families they serve and a configured flag. |
| credentialsHref | string | required | Link to account-level credentials. |
| labels | object of strings | required | Every visible string, including tier and autonomy names. |

Open state, create or edit mode and the agent record come from the editor's dialog state.

## Behaviour rules
- Hydrating the form on open must not count as an edit; only genuine edits mark the form dirty.
- Autosave: each dirty change schedules one persist after a short idle delay (from the motion or timing tokens, not a fixed fork value); a new edit reschedules; only one persist in flight.
- Status words in the rail: "Saving", "Will save in a moment", "Saved", "Not saved" (with Retry); icon plus word.
- Closing with a pending change flushes the save first; closing while a save failed asks for confirmation (ConfirmService).
- In create mode the first successful persist switches the dialog to edit mode.

## States
- create, edit; clean, dirty, saving, failed; model with or without provider; reasoning model (temperature hidden, effort shown).

## Keyboard and ARIA
- APG patterns: Dialog (Modal); Tabs-like vertical navigation for the rail (RAC Tabs, vertical orientation, manual activation); Slider for capability and temperature (RAC Slider with value text naming the tier or range); Toolbar or Radio Group for autonomy (RAC ToggleButtonGroup, single selection); Disclosure for Advanced.
- The name field has an explicit accessible label even though it looks like a heading.
- Autosave status is a polite status region.

## Responsive, touch, motion, forced colours
- Below the medium breakpoint the rail becomes a top tab strip and the identity card collapses into a summary with an edit action.
- Slider thumbs and autonomy segments have 44 px hit areas even if drawn thinner.
- No animated tier colours; tier is conveyed by name. Reduced motion: no transitions on slider fill.
- Forced colours: slider track, thumb and selected autonomy level visible with system colours.

## Acceptance tests
- Given the dialog opens on an existing agent, when nothing is edited, then onPersist is never called.
- Given the person edits the name, when the idle delay passes, then onPersist is called once with the new name.
- Given onPersist rejects, when the save ends, then "Not saved" and a Retry appear.
- Given the capability slider moves to a higher tier, when it settles, then a more capable model is selected and the value text names the tier.
- Given a reasoning model is chosen, when Instructions opens, then the temperature control is replaced by reasoning effort.
- Given the chosen model's family has no configured provider, when Engine renders, then the no-provider notice is shown.
- Given focus on the rail, when Down Arrow then Enter are pressed, then the next section is shown.

## Open questions
- Capability rating ranges and tier boundaries are product decisions; take them from the agent catalogue in the contract, not from the fork.
