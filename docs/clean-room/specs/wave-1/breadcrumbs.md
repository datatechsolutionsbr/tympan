# Breadcrumbs

Wave 1 · navigation · Status: specified

## Purpose
Show where the current page sits in the hierarchy (organisation, research project, module, record) and let the person go up one or more levels.

## Anatomy
- **Trail**: ordered list of ancestor links.
- **Separator**: decorative mark between items.
- **Current item**: the current page name, not a link.
- **Back link** (compact mode): only the parent, with a leading "back" icon.
- **Title slot and actions slot** (compact bar mode, optional): the current title in the centre and trailing actions, used on narrow screens as a top bar.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| items | Array<{ label: string; href: string }> | required | ancestors then the current page (last item is current) |
| label | string | from I18nAdapter ("Breadcrumb") | accessible name of the navigation landmark |
| mode | 'trail' \| 'compact' \| 'auto' | 'auto' | auto shows trail at 640 px and above, compact below |
| rootHref / rootLabel | string / string | none | used as the parent in compact mode when there is only one item |
| maxVisible | number | none | collapses middle items into an overflow menu when exceeded |
| actions | node | none | trailing slot (compact bar) |
| centerContent | node | current label | replaces the centred title (compact bar) |

## States
- link idle, hover, focus-visible; current item static; overflow menu closed or open.

## Keyboard and ARIA
- APG pattern: **Breadcrumb**. RAC primitive: `Breadcrumbs` + `Breadcrumb` (with `Link`); overflow uses ActionMenu.
- `navigation` landmark labelled by `label`; an ordered list; the current item has `aria-current="page"`.
- Separators hidden from assistive tech.
- Links use the RouterAdapter so navigation is client-side.
- Compact back link's accessible name includes the parent name (for example "Back to Sources").

## Responsive, touch, motion, forced colours
- Each link has a 44 px minimum hit height on touch.
- Long labels truncate with an ellipsis; the full label remains the accessible name and appears on hover.
- Text in `meta`/`label` style (§2.2), links in `--fk-accent` (§2.3). No motion.
- Forced colours: links use `LinkText`; the current item uses `CanvasText`.

## Acceptance tests
- Given items Organisation, Project, Sources, Then a navigation named "Breadcrumb" contains two links and "Sources" marked `aria-current="page"` and not a link.
- Given a width below 640 px and mode auto, Then only a back link to Project is shown, named "Back to Project".
- Given one item and a `rootHref`, When in compact mode, Then the back link points to `rootHref`.
- Given `maxVisible` 3 and five items, Then the first and last two show and the middle ones are in an overflow menu.
- Given a link is activated, Then navigation goes through the RouterAdapter.
