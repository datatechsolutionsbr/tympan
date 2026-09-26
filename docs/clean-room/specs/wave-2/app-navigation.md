# AppNavigation

Wave 2 · navigation · Status: specified

## Purpose
Turns one list of navigation entries into the app's primary navigation in the layout the shell needs (side bar, collapsed rail, top bar, or floating bar) and wires the same entries into the NavigationFlyout, the AppLauncherGrid and the account actions. The builders that convert entries for each presentation are part of this spec.

## Anatomy
- **Brand block**: BrandMark and product name (links home).
- **Scope switcher slot** (side bar): organisation → project selector supplied by the host (design direction §3.2).
- **Entry groups**: optional group headings in `eyebrow` style; entries with icon, label and a count only where an action is pending for this person.
- **Active marker**: accent-soft background, accent text and a leading bar (§3.2); never the CTA gradient.
- **Footer slot**: edition status, demo-data sentence, or other host content.
- **Account cluster**: avatar button opening a menu with profile, language, theme and sign out (§3.2 moves language and theme out of the bar).
- **Top bar** (with side bar): Breadcrumbs, command search trigger, avatar; on mobile a menu button, screen title and avatar.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| entries | NavEntry[] | required | `{ id; label; href; icon; description?; group?; count?; permission?; menu?: NavMenuEntry[]; onPress? }`. |
| layout | 'sidebar' \| 'rail' \| 'topbar' \| 'floating' | 'sidebar' | Presentation. Below 1024 'sidebar' and 'rail' become a left Drawer opened from the top bar. |
| collapsed / onCollapsedChange | boolean / (v: boolean) => void | false | Side bar collapsed to the rail (icons with tooltips). |
| pathname | string | from RouterAdapter | Current location; active entry is exact for the home path, prefix for others. |
| onNavigate | (href: string) => void | RouterAdapter navigate | Navigation. |
| onPrefetch | (href: string) => void | none | Called on hover or focus of an entry. |
| permissions | string[] | all | Entries whose `permission` is absent from this list are removed (builder `filterByPermission`). |
| brand / scopeSwitcher / footer | ReactNode | none | Slots. |
| account | { name?; initial?; pictureUrl?; onProfile; onSignOut; theme; onThemeChange; locale?; onLocaleChange? } | none | Account cluster. |
| flyout | { open: boolean; onOpenChange } | none | Enables the NavigationFlyout with the same entries. |
| launcher | boolean | false | Renders the AppLauncherGrid (home screen) with the same entries. |
| labels | object | from I18nAdapter | Landmark name, home, profile, sign out, theme, actions, open menu, collapse. |

Builders (pure functions): entries → floating-bar actions (adds optional home and account actions, marks active), entries → launcher tiles, entries → flyout destinations, and filter by permission.

## States
Entry: rest, hover, focus-visible, active (current page), with pending count. Side bar: expanded, collapsed, drawer open (mobile).

## Keyboard and ARIA
- A `nav` landmark named by a localised "Primary navigation"; entries are links (RAC `Link`) with `aria-current="page"` on the active one. Tab moves through entries; no roving focus needed.
- Group headings are headings or labelled lists, not interactive.
- Rail mode: each icon link has its label as accessible name and a tooltip (RAC `TooltipTrigger`) on hover and focus.
- Collapse toggle: APG Button with `aria-expanded` and `aria-controls`.
- Mobile drawer: APG Dialog (Modal), RAC `Modal`; Escape closes; focus returns to the menu button; choosing an entry closes the drawer.
- Account cluster: APG Menu Button, RAC `MenuTrigger` + `Menu`; theme and language appear as radio menu items (`menuitemradio`).
- Entry sub-menus (`menu`) open from a visible chevron button, never only by right-click or long-press.
- Counts are part of the link name ("Verification, 12 pending").

## Responsive, touch, motion, forced colours
- Widths and breakpoints from design direction §2.8 (side bar, rail, top bar heights, drawer below 1024).
- Every entry at least 44 px tall on touch; rail icons 44 × 44 px.
- Collapse and drawer transitions in `--fk-dur-base`; reduced motion: instant.
- Reduced transparency: bar and side bar opaque. Forced colours: active entry uses a system border or the leading bar in `Highlight`, not only background.

## Acceptance tests
- Given entries A, B, C and pathname "/b/12", then B has `aria-current="page"` and A and C do not.
- Given the home entry "/" and pathname "/b", then home is not current.
- Given an entry with a permission the person lacks, then it is not rendered in any presentation.
- Given layout 'sidebar' at a width of 800, then a menu button opens a modal drawer containing the entries.
- Given `collapsed`, then each entry shows only its icon, has its label as accessible name, and a tooltip appears on focus.
- Given an entry with a sub-menu, when its chevron button is activated with Enter, then the menu opens and arrow keys move through items.
- Given the account menu, when "Dark" is chosen, then `onThemeChange('dark')` is called.
- Given translated labels, then no English fallback text appears.
