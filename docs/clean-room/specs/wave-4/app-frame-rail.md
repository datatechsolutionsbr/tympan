# AppFrame rail layout (research shell)

Wave 4 · layout · Status: specified · Extends `wave-1/app-frame.md`

Written by the implementer from the approved storyboards (shell = rail + glass
sheet + bottom dock, no top bar) and design direction §2.1, §2.5, §2.8, §3.2.
No fork material was involved: this layout has no fork counterpart.

## Purpose
A ready research shell with no top bar: a navigation rail on the start side,
the page on one glass sheet that scrolls on its own, and a floating action
dock at the bottom of the sheet. It is the default frame for Fakhir research
screens; the wave-1 top-bar layout stays available.

## Anatomy
- **Skip links**: to the main content and to the dock.
- **Rail** (248 px, full height): brand at the top; a context switcher slot
  (organization and project); grouped navigation sections, each with an
  eyebrow label; an account slot pinned to the bottom.
- **Navigation item**: icon, label, optional count; the active item has the
  accent-soft background, accent text and a 3 px inset accent bar on the
  start edge (§3.2).
- **Sheet**: the `main` landmark on a level-1 glass surface (§2.5), radius
  `sheet`, 12 px margin from the viewport and the rail, its own vertical
  scroll, inner padding by breakpoint (§2.1).
- **Dock slot**: a FloatingActionBar (wave-4) centred at the bottom of the
  sheet, horizontal; the sheet reserves bottom padding equal to the dock's
  published inset so the dock never covers content.
- **Aside slot**: the evidence panel (see `evidence-panel.md`).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| layout | 'topbar' \| 'rail' | 'topbar' | Chooses this layout. |
| brand | node | none | Top of the rail. |
| context | node | none | Context switcher slot (organization → project). |
| navigation | node | required | Rail content; `RailNav`, `RailNavSection`, `RailNavItem` are provided. |
| account | node | none | Bottom of the rail. |
| dock | node | none | The action dock. |
| navOpen / onNavOpenChange | boolean / (open) => void | false | Rail drawer below 768 px. |
| other wave-1 props | | | width, aside, asideOpen, loadingLabel, mainId, busy, overlays… |

`RailNavItem`: `{ href?; onPress?; icon; label; count?; countLabel?; current? }`.

## States
Wide (≥ 768): rail visible. Narrow (< 768): rail collapses into a start-side
drawer opened from a menu item of the dock's tab bar; the dock becomes a
bottom tab bar. Route loading: fallback in the sheet, `aria-busy` on main.

## Keyboard and ARIA
- Landmarks: `navigation` (rail, labelled), `main` (sheet), the dock's own
  `navigation` landmark, `complementary` for the aside. No `banner`: there is
  no top bar.
- DOM order matches the visual order: skip links, rail, main, dock.
- Active item: `aria-current="page"`; counts are part of the name
  ("Verificação, 12 pendentes").
- The sheet scrolls itself: it is focusable only as the skip-link target
  (`tabindex=-1`); keyboard scrolling works once focus is inside it.

## Responsive, touch, motion, forced colours
- Sheet margin 12 px; padding 32/24/20 by breakpoint (§2.1).
- Below 768 the sheet has no margin or radius (full bleed) and reserves the
  tab bar height plus the bottom safe-area inset.
- Glass: rail and sheet share level 1; never more than two stacked blurs.
  Reduced transparency: opaque surfaces.
- Forced colours: active item marked with a system-colour border, not only
  the background.

## Acceptance tests
- Given `layout="rail"`, then there is a navigation landmark, one main and no banner.
- Given an active item, then it has `aria-current="page"` and its name includes the count.
- Given a width below 768 px, then the rail is not in the page until the menu control opens it in a modal drawer.
- Given a dock, then the sheet reserves bottom space for it (CSS contract) and a skip link targets the dock.
- Given the first Tab, then the skip link to the main content is focused.
