# LocalePicker

Wave 2 · form · Status: specified

## Purpose
Let the person choose the interface language from a trigger that opens a list of supported locales, each shown in its own language.

## Anatomy
- Trigger: language glyph plus the current locale's short code or flag (flag decorative).
- Chooser surface: a side drawer (list layout) or a centred dialog (grid layout) with a title.
- One option per locale: decorative flag, native name, short code, selected check.
- Footer line naming the current language and its code.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| locales | { code: string; nativeName: string; shortCode?: string; flag?: string }[] | required | Supported locales. |
| value | string | required | Current locale code. |
| onChange | (code: string) => void | required | Called when a different locale is chosen. The host applies it (cookie, reload of messages); the component does not. |
| presentation | "drawer" or "dialog" | "drawer" | Surface used for the list. |
| open, onOpenChange | boolean, (open) => void | uncontrolled | Optional control when the host opens it from its own menu item. |
| title | string | host i18n "Language" | Surface title and trigger name. |
| showTrigger | boolean | true | Hide when the host opens the chooser from elsewhere. |

## Behaviour
- Choosing a locale reports it and closes the surface; focus returns to the trigger (or to the host element that opened it).
- The current locale is marked with a check and "selected" state.
- Each option's text carries a `lang` attribute with its own code so screen readers pronounce it correctly.

## States
Trigger rest, hover, focus-visible, expanded. Option rest, hover, focus-visible, selected.

## Keyboard and ARIA
- Surface: APG Dialog (Modal). Backed by RAC `DialogTrigger` + `Modal` (dialog) or the Drawer spec.
- List: APG Listbox (single select). Backed by RAC `ListBox`; arrows move, Enter selects, typing jumps by name.
- Trigger is a button named with `title` plus the current language, and has `aria-haspopup="dialog"`.

## Responsive, touch, motion, forced colours
- Options at least 44 tall; dialog grid uses two columns below 640 and more above.
- Drawer entrance per §2.7 (`--fk-dur-base`), no slide with reduced motion.
- Reduced transparency: opaque surface.
- Forced colours: selected option uses system highlight and the check glyph.

## Acceptance tests
- Given locales pt-BR and en with value pt-BR, When opened, Then two options exist and "Português" is selected.
- Given "English" is chosen, Then onChange receives "en" and the surface closes with focus on the trigger.
- Given an option, When inspected, Then its text has lang set to its code.
- Given showTrigger false and open true, When rendered, Then the list is shown without a trigger.
- Given Escape while open, Then the surface closes and onChange is not called.
