# NotificationCenter

Wave 2 · feedback · Status: specified

## Purpose
Keeps a session history of the messages raised through the Toast service and lets people reopen it from a bell button in the top bar: review, dismiss one, or clear all.

## Anatomy
- **Bell trigger**: an icon button in the top bar, with a CountBadge when there are unseen entries.
- **History drawer**: a side Drawer (§2.5 level 4) with a header (icon, title, "clear all", close), and a list of entries.
- **Entry**: tone icon plus tone word (success, error, warning, information), title, optional message, relative time ("just now", "5 min ago"), and a dismiss button.
- **Empty view**: icon and one sentence saying there are no notifications.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| (service) history | Notice[] | [] | Newest first, capped (default 50). Each has id, tone, title, message?, createdAt. |
| (service) open() / close() | () => void | — | Show or hide the drawer. |
| (service) remove(id) | (id: string) => void | — | Removes one entry. |
| (service) clear() | () => void | — | Removes all entries. |
| (service) unseenCount | number | 0 | Entries added since the drawer was last opened. |
| historyLimit | number | 50 | Provider option. |
| labels | object | from I18nAdapter | Title, clear all, close, dismiss, empty text, relative-time phrases. |
| onOpenChange | (open: boolean) => void | none | Notified when the drawer opens or closes. |

The history is fed by the same call that shows a Toast (`success`, `error`, `warning`, `info`); the NotificationCenter never raises toasts itself.

## States
Trigger: no unseen, has unseen. Drawer: closed, open, empty, populated. Entry: rest, dismiss focus-visible, leaving.

## Keyboard and ARIA
- Trigger: APG Button (RAC `Button`) with `aria-haspopup="dialog"` and `aria-expanded`; name "Notifications" plus the unseen count.
- Drawer: APG Dialog (Modal) pattern, RAC `Modal` + `Dialog`, labelled by its title. Focus moves into the drawer on open, is trapped, Escape closes, and focus returns to the bell.
- The list is a list; each dismiss button's name includes the entry title ("Dismiss, Upload finished").
- After dismissing an entry, focus moves to the next entry's dismiss button, or to the previous one, or to the drawer title if the list became empty.
- "Clear all" asks no confirmation (history only) but announces "Notifications cleared" politely.

## Responsive, touch, motion, forced colours
- Under 640 the drawer covers the full width; above, it uses the drawer width from Drawer.
- Every button is at least 44 × 44 px.
- Drawer slides in with `--fk-dur-base`; entries fade out on removal; with reduced motion the drawer appears without sliding and entries disappear instantly.
- Forced colours: tone icons keep the tone word; entry boundaries use system borders.

## Acceptance tests
- Given three toasts were raised, when the bell is focused, then its name includes "3".
- Given the drawer is open, when Escape is pressed, then it closes and focus returns to the bell.
- Given two entries, when the first is dismissed, then focus lands on the remaining entry's dismiss button.
- Given no entries, when opened, then the empty sentence is shown and "clear all" is absent.
- Given an entry created 5 minutes ago, then its time reads with the localised "minutes ago" phrase.
- Given 60 toasts, then the history keeps only the 50 newest.

## Open questions
- The fork's drawer has no dialog role, no focus trap and no Escape handling, and its per-entry dismiss target is far below 44 px. The spec corrects all three.
- The fork hides the bell while the drawer is open; the new component keeps it and reflects `aria-expanded`.
