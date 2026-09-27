# Attachment

Wave 5 · conversation · Status: specified

Behaviour reference: shadcn/ui (MIT), read by the spec writer only.

## Purpose
Show one file or image attached to a composer, a message or an upload list: its preview or type icon, name, metadata, upload lifecycle, and actions (remove, retry, download). The whole card may open the file while its actions stay independently operable.

## Anatomy
- **Card**: horizontal (media beside text) or vertical (media above text).
- **Media**: a file-type icon, or an image thumbnail cropped to a square.
- **Title**: the file name, truncated in the middle so the extension stays visible.
- **Description**: type and size, progress ("45%"), or the failure reason.
- **Actions**: compact icon buttons at the end (remove, retry, download, more).
- **Open trigger** (optional): an invisible layer covering the card that opens a preview or link; it sits beneath the actions.
- **AttachmentGroup**: a horizontal row of cards that scrolls with snapping and an edge fade.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| name | string | required | File name. |
| kind | 'image' \| 'document' \| 'spreadsheet' \| 'audio' \| 'video' \| 'archive' \| 'code' \| 'other' | derived from the name | Picks the icon. |
| previewSrc | string | none | Thumbnail for images. |
| sizeBytes | number | none | Formatted by the host formatters. |
| state | 'idle' \| 'uploading' \| 'processing' \| 'failed' \| 'done' | 'done' | Lifecycle. Idle: chosen but not sent yet. |
| progress | number 0–1 | none | Uploading progress. |
| errorText | string | none | Failure reason (required when `state="failed"`). |
| orientation | 'horizontal' \| 'vertical' | 'horizontal' | Layout. |
| size | 'compact' \| 'small' \| 'regular' | 'regular' | Size step. |
| onOpen / href | handler / string | none | Enables the open trigger. |
| openLabel | string | from i18n ("Open {name}") | Name of the open trigger. |
| onRemove / onRetry / onDownload | handlers | none | Standard actions; each shows its button. |
| actions | { id; label; icon; onPress }[] | none | Extra actions. |

AttachmentGroup: `label` (name of the row), children Attachments.

## States
Idle (dashed frame), uploading (progress in the description and a subtle shimmer on the title), processing (shimmer, no percentage), failed (danger frame tint, reason text, retry), done; open trigger hover, pressed, focus-visible.

## Keyboard and ARIA
- The card is a group named by the file name; state is part of its description ("Uploading, 45%", "Failed: file too large").
- Open trigger: a RAC `Button` or `Link` named `openLabel`; actions are RAC `Button`s named with the file ("Remove report.pdf"). Trigger and actions are separate tab stops; actions come after the trigger.
- Uploading progress is exposed as a progress bar with value text; completion and failure are announced once, politely and assertively respectively.
- AttachmentGroup: a list named by `label`; when its cards have no interactive parts, the row itself is focusable and scrollable with arrow keys.
- Removing an attachment moves focus to the next attachment, or the previous one, or the composer input when none remain.

## Responsive, touch, motion, forced colours
- Action and trigger hit areas at least `--ty-control-target`; on touch, actions are always visible.
- Group scrolls horizontally with native momentum and snapping; the edge fade shows only on edges with hidden cards.
- Frame `--ty-line` (dashed when idle), fill `--ty-surface-raised`, radius `--ty-radius-card`; failed tint `--ty-danger-soft`, reason text `--ty-danger`, plus an icon; media fill `--ty-surface-sunken`.
- Title shimmer uses the skeleton shimmer and stops under reduced motion (the progress text remains).
- Forced colours: frame in `CanvasText`, failed state keeps its icon and text; the fade is removed.

## Acceptance tests
- Given `name="quarterly-report-final.pdf"` in a narrow card, then the visible title keeps ".pdf" at the end.
- Given `state="uploading"` and `progress` 0.45, then a progress bar reads 45% and the description shows it.
- Given `state="failed"` without `errorText`, then a development warning is raised.
- Given `onOpen` and `onRemove`, when Tab moves through the card, then focus visits the open trigger, then the remove button.
- Given the remove button pressed on the second of three cards, then focus moves to the new second card.
- Given the last card removed, then focus moves to the composer input supplied by the host.
- Given the card completes uploading, then "Uploaded report.pdf" is announced once.
- Given a group of presentational cards overflowing, then the row is focusable and Arrow Right scrolls it.
- Given reduced motion, then no shimmer runs.
