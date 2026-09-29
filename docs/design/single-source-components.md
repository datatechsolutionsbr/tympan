# Single-source components: Tympan custom elements

Status: decided (option B, web components); spike implemented on Button,
Switch and the theme palette. This note records the decision, the design
choices inside it, and how the rest of the library moves over.

## The problem

Tympan components are consumed by React applications (the gallery, the
site, research platforms built on `@datatechsolutions/tympan`) and by hosts
that are not React at all, through plain HTML. A component hand-written once
as a React component and once as a custom element drifts the first time
either is touched. The goal is one definition per component that every
consumer is generated from.

## Decision

**Tympan components become standard custom elements, written once in
TypeScript.** React consumes them through small wrappers that are
*generated* from the element's definition, so they cannot disagree with
it; any other host uses the elements directly as HTML. Everything is themed
by the same `--ty-*` custom properties and styled by the same `styles.css`.

Rejected alternative, for the record: a declarative contract from which a
React markup layer and the element's own rendering are both generated (still
two behaviour implementations to keep in step).

## Design choices

### Authoring: plain custom elements, no Lit

The elements extend a ~200-line internal base class
(`packages/ui/src/elements/base.ts`) that reads the definition, exposes one
property per prop (reflected to its attribute), keeps the anatomy in step
and dispatches events. There is no templating runtime to ship because the
anatomy is data (next section) and, inside a framework, the framework renders
it. No new dependency, nothing to clear with the clean-room and provenance
rules, and the standalone bundle of all three spike elements is 34 kB
minified (10 kB gzipped), most of it the theme catalogue.

Lit would buy reactive templates and shadow-DOM conveniences this design does
not use; it can be revisited if a component needs heavy client templating.

### Light DOM, not shadow DOM

The elements render into the light DOM and carry no shadow root:

- **One stylesheet.** `styles.css` (layered `@layer tympan.*`) styles the
  elements exactly as it styles the React components, with no per-element
  copy adopted into shadow roots, and a host's own layered CSS still
  adjusts them. Tokens would cross a shadow boundary anyway; component rules
  would not.
- **ARIA and labels work document-wide.** `<label for>`, `aria-labelledby`,
  `aria-describedby`, `aria-controls` and `aria-activedescendant` refer to
  ids across the page; no reference has to cross a shadow root, which ARIA
  cannot do.
- **Forms work natively.** The controls inside are native (`<button>`,
  `<input type="checkbox" role="switch">`), so they submit, validate, reset
  and autofill like any control (see form association below).
- **Server rendering is plain HTML** (see SSR below).

The cost is that there is no encapsulation of the element's subtree, and one
rule follows from it: **an element never moves or replaces a node a framework
owns.** That is why there are two kinds of element.

### Two kinds of element

- **Enhancing** (Button, Switch; later text field, select, checkbox, tabs,
  surface, …): the host framework renders the whole anatomy (host element,
  native control, parts, its own children in the slots) through the
  generated wrapper. When the element upgrades it only keeps the bound
  attributes in step and adds behaviour; it creates or removes nothing. Used
  from plain HTML with just its content (`<ty-button variant="primary">Save</ty-button>`),
  it builds the anatomy itself once, moving its children into the slots, and
  patches it in place afterwards (so a focused control keeps focus).
- **Self-rendering** (the theme palette; later the command palette, data
  table, date grid): a data-driven composite that owns its whole subtree.
  Wrappers render an empty host and pass data as attributes or properties;
  the framework never has children to reconcile inside it.

### The definition is the single source

Each element has a definition (`packages/ui/src/elements/*/definition.ts`,
plain data, importable in Node): its props (type, allowed values, default,
host attribute, documentation), events, slots, its light-DOM **anatomy**
(parts, classes, attribute bindings to props, conditions on props and on
filled slots, instance-scoped ids for ARIA references) and examples.

`tools/elements/generate.mjs` writes from it:

| Output | Where |
|---|---|
| React wrapper (`TyButton`, …) | `packages/ui/src/elements/react/` → `@datatechsolutions/tympan/elements/react` |
| Reference HTML of every example | `packages/ui/test/elements/fixtures/` |

`npm run check:elements` fails when any generated file is stale. Three
renderers must produce the same markup for every example, and tests hold
them to it: the reference renderer (`renderElement`, pinned by the
fixtures), the React wrapper (`renderToStaticMarkup`) and the element built
from plain HTML (jsdom), all compared on a canonical tree (sorted
attributes, boolean attributes as presence).

### Form association

