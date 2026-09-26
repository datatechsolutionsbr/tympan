# ConfirmService

Wave 2 · overlay · Status: specified

## Purpose
An app-wide, promise-based replacement for the browser's confirm prompt: any component asks a yes/no question and awaits the answer, while a single provider renders the dialog.

## Anatomy
- **Provider**: mounted once near the root (inside AppFrame).
- **Hook**: returns an async `confirm(options)` function.
- **Dialog**: a CompactConfirm (default) or a ModalDialog in alert form when a longer message is given.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| confirm(options) | (options: ConfirmOptions) => Promise<boolean> | — | Opens the dialog; resolves true on confirm, false on cancel, Escape or dismissal. |
| ConfirmOptions.title | string | required | The question. |
| ConfirmOptions.message | string | none | One or two sentences of consequence ("This removes 12 records"). |
| ConfirmOptions.confirmLabel | string | localised "Confirm" | Verb for the confirming button. |
| ConfirmOptions.cancelLabel | string | localised "Cancel" | Cancel button text. |
| ConfirmOptions.tone | 'neutral' \| 'danger' | 'neutral' | Danger uses the danger button treatment (§2.10) and a warning icon. |
| ConfirmOptions.icon | ReactNode | tone default | Icon override. |
| Provider.presentation | 'compact' \| 'dialog' | 'compact' | Which dialog renders the question. |

## States
Idle; pending (dialog open, promise unresolved); resolved. Requests are queued: a second call made while one is pending waits and opens after the first resolves.

## Keyboard and ARIA
- APG Alert Dialog pattern. RAC `Modal` + `Dialog` with `role="alertdialog"`, labelled by the title and described by the message.
- Initial focus: Cancel when tone is danger, Confirm otherwise. Escape resolves false. Focus returns to the element focused before the call.
- The confirming button text is a verb (never "OK" alone).

## Responsive, touch, motion, forced colours
- Buttons at least 44 px tall; side by side above 640, stacked full width below, with Cancel second in reading order only when the platform convention requires (keep order consistent across the product: Cancel then Confirm).
- Motion and forced-colour rules from CompactConfirm or ModalDialog.

## Composition notes
- Without a provider the hook falls back to the browser's native confirm with the title as text, and resolves false where no window exists (server rendering). This fallback is only for tests and isolated previews.

## Acceptance tests
- Given the provider, when `confirm({ title: "Delete source?" })` is called, then an alert dialog named "Delete source?" opens.
- Given it is open, when Confirm is pressed, then the promise resolves true and the dialog closes.
- Given it is open, when Escape is pressed, then the promise resolves false.
- Given two sequential calls, then each resolves independently with its own answer.
- Given tone 'danger', then initial focus is on Cancel.
- Given no provider, when `confirm` is called in a browser, then the native prompt is used with the title.
- Given the dialog closes, then focus returns to the triggering control.

## Open questions
- The fork has a `destructive` flag that changes nothing and always shows a trash icon; the spec makes `tone` meaningful.
- The fork replaces a pending request when a second one arrives (the first promise may never resolve); the spec queues.
