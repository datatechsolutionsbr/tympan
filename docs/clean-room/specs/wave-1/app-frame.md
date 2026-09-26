# AppFrame

Wave 1 · layout · Status: specified

## Purpose
The outer frame of every authenticated screen: skip link, route progress, side navigation, top bar, the main content area with its width modes, and slots for app-level providers, guards and drawers.

## Anatomy
- **Skip link** (first focusable element).
- **Route progress** (thin progress indicator during navigation; see RouteProgress).
- **Side navigation slot**: full-height column (272 px, collapsible to 72 px icon rail, becomes a start-side Drawer below 1024 px; design direction §2.8, §3.2).
- **Top bar slot**: 56 px sticky bar aligned with the content gutter (breadcrumbs, search, person menu).
- **Main**: the `main` landmark with id matching the skip link target; content width mode `reading` (max 1200), `data` (max 1440) or `full` (no limit), gutter 48/32/16 by breakpoint (§2.1).
- **Aside slot** (optional): evidence panel column (420 px at 1280 and above; overlay drawer from 1024 to 1279; full-screen bottom sheet below 1024).
- **Suspense fallback**: PageLoadingState while a route loads.
- **Invisible slots**: session guard, app initialisers, global drawers (profile, notifications), Toast region.
- **Ambient backdrop** (optional; see AmbientBackdrop).

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| navigation | node | required | side navigation content |
| topBar | node | none | top bar content |
| children | node | required | page content |
| width | 'reading' \| 'data' \| 'full' | 'reading' | content max width |
| aside | node | none | evidence/detail panel |
| asideOpen / onAsideOpenChange | boolean / (open) => void | false | panel visibility |
| navCollapsed / onNavCollapsedChange | boolean / (collapsed) => void | false | icon rail mode (≥ 1024 px) |
| navOpen / onNavOpenChange | boolean / (open) => void | false | drawer state below 1024 px |
| loadingLabel | string | from I18nAdapter | text for the route-loading fallback |
| sessionGuard, initializers, overlays | node | none | rendered outside the visual layout |
| mainId | string | 'main-content' | id used by SkipLink |

## States
- navigation expanded, collapsed (rail), drawer open/closed on narrow screens.
- aside closed, open as column, open as overlay, open as bottom sheet (by breakpoint).
- route loading (fallback shown, `main` `aria-busy`).

## Keyboard and ARIA
- APG: **Landmark regions** guidance. Landmarks: `navigation` (labelled "Main"), `banner` for the top bar, `main`, `complementary` for the aside (labelled by its title). RAC: `Modal`/`Dialog` for the drawer forms of navigation and aside.
- Skip link is first in tab order, then top bar, then navigation, then main (or navigation before top bar; order must match visual order in the chosen layout and be consistent across screens).
- Collapsing the navigation keeps every item reachable; rail items show their name in a tooltip on focus and hover and keep it as accessible name.
- The menu button that opens the navigation drawer has `aria-expanded` and `aria-controls`; Escape closes the drawer and returns focus.
- Focus is never hidden under the sticky top bar (`scroll-padding-top`, §2.6).

## Responsive, touch, motion, forced colours
- Breakpoints 640, 1024, 1280, 1536 (§2.8). Below 1024 px: top bar holds menu button, screen title and avatar; search becomes an icon.
- All bar controls have 44 × 44 px hit areas.
- Glass levels: navigation and top bar are level 1; drawers level 4; never more than two stacked blurs (§2.5). Reduced transparency: all opaque.
- Navigation collapse and aside entry use `--fk-dur-base`; reduced motion: instant.
- Forced colours: region boundaries drawn with 1 px system-colour borders.

## Acceptance tests
- Given the frame, Then landmarks navigation, banner and main each exist once, and main has id `mainId`.
- Given a page load, When Tab is pressed first, Then the skip link is focused.
- Given a width of 800 px, Then the navigation is hidden behind a menu button; When the button is pressed, Then a modal drawer with the navigation opens.
- Given `width` data, Then the content max width is 1440 px; reading, 1200 px.
- Given `asideOpen` at 1440 px, Then the aside is a column beside main; at 1100 px, an overlay drawer; at 800 px, a bottom sheet.
- Given a lazy route, While it loads, Then the loading fallback with `loadingLabel` is shown in main.
- Given the navigation collapsed, Then each rail item still has an accessible name.
