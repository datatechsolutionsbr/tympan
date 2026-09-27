# HTML contract: using Tympan without React

Tympan's styling is plain CSS over `ty-` classes, `data-*` attributes and
`--ty-*` custom properties. A host that renders HTML with another framework
(Rust/Dioxus, Leptos, server templates, web components) or by hand can use
the same stylesheets by emitting the markup described here. This document is
the contract: the classes, attributes and element structure each component's
CSS expects. The React components in `src/components` render exactly this
markup, so their source is the reference when something here is unclear.

## 1. Stylesheets

| File | What it holds | Load |
|---|---|---|
| `@datatechsolutions/tympan/styles.css` (`dist/styles.css`) | every component rule in `@layer tympan.base` and `@layer tympan.components`, **with the token stylesheet already inlined** in `@layer tympan.tokens` | always |
| `@datatechsolutions/tympan-tokens/tokens.css` | only the tokens: every `--ty-*` property for the built-in presets (`tympan`, `fakhir`, `astrlabe`, `neutral`, `high-contrast`), light and dark, the densities and the user-preference blocks | instead of `styles.css` when a host wants tokens without the components |
| `@datatechsolutions/tympan-tokens/print-themes.css` | opt-in UI themes derived from the print book styles (`data-ty-theme="print-<style>"`), about 2 MB (160 kB gzipped) | after `styles.css`, only when a print theme is offered; `print-themes/<theme>.css` holds one theme per file |
| `@datatechsolutions/tympan-tokens/print-themes.json` | name, label, font stylesheet URL and CSS file of each print theme | when building a theme picker |

Everything sits in cascade layers declared up front:
`@layer tympan.tokens, tympan.base, tympan.components;`. Unlayered host CSS
always wins over a layer, so a host stylesheet can adjust any component
without `!important`. A host that also uses other layered CSS should declare
the order once, before any stylesheet, for example
`@layer reset, tympan, app;`.

## 2. Theme, mode and density attributes

Set on `<html>` (or on any wrapper, for a scoped preview):

```html
<html data-ty-theme="astrlabe" data-ty-mode="system" data-ty-density="default">
```

| Attribute | Values | Effect |
|---|---|---|
| `data-ty-theme` | a preset name, a print theme name (with `print-themes.css` loaded) or a generated theme | which colour, radius, glass and font values apply; `tympan` also applies to `:root` without the attribute |
| `data-ty-mode` | `light`, `dark`, `system` (or absent) | `system` follows `prefers-color-scheme` |
| `data-ty-density` | `compact`, `default`, `comfortable` | control heights (`--ty-control-height*`) and `--ty-density` |

`prefers-contrast: more`, `prefers-reduced-transparency`,
`prefers-reduced-motion` and `forced-colors` are handled in the stylesheet;
the host does nothing.

To apply a stored choice before first paint, run a small inline script in
`<head>` that copies it from storage onto `<html>` (React hosts get it from
`themeInitScript()`; others can inline its output or write the three
`setAttribute` calls themselves). Print themes name a font stylesheet in
`print-themes.json`; add that `<link>` when the theme is selected.

The page ground: `body` gets the theme background, ink and font from
`@layer tympan.base`. A container that must look like a themed page on its own
(a portal, an iframe body) takes `class="ty-theme-scope"`.

## 3. Interaction states

The React components receive interaction state from React Aria as data
attributes. Markup without React does not, so `styles.css` includes
`native-states.css`, which maps the native pseudo-classes and ARIA states to
the same look for any element **without** `data-rac` (the attribute React Aria
puts on the elements it renders):

| React Aria attribute | Native equivalent handled by the stylesheet |
|---|---|
| `data-hovered` | `:hover` (only under `(hover: hover)`) |
| `data-pressed` | `:active` |
| `data-focus-visible` | `:focus-visible` (`:focus-within` for field groups) |
| `data-disabled` | `:disabled` or `aria-disabled="true"` |
| `data-selected` (tabs) | `aria-selected="true"` |
| `data-selected` (segmented control) | `aria-pressed="true"` or `aria-checked="true"` |
| `data-selected` (checkbox, switch) | the wrapped `input:checked` |
| `data-current` (rail item, link, button link) | `aria-current="page"` |
| `data-invalid` (field controls) | `aria-invalid="true"` on the control |

