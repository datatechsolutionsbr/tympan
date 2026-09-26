# SettingsDialog and PreferenceGroup

Wave 2 · overlay · Status: specified

## Purpose
A ready-made SectionedModal for account and workspace settings, assembled from configuration: profile (picture, fields, password change), workspace fields, and preferences (switches, radio groups, choice-card groups, language); plus custom sections rendered by the host. PreferenceGroup is the titled block used inside it.

## Anatomy
- **SectionedModal** in the sectioned layout, with identity block and optional sign-out button in the navigation footer.
- **Profile section**: ImagePicker or "change picture" button, a list of fields, and a password-change subform (current, new, confirm, submit).
- **Workspace section**: a list of fields; read-only fields may offer a copy button (CopyIdentifier behaviour).
- **Preferences section**: PreferenceGroups holding labelled Switches, radio groups, ChoiceCard groups and a LocalePicker.
- **Placeholder**: text shown when a section has no configuration.
- **Access denied view**: icon, title, description, shown when the requested section is not available to this person.
- **PreferenceGroup**: optional title with icon, then its children.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| open / onClose | boolean / () => void | required | As SectionedModal. |
| title / subtitle | string | required / none | Header. |
| sections | { id; label; icon?; group? }[] | required | Navigation. |
| initialSection | string | first | Section shown on open. |
| identity | ReactNode \| person summary | none | Top of navigation. |
| profile | { title; pictureUrl?; fallbackText; onChangePicture?; fields: SettingField[]; password?: { labels; onSubmit(current, next, confirm) } } | none | Profile section configuration. |
| workspace | { title; fields: SettingField[] } | none | Workspace section. |
| preferences | { title; description?; switches?; radioGroups?; choiceGroups?; locale? } | none | Preferences section. |
| SettingField | { key; label; description?; value; onChange?; kind: 'text' \| 'email' \| 'password' \| 'url' \| 'multiline'; readOnly?; copyable?; placeholder? } | — | One field. |
| renderSection | (id: string) => ReactNode \| undefined | none | Host content for sections not covered above. |
| placeholderText | string | from I18nAdapter | Text for unconfigured sections. |
| accessDenied | { title; description; icon? } | none | Shown when `initialSection` is not in `sections`. |
| signOut | { label; icon?; onPress } | none | Navigation footer action. |

## States
As SectionedModal, plus: field edited, copy done ("Copied" announced), password submitting / mismatch error, access denied, placeholder.

## Keyboard and ARIA
- Container behaviour and navigation: see SectionedModal (APG Dialog; RAC `Modal`, `Dialog`).
- Fields: Field + TextField/TextArea (RAC `TextField`); labels above, descriptions linked.
- Switches: APG Switch, RAC `Switch`; radio groups: APG Radio Group, RAC `RadioGroup` with a visible legend; choice-card groups: RAC `RadioGroup` of ChoiceCards.
- Password subform is a real form: Enter in the last field submits; mismatch between new and confirm is reported on the confirm field before `onSubmit` is called.
- Copy buttons are named "Copy {field label}" and announce success politely.

## Responsive, touch, motion, forced colours
- Inherits SectionedModal rules. Radio and choice groups reflow from up to 4 columns down to 1 under 640.
- All controls at least 44 px tall on touch.

## Acceptance tests
- Given the sections "Profile" and "Preferences", then navigation lists both and "Profile" content is shown first.
- Given a copyable read-only field "Workspace id", when its copy button is pressed, then the value is written to the clipboard and "Copied" is announced.
- Given a text field, when the person types, then `onChange` receives each new value.
- Given password inputs "a", "b1", "b2", when submitted, then an error is shown on the confirm field and `onSubmit` is not called.
- Given matching inputs, when submitted, then `onSubmit(current, next, confirm)` is called once.
- Given a section id with no configuration and no `renderSection` result, then the placeholder text is shown.
- Given `initialSection` not in `sections` and `accessDenied`, then the access-denied view is shown.
- Given `signOut`, when pressed, then its handler fires.

## Open questions
- The fork passes the password values to the host without checking the confirmation; the spec adds the local mismatch check.

## Renamed in implementation (2026-09-26)
The library is new and has no consumers, so the configuration was redesigned
around typed items (behaviour and acceptance tests unchanged):

| Spec name | Implementation |
|---|---|
| `sections` | `outline` (`SettingsOutlineEntry[]`) |
| `initialSection` | `startAt` |
| `identity` | `whoCard` |
| `profile`, `workspace`, `preferences` | `content: Record<pageId, SettingsPage>`; a page is `{ heading; lead?; items: SettingsItem[] }` and works for any page id |
| `SettingField` (`kind` text/email/password/url/multiline) | `EntryItem` (`type: 'entry'`, `format` plain/mail/secret/link/paragraph; `caption`, `help`, `text`, `onText`, `locked`, `copy`, `example`) |
| `switches` | `ToggleItem` (`type: 'toggle'`, `on`, `onFlip`) |
| `radioGroups`, `choiceGroups` | `PickItem` (`type: 'pick'`, `look: 'list' \| 'cards'`, `chosen`, `answers`, `onPick`) |
| `locale` | `LanguageItem` (`type: 'language'`) |
| picture / `onChangePicture` / `fallbackText` | `PortraitItem` (`type: 'portrait'`, `src`, `initials`, `onReplace`) |
| `password.onSubmit(current, next, confirm)` | `PassphraseItem` (`type: 'passphrase'`, `onSave(old, fresh, again)`, `captions`) |
| `renderSection`, `placeholderText` | `renderPage`, `emptyText` |
| `accessDenied { title; description; icon }` | `locked { heading; reason; glyph }` |
| `signOut` | `exit` |
