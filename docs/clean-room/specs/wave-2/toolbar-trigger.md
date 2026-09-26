# ToolbarTrigger

Wave 2 · navigation · Status: specified

## Purpose
The compact button used in the top bar and rails to open a menu, drawer or flyout: an icon, optionally followed by a very short caption (for example a locale code).

## Anatomy
- **Icon**: decorative glyph.
- **Caption** (optional): two or three characters or a short word.
- **Expanded indicator**: implied by the opened surface; no extra glyph required.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| icon | ReactNode | required | Glyph. |
| label | string | required | Accessible name; must contain the caption text when a caption is shown. |
| caption | string | none | Visible short text next to the icon. |
| onPress | () => void | none | Activation. |
| controls | 'menu' \| 'dialog' \| 'none' | 'none' | Sets `aria-haspopup`. |
| expanded | boolean | none | Reflects whether the controlled surface is open. |
| pressed | boolean | none | For toggles (for example "focus mode"). |
| disabled | boolean | false | Not operable. |

## States
Rest, hover (neutral background tint; the accent-soft fill of §2.3 is reserved for the active item), pressed, focus-visible, expanded, toggled on, disabled.

## Keyboard and ARIA
- APG Button (or Menu Button when `controls` is 'menu'). RAC `Button`, used as the trigger of `MenuTrigger` or `DialogTrigger`.
- Enter and Space activate; with a menu, Down Arrow also opens and focuses the first item.
- Accessible name follows WCAG 2.5.3: when the caption "PT" is visible the name is for example "Language, PT".
- Icon-only triggers show a tooltip with the label on hover and focus (RAC `TooltipTrigger`).

## Responsive, touch, motion, forced colours
- Visible height matches the control height of §2.10; the touch target is at least 44 × 44 px.
- Hover and press transitions `--fk-dur-instant`; none with reduced motion.
- Forced colours: focus ring and the pressed/expanded state indicated with system colours (for example a border), not only background.

## Acceptance tests
- Given an icon-only trigger labelled "Notifications", then a button named "Notifications" is exposed and a tooltip shows on focus.
- Given caption "EN" and label "Language", then the accessible name contains "EN".
- Given `controls` 'menu' and `expanded` true, then `aria-haspopup="menu"` and `aria-expanded="true"` are exposed.
- Given a touch device, then the hit area is at least 44 × 44 px.

## Open questions
- The fork's label replaces the visible caption in the accessible name (label-in-name failure); corrected above.