State that is not an interaction is always set by the host as a data
attribute, exactly as the React components do: variants (`data-variant`,
`data-size`, `data-tone`, `data-shape`), `data-busy`, `data-selected` on a
surface or table row, `data-actionable` on a clickable table row,
`data-invalid` and `data-disabled` on field wrappers. Boolean data attributes
are present-or-absent: write `data-busy=""` to turn one on, and leave it out
(never `data-busy="false"`) to turn it off.

Icons are inline SVG with `class="ty-icon"`, `aria-hidden="true"` and
`focusable="false"`; they take the text colour. Directional icons (chevrons,
arrows) add `ty-mirror-rtl`.

## 4. Components

Markup below shows the full structure; optional parts are marked in comments.
Attribute values in `|` are alternatives.

### Button

```html
<button type="button" class="ty-button"
        data-variant="primary|secondary|quiet|danger"
        data-size="compact|regular|large"
        data-shape="rounded|pill|circle">
  <span class="ty-button__icon"><svg class="ty-icon" aria-hidden="true" focusable="false">…</svg></span> <!-- optional -->
  <span class="ty-button__label">Save</span>
</button>
```

- Icon only: add `data-icon-only=""`, omit the label span and give the button
  an `aria-label`.
- Full width: `data-full-width=""`. Busy: `data-busy=""` and `aria-busy="true"`.
- A navigation button is an `<a class="ty-button" href="…">` with the same
  attributes; `aria-current="page"` marks the current destination.
- Disabled: the native `disabled` attribute (or `aria-disabled="true"` to stay
  focusable).
- At most one `data-variant="primary"` per view.

### Link

```html
<a class="ty-link" href="/runs">Runs</a>
<a class="ty-link" data-emphasis="subtle" data-standalone="" href="…">Details</a>
```

### Text field (single-line input)

```html
<div class="ty-text-field" data-appearance="outlined|filled">
  <label class="ty-text-field__label" for="name">Name</label>
  <p class="ty-text-field__hint" id="name-hint">Shown on the canvas</p>          <!-- optional -->
  <div class="ty-text-field__group">
    <span class="ty-text-field__leading" aria-hidden="true"><svg class="ty-icon">…</svg></span> <!-- optional -->
    <input id="name" class="ty-text-field__input" type="text" aria-describedby="name-hint">
    <button type="button" class="ty-text-field__action" aria-label="Clear">…</button> <!-- optional -->
  </div>
  <p class="ty-text-field__error" id="name-error">                                  <!-- when invalid -->
    <svg class="ty-icon" aria-hidden="true">…</svg><span>Required</span>
  </p>
</div>
```

Invalid: `data-invalid=""` on the root (or `aria-invalid="true"` on the input)
and point `aria-describedby` at the error. Read-only: `data-readonly=""`.
Disabled: `data-disabled=""` on the root and `disabled` on the input.

### Text area

```html
<div class="ty-text-area" data-resize="vertical|none">
  <label class="ty-text-area__label" for="notes">Notes</label>
  <textarea id="notes" class="ty-text-area__input" rows="4"></textarea>
  <p class="ty-text-area__counter">12 / 500</p>                                     <!-- optional -->
</div>
```

`data-monospace=""` switches to the mono stack (code, JSON). Invalid,
read-only and disabled work as for the text field.

### Select (native)

```html
<div class="ty-native-select">
  <label class="ty-native-select__label" for="region">Region</label>
  <div class="ty-native-select__frame">
    <select id="region" class="ty-native-select__control">
      <option value="">Choose…</option>
      <option>us-east-1</option>
    </select>
    <svg class="ty-icon ty-native-select__chevron" aria-hidden="true">…</svg>
  </div>
</div>
```

