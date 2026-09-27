# Provenance

> **Rename note (2026-09-26).** The repository is now Tympan, an
> Astrlabe-family component published by Datatech. `packages/ui` is
> `@datatechsolutions/tympan` (called `@fakhir/ui` in this record, before
> that `@fakhir/design-system`), `packages/flow` is
> `@datatechsolutions/tympan-flow` (here `@fakhir/flow`, before that
> `@fakhir/flow-canvas`) and `packages/tokens` is
> `@datatechsolutions/tympan-tokens` (here `@fakhir/tokens`). The `fk-` class
> and `--fk-` custom-property prefix and the `data-fk-*` attributes named here
> are now `ty-`, `--ty-` and `data-ty-*`; `FakhirProvider` is `TympanProvider`;
> the Fakhir look is the `fakhir` theme preset. This record is otherwise kept
> as written.

> **Merge note (2026-09-26).** `packages/flow`
> (`@datatechsolutions/tympan-flow`) was later folded into `packages/ui`: its
> sources are in `packages/ui/src/flow` and it ships as the
> `@datatechsolutions/tympan/flow` subpath with the
> `@datatechsolutions/tympan/flow.css` stylesheet. Paths under
> `packages/flow` named here are now under `packages/ui/src/flow`.

Per component: the spec it implements, the sources used, and the decisions
taken where the spec left room. "DD" is the design direction
(`docs/infra/design-direction-fakhir.md`); specs live in
`docs/clean-room/specs/wave-1/`. React Aria Components (RAC) primitives were
used from their documentation and published type definitions; APG is the
WAI-ARIA Authoring Practices Guide. Every component has an axe-core check.
No fork or commercial template material was used for any row.

