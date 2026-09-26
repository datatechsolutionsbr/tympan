# FlowSettingsDialog

Wave 3 · overlay · Status: specified

## Purpose
A modal for editing a flow's identity (name, description, slug) and, when known, its lifecycle (draft or published, active or archived), emitting only what changed.

## Anatomy
- SectionedModal with title, subtitle and eyebrow.
- Name field (required), description text area.
- Lifecycle block (only when the opener supplied slug, draft or active values): slug field with a hint about leaving it blank; a fieldset "Lifecycle" with two switches, each with a label and a sentence that changes with its value (draft: editable, runs unaffected / published: edits need a new version; active: listed and runnable / archived: hidden from default listings).
- Footer: Cancel (secondary) and Save (primary, shows a busy state).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| onSave | (patch: FlowSettingsPatch) => Promise<void> | required | Persist; a rejection keeps the dialog open for retry and the host shows the error. |
| labels | object of strings | required | All visible strings. |

FlowSettingsPatch = { name: string; description: string; slug?: string or null; isDraft?: boolean; isActive?: boolean }. Opening data (name, description, optional slug, draft, active) comes from the editor dialog state.

## Behaviour rules
- Name and description are trimmed and always sent. A blank name blocks saving and shows a field error (the fork silently ignored the click).
- Slug is sent only when it differs from the original; a blank slug is sent as null (meaning "use the generated one").
- Draft and active are sent only when the opener supplied them and the value changed.
- Enter in a single-line field saves; Shift+Enter and Enter inside the description do not.

## States
- simple (no lifecycle block) and full; saving (Save busy, fields read-only); invalid name.

## Keyboard and ARIA
- APG pattern: Dialog (Modal); switches follow the APG Switch pattern. RAC: Modal, Dialog, TextField, Switch.
- Lifecycle switches are grouped with a legend; each switch's changing sentence is linked by `aria-describedby`.
- Save busy state uses `aria-busy` and keeps focus on the button.

## Responsive, touch, motion, forced colours
- Full-screen on phones. Switch hit areas at least 44 px.
- No motion beyond the modal's own entry; none under reduced motion.
- Forced colours: switch on and off states distinguishable by thumb position and border, not colour.

## Acceptance tests
- Given the opener supplied only name and description, when the dialog opens, then no slug or lifecycle controls are shown.
- Given the original slug "pricing" and the person clears it, when saving, then the patch has slug null.
- Given draft was true and is switched off, when saving, then the patch includes isDraft false and nothing about active.
- Given a blank name, when Save is activated, then onSave is not called and the name field shows an error.
- Given onSave rejects, when saving finishes, then the dialog stays open with values intact.
- Given focus in the name field, when Enter is pressed, then the dialog saves.
