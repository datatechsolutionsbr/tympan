# Provenance

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
| NativeSelect | native-select.md | native select; RAC Modal, Dialog, ListBox (wheel) | 13 | Wheel only below 640 px with a coarse pointer; hidden native select keeps form submission |
| ListboxSelect | listbox-select.md | RAC Select, ListBox; APG select-only combobox | 11 | Narrow screens: the same Popover laid out as a bottom tray (RAC collections need the Popover) |
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
| Spinner | spinner.md | RAC ProgressBar | 9 | Overlay wraps the covered region (`inert` + `aria-busy`) |
| ProgressBar | progress-bar.md | RAC ProgressBar | 7 | Reduced motion: static partial fill + "In progress" |
| Skeleton, PageLoadingState | skeleton.md | custom; DD §2.12 | 13 | Status sentence visually hidden; pulse opacity only |
| EmptyState | empty-state.md | RAC Button | 9 | Primary action variant overridable (one primary per view is the host's call) |
| ErrorState | error-state.md | RAC Button, Disclosure; APG Disclosure | 10 | `appearedAfterLoad` decides alert vs focusing the title |
| Breadcrumbs | breadcrumbs.md | RAC Link; APG Breadcrumb | 8 | Overflow uses ActionMenu with `href` items |
| PageHeader | page-header.md | RAC Heading, TextField; DD §2.1, §2.2 | 7 | Editable title keeps one (visually hidden) heading for the outline |
| SectionHeading | section-heading.md | RAC Heading | 6 | |
| Toast | toast.md | custom region (RAC's unstable queue cannot replace by id nor mix politeness) | 14 | Two sibling live containers (assertive errors, polite rest); F6 enters the region |
| SkipLink | skip-link.md | native anchor; WCAG 2.4.1 | 7 | Temporary `tabindex=-1` on the target |
| AppFrame | app-frame.md | RAC ModalOverlay, Modal, Dialog; APG landmark regions; DD §2.8, §3.2 | 9 | Desktop DOM order: skip link, navigation, top bar, main (matches the visual order); `FrameNavLabel` keeps rail names |
| ProofBadge | none (DD §2.11) | DD §2.11; RAC TooltipTrigger, Focusable; lucide BadgeCheck, Hourglass, CircleX, CircleDashed, Minus | 12 | `detail` prop (e.g. "4/6"); tooltip only when `interactive` |
| ActorChip | none (DD §2.11) | DD §2.11; Avatar | 9 | Agent always shows the word "agent"; system shows "system" and the rule in mono |

Foundations: `ThemeProvider`/`useTheme`/`themeInitScript` (5 tests),
`variants()` (2 tests), token contract (40 tests: every `var(--fk-*)` read by
a stylesheet exists). Total: 424 tests in the design system, 24 in the tokens
package.

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