| Component | Spec | Sources | Tests | Decisions on open points |
|---|---|---|---|---|
| Button | button.md | RAC Button, Link; APG Button, Link; DD §2.6, §2.7, §2.10 | 14 | Busy uses RAC `isPending` plus `aria-busy`; width frozen while busy; 44 px hit area by `::before`; variants declared as data with `variants()` |
| Link | link.md | RAC Link, Button; APG Link; WCAG 2.5.8 | 9 | `standalone` prop gives the 44 px hit height; inline prose links are exempt |
| Text, Strong, Code | text.md | native elements; DD §2.2, §2.3 | 8 | `copyable` accepted, inert until wave 2; muted contrast checked against DD values |
| Heading, Subheading | heading.md | RAC Heading; DD §2.2 | 9 | Eyebrow sits in a wrapper outside the heading element |
| TextField | text-field.md | RAC TextField, SearchField; DD §2.10 | 12 | `maxLength` not native so the over-limit state exists; reveal has `aria-pressed` and a changing name |
| TextArea | text-area.md | RAC TextField + TextArea | 9 | Auto-grow counts hard lines, measures soft wraps in browsers |
| NativeSelect | native-select.md | native select; RAC Modal, Dialog, ListBox (wheel) | 15 | Wheel only below 640 px with a coarse pointer; hidden native select keeps form submission; control 40 px on desktop and 44 px below 1024 px (density tokens), value centred by a full-height line box |
| ListboxSelect | listbox-select.md | RAC Select, ListBox; APG select-only combobox | 13 | Narrow screens: the same Popover laid out as a bottom tray (RAC collections need the Popover); trigger 40 px on desktop and 44 px below 1024 px, one centred line: the chosen option's description and check stay in the list |
| Checkbox, CheckboxGroup | checkbox.md | RAC Checkbox, CheckboxGroup; APG Checkbox | 9 | |
| Switch, SwitchGroup | switch.md | RAC Switch; APG Switch | 11 | Enter also toggles, as the spec asks |
| Field, Fieldset, FieldStack | field.md | native fieldset/label; WCAG 1.3.1, 3.3.2 | 10 | Error replaces the hint; error announced politely only when it appears after mount; required marker is text |
| Surface | surface.md | RAC Button, Link; "single primary control" card technique | 8 | Title, description, footer props for the anatomy; nested blur dropped (§2.5) |
| Separator | separator.md | RAC Separator | 7 | A captioned rule is not a separator role, so the caption stays readable |
| Tag, TagList | tag.md | RAC Button, Link, TagGroup | 9 | Category tone is a small square only (§2.3) |
| StatusPill | status-pill.md | custom; DD §2.3 | 7 | Announcing is opt-in; built-in map uses lucide icons per tone |
| Avatar | avatar.md | RAC Button, Link; DD §2.11 | 8 | Agent: square, dashed border, bot icon, never initials |
| InlineNotice | inline-notice.md | APG Alert; live-region guidance | 12 | `info` tone uses the ink-2 family (the accent never marks state, §2.3) |
| ModalDialog | modal-dialog.md | RAC ModalOverlay, Modal, Dialog, Heading; APG Dialog, Alert Dialog | 12 | Alert dialogs: host marks the least destructive action with `autoFocus` |
| Drawer | drawer.md | RAC ModalOverlay, Modal, Dialog | 10 | Always a close button; drag closes past 120 px or 0.6 px/ms |
| Popover | popover.md | RAC DialogTrigger, Popover, Dialog, OverlayArrow; APG Disclosure | 9 | `offset` is a spacing step; Tab out closes |
| ActionMenu | action-menu.md | RAC MenuTrigger, Menu, MenuItem, MenuSection, Separator; APG Menu Button, Menu | 14 | Context mode: right click, Shift+F10, ContextMenu key, long press; own viewport clamp |
| Tabs | tabs.md | RAC Tabs, TabList, Tab, TabPanel; APG Tabs | 10 | Data-driven `tabs` prop; `keepMounted` via force-mount |
| SegmentedControl | segmented-control.md | RAC RadioGroup, Radio; APG Radio Group | 8 | Radio semantics, no live region |
| DataTable | data-table.md | native table (APG Table) for read-only data; RAC Table (APG Grid) when selectable or actionable | 16 | Sort cycle computed in the component; densities from DD §2.9 as custom properties |
| Pagination | pagination.md | RAC Button; landmark guidance | 12 | Page size uses a labelled native select |
| Spinner | spinner.md | RAC ProgressBar (CSS-only ring) | 9 | Overlay wraps the covered region (`inert` + `aria-busy`) |
| ProgressBar | progress-bar.md | RAC ProgressBar | 7 | Reduced motion: static partial fill + "In progress" |
| Skeleton, PageLoadingState | skeleton.md | custom; DD §2.12 | 13 | Status sentence visually hidden; pulse opacity only |
| EmptyState | empty-state.md | RAC Button | 9 | Primary action variant overridable (one primary per view is the host's call) |
| ErrorState | error-state.md | RAC Button, Disclosure; APG Disclosure | 10 | `appearedAfterLoad` decides alert vs focusing the title |
| Breadcrumbs | breadcrumbs.md | RAC Link; APG Breadcrumb | 8 | Overflow uses ActionMenu with `href` items |
| PageHeader | page-header.md | RAC Heading, TextField; DD §2.1, §2.2 | 7 | Editable title keeps one (visually hidden) heading for the outline |
| SectionHeading | section-heading.md | RAC Heading | 6 | |
| Toast | toast.md | custom region (RAC's unstable queue cannot replace by id nor mix politeness) | 17 | Two sibling live containers (assertive errors, polite rest); F6 enters the region; light haptic only with the haptics preference on and after a user gesture |
| SkipLink | skip-link.md | native anchor; WCAG 2.4.1 | 7 | Temporary `tabindex=-1` on the target |
| AppFrame | app-frame.md | RAC ModalOverlay, Modal, Dialog; APG landmark regions; DD §2.8, §3.2 | 9 | Desktop DOM order: skip link, navigation, top bar, main (matches the visual order); `FrameNavLabel` keeps rail names |
| ProofBadge | none (DD §2.11) | DD §2.11; RAC TooltipTrigger, Focusable; lucide BadgeCheck, Hourglass, CircleX, CircleDashed, Minus | 12 | `detail` prop (e.g. "4/6"); tooltip only when `interactive` |
| ActorChip | none (DD §2.11) | DD §2.11; Avatar | 9 | Agent always shows the word "agent"; system shows "system" and the rule in mono |

Foundations: `ThemeProvider`/`useTheme`/`themeInitScript` (5 tests),
`variants()` (2 tests), token contract (40 tests: every `var(--fk-*)` read by
a stylesheet exists). Total at the end of wave 1: 424 tests in the design system, 24 in the tokens
package.

## Waves 2 and 4 (branch `ds/wave-2`)
Specs in `docs/clean-room/specs/wave-2/` and `wave-4/`. Nine research-shell specs were written by the implementer from the approved storyboards and the design direction (marked "new"; they have no fork counterpart). Groups were implemented by sub-sessions of the same implementer under the same rules; the coordinating implementer wrote the shell group and integrated. Columns as above.

### Shell and research (wave 4, research shell)

| Component | Spec | Sources | Tests | Decisions on open points |
|---|---|---|---|---|
| AppFrame rail layout, RailNavSection, RailNavItem, RailContextButton | wave-4/app-frame-rail.md (new) | RAC ModalOverlay, Modal, Dialog, Link, Button; APG landmark regions; DD §2.1, §2.5, §2.8, §3.2; approved storyboards | 10 | Rail is the default layout when no `topBar` is given; no banner landmark; below 768 px the rail is a modal drawer opened from the tab bar's "more" menu (or a floating menu button without a dock); the sheet pads its end by the dock's published inset |
| FloatingActionBar | wave-4/floating-action-bar.md | react-aria useLink, useButton, useLongPress, mergeProps; RAC Popover, Menu, MenuItem, useLocale; APG Toolbar, Menu Button; DD §2.5, §2.7 | 21 | Own roving tabindex (RAC Toolbar keeps every item tabbable); pure model (`barModel.ts`) for slots, overflow order, chords and keys; default focus chord Alt+Shift+D; chevron is a 24 px pointer shortcut to the same menu the 44 px item opens; built-in alert-dialog confirmation unless `requestConfirm` (e.g. ConfirmService) is passed; `narrowVariant="tabbar"` gives 5 items + "more" below 768 px; used as the research dock at the user's request although §5 discourages docks over data (inset keeps content clear); contextual items may carry `pressed` (aria-pressed, for canvas modes) and `group` (a separator between groups), so a canvas tool list can become the dock |
| PageHeader (rework + editorial variant) | wave-1/page-header.md, wave-4/page-header-editorial.md (new) | RAC Heading, TextField, Link; DD §2.1, §2.2 | 11 | Restructured into parts (TrailLine, MetaRow, EditableTitle, slot list) for independence; editorial: mono trail with CSS separators, 68ch lead, divider by default |
| EvidencePanel | wave-4/evidence-panel.md (new) | Drawer (RAC Modal); ProofBadge; APG Window Splitter; DD §2.8, §3.7 | 8 | Docked complementary region ≥ 1280 px, end drawer 1024–1279, bottom sheet (80dvh) below; width 340–420 via the shared splitter hook |
| ResizableSplit | wave-4/resizable-split.md (new) | APG Window Splitter | 8 | Value is the sized pane; Enter toggles to min and back; stacks below `stackBelow` |
| StatStrip | wave-4/stat-strip.md (new) | RAC Link, useLocale; Intl.NumberFormat; DD §2.2, §3.5 | 6 | Labelled group around a `dl`; hairlines, no cards; linked values named "value label" |
| StageStrip | wave-4/stage-strip.md (new) | RAC Link; lucide status glyphs; DD §3.5 | 6 | Ordered list with `aria-current="step"`; row with arrows from 1024 px, vertical below |
| AttentionList | wave-4/attention-list.md (new) | Button, ProofBadge, RAC Link; DD §2.11 | 6 | Action names made unique with a visually hidden ": title" suffix |
| ActivityFeed | wave-4/activity-feed.md (new) | ActorChip; Intl.RelativeTimeFormat, DateTimeFormat | 7 | `time` with ISO datetime, relative text, absolute date in `title`; actor before time |
| PhaseBar | wave-4/phase-bar.md (new) | DD §2.3, §2.11 textures | 5 | Bar is one `img` named with every part; legend repeats the facts in text; 2 px minimum segment |
| ActorChip (fix) | DD §2.11 | | 9 | Space between name and kind so the accessible name reads "stage-counter agent" |

### Choices and filters (wave 2)

| Component | Spec | Sources | Tests | Decisions on open points |
|---|---|---|---|---|
| ThemeSwitcher | wave-2/theme-switcher.md | RAC Switch, Button; APG Switch, Button; DD §2.3, §2.7 | 7 | Name stays "Dark mode", state carried by checked; forced colours show a check inside the knob |
| StateSwitch | wave-2/state-switch.md | RAC Switch; APG Switch | 8 | Name is `label`, state text is the description; events stop at the wrapper; `aria-busy` while pending |
| OneTimeCodeField | wave-2/one-time-code-field.md | RAC Group, Input; APG labelled group; requestHaptic | 12 | One entry per box; multi-character entry (autofill) handled as paste; error `role="alert"` describes the group |
| PasswordStrength | wave-2/password-strength.md | ARIA meter role; DD §2.3 | 11 | Own `role="meter"` element (RAC Meter emits `meter progressbar`, flagged by axe 4.13); level from rules share plus length bonus; announced politely after 700 ms |
| SearchBar | wave-2/search-bar.md | RAC SearchField, TagGroup (FilterChips), Button; ModalDialog, Drawer; APG search landmark, Dialog | 8 | Cancel visible while focus is in the bar; filters dialog becomes a bottom Drawer under 640 px; `kindIcons` host map |
| FilterField | wave-2/filter-field.md | RAC SearchField; live-region guidance | 8 | Placeholder never the name (dev warning); count announced after 500 ms |
| FilterChips | wave-2/filter-chips.md | RAC TagGroup, Tag, Button | 10 | Focus to the next chip, else previous, else the next focusable; remove names exactly "Remove X" |
| FilterTile, FilterTileGroupHeading, FilterTileGrid | wave-2/filter-tile.md | RAC ToggleButton, Heading; APG Button (toggle) | 6 | Labelled group of independent toggles; hues limited to categorical tokens, selection uses the accent |
| ChoiceCard, ChoiceCardGroup | wave-2/choice-card.md | RAC RadioGroup, Radio, ToggleButton; APG Radio Group, Button (toggle) | 7 | Group context switches to radio mode; unavailable radio disabled with the reason as description |
| ChoiceTile | wave-2/choice-tile.md | RAC ToggleButton; APG Button (toggle) | 7 | Light haptic; dev warning without text or `label`; `customSelection` |
| ChoiceGrid | wave-2/choice-grid.md | RAC RadioGroup, Radio; APG Radio Group | 7 | Horizontal orientation; busy disables and sets `aria-busy` |
| ChipGroup | wave-2/chip-group.md | RAC CheckboxGroup, Checkbox, TextField, Button; APG Checkbox | 10 | Id from text (accents stripped); remove buttons beside the chip; count a polite status |
| FlagSetPicker | wave-2/flag-set-picker.md | ChoiceCardGroup, Checkbox/CheckboxGroup | 6 | Outer group named by `label`; preset and option groups labelled |

### Pickers and forms (wave 2)

| Component | Spec | Sources | Tests | Decisions on open points |
|---|---|---|---|---|
| CategoryTabs, CategoryLabel | wave-2/category-tabs.md | RAC ToggleButtonGroup, ToggleButton; APG Radio Group; DD §2.3 | 9 | Marker is a categorical index 1–8; code stripped only when a whole leading word; events stop at the row |
| TagField | wave-2/tag-field.md | RAC ComboBox, TextField, TagGroup, ListBox, Popover; APG Combobox | 13 | Pills beside the text primitive (not nested); popover anchored to the box; remove buttons named by host wording |
| CurrencyField | wave-2/currency-field.md | RAC TextField, useLocale; Intl.NumberFormat, Intl.DisplayNames | 11 | Own parsing with live grouping; draft keeps a trailing decimal mark; caret kept by digit count; currency name in a hidden description |
| DateField | wave-2/date-field.md | RAC DialogTrigger, Popover, Dialog, Calendar, GridList; APG Date Picker Dialog; @internationalized/date | 10 | DialogTrigger + Calendar to control view reset and month view; today marked with `data-today`; Today shortcut outside the Calendar |
| TimeField | wave-2/time-field.md | RAC DialogTrigger, Popover, Dialog, Heading; APG Spinbutton | 10 | Own two spinbutton inputs so typed values clamp; arrows wrap; blocked Confirm stays focusable and described |
| MonthField | wave-2/month-field.md | RAC DialogTrigger, Popover, GridList; APG Dialog + Grid | 10 | Trigger name "label, value"; PageUp/PageDown step years; year controls clamp to data years |
| WheelPicker, WheelPickerGroup | wave-2/wheel-picker.md | RAC ListBox; APG Listbox; CSS scroll-snap | 10 | Pointer drag for mouse, native scroll for touch; report on settle; reduced motion scrolls instantly; the initial value is placed without animation once its row is rendered (RAC commits rows after the ListBox, React 18 and 19) |
| LocalePicker | wave-2/locale-picker.md | RAC ListBox; Drawer, ModalDialog; APG Dialog, Listbox | 8 | Re-choosing the current locale closes without reporting; names carry `lang`; flag decorative |
| ImagePicker | wave-2/image-picker.md | RAC Button, DropZone; native file input | 11 | Own hidden file input (value reset, same file re-validates); one status region for errors, progress and success |
| SchemaRequestForm | wave-2/schema-request-form.md | RAC Form; TextField, TextArea, NativeSelect, Checkbox, Button, InlineNotice, StatusPill | 10 | `validationBehavior="aria"`; required boolean must be checked; focus to the first invalid field |
| FormContainer, FieldGrid, FieldGridItem, InlineRow, FormSection, FramedForm | wave-2/form-layout.md | RAC Form; native fieldset/legend | 9 | Header and footer are divs (no duplicate landmarks); `FieldGridItem` carries the span; 20 px spacing from 1280 px, 16 px below |
| FormActions | wave-2/form-actions.md | Button; `group` role | 8 | Destructive primary = danger variant with icon; phones reverse visually, DOM stays secondary then primary |

### Overlays and navigation (wave 2)

| Component | Spec | Sources | Tests | Decisions on open points |
|---|---|---|---|---|
| SectionedModal | wave-2/sectioned-modal.md | RAC ModalOverlay, Modal, Dialog, Heading, Button; APG Dialog (Modal); DD §2.4, §2.5, §2.8 | 10 | Layout (bare, structured, sectioned) from props; section nav = `nav` + buttons with `aria-current`; Ctrl/Cmd+Enter submits; below 1024 the nav is a scrollable row; initial focus first field, else heading |
| SettingsDialog, PreferenceGroup | wave-2/settings-dialog.md (renamed in implementation) | SectionedModal; RAC RadioGroup, Radio; TextField, TextArea, Switch, NativeSelect, Avatar | 12 | Configuration is `content` by page id, each page a heading plus typed items (entry, toggle, pick, language, portrait, passphrase) drawn by one switch; any page id works; passphrase mismatch caught on the confirmation field before `onSave` |
| ConfirmProvider, useConfirm (ConfirmService) | wave-2/confirm-service.md | CompactConfirm, ModalDialog; APG Alert Dialog | 6 | FIFO queue; `presentation` compact or dialog; native `confirm` fallback, false on the server |
| CompactConfirm | wave-2/compact-confirm.md | RAC ModalOverlay, Modal, Dialog (`alertdialog`), Heading; APG Alert Dialog | 8 | Danger tone = icon + visible word, Cancel focused first; medium haptic on open, only with the haptics preference on and after a user gesture |
| DetailsPopover | wave-2/details-popover.md | RAC DialogTrigger, Popover, OverlayArrow, Dialog, useLocale; ActorChip, Drawer | 8 | Bottom Drawer under 640 px; comparison as plain text; time via Intl in the RAC locale |
| NavigationFlyout | wave-2/navigation-flyout.md | RAC ModalOverlay, Modal, Dialog, Link; TextField, Switch, Button | 8 | Destinations are real links; modified clicks keep new-tab behaviour; accent-insensitive filter with a count status; current = longest matching href |
| ToolbarTrigger | wave-2/toolbar-trigger.md | RAC Button, TooltipTrigger, Tooltip; APG Button / Menu Button; WCAG 2.5.3 | 6 | Name "label, caption" unless the label contains the caption; tooltip only when icon-only |
| AppNavigation (+ builders) | wave-2/app-navigation.md | RAC Link, TooltipTrigger, MenuTrigger, Menu, MenuSection, ModalOverlay, Modal, Dialog; ActionMenu, Button, Avatar | 10 | Pure builders (`buildFloatingActions` feeds the dock); counts in link names; no top bar built (rejected by the user) |
| AppLauncherGrid | wave-2/app-launcher-grid.md | RAC Link, Button; ActionMenu, Avatar, Separator | 9 | Profile tile shows the person; more menu also on Shift+F10, context-menu key, long press; counts capped "99+", full number in the name |
| CommandPalette | wave-2/command-palette.md | RAC ModalOverlay, Modal, Dialog, Button; APG Combobox inside APG Dialog; Skeleton | 11 | Hand-built combobox (`aria-activedescendant`) for scopes, action sub-list, wrap-around and fallback actions; Escape order sub-list, scope, close; pure model and fuzzy scoring |
| LongPressMenu | wave-2/long-press-menu.md | RAC MenuTrigger, Menu, MenuItem, Popover, Button, Link; APG Menu Button | 6 | Own 500 ms timer on capture-phase pointer events; the click ending a long press is swallowed; right click, Shift+F10, context-menu key |
| FloatingActionButton | wave-2/floating-action-button.md | Button; `createPortal`; DD §2.3, §2.8 | 6 | Inline ≥ 1024 px, portalled to the end of `body` below; `data-fk-fab-reserve` pads the page; safe-area offsets |
| StepList | wave-2/step-list.md | RAC Link, Button | 7 | `currentIndex` wins; non-selectable steps are text; under 640 px only markers plus the current name |
| PageDots | wave-2/page-dots.md | RAC Button; APG Carousel picker | 6 | Roving focus; static mode as text; counter above `maxDots`; 44 px hit area (24 px on fine pointers) |
| WizardPage | wave-2/wizard-page.md | StepList, Button | 7 | Focus to the h1 after a step change; `document.title` "step: flow"; header is a div |

### Lists and records (wave 2)

| Component | Spec | Sources | Tests | Decisions on open points |
|---|---|---|---|---|
| SectionPanel | wave-2/section-panel.md | RAC Disclosure, DisclosurePanel, Button; APG Disclosure; DD §2.1, §2.2, §2.5 | 8 | Heading wraps the trigger; actions and aside outside it; toolbar, tags and body in the panel (region labelled by the title) |
| ListPanel, ListPanelRow | wave-2/list-panel.md | RAC GridList, GridListItem; APG Grid, Feed; DD §2.5, §2.6, §2.7 | 7 | Rows read as data; three forms: static ul, GridList when a row is actionable, role=feed of articles with PageUp/PageDown |
| ListRow | wave-2/list-row.md | RAC Button (via Button); DD §2.3, §2.10 | 6 | Item name appended visually hidden to each action name; emphasised row shows a "Current" text marker; compact action buttons keep the 44 px hit area |
| SummaryRow | wave-2/summary-row.md | native dl/dt/dd; DD §2.2, §2.3 | 6 | CSS truncation, full text in `title` and in the tree; tile omitted without an icon |
| CountBadge | wave-2/count-badge.md | live-region guidance; DD §2.2, §2.3 | 6 | Visible number aria-hidden; hidden sentence with an id for `aria-describedby`; increases go to one shared polite region; one emphasis on change |
| NotificationCenter | wave-2/notification-center.md | RAC ModalOverlay, Modal, Dialog, Heading; APG Dialog; wave-1 Toast history | 10 | Reads `useToast().history`, keeps its own removed/cleared/seen ledger; focus after dismiss: next, previous, else the title |
| ProfileAvatar | wave-2/profile-avatar.md | native img; DD §2.11 | 8 | Picture, then initial, then neutral glyph; initial scaled with container query units |
| CopyIdentifier | wave-2/copy-identifier.md | RAC Button, TooltipTrigger, Tooltip; APG Tooltip | 8 | Reducer idle/copied/failed; wrapper stops propagation to clickable parents; 44 px hit area |
| HistoryList | wave-2/history-list.md | RAC DisclosureGroup, Disclosure, DisclosurePanel; APG Disclosure; DD §2.11, §2.12 | 8 | Entries without details render a static header; loading = Skeleton rows + status + aria-busy |
| GroupedDisclosureList | wave-2/grouped-disclosure-list.md | RAC DisclosureGroup; APG Accordion | 8 | Collapsed bodies not rendered; Up/Down/Home/End in the capture phase |
| RecoveryCodeList | wave-2/recovery-code-list.md | RAC Button; native ol | 9 | File body from `recoveryCodesFile`; haptic via `requestHaptic('medium')` |
| MarkdownView | wave-2/markdown-view.md | own parser to a data tree, React elements only; Link | 13 | No HTML strings; links only for absolute http(s); heading level = base + depth − 1 (max 6); overflowing code blocks become labelled focusable regions |

### Metrics and cards (wave 2 and 4)

| Component | Spec | Sources | Tests | Decisions on open points |
|---|---|---|---|---|
| StatTile | wave-2/stat-tile.md | RAC ToggleButton; wave-1 Popover (RAC DialogTrigger); APG Button; DD §2.2, §2.3, §2.5, §2.7 | 7 | Explain trigger beside the toggle; name = label, value, qualifier, marks; attention tone = icon + word; selected = accent border + check; live region wraps only the value |
| MetricTile | wave-2/metric-tile.md | custom group; DeltaIndicator; DD §2.2, §2.3, §2.5 | 8 | `surface` raised (level 2) or plain; long values wrap; trend is a percentage unless `format` |
| TweenedNumber | wave-2/tweened-number.md | requestAnimationFrame; DD §2.7 (cubic-bezier(.2,0,0,1) solved in JS) | 7 | Own frame driver; hidden tab lands on the target; 240 ms default; reduced motion or 0 ms shows the target |
| DeltaIndicator, DeltaMark | wave-2/delta-indicator.md | Intl.NumberFormat (signDisplay exceptZero); DD §2.2, §2.3, §2.4 | 8 | True minus sign; direction words visually hidden; not a live region |
| AgentOutputCard | wave-2/agent-output-card.md | ActorChip; RAC Button; DD §2.2, §2.3, §2.11 | 5 | `avatarUrl` accepted but not drawn (§2.11 square bot mark); one tab stop with stretched `::after`; clamp by custom property |
| RecordCard, RecordActions | wave-2/record-card.md | RAC Button; Button, StatusPill, ModalDialog (alertdialog); DD §2.3, §2.5, §2.7 | 8 | Only the title is the activation target; `li` by default, `article` when standalone; categorical accent strip 1–8; delete confirmation by alert dialog; dragging state is a host prop |
| ProfileSummary | wave-2/profile-summary.md | Avatar (decorative), Tag; DD §2.11 | 6 | Name read once; e-mail only with `showEmail` |
| ContactChannelCard, ContactOfficeCard, ContactSection | wave-2/contact-card.md | native `dl`, `address`, mailto/tel anchors; DD §2.2, §2.6 | 6 | Purpose is a free label; heading levels configurable; tel stripped to digits and + |
| InsightCard | wave-4/insight-card.md | ActorChip, Button, ProgressBar, InlineNotice, ProofBadge, DeltaIndicator, Link; DD §2.2, §2.3, §2.11, §2.12 | 7 | Article described by a hidden "Proposed by <name>, <kind>" sentence; one primary action (dev warning); rejection shows its message or the i18n fallback; outcome focused with `role=status` |
| TickerCard | wave-4/ticker-card.md | RAC Button; DeltaMark; Skeleton; Link; DD §2.3, §2.9, §2.12 | 7 | Rows a `ul`; hidden column words give name, qualifier, value, change; row height follows density, ≥ 44 px when interactive |

### Charts and regions (wave 2 and 4)

| Component | Spec | Sources | Tests | Decisions on open points |
|---|---|---|---|---|
| Chart | wave-2/chart.md | SVG (MDN); SegmentedControl, DataTable, EmptyState; APG Grid (roving focus); DD §2.3, §2.7, §5 | 16 | Own SVG renderer on a viewBox; colours only from `--fk-chart-*`/`--fk-categorical-*`; marker shape and dash per series; one tab stop with a polite readout; the table view is the complete text alternative; non-interactive mode is one `role=img`; input model renamed in implementation (`ChartFigure`: form, heading, across, up, layers, records, notes; props `figure`, `face`), mapping in the spec; the value gutter grows with the widest tick label, and a unit too long for it is written once above the axis (never clipped) |
| ReportView | wave-2/report-view.md | DataTable, Chart, EmptyState, InlineNotice, StatusPill, ActorChip; Intl.NumberFormat; RAC useLocale | 13 | Section renderers from a kind lookup; unknown kinds become a neutral note with the raw JSON; host render props for KPI, markdown, region map, input request; currency never hard-coded |
| LiveReportView | wave-2/live-report-view.md | ReportView, StatusPill, InlineNotice, Button | 14 | Pure reducer; resumes from the last cursor; backoff 500 ms doubling to 4 s, 3 retries; circuit breaker (6 attempts in 10 s); phase announced politely, steps not |
| RegionMap | wave-2/region-map.md | d3-geo (ISC: projection and path); Button, InlineNotice, Skeleton; APG roving tabindex | 10 | Markers are SVG buttons with `aria-pressed`, one tab stop; +/− zoom, Shift+arrows pan, Esc closes the detail; drag past 6 px is not a tap; the region list with toggles is always rendered |
| ToneTint | wave-4/tone-tint-resolver.md | CSS `color-mix()` (MDN); DD §2.3, §2.5 | 7 | `--fk-tint-<tone>-rgb/soft/ring` point at existing tokens, re-declared per theme and mode; `tintStyle()` + `data-fk-tinted`; `checkToneUsage` flags categorical tones outside map, chart, legend and graph node |
| RegionThemeRegistry | wave-4/region-theme-registry.md | WCAG contrast formula; @fakhir/tokens values | 7 | `onPrimary` computed against #fcfdfd / #0f172a; isolated registries and a provider; errors name country, field and code |
| RegionThemeData (BR) | wave-4/region-theme-data.md | ISO 3166-2:BR; IBGE Divisão Territorial and Divisões Regionais | 5 | Only BR codes, names and the 5 macro-regions ship; no identity colours (flag law gives names, not values), label points or view (derived from host boundaries by `deriveGeometry()`); other 29 countries: format, validation and registration API only |
| CountryProfileData (BR) | wave-4/country-profile-data.md | ISO 3166-1, ISO 4217, Unicode CLDR, Constituição Federal art. 13, Correios, Receita Federal, Natural Earth | 6 | Currency presentation derived through Intl, never stored; `register(target)` accepts the Formatters `registerCountry` |

### Auth, brand and pages (wave 2 and 4)

| Component | Spec | Sources | Tests | Decisions on open points |
|---|---|---|---|---|
| FederatedSignIn | wave-2/federated-sign-in.md | RAC Button (via Button, `isPending`); APG Button; DD §2.10 | 7 | Provider marks only through ThirdPartyMarkSlot (`markKey`) or a host glyph; default glyph lucide KeyRound; group named from i18n or `aria-labelledby` |
| AuthFrame | wave-2/auth-frame.md | APG landmark regions; DD §2.1, §2.2, §2.5, §3.3 | 8 | Brand side not rendered below 1024 px; display type on the form's `h1`; widths 340/400/520 px |
| BrandPanel | wave-2/brand-panel.md | `aside` landmark; DD §2.2, §2.3, §2.5 | 5 | Title `h2` (or `h3`) at h1 size; figures a `ul`; one aria-hidden radial wash on `--fk-ambient-1` |
| BrandMark, BrandLogo | wave-2/brand-mark.md | DD §2.2, §2.3; own open-book stroke art | 6 | Image form picks the dark file from `mode`, else the OS scheme; logo paths are host-served defaults |
| BrandLoader | wave-2/brand-loader.md | `role=status`; DD §2.7, §2.12 | 8 | Tone ring plus opacity-only breathing on `--fk-dur-pulse`; label falls back to "Loading" |
| LoaderPresets | wave-4/loader-presets.md | own registry; tone set from wave-4/tone-tint-resolver.md | 4 | Only the Fakhir preset ships; tones map to existing tokens |
| UpgradeGate | wave-2/upgrade-gate.md | RAC ModalOverlay, Modal, Dialog, Heading; APG Dialog (Modal); InlineNotice | 5 | `aria-modal` set on the dialog; "cannot be closed" in visually hidden description text; primary button has initial focus |
| HttpErrorPage | wave-2/http-error-page.md | `main` landmark; lucide FileQuestion, TriangleAlert, ServerCrash; DD §2.2, §2.12 | 6 | Big code aria-hidden, `h1` reads "Error 404: …"; optional exact `code` for 5xx; neutral ink only |
| RouteProgress | wave-2/route-progress.md | live-region guidance (polite `role=status`) | 5 | Transition-table state machine (idle, waiting, shown, finishing); 200 ms delay; 240 ms completion; reduced motion: static 60 % bar |
| ConsentBanner | wave-2/consent-banner.md | RAC Button, Link; APG landmark regions | 8 | Non-modal labelled `section`; storage wrapper never throws; both choices equal weight |
| EnvironmentBanner | wave-2/environment-banner.md | Tag; region landmark; DD §2.3 pending tone | 5 | `environment` may be a reader function; prod/production/live count as production; facts as a `dl` |
| AmbientBackdrop | wave-2/ambient-backdrop.md | DD §2.5; MDN `@supports`, prefers-reduced-transparency | 5 | Reads `--fk-ambient-1/2`; hidden without backdrop-filter, under reduced transparency and in forced colours |
| LegalDocumentFrame | wave-2/legal-document-frame.md | RAC Disclosure, DisclosurePanel, Button, Heading; APG Disclosure; IntersectionObserver | 8 | Slugs: NFD + transliteration table, `section-N` fallback, `-2` on collisions; current section by IntersectionObserver; a followed link focuses the `h2` and updates the hash |
| SkeletonFill, SkeletonBlock | wave-4/skeleton-fill.md | DD §2.3, §2.7, §2.12 | 7 | Hook is the `data-fk-skeleton` attribute; fill tokens defined on the hooked element; opacity pulse on `--fk-dur-pulse` |
| ThirdPartyMarkSlot, ProviderMark | wave-4/third-party-mark-slot.md | lucide Cpu, Database, Boxes; own registry | 10 | Empty registry, no path data (tested); icon-set sources only through a host adapter; brand colour opt-in; unknown models show "Other provider" |

### Touch and utilities (wave 2 and 4)

| Component | Spec | Sources | Tests | Decisions on open points |
|---|---|---|---|---|
| MotionFoundation | wave-2/motion-foundation.md | DD §2.7; MDN prefers-reduced-motion; `@fakhir/tokens/values` | 6 | JS tokens checked against token values; presets opacity/translate only, reduced twins opacity-only and instant; `decorativeMotion` context flag, default false |
| Haptics | wave-2/haptics.md | MDN Vibration API, User Activation API | 9 | Own pattern table, all under 0.2 s; reduced motion: only success, warning, error; host switch `HapticsPreference` (also read by Toast and CompactConfirm); `requestHaptic` kept; nothing calls `navigator.vibrate` before a user gesture (sticky activation, or a first press seen by the module) |
| animateChange (ViewTransition) | wave-2/view-transition.md (renamed in implementation) | MDN View Transitions API | 6 | `animateChange` → `{ done, cancel }`; root flag `data-fk-change-style=<style>` cleared on finish, cancel or rejection; `instant` and reduced motion apply at once |
| Routing (RouterAdapter) | wave-2/router-adapter.md (renamed in implementation) | RAC RouterProvider; MDN History/Location | 5 | `RoutingProvider host={…}` with `go`, `step`, `warm`, `Anchor`, `visit`; browser and host implementations of one abstract `Routes`; `reload` re-enters the path through the host; also drives RAC's RouterProvider |
| I18nAdapter | wave-2/i18n-adapter.md | RAC I18nProvider/useLocale; MDN Intl | 6 | Own ICU subset parser (plural, selectordinal, select, number, date), no dependency; locale falls back to RAC's |
| EntityListLoader | wave-2/entity-list-loader.md | React only | 7 | Ticket-based stale-response guard; a null key sets loading false |
| Formatters | wave-2/formatters.md, wave-4/country-profile-data.md (shape) | MDN Intl | 8 | Placeholder "not informed" from the catalogue; registry validates code, locale, ISO 4217; ships no country data |
| ApiErrorModel | wave-2/api-error-model.md | RFC 9457; Fakhir OpenAPI `components/workflows.yaml` | 5 | Translators from the contract's RunStatus, StepStatus, RunEvent.event; a test requires every contract enum value mapped; unknown events skipped |
| LegacyAliasMap | wave-4/legacy-alias-map.md | the spec | 4 | Decision record in `utilities/legacy-alias-map/LEGACY-ALIASES.md`; test checks the barrel exports no alias |
| SwipeRow | wave-2/swipe-row.md | APG Menu Button; ActionMenu; touch events | 9 | `revealFraction` instead of pixels; destructive full swipe needs `confirm` or `undoable`; hidden actions inert |
| PullToRefresh | wave-2/pull-to-refresh.md | RAC ProgressBar; touch events | 8 | `refresh()` from hook and ref (keyboard path); threshold 64 px, cap 120 px; polite status only while refreshing |
| EdgeSwipeBack | wave-2/edge-swipe-back.md | touch events; RAC useLocale | 7 | Zone 24 px, commit 96 px; back from the RouterAdapter; RTL from `dir` or locale |
| SafeAreaInset | wave-2/safe-area-inset.md | MDN env(safe-area-inset-*), :has(), scroll-padding | 7 | Logical edges resolved in JS; bottom bar publishes its height and nudges a focused element under it |
| GlassCheckToggle | wave-4/glass-check-toggle.md | RAC ToggleButton, TooltipTrigger; APG Button (toggle) | 7 | `enabled` defaults to false (developer only); reserved `--fk-debug-glass-check` declared locally |
| CascadeGrid | wave-4/cascade-grid.md | MDN CSS animations | 8 | Plain grid unless `cascade` and `decorativeMotion` are on and reduced motion is off; item count frozen at first mount |

### Public pages (wave 4)

| Component | Spec | Sources | Tests | Decisions on open points |
|---|---|---|---|---|
| ShowcaseHeading, Kicker, Lead | wave-4/showcase-heading.md | RAC Heading; DD §2.2, §2.3, §2.8 | 7 | With no kicker and no lead only the heading element renders (`data-align` on it); display steps down to h1 below 640 px; the kicker is a `p` outside the heading |
| RevealNumber | wave-4/reveal-number.md | IntersectionObserver (MDN), requestAnimationFrame; DD §2.2, §2.7 | 8 | Own small count-up; server output is the final value; an invisible copy of the final value fixes the width; duration read from `--fk-dur-base`; reduced motion or no observer: final value at once |
| ShowcaseBackdrop, AccentBand | wave-4/showcase-backdrop.md | DD §2.3, §2.5; MDN `@supports`, prefers-reduced-transparency, forced-colors | 8 | Two radial glows in `--fk-ambient-1/2` (`faint` halves them); 4 px band from accent to accent-soft; reduced transparency or no backdrop-filter: glows hidden, band solid; hidden in forced colours |
| FeatureShowcaseCard, FeatureShowcaseMosaic | wave-4/feature-showcase-card.md | RAC Heading, Link; APG Link; DD §2.4, §2.5, §2.7 | 7 | Mosaic added (3 columns from 1024 px, `wide` spans 2); title link hit area covers the card; card states via `:has()`; media with `mediaAlt` is role img, otherwise aria-hidden |
| RuledGrid, RuledGridRow, RuledGridCell | wave-4/ruled-grid.md | DD §2.1, §2.5, §2.8 | 7 | Four decorative corner marks per cell; column template through `--fk-ruled-columns`; `as` gives list semantics |
| HighlightStat | wave-4/highlight-stat.md | ARIA group naming; RAC useLocale; Link; RevealNumber; DD §2.2, §3.5 | 6 | role=group named by the label, described by value and source; locale number format; level-2 surface |
| FeatureTile, FeatureTileGrid | wave-4/feature-tile.md | RAC Heading, Link; APG Link; DD §2.2, §2.3, §2.8 | 5 | FeatureTileGrid (`ul`/`li`, 1/2/3 columns at 640 and 1024 px); same accent-soft badge on every tile; title link covers the tile |

### Wave-1 files restructured for independence

At the coordinator's request (outside similarity audit), Spinner (now a CSS-only ring instead of a lucide icon), Text, SegmentedControl, SectionHeading, Tabs, Separator, Switch and PageHeader were restructured (internal parts, helper tables, hooks) with unchanged API, class names, behaviour and tests.

### Decisions shared across groups

- **Copy**: one catalogue per group (`src/internal/messages/<group>.ts`) merged into `Messages`; `messagesPtBR`, `messagesEs` and English ship as defaults, `catalogueForLocale()` picks one from the provider's locale, `icuMessages` accepts ICU MessageFormat strings (function keys take `{0}`, `{1}` positionally) and `pseudo` pseudo-localizes every string.
- **Right to left**: layout CSS is logical only (`check:logical-css`); directional glyphs carry `fk-mirror-rtl`; every gallery page renders and passes axe in Arabic (`test/i18n-rtl.test.tsx`).
- **Scripts**: `@fakhir/tokens` emits `:lang()` blocks that put the script's Noto family first, relax line heights, drop tracking where it breaks joining and set CJK/Thai line breaking.
- **Retrofit for languages** (after the first pass): Spanish catalogues for every group, counts and plurals through `Intl.PluralRules`, locale digits everywhere (including typed input in CurrencyField and TimeField), Unicode-aware CommandPalette matching, script-preserving slugs in LegalDocumentFrame, charts running in the reading direction, and one right-to-left test per component (`test/rtl.tsx`, `test/rtl-b.tsx` helpers).
- **Totals on `ds/wave-2`**: 1625 tests in the design system (199 files), 25 in the tokens package.
- **Dependencies added**: `react-aria` (hooks), `@internationalized/date`, `d3-geo` (see THIRD_PARTY_NOTICES.md).

## Avatars and flags (branch `feat/avatars-flags`)

| Piece | Sources | Tests | Decisions |
|---|---|---|---|
| Avatar `artwork` slot | existing Avatar spec (wave-1/avatar.md, DD §2.11) | Avatar.test.tsx (artwork replaces initials and bot icon; image wins; null falls back) | Artwork is always decorative; the frame keeps role, name, pressable wrapper and agent shape. |
| `avatarSvg`, `avatarPalette`, `GeneratedAvatar` (`/avatars`) | DiceBear 9.4.3 public API (`createAvatar`, style `meta`/`schema`, read from the published type definitions and `lib/` of the npm packages), each style's LICENSE file | avatars.test.tsx: determinism, every allowed style over 24 seeds, CSS and resolved theme colours, figure art keeps its colours, id scoping, licence gate (CC BY / custom / unlisted refused), agent restrictions, allow-list against installed LICENSE files, import and package.json scan, fallback, axe, right to left | Colours through sentinel hex values swapped for `var(--ty-avatar-<slot>, color-mix(...))` so inline avatars follow theme and mode; figure styles get only a light paper background; agents use neutral ink and abstract styles; own FNV id prefix instead of DiceBear's `randomizeIds` (which uses `Math.random` and breaks determinism). |
| Licence allow-list | package LICENSE files and `meta.license` of all 31 DiceBear 9 styles | as above, plus `check:provenance` rule | 14 CC0/MIT styles in, 17 CC BY 4.0 or custom-licensed styles and `@dicebear/collection` out (THIRD_PARTY_NOTICES.md). |
| `Flag`, `flagName`, `loadFlagSvg` (`/flags`) | flag-icons 7.5.0 SVGs (MIT), `Intl.DisplayNames` (ECMA-402), CLDR region codes | flags.test.tsx: coverage, per-aspect ids, names in en/pt-BR/es/ja/ar, own names for subdivisions, code fallback, label/decorative, 1x1/circle/unknown, axe, right to left | One generated module per flag and aspect, loaded by dynamic import and shown as a data-URI `img` (no id clashes, no injected markup); names from DisplayNames with a small en/pt/es table for flags without a CLDR region; flags never mirror. |

## Ambiguities resolved (summary)

- **Info tone.** DD §2.3 gives no info colour and forbids the accent as state;
  `info` uses a low-chroma ink-2 family.
- **Proof-state text.** The pinned semantic greens and ambers fall just below
  4.5:1 on their own soft fill, so proof text uses the generated `on-*-soft`
  tone (≥ 4.5:1); `--fk-success` etc. keep the exact DD values.
- **Field borders.** DD's `line-strong` is ~2:1 on the sheet; WCAG 1.4.11 needs
  3:1 for a field boundary, so fields use the new `--fk-input` role (≥ 3:1).
- **Theming attributes.** `data-fk-theme`, `data-fk-mode`, `data-fk-density`
  (the coordinator's names); `ThemeScope` also accepts `scheme` as an alias.
- **Hit areas in jsdom.** Asserted on the stylesheet (`::before` with
  `max(100%, var(--fk-control-target))`) because jsdom has no layout.

## Theme system: ideas from shadcn/ui and Tailwind CSS documentation (concepts only)

Added at the user's request. From the public shadcn/ui theming page: paired
surface/foreground roles, one radius base deriving the scale, themes as a swap
of custom properties, composable parts, variants declared as data. From the
public Tailwind CSS colour and theme pages: 11-step ramps (50…950) in OKLCH,
a spacing scale from one unit, type sizes paired with line heights, shadow and
easing steps, breakpoints and container widths. All implemented with our own
names (`--fk-*`), our own ramp curves and hues, and our own `variants()` helper
(no class-variance-authority, no registry files, no utility classes). No code,
class string, CSS file or palette value from either project was read or copied.
Details and URLs: `packages/tokens/README.md`, section "Ideas taken from public
documentation".

## ProductMark: the Datatech family marks (author's artwork)

`src/components/product-mark/marks.ts` holds the symbol and horizontal marks
of Fakhir, Astrlabe and Datatech from the "Instrumento" brand direction, and
the wordmark of Tympan; Tympan's symbol stays its original plate mark (outer
circle, two almucantars, horizon), drawn in `ProductMark.tsx`. The artwork is the author's own (Datatech), produced by her brand
generator script (Python, in the brand redesign working folder) and exported
as per-product SVGs; the module was generated from those SVGs by replacing the
ink fill with `currentColor` and the accent fill with `var(--ty-mark-accent)`.
The wordmarks are set in Archivo and converted to outlines (see
THIRD_PARTY_NOTICES.md). No third-party logo or icon set was used.
