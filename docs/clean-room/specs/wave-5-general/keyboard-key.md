# KeyboardKey

Wave 5 · data display · Status: specified

Behaviour reference: shadcn/ui (MIT), read by the spec writer only.

## Purpose
Display a keyboard key or a key combination ("Ctrl + K", "⌘ Enter") in text, menus, tooltips, command lists and help screens. Display only; it never listens for keys.

## Anatomy
- **Key**: one key cap with a label or a symbol.
- **Combination**: several keys with a separator ("+" or nothing, per platform style).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| keys | string[] | required | Logical keys, for example ["Mod", "K"]. |
| platform | 'auto' \| 'apple' \| 'other' | 'auto' | Picks symbols: `Mod` becomes the Command symbol on Apple and "Ctrl" elsewhere; likewise Alt/Option and Shift. |
| style | 'symbols' \| 'words' | 'symbols' on Apple, 'words' elsewhere | Symbols or words for modifier keys. |
| separator | 'plus' \| 'none' | 'plus' on other platforms, 'none' on Apple | Between keys. |
| size | 'small' \| 'regular' | 'regular' | Small inside menu items and tooltips. |
| tone | 'default' \| 'on-accent' | 'default' | For use on accent or inverted surfaces (tooltips). |

Helper: `formatShortcut(keys, platform?)` returns the spoken and visual strings for use in `aria-keyshortcuts` and labels.

## States
Static only.

## Keyboard and ARIA
- Uses the native keyboard-input element for each key (RAC `Keyboard` where available).
- Symbols have spoken names: the combination is exposed as one text such as "Command K" (from i18n), with the symbol glyphs hidden from assistive tech, so "⌘" is not read as an unknown character.
- Where a shortcut belongs to a control, the control carries `aria-keyshortcuts` with the canonical form (for example "Meta+K"); the KeyboardKey is then decorative next to it.

## Responsive, touch, motion, forced colours
- Not rendered inside touch-only presentations (bottom-sheet menus) where no keyboard is present, unless the host asks.
- Key cap in `--ty-font-mono` at the meta size, fill `--ty-surface-sunken`, border `--ty-line`, radius `--ty-radius-control`; on-accent tone uses `--ty-on-accent-soft`.
- No motion.
- Forced colours: key border in `CanvasText`.

## Acceptance tests
- Given keys ["Mod", "K"] on an Apple platform, then the Command symbol and "K" are shown with no separator, and the accessible text is "Command K".
- Given the same keys on another platform, then "Ctrl + K" is shown and read.
- Given `style="words"` on Apple, then "Cmd" (from i18n) is shown instead of the symbol.
- Given `formatShortcut(["Mod","Shift","P"], "other")`, then the canonical value is "Control+Shift+P".
- Given a KeyboardKey inside a menu item with a shortcut, then the menu item has `aria-keyshortcuts` and the key cap is hidden from assistive tech.
