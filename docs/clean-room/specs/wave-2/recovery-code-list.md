# RecoveryCodeList

Wave 2 · data display · Status: specified

## Purpose
Show freshly generated one-use recovery codes for second-factor sign-in, and let the person copy or download them, optionally behind a reveal step.

## Anatomy
- Code panel on a sunken surface (§2.3): numbered list of codes in monospace (§2.2 Mono).
- Hidden state: a sentence saying the codes are hidden and an optional reveal action.
- Action row (only when revealed): "Copy all" and "Download".
- Status line for copy feedback.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| codes | string[] | required | Codes in display order. |
| revealed | boolean | true | Whether codes are visible. |
| onReveal | () => void | none | When present and hidden, shows the reveal action. |
| onCopyAll | () => void | none | Called after the codes are placed on the clipboard. |
| allowDownload | boolean | true | Shows the download action. |
| fileName | string | host i18n, e.g. "recovery-codes.txt" | Name of the downloaded file. |
| strings | { hidden, reveal, copyAll, copied, download, fileTitle, generatedAt, keepSafe } | host i18n | All text, including the file header lines. |

## Behaviour
- Copy all writes every code, one per line, to the clipboard, requests a success haptic, then calls `onCopyAll`, and shows "Copied" in the status line for a short time. If the clipboard is unavailable, the status line says so and the codes stay selectable.
- Download produces a plain-text file: a title line, the generation time (ISO format), a keep-safe sentence, then the codes numbered from 1.
- Codes are selectable text so they can also be copied manually.

## States
Hidden (with or without reveal action), revealed, copy succeeded, copy failed.

## Keyboard and ARIA
- APG pattern: none; an ordered list plus buttons. Actions use RAC `Button`.
- The list is an ordered list so numbering is announced; digits are read as characters (hint via spacing, not by altering text).
- Status line is a polite live region.

## Responsive, touch, motion, forced colours
- Two columns of codes above 640, one below. Buttons at least 44 × 44.
- No motion.
- Reduced transparency: panel opaque.
- Forced colours: panel border visible; code text in CanvasText.

## Acceptance tests
- Given three codes and revealed, Then an ordered list shows them numbered 1 to 3.
- Given "Copy all" is activated, Then the clipboard receives the codes joined by newlines and onCopyAll is called.
- Given "Download" is activated, Then a text file is produced whose body lists the codes numbered from 1 after the header lines.
- Given allowDownload false, Then no download action exists.
- Given revealed false and no onReveal, Then no codes, no actions and no reveal button are shown.
- Given revealed false and onReveal, When the reveal action is activated, Then onReveal is called.
