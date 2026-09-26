# OneTimeCodeField

Wave 2 · form · Status: specified

## Purpose
Enter a short verification code (sign-in, second factor, e-mail confirmation) one character per box, with paste and autofill support.

## Anatomy
- Group of equal boxes, one per character.
- Error text below the group.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| length | number | 6 | Number of characters. |
| value | string | required | Current code (controlled). |
| onChange | (value: string) => void | required | Called on every edit. |
| onComplete | (code: string) => void | none | Called when all boxes are filled (by typing or paste). |
| characters | "digits" or "alphanumeric" | "digits" | Accepted characters and mobile keyboard type. |
| label | string | host i18n "Verification code" | Group name. |
| boxLabel | (position: number, total: number) => string | host i18n "Character {n} of {total}" | Name of each box. |
| errorText | string | none | Error message; group becomes invalid. |
| disabled | boolean | false | Disables all boxes. |
| autoFocus | boolean | false | Focus the first box on mount. |

## Behaviour
- Typing an accepted character fills the box and moves focus to the next one; unaccepted characters are ignored.
- Backspace clears the current box; in an empty box it clears the previous one and moves there.
- ArrowLeft/ArrowRight move between boxes, stopping at the ends. Focusing a box selects its content.
- Pasting anywhere fills from the start: characters are filtered by `characters`, truncated to `length`, focus moves to the next empty box (or the last), and `onComplete` fires if the code is complete. A paste with no usable characters changes nothing.
- The first box accepts OS one-time-code autofill.
- Light haptic on each entry; success haptic on completion (see Haptics).

## States
Empty, partially filled, complete, focus-visible on a box, invalid (every box marked plus error text), disabled.

## Keyboard and ARIA
- APG pattern: none dedicated; a labelled group of text inputs. No RAC primitive; custom, built from RAC `Input` elements inside a `Group`.
- The group has role group, the name from `label`, and is described by the error text, which is also announced assertively when it appears.
- Each box is named by `boxLabel`.

## Responsive, touch, motion, forced colours
- Each box at least 44 × 44; boxes shrink proportionally only above that floor and the group may wrap on very narrow screens.
- No motion beyond focus ring.
- Forced colours: box borders and the invalid state (thicker border plus the error text) stay visible.

## Acceptance tests
- Given length 6, When rendered, Then a named group with six named boxes exists.
- Given digits mode, When "a" is typed, Then onChange is not called.
- Given alphanumeric mode, When "a" is typed, Then onChange receives "a".
- Given five digits entered, When the sixth is typed, Then onComplete receives the full code.
- Given focus in an empty third box, When Backspace is pressed, Then the second box is cleared and focused.
- Given "12-34 56" is pasted in digits mode, Then value becomes "123456" and onComplete fires.
- Given a paste of "12", Then focus moves to the third box and onComplete does not fire.
- Given errorText, Then the group is described by it; without it, the group has no description.
