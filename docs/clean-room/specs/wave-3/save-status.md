# SaveStatus

Wave 3 · feedback · Status: specified

## Purpose
A tiny indicator that tells the person whether the editor is saving or has just saved, readable by assistive technology.

## Anatomy
- Glyph (decorative) and a text label. The label may be visually hidden only when the glyph sits next to other text that makes the meaning clear; by default the label is visible (design direction §2.11 rule: never colour or glyph alone).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| status | 'idle' or 'saving' or 'saved' or 'error' | required | Current autosave state. |
| labels | { saving: string; saved: string; error?: string } | required | Localised words; the component has no built-in copy. |
| showLabel | boolean | true | Show the word visibly. |

## States
- idle: renders nothing, but the live region stays mounted so the next change is announced.
- saving: neutral tone with a progress glyph.
- saved: success tone with a check glyph.
- error (new, not in the fork): error tone with the error word.

## Keyboard and ARIA
- Not focusable. The wrapper is a status region (`role="status"`, polite).
- Glyphs are hidden from assistive technology.
- No RAC primitive; custom.

## Responsive, touch, motion, forced colours
- Fits in the editor top bar; never wraps.
- No animation beyond an opacity change; none under reduced motion.
- Forced colours: text in CanvasText; glyph remains visible.

## Acceptance tests
- Given status saving, when rendered, then the text "saving" (from labels) is present in a status region.
- Given status changes from saving to saved, when the change happens, then a screen reader receives the saved label once.
- Given status idle, when rendered, then no visible content appears.
- Given status error, when rendered, then the error word and error tone are shown.
