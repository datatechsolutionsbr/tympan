# Popover

Wave 1 · overlay · Status: specified

## Purpose
A non-modal floating panel anchored to a trigger, for short explanations or arbitrary small content (help text, a mini form, a brand menu).

## Anatomy
- **Trigger**: any single focusable element supplied by the host, or the built-in info trigger (an icon-only button).
- **Panel**: floating surface positioned next to the trigger.
- **Arrow**: small pointer toward the trigger (optional).
- **Title** (info mode): short heading inside the panel.
- **Content**: body.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| trigger | node | built-in info button | element that toggles the panel |
| triggerLabel | string | required when using the info button | accessible name of the icon-only trigger |
| title | string | none | heading rendered at the top; labels the panel |
| children | node | required | panel content |
| placement | 'top' \| 'end' \| 'bottom' \| 'start' | 'bottom' | preferred side; flips when there is no room |
| align | 'start' \| 'center' \| 'end' | 'center' | alignment along the chosen side |
| offset | number (design space step) | space-2 | gap between trigger and panel |
| showArrow | boolean | true | renders the arrow |
| open / defaultOpen | boolean | uncontrolled | controlled or initial open state |
| onOpenChange | (open: boolean) => void | none | called on every open/close |

## States
- closed, open; trigger reflects expanded state.
- Positioned to stay inside the viewport (flip and shift).

## Keyboard and ARIA
- APG pattern: **Disclosure** for the trigger relationship; the panel behaves as a non-modal dialog. RAC primitive: `DialogTrigger` + `Popover` + `Dialog` (non-modal usage), `OverlayArrow` for the arrow.
- Trigger has `aria-expanded` and controls the panel.
- Enter/Space on the trigger opens; focus moves into the panel only if it contains focusable content, otherwise the panel is announced via its label.
- Escape closes and returns focus to the trigger. Pressing outside closes. Tab out of the panel closes it.
- For info mode the panel is labelled by `title`.
- Must not be used for content that needs a focus trap; use ModalDialog.

## Responsive, touch, motion, forced colours
- Trigger hit area at least 44 × 44 px even when the icon is smaller.
- Surface uses elevation level 3 and `--fk-radius-card` (design direction §2.4, §2.5). Maximum width keeps prose within 60ch (§2.2).
- Opening uses `--fk-dur-quick` fade/scale; reduced motion: opacity only or instant.
- Reduced transparency: opaque surface.
- Forced colours: panel border in a system colour; arrow may be hidden.
- On small screens the panel must fit the viewport width minus the 16 px gutter.

## Acceptance tests
- Given the info trigger with `triggerLabel` "About this score", Then a button with that name and `aria-expanded=false` exists.
- Given a closed popover, When the trigger is activated, Then the panel is visible, labelled by `title`, and the trigger has `aria-expanded=true`.
- Given an open popover, When Escape is pressed, Then it closes and focus is on the trigger.
- Given an open popover, When the user clicks outside, Then `onOpenChange(false)` is called.
- Given `placement` top and no room above, When opened, Then the panel renders below the trigger.
- Given controlled `open` true, Then the panel shows without user interaction.
