# CascadeGrid

Wave 4 · layout · Status: specified

## Purpose
A grid container whose items appear one after another in quick succession the first time the grid mounts. It exists for hosts that want this entrance on showcase pages.

**Design direction note.** §2.7 says "no spring, no stagger" and §4 Phase 3 removes the staggered grid from the Fakhir app. The component is therefore off by default at library level and must not be used in the authenticated Fakhir app. With the switch off it renders exactly like a plain grid.

## Anatomy
- **Grid element**: the host's grid layout (columns and gaps passed through).
- **Item wrappers**: one transparent wrapper per child, which becomes the grid cell. Wrappers add no layout of their own.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| children | node | required | Grid items. |
| cascade | boolean | follows the global switch (off) | Per-instance opt-in. |
| stepMs | number | derived from `--fk-dur-instant` | Delay between two items. |
| maxTotalMs | number | `--fk-dur-base` | Upper bound for the whole cascade; the step shrinks when there are many items so the last item starts within this bound. |
| distance | 'none' \| 'small' | 'small' | Whether items also rise slightly or only fade. |
| role, aria-label, testing id | passthrough | | Forwarded to the grid element. |

**Global switch.** MotionFoundation gains one flag, `decorativeMotion` (default false). CascadeGrid animates only when `cascade` is true and `decorativeMotion` is true and reduced motion is off. Any one of the three off gives the plain grid.

## States
Plain (default); cascading (first mount only); settled. Re-renders and new children do not replay the cascade; items added later appear at once.

## Keyboard and ARIA
- No change to semantics: roles and names are forwarded to the grid element; wrappers carry no role.
- Items are in the accessibility tree and focusable from the first frame (they start transparent, never `display: none` or inert), so keyboard users are never blocked by the entrance.

## Responsive, touch, motion, forced colours
- `prefers-reduced-motion: reduce`: plain grid, no wrapper animation, children visible at once.
- Movement uses opacity and a small translate only, eased with `--fk-ease`; no scale and no spring.
- Server rendering outputs a plain grid with visible items; the cascade is a client-only enhancement, so no content is hidden without scripts.
- Forced colours: no effect.

## Acceptance tests
- Given default settings, when mounted, then no item has an animation and the markup matches a plain grid with the same children.
- Given cascade true and decorativeMotion true, when mounted, then items start their entrance in document order.
- Given twenty items, when cascading, then the last item starts no later than `maxTotalMs`.
- Given reduced motion, when mounted with every switch on, then no animation runs.
- Given the grid has already mounted, when a new child is added, then it appears without animation.
- Given a focusable child, when Tab is pressed during the cascade, then it receives focus.
