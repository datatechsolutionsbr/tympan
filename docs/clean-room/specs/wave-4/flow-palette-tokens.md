# FlowPaletteTokens

Wave 4 · utility (token API) · Status: specified

## Purpose
All colour decisions of the workflow canvas expressed as tokens, replacing the fork's per-kind maps of utility class strings and literal colours (icon-bubble gradients per node kind, badge colours, minimap colours, port colours, run accents, connector colours, category and adjustment pills). NodeKindCatalog (wave 3) already says the catalog carries tone names, never colours; this spec defines what the tones resolve to and which parts use them.

## Anatomy
- **Kind tone**: every node kind has one tone name from the categorical set `categorical-1` to `categorical-8` of §2.3, or `neutral`. The tone comes from the backend node catalog entry (field `tone`); the library ships a default assignment used when the catalog has none:
  - start and end kinds share one tone (they are told apart by icon and label, not colour);
  - branching kinds (if/else, rule) one tone;
  - compute kinds (code, iteration and its start) one tone;
  - agent and answer kinds one tone;
  - report output kind one tone;
  - data source kind one tone;
  - note and group kinds `neutral`.
  Unknown kinds use `neutral`.
- **Per-part tokens** derived from the kind tone (defined once in the token stylesheet for both themes):
  - icon bubble: a flat fill of the tone at the categorical token strength with `--fk-accent-ink`-style icon ink chosen for contrast. **No gradients** (§2.3 reserves the gradient for the primary button).
  - kind badge: text in the tone, background in a soft tint of the tone (ToneTint `soft`), plus the kind's label (never colour alone).
  - minimap node: the tone at full strength.
  - port: the tone at full strength with a 1 px ring in the surface colour so the port stays visible on any background.
  - run accent (while a node runs): uses the semantic pending colour, not the kind tone (§2.3: state colours are semantic).
- **Connector tokens**: `--fk-connector` (rest, `--fk-line-strong`), `--fk-connector-active` (`--fk-accent`, the path currently executing or selected), `--fk-connector-true` (success semantic colour), `--fk-connector-false` (error semantic colour), `--fk-connector-rule` (a categorical tone). Every conditional connector also carries its label word and a distinct line style (solid for true, dashed for false), so colour is never the only carrier.
- **Pills for flow-level categories** (for example data origin categories in palettes): tone names from the catalog, rendered with ToneTint.
- **Resolver**: `kindTone(kind)` → ToneName; `kindTokens(kind)` → references to the bubble, badge, minimap and port tokens. Components only ever receive token references.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| kindTone | (kind: string) => ToneName | catalog, then default assignment, then neutral | Tone for a kind. |
| kindTokens | (kind: string) => { bubble; badge; minimap; port } | | Token references. |
| connectorTokens | { rest; active; true; false; rule } | | Token references. |
| overrideKindTones | (map: Record<string, ToneName>) => void | | Host override (validated against tone names). |

## States
Light and dark theme; forced colours; reduced transparency (no change: none of these tokens use transparency except the badge tint, which follows ToneTint).

## Keyboard and ARIA
Not applicable. Kind labels and connector condition words are required by GraphNodeCard and ConditionalConnector.

## Responsive, touch, motion, forced colours
- `forced-colors: active`: bubbles, badges and ports draw `CanvasText` borders with no fill; connectors use `CanvasText` with their line styles.
- Minimap colours are dropped in forced colours; nodes show as outlines.

## Acceptance tests
- Given the token stylesheet, then no canvas token contains a gradient.
- Given a kind absent from the catalog and the defaults, then its tone is neutral.
- Given a false-branch connector, then it is dashed and labelled, in addition to its colour.
- Given a host override assigning an unknown tone, then it throws a descriptive error.
- Given a running node, then its run accent uses the pending semantic token regardless of kind tone.
- Given every pair of categorical tone and surface in both themes, then non-text contrast is at least 3:1 (static check).
