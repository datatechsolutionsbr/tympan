# Tabs

Wave 1 · navigation · Status: specified

## Purpose
Switch between sibling views of the same object inside one page region, showing one panel at a time.

## Anatomy
- **Tab list**: horizontal (default) or vertical row of tabs.
- **Tab**: label, optional leading icon, optional count.
- **Selection indicator**: marks the selected tab (shape and weight, not colour alone).
- **Panel**: content for the selected tab.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| selectedKey / defaultSelectedKey | string | first tab | controlled or initial selection |
| onSelectionChange | (key: string) => void | none | called when a different tab is selected |
| orientation | 'horizontal' \| 'vertical' | 'horizontal' | layout and arrow-key axis |
| activation | 'automatic' \| 'manual' | 'automatic' | automatic selects on focus; manual needs Enter/Space |
| label | string | required | accessible name of the tab list |
| Tab.id | string | required | key linking tab and panel |
| Tab.label | node | required | visible text |
| Tab.icon | icon component | none | decorative |
| Tab.count | number | none | optional count shown after the label, included in the accessible name |
| Tab.disabled | boolean | false | cannot be selected |
| Panel.id | string | required | matches a tab |
| keepMounted | boolean | false | keep inactive panels in the DOM (hidden) to preserve their state |

## States
- tab: idle, hover, focus-visible, selected, disabled.
- panel: shown only for the selected tab.

## Keyboard and ARIA
- APG pattern: **Tabs** (automatic or manual activation). RAC primitive: `Tabs` + `TabList` + `Tab` + `TabPanel`.
- One tab stop for the list (roving focus). ArrowLeft/ArrowRight (or Up/Down when vertical) move, wrapping; Home/End jump; direction follows reading direction.
- Tab from the list moves focus into the selected panel (panel is focusable when it has no focusable content).
- Roles `tablist`, `tab` (`aria-selected`, `aria-controls`), `tabpanel` (`aria-labelledby`).

## Responsive, touch, motion, forced colours
- Each tab has a 44 px minimum touch height below 1024 px; the list scrolls horizontally rather than wrapping when it overflows, with the selected tab scrolled into view.
- Selected tab uses `--fk-accent` for the indicator and text weight change (§2.3); changing tabs uses `--fk-dur-quick` (§2.7); reduced motion: indicator moves instantly.
- Forced colours: the selected tab keeps a visible indicator (border or underline in `Highlight`).

## Acceptance tests
- Given three tabs, Then one `tablist` with three `tab` elements exists and exactly one has `aria-selected=true`.
- Given focus on the first tab, When ArrowRight is pressed (automatic activation), Then the second tab is focused, selected, and its panel is shown.
- Given manual activation, When ArrowRight is pressed, Then focus moves but selection does not change until Enter.
- Given focus on the last tab, When ArrowRight is pressed, Then focus wraps to the first.
- Given a disabled tab, When arrowing, Then it is skipped.
- Given a tab with count 4, Then its accessible name includes the count.
- Given `keepMounted`, When switching tabs, Then the previous panel's input values are preserved.
