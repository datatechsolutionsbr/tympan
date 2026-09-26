# ProfileAvatar

Wave 2 · data display · Status: specified

## Purpose
Shows the signed-in person as their picture or, without one, as the first letter of their name (or e-mail) on a disc, at any size the host chooses; used in the top bar, side rail and profile menus.

## Anatomy
- **Disc**: circular frame (people are always round, design direction §2.11).
- **Picture**: the profile image, cropped to fill.
- **Initial**: one uppercase letter, scaled with the disc.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| name | string \| null | none | Display name; first letter used for the initial. |
| email | string \| null | none | Fallback source for the initial. |
| pictureUrl | string \| null | none | When present, shown instead of the initial. |
| label | string | name, else email, else localised "Profile" | Accessible name. |
| size | 'sm' \| 'md' \| 'lg' \| 'fill' | 'fill' | Fixed sizes, or fill the box the host gives it. |
| decorative | boolean | false | When the name is already shown next to it, hide the avatar from assistive technology. |

## States
Picture, initial, placeholder (no name and no e-mail: a neutral person glyph), picture failed to load (falls back to initial).

## Keyboard and ARIA
- Not interactive by itself; when used as a profile button, the host wraps it in a Button and gives the button the name.
- Picture: image with alternative text `label`. Initial: an element with role image and name `label`; the letter itself is hidden.
- When `decorative` is true, it is hidden from assistive technology entirely.
- No RAC primitive needed.

## Responsive, touch, motion, forced colours
- The initial scales proportionally with the disc at any size.
- Background of the initial disc uses `--fk-accent-soft` with `--fk-ink` text (§2.11), meeting 4.5:1.
- No motion. Forced colours: the disc keeps a system-colour border so it stays visible.

## Acceptance tests
- Given a picture URL, then an image with alt equal to the name is rendered.
- Given no picture and name "maria", then the initial "M" is shown and the element is announced as "maria".
- Given only e-mail "joao@x.org", then the initial is "J".
- Given neither name nor e-mail, then a neutral glyph is shown with the localised "Profile" label.
- Given the picture fails to load, then the initial is shown instead.
- Given `decorative`, then nothing is exposed to assistive technology.

## Open questions
- The fork falls back to the letter "U" when nothing is known; the spec uses a neutral glyph instead of an arbitrary letter.