### Field, fieldset and stacks (wrapping any control)

```html
<div class="ty-field">
  <label class="ty-field__label" for="x">Label <span class="ty-field__required">(required)</span></label>
  <!-- control -->
  <p class="ty-field__hint">Help text</p>
  <p class="ty-field__error"><svg class="ty-icon ty-field__error-icon" aria-hidden="true">…</svg>Message</p>
</div>

<fieldset class="ty-fieldset">
  <legend class="ty-fieldset__legend">Connection</legend>
  <p class="ty-fieldset__description">…</p>
  <div class="ty-fieldset__body">…fields…</div>
</fieldset>

<div class="ty-field-stack">…fields, evenly spaced…</div>
```

### Checkbox

```html
<div class="ty-checkbox" data-appearance="plain|tile">
  <label class="ty-checkbox__row">
    <input type="checkbox" class="ty-visually-hidden">
    <span class="ty-checkbox__indicator" aria-hidden="true"><!-- check icon when checked --></span>
    <span class="ty-checkbox__text">
      <span class="ty-checkbox__label">Notify me</span>
      <span class="ty-checkbox__description">By email</span>                          <!-- optional -->
    </span>
  </label>
</div>
```

The input must be the row's direct child: the checked, focus and disabled
looks come from `:has(> input:checked)` and friends. Render the check icon
(`<svg class="ty-icon">`) inside the indicator while checked.

### Switch

```html
<label class="ty-switch" data-size="small|regular|large" data-layout="inline|tile">
  <input type="checkbox" role="switch" class="ty-visually-hidden">
  <span class="ty-switch__track" aria-hidden="true"><span class="ty-switch__thumb"></span></span>
  <span class="ty-switch__text">
    <span class="ty-switch__label">Autosave</span>
    <span class="ty-switch__description">Every change</span>                        <!-- optional -->
  </span>
</label>
```

### Segmented control

```html
<div class="ty-segmented-control" role="group" aria-label="Mode" data-size="compact|regular|large">
  <button type="button" class="ty-segmented-control__segment" aria-pressed="true">
    <span class="ty-segmented-control__label">Light</span>
  </button>
  <button type="button" class="ty-segmented-control__segment" aria-pressed="false">
    <span class="ty-segmented-control__label">Dark</span>
  </button>
</div>
```

`data-full-width=""` stretches the segments. A radio-group version uses
`role="radiogroup"` and segments with `role="radio"` and `aria-checked`.

### Surface (card, panel, sheet)

```html
<section class="ty-surface" data-elevation="sheet|raised|floating|flat" data-padding="none|regular|roomy">
  <header class="ty-surface__header">                                               <!-- optional -->
    <h2 class="ty-surface__title">Runs</h2>
    <div class="ty-surface__description">Last 24 hours</div>
  </header>
  <div class="ty-surface__body">…</div>
  <footer class="ty-surface__footer">…buttons…</footer>                              <!-- optional -->
</section>
```

- `sheet` is the level-1 glass (large radius, blur); `raised` a card on it
  (no blur of its own); `floating` a popover-level card; `flat` a borderless
  group.
- A whole-card link: add `data-pressable=""` and put the destination on
  `<a class="ty-surface__primary" href="…">` inside the title; its hit area
  stretches over the card. `data-selected=""` marks a chosen card.

### Table

