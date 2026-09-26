# SectionedModal

Wave 2 · overlay · Status: specified

## Purpose
The large modal used across the product for editing and inspecting an item, in three layouts: bare (content only), structured (header, body, footer, optional form), and with a side navigation of sections (settings-like).

## Anatomy
- **Backdrop**: dims the page (§2.5 level 4).
- **Panel**: raised surface; width from a size scale.
- **Header** (structured and sectioned): eyebrow, icon, title, subtitle, header actions, close button; optional decorative accent stripe.
- **Error slot**: an InlineNotice (tone error) at the top of the body for save or validation failures.
- **Body**: scrollable content.
- **Footer**: custom content, or the built-in Cancel and Save pair when used as a form.
- **Section navigation** (sectioned layout): optional identity block (ProfileSummary or custom), optional header extras, grouped list of sections each with icon, label and optional count, and a navigation footer (for example sign out).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| open | boolean | required | Visibility. |
| onClose | () => void | required | Requested close (close button, Escape, backdrop, Cancel). |
| title / subtitle / eyebrow / icon | string / string / string / ReactNode | none | Header content; without a title the layout is bare and an `aria-label` is required. |
| ariaLabel | string | none | Name for the bare layout. |
| headerActions | ReactNode | none | Extra header buttons. |
| size | 'sm' \| 'md' \| 'lg' \| 'xl' \| 'full' | 'lg' | Panel width step. |
| dismissible | boolean | true | When false, Escape and backdrop do nothing; only close button or Cancel close it. |
| error | ReactNode | none | Error content shown at the top of the body. |
| footer | ReactNode | none | Custom footer. |
| onSubmit | (event: SubmitEvent) => void | none | Wraps body and footer in a form. |
| formFooter | { cancelLabel?: string; submitLabel?: string; pending?: boolean; submitDisabled?: boolean } | none | Built-in Cancel/Save footer. |
| sections | { id: string; label: string; icon?: ReactNode; group?: string; count?: number; content?: ReactNode }[] | none | Enables the sectioned layout. |
| activeSection / defaultSection / onSectionChange | string / string / (id: string) => void | first section | Controlled or uncontrolled active section. |
| identity | ReactNode | none | Block at the top of the navigation. |
| navigationFooter | ReactNode | none | Block at the bottom of the navigation. |
| closeLabel | string | from I18nAdapter | Close button name. |

## States
Closed, opening, open, submitting (Save shows spinner, Cancel and Save disabled), error shown, active section, closing.

## Keyboard and ARIA
- APG Dialog (Modal). RAC `ModalOverlay` + `Modal` + `Dialog`. Labelled by the title (unique id per instance), described by the subtitle.
- Focus goes to the first focusable field (or the dialog heading when none), is trapped, and returns to the opener on close. Escape closes when dismissible.
- Form: Cmd+Enter or Ctrl+Enter submits from any field; plain Enter in a text area never submits.
- Section navigation: a `nav` labelled by the title containing a list of buttons with `aria-current="page"` on the active one (APG Disclosure navigation style, not tabs, because each section is a large independent view). After switching, focus stays on the navigation item; the content heading is announced via the section region's label.
- The error slot uses `role=alert` when it appears after a submit attempt.

## Responsive, touch, motion, forced colours
- Under 1024 the sectioned layout stacks: navigation becomes a horizontally scrollable row or a NativeSelect above the content; under 640 the panel is full screen with the footer pinned to the bottom above the safe area.
- Close button and navigation items at least 44 × 44 px.
- Enter and exit: opacity and a small offset over `--fk-dur-base`; reduced motion: opacity only.
- Reduced transparency: panel opaque; backdrop solid dim. Forced colours: panel border and active section indicated by a system border, not only background.
- No decorative glow blobs behind the navigation (design direction §2.5: two blur levels maximum).

## Acceptance tests
- Given a structured modal with title "Edit source", then a dialog named "Edit source" is exposed and focus is inside it.
- Given `dismissible` false, when Escape is pressed, then `onClose` is not called; when the close button is pressed, it is.
- Given a form footer, when Ctrl+Enter is pressed in a text field, then `onSubmit` fires; when Enter alone is pressed in a text area, it does not.
- Given `pending`, then Save shows busy and is disabled.
- Given `error`, then an alert with that text is in the body.
- Given three sections, when the second navigation item is activated, then its content shows and it has `aria-current`.
- Given `defaultSection` "b", then section "b" is shown first.
- Given a width of 375, then the panel fills the screen and the footer stays visible.
