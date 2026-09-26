# ImagePicker

Wave 2 · form · Status: specified

## Purpose
Lets a person choose an image file (typically a profile picture or logo), validates type and size locally, shows a preview immediately, hands the file to the host's upload function, and reports success or error.

## Anatomy
- **Preview**: the current image or an Avatar fallback (initials), round for people or rounded-square for organisations and agents (§2.11).
- **Trigger**: the preview is a button; on hover or focus an overlay shows a camera/upload icon.
- **Hidden file input**: the native chooser, opened by the trigger.
- **Busy overlay**: spinner while uploading.
- **Hint** and **error message** below the preview.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| value | string \| null | none | Current image URL. |
| fallbackText | string | none | Initials shown when there is no image. |
| label | string | localised "Change picture" | Accessible name of the trigger. |
| shape | 'circle' \| 'rounded' | 'circle' | Frame shape. |
| size | 'md' \| 'lg' | 'lg' | Preview size. |
| accept | string[] | JPEG, PNG, WebP media types | Allowed media types. |
| maxBytes | number | 5 MiB | Largest accepted file. |
| upload | (file: File) => Promise<{ ok: boolean; key?: string; error?: string }> | required | Host upload function. |
| onUploaded | (key: string) => void | none | Called after a successful upload. |
| hint | string | none | Guidance under the preview. |
| messages | { wrongType: string; tooLarge: string; failed: string } | from I18nAdapter | Error wording. |
| disabled | boolean | false | Not operable. |

## States
Empty (fallback), with image, previewing new file, uploading (busy), success (brief confirmation), error (wrong type, too large, upload failed; preview reverts), disabled.

## Keyboard and ARIA
- Trigger: APG Button, RAC `FileTrigger` wrapping a `Button`. Enter or Space opens the system file chooser.
- The trigger is described by the hint and, when present, by the error (`aria-describedby`); the error is also announced politely.
- Uploading sets `aria-busy` on the trigger and disables it; completion is announced ("Picture updated").
- Choosing nothing (cancel) changes nothing and shows no error.
- Optional drop target: RAC `DropZone`, with the same validation; the button path must always exist.

## Responsive, touch, motion, forced colours
- Trigger at least 44 × 44 px (the preview is larger).
- The overlay shows on focus as well as hover; on touch it is always visible as a small corner badge.
- Success confirmation is a static check or text, not a looping ring; spinner stops under reduced motion (a static busy glyph plus text).
- Forced colours: preview frame and focus ring use system colours.

## Acceptance tests
- Given the trigger, when activated, then the native file chooser is opened.
- Given a GIF when only JPEG/PNG/WebP are allowed, then the wrong-type message appears and `upload` is not called.
- Given a 6 MiB file with a 5 MiB limit, then the too-large message appears.
- Given a valid file and an upload that resolves ok with key "k1", then `onUploaded("k1")` is called once and the preview shows the new image.
- Given an upload that resolves not ok with error text, then that text is shown and the preview reverts.
- Given an upload that throws, then the thrown message is shown.
- Given `disabled`, then the trigger is disabled and exposed as such.
- Given the same file is chosen twice in a row, then the second choice also triggers validation.