```html
<div class="ty-table-wrap" data-density="compact|standard|comfortable">
  <div class="ty-table-scroll">
    <table class="ty-table">
      <caption class="ty-table__caption">Recent runs</caption>                      <!-- optional -->
      <thead class="ty-table__head">
        <tr class="ty-table__row">
          <th class="ty-table__column" scope="col">Workflow</th>
          <th class="ty-table__column" scope="col" data-align="end">Duration</th>
        </tr>
      </thead>
      <tbody>
        <tr class="ty-table__row" data-actionable="">
          <th class="ty-table__cell ty-table__cell--row-header" scope="row">Nightly sync</th>
          <td class="ty-table__cell" data-align="end" data-numeric="">1.2 s</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

- Sortable header: put `<button class="ty-table__sort">Label <svg class="ty-icon ty-table__sort-icon">…</svg></button>`
  in the `th` and set `aria-sort` on the `th`.
- `data-actionable=""` gives a clickable row the pointer and hover; make the
  row's main cell a link or button so it is reachable by keyboard.
- An empty body: one `<td class="ty-table__cell ty-table__cell--empty" colspan="…">`
  holding an empty state.
- `data-column-lines=""` and `data-sticky-first=""` on the wrap add column
  rules and a sticky first column.

### Status pill (run and lifecycle state)

```html
<span class="ty-status" data-tone="neutral|info|success|warning|danger" data-size="small|regular">
  <span class="ty-status__icon" aria-hidden="true"><svg>…</svg></span>
  <span class="ty-status__label">Running</span>
</span>
```

`data-busy=""` spins the icon (for an in-progress state).

### Tag (badge, chip)

```html
<span class="ty-tag" data-tone="neutral|accent" data-size="small|regular|large">
  <span class="ty-tag__icon" aria-hidden="true"><svg>…</svg></span>               <!-- optional -->
  <span class="ty-tag__text">postgres</span>
  <button type="button" class="ty-tag__remove" aria-label="Remove postgres">…</button> <!-- optional -->
</span>
```

An interactive tag is `<a>` or `<button class="ty-tag" data-interactive="">`.
A list of tags: `<div class="ty-tag-list"><div class="ty-tag-list__items">…</div></div>`.
A categorical swatch: `<span class="ty-tag__swatch" style="--ty-tag-category: var(--ty-chart-3)"></span>`.

### Tabs

```html
<div class="ty-tabs" data-orientation="horizontal|vertical">
  <div class="ty-tabs__list" role="tablist" aria-label="Sidebar">
    <button type="button" role="tab" class="ty-tabs__tab" id="t1" aria-controls="p1" aria-selected="true">
      Navigator <span class="ty-tabs__count">3</span>
    </button>
    <button type="button" role="tab" class="ty-tabs__tab" id="t2" aria-controls="p2" aria-selected="false" tabindex="-1">Execution</button>
  </div>
  <div class="ty-tabs__panel" role="tabpanel" id="p1" aria-labelledby="t1" tabindex="0">…</div>
</div>
```

The host implements roving focus (arrow keys move between tabs). Hidden
panels are left out or take the `hidden` attribute.

### Dialog (modal)

```html
<div class="ty-modal-dialog__backdrop">
  <div class="ty-modal-dialog" data-width="narrow|regular|wide|xwide">
    <div class="ty-modal-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="d-title" aria-describedby="d-desc">
      <div class="ty-modal-dialog__inner">
        <header class="ty-modal-dialog__header">
          <h2 class="ty-modal-dialog__title" id="d-title" tabindex="-1">Delete workflow?</h2>
          <button type="button" class="ty-button" data-variant="quiet" data-icon-only="" data-shape="circle" aria-label="Close">…</button>
        </header>
        <p class="ty-modal-dialog__description" id="d-desc">This cannot be undone.</p>
        <div class="ty-modal-dialog__body">…</div>                                  <!-- optional, scrolls -->
        <footer class="ty-modal-dialog__actions">…buttons…</footer>
      </div>
    </div>
  </div>
</div>
```

The host owns the behaviour: focus moves into the dialog and is trapped
there, Escape and a backdrop press close it (unless it is busy), the page
behind is `inert` and does not scroll, and focus returns to the opener.
`data-entering=""` / `data-exiting=""` on the backdrop and `.ty-modal-dialog`
play the enter and exit animations.

### Drawer (side or bottom sheet)

```html
<div class="ty-drawer__backdrop" data-placement="end|bottom">
  <div class="ty-drawer" data-placement="end|bottom">
    <div class="ty-drawer__dialog" role="dialog" aria-modal="true" aria-labelledby="dr-title">
      <header class="ty-drawer__header">
        <h2 class="ty-drawer__title" id="dr-title">Node settings</h2>
        <!-- close button -->
      </header>
      <div class="ty-drawer__body">…</div>
    </div>
  </div>
