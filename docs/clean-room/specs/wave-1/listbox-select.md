# ListboxSelect

Wave 1 · form · Status: specified

## Purpose
Chooses one value from a list shown in a custom popover, for cases where options need richer rendering than the native select allows.

## Anatomy
- **Label**, **trigger** (shows the selected label or placeholder and a chevron), **popover** containing a **listbox** of **options**, each with a **check mark** when selected and an optional **description**; **error message**.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| label / accessibleLabel | string | none | One is required. |
| options | Array<{ value: string; label: string; description?: string; icon?: node; disabled?: boolean }> | required | Items. |
| sections | Array<{ title: string; options: … }> | none | Optional grouped options. |
| value / defaultValue | string \| null | null | Selected value. |
| onChange | (value: string) => void | none | Fires when an option is chosen. |
| placeholder | string | from I18n | Trigger text when empty. |
| errorMessage | string | none | Invalid state. |
| hint | node | none | Description. |
| disabled, required, name | — | — | `name` renders a hidden input for form submission. |
| open / onOpenChange | boolean / (open) => void | uncontrolled | Popover visibility. |

## States
Closed, open, option focused (virtual focus), option selected, option disabled, trigger focus-visible, invalid, disabled.

## Keyboard and ARIA
- APG pattern: **Listbox** inside a **Select-only Combobox**.
- RAC primitive: `Select` with `Button`, `SelectValue`, `Popover`, `ListBox`, `ListBoxItem`, `ListBoxSection`.
- Trigger: Enter, Space, ArrowDown open and focus the selected (or first) option; ArrowUp opens on the last.
- In the list: arrows move, Home/End jump, type-ahead matches by label, Enter/Space selects and closes, Escape closes without change; focus returns to the trigger.
- Selected option has `aria-selected`; disabled options are skipped.
- Clicking outside closes without change.

## Responsive, touch, motion, forced colours
- Trigger touch height per §2.10; each option row is at least 44 px tall.
- On narrow screens the popover becomes a bottom tray (Drawer behaviour) with the same listbox semantics.
- Opening uses the quick duration and entry easing of §2.7; reduced motion shows it instantly.
- Popover surface is elevation level 3 (§2.5); opaque under reduced transparency.
- Forced colours: selected option uses `Highlight`/`HighlightText`, and the check mark stays visible.

## Acceptance tests
- Given a closed select, when ArrowDown is pressed on the trigger, then the list opens with the selected option focused.
- Given the list is open, when "b" is typed, then focus moves to the first option starting with "b".
- Given an option is chosen with Enter, then `onChange` fires with its value, the list closes and focus is on the trigger.
- Given Escape while open, then the list closes and the value is unchanged.
- Given a disabled option, when arrowing, then it is skipped.
- Given `name`, when the surrounding form submits, then the value is included.
- Given `disabled`, when the trigger is clicked, then nothing opens.
- Given axe, when open and closed, then no violations are reported.

## Open questions
- The fork rendered options as plain buttons without listbox roles and closed on an invisible backdrop; this spec requires the full listbox pattern instead.
