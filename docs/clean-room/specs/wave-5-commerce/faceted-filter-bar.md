# FacetedFilterBar

Wave 5 · commerce · navigation and form · Status: specified

## Purpose
Let a shopper narrow and order a product listing: choose values in facets (category, colour, size, price band, brand), sort the results, see and remove the active filters, and do the same on a narrow screen through a filter sheet. One component, three layouts: a bar of per-facet popovers, a single expandable panel, and a sidebar.

## Anatomy
- **Heading** (visually hidden by default): names the filter region.
- **Sort control**: a trigger labelled with the word for sort and the current choice, opening a single-choice menu (ActionMenu, wave 1, in radio mode) of sort options supplied by the host.
- **Facet groups**: each facet is a titled group of options. Option kinds: multi-select checkboxes (Checkbox, wave 1, compact row form), single-select radios, colour values (SwatchGroup from commerce primitives in multi-select form), and a price range (two CurrencyField inputs, wave 2, with an apply button). Each option may show a count of matching products.
- **Subcategory links** (optional): a list of links above the facets (sidebar layout) to child categories.
- **Active filters row**: FilterChips (wave 2) listing each applied value, each removable, plus a clear-all action.
- **Summary trigger** (expandable-panel layout): a button showing the count of applied filters that opens the panel.
- **View switch** (optional): SegmentedControl (wave 1) between grid and list presentations of the results.
- **Result count** (optional): "N products" text, announced when it changes.
- **Filter sheet** (narrow screens): a Drawer (wave 1) from the end edge with a title, a close button, the facets as collapsible sections, and a footer with "show N results" and clear-all.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| facets | { id; label; kind: 'multi' \| 'single' \| 'colour' \| 'range'; options?: { value; label; count?; swatch? }[]; range?: { min: Money; max: Money } ; collapsedByDefault? }[] | required | Facet definitions from the host. |
| value | Record<facetId, string[] \| { min?: Money; max?: Money }> | required | Applied filters (controlled). |
| onChange | (next value, change: { facetId; kind: 'add' \| 'remove' \| 'clear' \| 'set' }) => void | required | Every change. |
| sortOptions | { value; label }[] | [] | Sort choices; hidden when empty. |
| sort | string | none | Current sort value. |
| onSortChange | (value) => void | none | Sort change. |
| layout | 'popovers' \| 'panel' \| 'sidebar' | 'popovers' | Wide-screen layout. Narrow screens always use the filter sheet. |
| applyMode | 'immediate' \| 'deferred' | 'immediate' | Immediate calls `onChange` on each toggle. Deferred keeps a draft inside popovers, the panel or the sheet and commits on "apply" or "show results". |
| subcategories | { label; href; current? }[] | none | Links at the top of the sidebar and the sheet. |
| resultCount | number | none | Shown and announced; used in the sheet's footer button. |
| view / onViewChange | 'grid' \| 'list' / handler | none | Enables the view switch. |
| showOptionCounts | boolean | true | Shows counts next to options when supplied. |
| hideEmptyOptions | boolean | false | Options with a zero count are hidden instead of disabled. |
| pending | boolean | false | Results are reloading: counts dimmed, controls stay usable. |
| labels | object | from I18nAdapter | Sort, filters, clear all, apply, show results, close, clear value, from, to, active filters. |

URL state is the host's: the component reports changes and never reads or writes the address bar, so it works with the RouterAdapter (wave 2) or any state store.

## States
No filters; some filters (active row visible, facet triggers show a count badge); popover or panel open; sheet open; deferred draft differs from applied (apply button enabled); option with zero matches (disabled with "0" or hidden); pending results; range invalid (min greater than max: inline error on the fields, apply disabled); facet list loading (Skeleton rows).

## Keyboard and ARIA
- Region: a `section` (or `aside` in sidebar layout) labelled by the heading.
- Sort: APG **Menu Button** with `menuitemradio` items; the current sort is checked; the trigger's name includes the current sort.
- Popovers layout: each facet trigger is an APG **Disclosure** button that opens a non-modal Popover (wave 1) holding a `fieldset` with a legend; Escape closes and returns focus to the trigger; opening one popover closes the others; Tab leaves the popover and closes it.
- Panel layout: one Disclosure button (name includes the applied count) controlling a region with one `fieldset` per facet.
- Sidebar layout: each facet is a `fieldset` whose legend is also a Disclosure button when `collapsedByDefault` is set.
- Options: checkboxes and radios are native-semantics RAC `Checkbox` and `RadioGroup`; the count is part of the accessible description, not the name.
- Active filters: FilterChips semantics (each remove button named "Clear {facet}: {value}"); after removing, focus moves to the next chip, or to the clear-all control when none remain, or to the sort control when the row disappears.
- Filter sheet: APG **Dialog (modal)** via Drawer; focus starts on the sheet title; facets inside are Disclosures; the footer button name includes the result count.
- Result count changes are announced politely once per settled change, not per click.

## Responsive, touch, motion, forced colours
- Wide screens use the chosen layout; below the medium layout width token the bar collapses to a sort control plus a "filters" button (with count) that opens the sheet.
- Sidebar layout stacks above the results on medium screens only if the host opts in; otherwise it becomes the sheet.
- Every option row is a full-width touch target (`--ty-control-target`).
- Popovers, panel and sheet open with opacity and short slide from the design motion tokens; reduced motion shows them instantly.
- Forced colours: facet trigger count badge keeps a system border; checked state uses system checkmarks.
- Right-to-left: the sheet enters from the left edge; chevrons mirror; the price range order (from, to) follows reading direction.

## Acceptance tests
- Given facets and `layout="popovers"`, when a facet trigger is activated, then its popover opens, focus moves to the first option, and other popovers are closed.
- Given the popover is open, when Escape is pressed, then it closes and focus returns to its trigger.
- Given `applyMode="immediate"`, when an option is checked, then `onChange` fires with `kind: 'add'`.
- Given `applyMode="deferred"` in the sheet, when options are checked and the sheet is closed without applying, then `onChange` does not fire and the draft is discarded.
- Given two applied values, then the active row shows two chips and each facet trigger shows its own count.
- Given a chip's remove button is pressed, then `onChange` fires with `kind: 'remove'` and focus moves to the next chip.
- Given clear-all, then `onChange` fires once with `kind: 'clear'` and an empty value.
- Given sort options, when the person picks one, then `onSortChange` fires and the trigger's accessible name includes the new label.
- Given a narrow viewport, then the facets are not visible inline and a "filters" button with the applied count opens a modal sheet.
- Given `resultCount` changes from 120 to 18, then "18 products" is announced once.
- Given a range with min greater than max, then an error is shown on the fields and apply is disabled.
- Given an option with count 0 and `hideEmptyOptions` false, then it is disabled and still readable.
- Given axe on each layout open and closed, then there are no violations.

## Composition notes
Reuses Checkbox, ActionMenu, Popover, Drawer, SegmentedControl, Skeleton (wave 1), FilterChips, CurrencyField, CountBadge (wave 2), SwatchGroup (commerce primitives). SearchBar (wave 2) remains the choice for text search plus chips in back-office lists; this component is the shopper-facing counterpart.

## Open questions
- Whether a hierarchical category facet (tree with expand) is needed now or later.