</div>
```

### Popover

```html
<div class="ty-popover" data-placement="bottom">
  <div class="ty-popover__dialog" role="dialog" aria-label="Details">
    <div class="ty-popover__body">
      <h3 class="ty-popover__title">Retry policy</h3>                                <!-- optional -->
      <div class="ty-popover__content">…</div>
    </div>
  </div>
</div>
```

The host positions it (fixed or absolute, with collision handling) and
closes it on Escape and outside press.

### Menu (action menu)

```html
<div class="ty-action-menu">
  <div class="ty-action-menu__menu" role="menu" aria-label="Workflow actions">
    <div class="ty-action-menu__item" role="menuitem" tabindex="-1">
      <span class="ty-action-menu__label">Rename</span>
      <kbd class="ty-action-menu__shortcut">F2</kbd>                                  <!-- optional -->
    </div>
    <div class="ty-action-menu__separator" role="separator"></div>
    <div class="ty-action-menu__item" role="menuitem" data-tone="danger" tabindex="-1">
      <span class="ty-action-menu__label">Delete</span>
    </div>
  </div>
</div>
```

The focused item is styled from `:focus`, so move real focus between items
with the arrow keys.

### Toast

```html
<div class="ty-toast-region" data-placement="top-end|top-center|bottom-center">
  <div class="ty-toast-region__list" role="status" aria-live="polite">
    <div class="ty-toast" data-tone="info|success|warning|error" role="alertdialog" aria-labelledby="n1-title" tabindex="0">
      <svg class="ty-icon ty-toast__icon" aria-hidden="true">…</svg>
      <div class="ty-toast__body">
        <p class="ty-toast__title" id="n1-title">Saved</p>
        <p class="ty-toast__message">Version 12 is live.</p>                          <!-- optional -->
        <div class="ty-toast__actions">…one button…</div>                            <!-- optional -->
      </div>
      <button type="button" class="ty-button ty-toast__dismiss" data-variant="quiet" data-size="compact" data-icon-only="" aria-label="Dismiss">…</button>
    </div>
  </div>
</div>
```

Errors go in a second list with `role="alert"` and `aria-live="assertive"`.

### Inline notice (alert)

```html
<div class="ty-notice" data-tone="info|success|warning|danger" role="status">
  <span class="ty-notice__icon" aria-hidden="true"><svg class="ty-icon">…</svg></span>
  <div class="ty-notice__body">
    <p class="ty-notice__title"><span class="ty-visually-hidden">Warning: </span>Vault sealed</p>
    <div class="ty-notice__message">Unseal it to run workflows that use credentials.</div>
    <div class="ty-notice__actions">…</div>                                         <!-- optional -->
  </div>
</div>
```

### Navigation rail and the app frame

```html
<div class="ty-app-frame" data-layout="rail" data-width="reading|data|full">
  <div class="ty-app-frame__rail">
    <div class="ty-app-frame__rail-slot" data-slot="brand">Astrlabe</div>
    <nav class="ty-app-frame__rail-nav" aria-label="Main">
      <div class="ty-rail-section">
        <p class="ty-rail-section__label" id="s1">Build</p>
        <ul class="ty-rail-section__list" aria-labelledby="s1">
          <li class="ty-rail-section__entry">
            <a class="ty-rail-item" href="/workflows" aria-current="page">
              <svg class="ty-icon ty-rail-item__icon" aria-hidden="true">…</svg>
              <span class="ty-rail-item__label">Workflows</span>
              <span class="ty-rail-item__count" aria-hidden="true">12</span>          <!-- optional -->
            </a>
          </li>
        </ul>
      </div>
    </nav>
    <div class="ty-app-frame__rail-slot" data-slot="account">…</div>
  </div>
  <div class="ty-app-frame__stage">
    <main class="ty-app-frame__sheet" id="main" tabindex="-1">
      <div class="ty-app-frame__content">…page…</div>
    </main>
  </div>
  <div class="ty-app-frame__aside-slot">…</div>                                      <!-- optional -->
