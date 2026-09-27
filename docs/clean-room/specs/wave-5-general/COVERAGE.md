# Wave 5 (general): coverage of the shadcn/ui component set

Date: 2026-09-26. Behaviour reference: shadcn/ui (MIT), read by the spec
writer only. Implementers build from the specs in this folder and from
existing Tympan specs; they do not open the reference source.

This table lists every component of the reference set (all three primitive
bases, plus the chat and AI components) and names the Tympan equivalent.
"Covered" means the Tympan component already offers the behaviour. "Partial"
means an equivalent exists but lacks behaviour listed in the gaps column; the
fix is in `gap-patches.md` or in a new spec named in the last column.
"Missing" means there is no public Tympan equivalent; the new spec is named
in the last column.

Counts: **26 covered**, **21 partial**, **18 missing** (65 reference
components). Page-level blocks (sign-in pages, dashboard shells, sidebar
layouts) are compositions, not components, and are out of scope.

| Reference component | Tympan equivalent | Status | Gaps in the equivalent | Spec |
|---|---|---|---|---|
| Accordion | GroupedDisclosureList, SectionPanel (collapsible) | Missing | Both are domain-shaped (grouped items, titled panel). No generic group of headed disclosures with single or multiple expansion. | `accordion.md` |
| Alert | InlineNotice | Covered | None of note (tone, title, icon, actions, dismiss already present). | — |
| Alert Dialog | CompactConfirm, ConfirmService, ModalDialog with alert role | Covered | None. | — |
| Aspect Ratio | none | Missing | No frame that keeps a fixed width-to-height ratio for media. | `aspect-frame.md` |
| Attachment | ImagePicker (different job) | Missing | No file or image chip with upload lifecycle, actions and a whole-card trigger. | `attachment.md` |
| Avatar | Avatar | Partial | No stacked group with an overflow count; no presence or status badge on the frame. | `avatar-group.md`, gap-patches § Avatar |
| Badge | Tag, StatusPill, CountBadge | Covered | None (tone, link, count, removal already present). | — |
| Breadcrumb | Breadcrumbs | Covered | None (collapsed middle already reachable through a menu). | — |
| Bubble | none (bubbles exist only inside the assistant surface of the flow package) | Missing | No generic bubble with variants, alignment, grouping and reactions. | `chat-bubble.md` |
| Button | Button | Covered | Minor: no link-looking variant (Link covers it). | gap-patches § Button |
| Button Group | none | Missing | No group that joins adjacent buttons, inputs and text into one control row. | `button-group.md` |
| Calendar | calendar inside the DateField popover | Missing | Not exported; no range mode, several visible months, month and year pickers, week numbers or unavailable dates. | `calendar.md` |
| Card | Surface and the card family | Partial | Surface has no header action slot and no compact size. | gap-patches § Surface |
| Carousel | PageDots (indicator only) | Missing | No slide track with previous and next controls, keyboard and swipe. | `carousel.md` |
| Chart | Chart | Covered | Not compared in depth; Chart already has figure, legend and table face. | — |
| Checkbox | Checkbox, CheckboxGroup | Covered | None. | — |
| Collapsible | SectionPanel (collapsible) | Partial | No free-form disclosure (any trigger, any content) outside a panel. | `disclosure.md` |
| Combobox | TagField (multiple values) | Partial | No single-value combobox with filtering, sections, empty result, clear action and custom value policy. | `combobox.md` |
| Command | CommandPalette | Partial | Only a modal palette; no inline command list for use inside a popover or panel. | gap-patches § CommandPalette |
| Context Menu | ActionMenu (context mode), LongPressMenu | Partial | No submenus, no checkable or radio items, no region wrapper serving pointer, keyboard and touch together. | `context-menu.md`, gap-patches § ActionMenu |
| Data Table | DataTable | Partial | No column visibility control and no filter bar contract. | gap-patches § DataTable |
| Date Picker | DateField | Partial | Single date only; no range picker. | `date-range-field.md` |
| Dialog | ModalDialog, SectionedModal | Covered | None. | — |
| Direction | TympanProvider (locale gives reading direction) | Covered | None. | — |
| Drawer | Drawer | Partial | No drag-to-dismiss on the bottom placement, no snap points, no start or top placement. | gap-patches § Drawer |
| Dropdown Menu | ActionMenu | Partial | No submenus, no checkbox or radio items. | gap-patches § ActionMenu |
| Empty | EmptyState | Covered | None. | — |
| Field | Field, Fieldset, FormLayout | Partial | No horizontal or responsive orientation; no labelled separator; several errors are not merged. | gap-patches § Field |
| Form | FramedForm, FormLayout, SchemaRequestForm | Covered | None. | — |
| Hover Card | DetailsPopover (press only) | Missing | No preview surface that opens on hover or focus and never traps focus. | `hover-card.md` |
| Input | TextField | Covered | None. | — |
| Input Group | TextField (leading icon, clear, reveal) | Partial | Only fixed add-ons; no general start, end, above and below slots with text and buttons, no multi-line variant. | `input-group.md` |
| Input OTP | OneTimeCodeField | Partial | No visual grouping with a separator (for example two groups of three). | gap-patches § OneTimeCodeField |
| Item | ListRow, SummaryRow | Partial | No image media, no whole-row link, no header or footer lines, no size steps, no outline or muted appearance. | gap-patches § ListRow |
| Kbd | none | Missing | No keyboard key and key-combination display. | `keyboard-key.md` |
| Label | Field label | Covered | None. | — |
| Marker | none | Missing | No inline conversation status, note or labelled separator. | `conversation-marker.md` |
| Menubar | none | Missing | No horizontal bar of menus with roving focus. | `menubar.md` |
| Message | none (assistant rows live inside the flow package) | Missing | No generic message row with avatar, header, footer and alignment. | `message.md` |
| Message Scroller | none (auto-scroll lives inside the assistant surface) | Missing | No transcript scroller with turn anchoring, follow-output, prepend preservation and jump commands. | `message-list.md` |
| Native Select | NativeSelect | Covered | None. | — |
| Navigation Menu | AppNavigation (top bar), NavigationFlyout | Partial | No site-style top navigation whose items open rich content panels. | gap-patches § AppNavigation |
| Pagination | Pagination | Covered | None. | — |
| Popover | Popover | Covered | None. | — |
| Progress | ProgressBar | Covered | None. | — |
| Questionnaire | WizardPage, ChoiceGrid (adjacent) | Missing | No one-question-at-a-time form with skip, freeform answer, answer shortcuts and native form submission. | `question-flow.md` |
| Radio Group | ChoiceGrid (card radios) | Partial | Only card-shaped choices; no plain radio list with descriptions and horizontal layout. | `radio-group.md` |
| Resizable | ResizableSplit | Partial | Two panes, horizontal only; no vertical orientation, no more than two panes, no collapsible pane, no persisted layout. | gap-patches § ResizableSplit |
| Scroll Area | none | Missing | No focusable scroll region with themed thin scrollbars and edge fades. | `scroll-area.md` |
| Select | ListboxSelect | Covered | None. | — |
| Separator | Separator | Covered | None. | — |
| Sheet | Drawer | Covered | Side sheet is the Drawer `end` placement (start and top are in the Drawer gap). | — |
| Sidebar | AppNavigation (sidebar, rail), AppFrame | Partial | No toggle shortcut, collapsed state not remembered, no item badges or per-item actions. | gap-patches § AppNavigation |
| Skeleton | Skeleton | Covered | None. | — |
| Slider | none | Missing | No single or range slider. | `slider.md` |
| Sonner / Toast | Toast | Partial | No promise-bound toast (loading, then success or failure) and no in-place update of an open toast. | gap-patches § Toast |
| Spinner | Spinner | Covered | None. | — |
| Switch | Switch | Covered | None. | — |
| Table | DataTable | Covered | Static tables use DataTable with no sort or selection. | — |
| Tabs | Tabs | Partial | One appearance only; no underline appearance. | gap-patches § Tabs |
| Textarea | TextArea | Covered | None. | — |
| Toggle | ToolbarTrigger (pressed), GlassCheckToggle (developer only) | Missing | No general two-state button. | `toggle-button.md` |
| Toggle Group | SegmentedControl | Partial | Single selection only; no multiple selection, no vertical layout. | `toggle-button.md` (group part) |
| Tooltip | used internally, not exported | Missing | Not public. | `tooltip.md` |
| Typography | Text, Heading, MarkdownView | Covered | None. | — |

## How the status was decided

- A reference component whose Tympan equivalent already carries its
  behaviour is **covered**, even when the API differs.
- A Tympan behaviour used only internally (Tooltip) counts as **missing**,
  because hosts cannot use it.
- Where the gap is a whole new component (Toggle Group's multiple mode,
  Collapsible, a range date picker), a new spec is written instead of
  widening an existing component whose purpose is narrower.

## New specs in this folder

tooltip, slider, radio-group, toggle-button (with ToggleButtonGroup),
combobox, calendar, date-range-field, accordion, disclosure, hover-card,
menubar, context-menu, carousel, keyboard-key, button-group, input-group,
scroll-area, aspect-frame, avatar-group, message, message-list,
chat-bubble, attachment, conversation-marker, question-flow.
