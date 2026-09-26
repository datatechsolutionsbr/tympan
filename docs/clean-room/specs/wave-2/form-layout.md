# FormLayout

Wave 2 · layout · Status: specified

## Purpose
Structural pieces that arrange fields consistently: the form container, a responsive field grid, an inline row, a titled section, and a framed form with header and footer.

## Anatomy
- **FormContainer**: the form element with vertical rhythm between fields (20 px on wide, 16 px on narrow, §2.1).
- **FieldGrid**: two columns on wide screens, one below 640 px; a field may span both columns.
- **InlineRow**: fields and a button on one line (search plus button, filter bar); wraps on narrow screens.
- **FormSection**: optional title (`h3`, §2.2) and description, then its fields; sections separated by dividers.
- **FramedForm**: a sheet with header (icon, title, subtitle), body (sections) and footer (FormActions).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| FormContainer: onSubmit | `(event) => void` | undefined | Native submission; default browser submission is prevented when a handler is given. |
| FieldGrid: columns | `1 \| 2` | 2 | Maximum columns on wide screens. |
| Field span (child) | `'full' \| 'half'` | `'half'` | Column span inside FieldGrid. |
| FormSection: title, description | node | undefined | Section heading texts. |
| FormSection: headingLevel | 2 to 6 | 3 | Heading level. |
| FramedForm: title, subtitle, icon | string, string, node | undefined | Header; header hidden when no title. |
| FramedForm: onSubmit | `(event) => void` | required | Called on submit, default prevented. |
| FramedForm: submitLabel, cancelLabel, onCancel | string, string, function | cancel optional | Footer; cancel shown only when both label and handler exist. |
| FramedForm: busy, submitDisabled | boolean | false | Disable submit; busy shows Spinner in it. |
| FramedForm: showHeader, showFooter | boolean | true | Toggle regions. |
| FramedForm: footerExtra | node | undefined | Extra footer content. |

## States
- FramedForm: idle, busy (submit disabled, `aria-busy` on the form), submit disabled.

## Keyboard and ARIA
- FormContainer and FramedForm render a real `form` (RAC `Form`) so Enter submits and validation errors are reported per field.
- FormSection renders a `group` labelled by its title (or `fieldset`/`legend` when the section is a set of related choices).
- FramedForm's form is labelled by its title.
- No APG pattern beyond native form semantics.

## Responsive, touch, motion, forced colours
- Label above field always (§2.10); never side-by-side labels on narrow screens.
- No animations. Forced colours: section dividers visible.

## Acceptance tests
- Given FramedForm with title, when rendered, then a form named by the title exists with header, body and footer.
- Given only `cancelLabel` without `onCancel`, when rendered, then no cancel button exists.
- Given FramedForm, when Enter is pressed in a text field, then `onSubmit` fires once and the page does not reload.
- Given `busy`, when rendered, then submit is disabled and the form has `aria-busy`.
- Given FieldGrid at 375 px, when rendered, then fields are in one column; at 1280 px, in two.
- Given FormSection with title, when rendered, then a heading at the requested level labels the group.
