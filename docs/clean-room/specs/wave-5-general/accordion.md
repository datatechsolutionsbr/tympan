# Accordion

Wave 5 · layout · Status: specified

Behaviour reference: shadcn/ui (MIT), read by the spec writer only.

## Purpose
A vertical stack of headed sections where each section's body can be shown or hidden. Used for FAQs, settings groups and long forms. GroupedDisclosureList remains the choice for grouped data lists; SectionPanel for single titled panels.

## Anatomy
- **Accordion**: the stack; separators between items.
- **Item**: a heading that contains the **trigger** (title, optional leading icon, optional trailing summary text, chevron) and a **panel** holding any content.

## Properties and events
Accordion:
| Name | Type | Default | Meaning |
|---|---|---|---|
| items | { id; title; summary?; icon?; content; disabled? }[] | none | Data form. A composed form with Item children is also accepted. |
| expansion | 'single' \| 'multiple' | 'single' | Single: opening one closes the others. Multiple: any number open. |
| collapsible | boolean | true | Single mode: the open item can be closed so that none is open. When false, one item always stays open. |
| expandedKeys / defaultExpandedKeys / onExpandedChange | set of ids | empty | Controlled or not. |
| headingLevel | 2 – 6 | 3 | Level of each item heading. |
| appearance | 'plain' \| 'separated' \| 'contained' | 'plain' | Plain: lines between items. Separated: each item on its own surface. Contained: one surface around all. |
| keepMounted | boolean | false | Keep closed panels in the DOM (hidden) for find-in-page and form state. |
| disabled | boolean | false | Whole accordion. |

Item (composed form): `id`, `title`, `summary`, `icon`, `disabled`, `children`.

## States
Item closed, open, opening, closing, hover, focus-visible, disabled.

## Keyboard and ARIA
- RAC `DisclosureGroup` with `Disclosure`, `Heading`, `Button` (slot trigger) and `DisclosurePanel`; APG **Accordion** pattern.
- Each trigger is a `button` inside a heading of `headingLevel`, with `aria-expanded` and `aria-controls` its panel; the panel is a `region` labelled by the trigger when it holds substantial content.
- Enter and Space toggle; Tab moves between triggers and into open panels in document order.
- Optional arrow navigation between triggers (Arrow Up and Down, Home, End), matching APG.
- In single mode with `collapsible` false, the open item's trigger reports `aria-disabled` so it cannot be closed.
- With `keepMounted`, closed panels are hidden with `hidden="until-found"` where supported, so find-in-page opens them.

## Responsive, touch, motion, forced colours
- Triggers span the full width and are at least `--ty-control-target` high.
- Chevron rotates with the open state; panel height animates with `--ty-dur-base` and `--ty-ease-out`. Under reduced motion both change instantly.
- Lines `--ty-line-soft`; surfaces for separated and contained appearances `--ty-surface-raised`, radius `--ty-radius-card`; focus ring `--ty-focus-ring`.
- Forced colours: separators and surfaces keep a `CanvasText` border; open state is carried by the chevron direction and `aria-expanded`.

## Acceptance tests
- Given single mode with item A open, when B's trigger is pressed, then B opens and A closes.
- Given single mode with `collapsible` true and A open, when A's trigger is pressed, then no item is open.
- Given single mode with `collapsible` false and A open, when A's trigger is pressed, then A stays open.
- Given multiple mode, when A and B are pressed, then both are open and `onExpandedChange` reports both.
- Given `headingLevel` 4, then each trigger sits inside a level-4 heading.
- Given a disabled item, then its trigger cannot be toggled and is skipped by arrow navigation.
- Given `keepMounted` and a search for text in a closed panel, then the browser can reveal it (where the platform supports it).
- Given reduced motion, when an item opens, then no height transition runs.
