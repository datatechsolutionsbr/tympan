# AvatarGroup

Wave 5 · data display · Status: specified

Behaviour reference: shadcn/ui (MIT), read by the spec writer only.

## Purpose
Show several people or agents as a compact overlapping stack with an overflow count ("+4"), for participants of a thread, assignees and collaborators.

## Anatomy
- **Stack** of Avatars, each slightly overlapping the previous one, with a ring in the surface colour separating them.
- **Overflow chip**: "+n" in the same size as the avatars.
- Optional **pressable wrapper** that opens a list of everyone (Popover or Drawer supplied by the host).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| people | { id; name; src?; fallbackText?; actorKind? }[] | required | Everyone in the group, in display order. |
| max | number | 4 | Avatars shown before the overflow chip. |
| size | Avatar size | 'regular' | Size of every avatar and the chip. |
| label | string | from i18n ("{count} participants") | Accessible name of the group. |
| onPress | () => void | none | Makes the whole group one button (for example "Show all participants"). |
| overflowLabel | (hidden: number) => string | from i18n ("{n} more") | Name of the overflow chip. |

## States
All shown; overflowing; pressable (hover, pressed, focus-visible).

## Keyboard and ARIA
- Non-pressable: a list (`role="list"`) named by `label`; each avatar is a list item named by the person's name; the chip is a list item named by `overflowLabel`.
- Pressable: RAC `Button` whose accessible name is `label` plus the first names ("Ana, Bruno, Carla and 4 more"); inner avatars are decorative.
- Initials are never read as letters.

## Responsive, touch, motion, forced colours
- A pressable group has a hit area of at least `--ty-control-target`.
- Overlap and ring use the Avatar size step and `--ty-surface` as ring colour; the chip uses `--ty-neutral-soft` and `--ty-on-neutral-soft`.
- No hover spreading or animation.
- Forced colours: each avatar keeps a `CanvasText` border so overlaps stay distinguishable.

## Acceptance tests
- Given 7 people and `max` 4, then 4 avatars and a "+3" chip are shown.
- Given 3 people and `max` 4, then no chip is shown.
- Given a non-pressable group, then a list with one item per visible avatar plus the chip is exposed, named "7 participants".
- Given `onPress`, when activated with Enter, then it fires and the button name lists the first names and the hidden count.
- Given an agent in the list, then its avatar keeps the agent shape (Avatar rules).
