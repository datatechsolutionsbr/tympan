# NavigationFlyout

Wave 2 · navigation · Status: specified

## Purpose
A large panel opened from the top bar that lets people jump to any area of the app: a searchable grid of destinations and a row of quick account actions (notifications, theme, profile, sign out). It is the "all destinations" companion to the AppNavigation.

## Anatomy
- **Panel**: a modal panel dropped from the top bar (§2.5 level 4) with an optional title.
- **Destination search**: a search field that filters destinations by label and subtitle.
- **Destination grid**: tiles, each with icon, label, optional subtitle; the current area is marked.
- **No-results line**: shown when the filter matches nothing.
- **Quick actions row**: notifications (with CountBadge), theme (label plus Switch), profile (initial or person icon plus name), sign out (danger tone).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| open / onOpenChange | boolean / (open: boolean) => void | required | Visibility. |
| title | ReactNode | none | Panel heading. |
| destinations | { id: string; label: string; subtitle?: string; href: string; icon: ReactNode; onPress?: () => void }[] | required | Tiles; `onPress` replaces navigation when given. |
| currentPath | string | from RouterAdapter | Marks the current destination (prefix match, exact for the home path). |
| onNavigate | (href: string) => void | RouterAdapter navigate | Navigation. |
| searchable | boolean | true | Shows the search field. |
| quickActions | { theme: 'light' \| 'dark'; onThemeChange; onNotifications?; unseenCount?; onProfile; personName?; personInitial?; onSignOut } | none | Account row. |
| labels | object | from I18nAdapter | Search placeholder, no results, notifications, theme, profile, sign out. |

## States
Closed, open, filtered, empty result, destination current, tile hover and focus-visible.

## Keyboard and ARIA
- Panel: APG Dialog (Modal); RAC `Modal` + `Dialog`, labelled by the title or by a localised "Navigation". Escape closes; focus returns to the opener.
- Initial focus: the search field when present, otherwise the current destination.
- Destinations: a `nav` containing a list of links (RAC `Link`, or `GridList` with link items for arrow-key movement in two dimensions). The current one has `aria-current="page"`.
- The number of matches is announced politely after filtering ("4 destinations").
- Quick actions: buttons (APG Button); the theme control is an APG Switch (RAC `Switch`) with its own label, not nested inside a button. Choosing any action closes the panel first, then runs the action.

## Responsive, touch, motion, forced colours
- Grid reflows from several columns to one under 640; the panel fills the screen under 640.
- Every tile and action at least 44 px tall.
- Opening: fade and short slide from the top in `--fk-dur-base`; no hover lift (§2.7). Reduced motion: fade only.
- Forced colours: current destination marked by a system border plus `aria-current`, not only by tint.

## Acceptance tests
- Given 8 destinations, when the person types "sou", then only destinations whose label or subtitle contains it remain and the count is announced.
- Given a query matching nothing, then the no-results line is shown.
- Given currentPath "/sources/12", then the destination with href "/sources" is marked current.
- Given a destination with `onPress`, when activated, then `onPress` runs and no navigation happens.
- Given the panel is open, when "Sign out" is activated, then the panel closes and `onSignOut` fires.
- Given the theme switch, when toggled, then `onThemeChange` receives the other theme and the panel stays open.
- Given Escape, then the panel closes and focus returns to the opener.

## Open questions
- The fork renders destinations as buttons that navigate programmatically; the spec uses real links so they can be opened in a new tab.
