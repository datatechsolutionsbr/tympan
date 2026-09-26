# FlowSwitcherBar

Wave 3 · navigation · Status: specified

## Purpose
A horizontal bar above the editor listing the person's flows, to switch the open flow, create a new one or delete one.

## Anatomy
- **Flow tabs**: each shows name, version (as metadata in mono per §2.2 and §2.13), draft or published state as a StatusPill, and relative time since the last update.
- **Delete button** per tab (icon button), only when more than one flow exists.
- **New flow button** at the end.
- **Loading placeholder**: skeleton tabs (§2.12).

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| flows | { id, name, version, isDraft, updatedAt? }[] | required | flows to show |
| activeFlowId | string or null | required | the open flow |
| isLoading | boolean | required | shows skeletons |
| onSelect | (flow) => void | required | switch flow |
| onCreate | () => void | required | new flow |
| onDelete | (id, name) => void | required | host confirms (ConfirmService) and deletes |
| labels | { draft, published, newFlow, delete } | i18n | strings |

Relative time: localised "just now", minutes, hours, days (use the I18nAdapter's relative time formatter, not hand-built English strings).

## States
Loading; list; active tab (accent soft background and marker, §2.3); tab hover and focus-visible; single flow (no delete); overflowing (horizontal scroll with scroll buttons).

## Keyboard and ARIA
APG Tabs pattern does not fit because each tab carries an extra action; use a RAC ToggleButtonGroup-like list: a list of RAC Buttons where the active one has aria-current="page", each followed by its delete RAC Button as a sibling (never nested). Arrow keys move between flow buttons; Tab reaches the delete button of the current item and the new flow button. Delete buttons are named "Delete flow <name>".

## Responsive, touch, motion, forced colours
- Delete visible always on touch and on focus, not only on hover; 44 px targets.
- Below 640 px the bar becomes a RAC Select listing flows plus separate new and delete buttons.
- Reduced motion: no scroll animation. Forced colours: active tab marked by a border and aria-current, not tint alone.

## Acceptance tests
- Given three flows and an active id, when rendered, then the active flow's button reports aria-current.
- Given one flow, when rendered, then no delete button exists.
- Given a delete activation, when pressed, then onDelete receives id and name and onSelect is not called.
- Given isLoading, when rendered, then skeleton tabs and a status "loading flows" are present.
- Given an update ten minutes ago in pt-BR, when rendered, then the time reads in Portuguese.
- Given a draft flow, when rendered, then the draft pill shows icon and word.