</div>
```

A context switcher at the top of the rail (organization, project):
`<button class="ty-rail-context"><span class="ty-rail-context__lines"><span class="ty-rail-context__scope">Organization</span><span class="ty-rail-context__name">Acme</span></span><svg class="ty-icon ty-rail-context__glyph">…</svg></button>`.

### Floating action bar (dock)

```html
<nav class="ty-action-bar" data-edge="bottom|top|start|end" data-orientation="horizontal|vertical" aria-label="Actions">
  <div class="ty-action-bar__track">
    <div class="ty-action-bar__slot" data-kind="primary">
      <button type="button" class="ty-action-bar__item" aria-label="New workflow">
        <span class="ty-action-bar__glyph" aria-hidden="true"><svg class="ty-icon">…</svg></span>
        <span class="ty-action-bar__tip" role="tooltip">New workflow <kbd class="ty-action-bar__kbd">N</kbd></span>
      </button>
    </div>
    <span class="ty-action-bar__separator" aria-hidden="true"></span>
  </div>
</nav>
```

`data-active=""` marks the item whose panel is open; `data-anchor="container"`
positions the bar inside its nearest positioned ancestor instead of the
viewport.

### Page header

```html
<header class="ty-page-header" data-scale="page|section|display" data-layout="stacked|inline">
  <div class="ty-page-header__row">
    <span class="ty-page-header__icon" aria-hidden="true"><svg class="ty-icon">…</svg></span> <!-- optional -->
    <div class="ty-page-header__text">
      <p class="ty-page-header__eyebrow">Settings</p>                                 <!-- optional -->
      <h1 class="ty-page-header__title">Model connections</h1>
      <p class="ty-page-header__summary">Providers your agents may call.</p>           <!-- optional -->
    </div>
    <div class="ty-page-header__actions">…buttons…</div>                              <!-- optional -->
  </div>
</header>
```

`data-divider=""` draws a rule under the header.

### Headings, text and code

```html
<h2 class="ty-heading" data-appearance="display|h1|h2|h3|label">Section</h2>
<div class="ty-heading-group"><p class="ty-heading__eyebrow">Eyebrow</p><h2 class="ty-heading">…</h2></div>
<p class="ty-text" data-size="body|body-lg|meta" data-tone="default|muted|danger|success" data-measure="prose">…</p>
<strong class="ty-strong">…</strong>  <code class="ty-code">run_01H…</code>
```

`data-truncate="line"` (one line with an ellipsis) or `"clamp"`, and
`data-numeric=""` (tabular figures) apply to `.ty-text`.

### Section heading

```html
<div class="ty-section-heading">
  <div class="ty-section-heading__row">
    <div class="ty-section-heading__text">
      <h2 class="ty-section-heading__title">Schedules</h2>
      <p class="ty-section-heading__subtitle">Recurring runs</p>                      <!-- optional -->
    </div>
    <div class="ty-section-heading__trailing">…</div>                                <!-- optional -->
  </div>
</div>
```

### Empty state

```html
<div class="ty-empty" data-framing="inline|page" role="region" aria-labelledby="e1">
  <svg class="ty-icon ty-empty__icon" aria-hidden="true">…</svg>
  <h2 class="ty-empty__title" id="e1">No runs yet</h2>
  <p class="ty-empty__description">Run a workflow to see it here.</p>
  <div class="ty-empty__actions">…</div>                                             <!-- optional -->