Enhancing elements keep a native control in the light DOM, so it is the
control that participates in the form: a `<ty-switch name value>` is
submitted while on, `form.reset()` restores it (the element follows the
reset), a `<ty-button type="submit" name value>` submits its form with its
value. `ElementInternals` (`static formAssociated = true`) is reserved for a
future self-rendering control that has no native control inside (a combobox
whose value is not a text input's); none of the spike needs it.

### Focus and ARIA

No shadow roots means no cross-root problem. Enhancing elements rely on the
native control's focus and keyboard behaviour and add only what the spec
asks for on top (Enter toggles the switch, a busy button is focusable but
inert, `aria-busy` and `aria-disabled`). Self-rendering elements own their
ids per instance (`data-ty-instance`, which wrappers set from `useId`) and use the ARIA pattern of the component they render: the
theme palette is a native `<dialog>` in the top layer (nothing can clip it,
the page behind is inert, Escape cancels) holding a combobox over a listbox
with `aria-activedescendant`, the same pattern as the React CommandPalette.

### SSR and hydration

Wrappers render the full anatomy on the server (React SSR); the
element upgrades without changing the DOM, so there is no hydration mismatch
and the page looks right before the element script has even loaded (the
styles key off classes and data attributes, not the element). Interaction
states before upgrade come from `native-states.css`. Self-rendering elements
render nothing on the server (the palette is closed until opened).

### Events

Native events (`click`, `change`, `input`) bubble from the native controls
and are wired by the wrappers on those controls (React `onClick` /
`onChange`), with the relevant fields read
into a typed detail (`{ checked }`). Component-level events are
`CustomEvent`s named `ty-<verb>` (`ty-theme-change`, `ty-close`), bubbling
and composed; the React wrapper listens through a ref and calls the typed
`onThemeChange(detail)`.

React 18 writes custom-element props as attributes and React 19 sets the
element's own properties when it defines them; the generated wrapper passes
`true` / `undefined` for booleans and strings for the rest, which mean the
same to both.

### i18n

Elements hold no copy. Every visible or announced string is an attribute
with an English default (`label`, `placeholder`, `group-mode`,
`results-label="{count} results"`, theme names through `theme-labels`), and
hosts pass their translations through the wrappers. Direction: the elements
use logical CSS only (the guardrails enforce it) and nothing in the spike's
keyboard maps depends on the inline axis; an element that gains one reads
the direction from `getComputedStyle(this).direction` (the React components
mirror ArrowLeft/Right the same way).

### Theming

The same custom properties theme everything. The theme palette applies a
choice as `data-ty-theme` / `data-ty-mode` / `data-ty-density` on `<html>`,
links `print-themes.css` while a print style is applied (the host names the
URL), links a theme's web fonts only when told to (`load-fonts`), and stores
the choice in the `{ theme, mode, density }` JSON ThemeProvider and
`themeInitScript` use, so two pages on the same origin
share one choice. With `apply` it applies the stored choice (or its
defaults, which a host sets to its organization's default) on connect.

### Distribution

| Consumer | What |
|---|---|
| npm, with React | `@datatechsolutions/tympan/elements/react` (wrappers; registers the elements) |
| npm, no React | `@datatechsolutions/tympan/elements` (definitions, element classes, `defineTympanElements()`) |
| anything else | `@datatechsolutions/tympan/elements.bundle.js`: one ES module, all dependencies inlined, registers on load |

## Migration of the existing React components

The React components on React Aria stay the default export of
`@datatechsolutions/tympan`; nothing changes for current consumers until a
component is switched on purpose.

1. Write the element's definition and class, mirroring the React
   component's markup (the HTML contract, `packages/ui/docs/html-contract.md`)
   and behaviour spec.
2. Generate the wrappers; they ship under `/elements/react` next to the
   React Aria component.
3. Parity and behaviour tests: the three renderers agree; axe, keyboard,
   form participation, theming and right-to-left tests pass; the React Aria
   component's own tests pass against the wrapper where the props match.
4. When a component reaches parity, the main export switches to the wrapper
   in a major version, with the React Aria props kept where they map
   (`onPress` → `onClick`, `isSelected` → `checked`) and a codemod for the
   rest.

Order: simple enhancing components first (button, link, switch, checkbox,
text field, text area, select, tag, status pill, surface, notice, spinner,
skeleton), then overlays that fit the native `<dialog>` and popover (modal
dialog, drawer, popover, toast), then the composites React Aria gives the
most for (combobox, date and time fields, virtualised tables and lists),
which move only when an element matches React Aria's accessibility and
internationalisation behaviour.

## The flow canvas

Tympan's flow canvas (`@datatechsolutions/tympan/flow`) is a React
application component with its own layout engine; a host with its own
canvas keeps its geometry. What they
share is the visual layer: the `--ty-flow-*` tokens (node surface, border and
radius, connector colours and widths including true/false branches, run
rings for running/succeeded/failed/selected, grid dots, marquee, guides) and
the tone tokens for node kinds. Another canvas styles its nodes and edges with
those tokens; the flow's component CSS (`flow.css`) stays with the React
canvas until parts of it become elements.

## Spike status

| | Button | Switch | Theme palette |
|---|---|---|---|
| Definition + element | yes | yes | yes |
| Generated React wrapper | yes | yes | yes |
| Parity (reference / React / element) | 7 examples | 5 examples | n/a (self-rendering) |
| Behaviour tests (axe, keyboard, forms, theming, RTL) | yes | yes | yes |