</div>
```

### Spinner, progress and skeleton

```html
<span class="ty-spinner" data-size="small|regular|large" data-tone="accent|neutral|on-accent" role="progressbar" aria-label="Loading">
  <span class="ty-spinner__ring" aria-hidden="true"></span>
</span>

<div class="ty-progress" data-tone="neutral|success|warning|danger" role="progressbar" aria-valuenow="40" aria-valuemin="0" aria-valuemax="100">
  <div class="ty-progress__header"><span class="ty-progress__label">Indexing</span><span class="ty-progress__value">40%</span></div>
  <div class="ty-progress__track" aria-hidden="true"><div class="ty-progress__fill" style="inline-size: 40%"></div></div>
</div>

<span class="ty-skeleton" data-shape="rect|circle|pill|heading" data-width="short|medium|long" aria-hidden="true"></span>
```

`data-indeterminate=""` on `.ty-progress` animates an unknown amount.

### Avatar

```html
<span class="ty-avatar" data-size="xsmall|small|regular|large" data-kind="person|agent" data-tint="accent|neutral">
  <span class="ty-avatar__initials" aria-hidden="true">NM</span>
</span>
<button type="button" class="ty-avatar-control" aria-label="Account">…a .ty-avatar…</button>
```

With a photo: `data-image=""` and `<img class="ty-avatar__image" alt="">`.

### Separator

```html
<div class="ty-separator" role="separator" data-orientation="horizontal|vertical" data-spacing="none|regular|roomy"></div>
<div class="ty-separator ty-separator--captioned" role="separator">
  <span class="ty-separator__line" aria-hidden="true"></span><span class="ty-separator__caption">or</span><span class="ty-separator__line" aria-hidden="true"></span>
</div>
```

### Skip link and visually hidden text

```html
<a class="ty-skip-link" href="#main">Skip to content</a>
<span class="ty-visually-hidden">Read by screen readers only</span>
```

## 5. Custom properties for host layout

Page layout that no component covers belongs in the host's own stylesheet,
written with logical properties and the tokens, never with raw values:

| Need | Tokens |
|---|---|
| spacing | `--ty-space-1` … `--ty-space-9` |
| surfaces | `--ty-bg`, `--ty-surface`, `--ty-surface-raised`, `--ty-surface-sunken`, `--ty-surface-solid` |
| text | `--ty-ink` (headings), `--ty-ink-2` (body), `--ty-ink-3` (secondary) |
| lines | `--ty-line`, `--ty-line-soft`, `--ty-line-strong` |
| brand | `--ty-brand` (`--ty-accent`), `--ty-brand-soft`, `--ty-on-brand-soft`, `--ty-cta` |
| tones | `--ty-{danger,warning,success,info,neutral}`, `-soft`, `on-…-soft` |
| categorical | `--ty-chart-1` … `--ty-chart-8` |
| radius | `--ty-radius-control`, `--ty-radius-card`, `--ty-radius-sheet`, `--ty-radius-pill` |
| elevation | `--ty-shadow-sheet`, `--ty-shadow-raised`, `--ty-shadow-floating`, `--ty-shadow-modal` |
| glass | `--ty-glass-blur-sheet`, `--ty-glass-blur-floating`, `--ty-glass-saturate` |
| type | `--ty-font-sans`, `--ty-font-serif`, `--ty-font-mono`, `--ty-font-size-{display,h1,h2,h3,body-lg,body,label,meta,eyebrow}` with matching `--ty-font-line-height-*`, `--ty-font-weight-{regular,semibold,bold}` |
| motion | `--ty-dur-{instant,quick,base}`, `--ty-ease`, `--ty-ease-out` (durations become `0ms` under reduced motion) |
| layers | `--ty-z-{sticky,popover,modal,toast}` |
| controls | `--ty-control-height`, `--ty-control-height-compact`, `--ty-control-height-touch`, `--ty-control-target`, `--ty-focus-width`, `--ty-focus-ring` |

The full list, with values for every preset, is in
`@datatechsolutions/tympan-tokens/tokens.json`.
