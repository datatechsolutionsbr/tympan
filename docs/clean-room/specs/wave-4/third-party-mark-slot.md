# ThirdPartyMarkSlot (and ProviderMark)

Wave 4 · primitive · Status: specified

## Purpose
A single mechanism for showing the mark of a third-party product next to its name: model providers on agent nodes, agent editors and palettes; database and service dialects on data source nodes. The library **never draws, traces or embeds a logo of its own making**. Marks come from an openly licensed icon set chosen by the host (default recommendation: the Simple Icons collection, whose icon data is released under CC0), or from assets the host is licensed to use. The text name is always shown, so the mark is decoration and the component works with no marks at all.

## Anatomy
- **Mark registry**: a map from a mark key (for example a provider key or a dialect key) to a mark source: `{ kind: 'icon-set', setName, slug }` or `{ kind: 'asset', url }` or `{ kind: 'component', render }`, plus the licence note and the owner's name. Created by `createMarkRegistry(entries)` and provided through `MarkRegistryProvider`. The library ships an empty registry.
- **Icon-set adapter**: an optional adapter that turns `{ setName, slug }` into a rendered mark from a package the host installs (for example the Simple Icons package pinned by the host). The adapter renders the set's own path data unchanged; it does not recolour into brand colours by default (monochrome in `currentColor`, which suits §2.3's single accent), and it exposes the set's official brand colour only if the host opts in.
- **ThirdPartyMarkSlot**: the rendering component. Given a mark key and a name, it shows the mark (if registered) followed or preceded by the name. Without a registered mark it shows a neutral lucide glyph for the category (for example a chip icon for models, a database icon for data sources) and the name.
- **ProviderMark**: a thin wrapper for model providers. It maps a model identifier to a provider key with host-extendable matching rules, then renders ThirdPartyMarkSlot with the provider's display name.
  - Default rules (host may replace): strip a leading regional routing prefix from the identifier; match the vendor prefix before the first dot; otherwise match a known model family word; otherwise key `other`.
  - `other` renders the neutral glyph and the word for "other provider" from the I18nAdapter. It never falls back to some real provider's mark.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| markKey (slot) | string | required | Registry key. |
| name (slot) | string | required | Visible and accessible name of the product. |
| category (slot) | 'model' \| 'datasource' \| 'service' | 'service' | Picks the neutral fallback glyph. |
| showName (slot) | boolean | true | When false the name becomes visually hidden but stays the accessible name. |
| size (slot) | 'inline' \| 'bubble' | 'inline' | Inline with text, or inside a node icon bubble. |
| modelId (ProviderMark) | string | required | Model identifier. |
| rules (ProviderMark) | { match: (id) => boolean; key; name }[] | built-in | Override or extend matching. |
| createMarkRegistry | (entries) => Registry | | Validates keys are unique and each entry has a licence note. |

## States
Registered mark; fallback glyph; image failed to load (switches to fallback glyph).

## Keyboard and ARIA
- The mark is always `aria-hidden` (the name carries the meaning). Nothing is focusable.
- When `showName` is false, the accessible name remains available to the parent control.

## Responsive, touch, motion, forced colours
- Marks render monochrome in `currentColor` by default, so they follow theme and forced colours automatically. Opt-in brand colours are dropped under `forced-colors: active`.
- No animation.

## Acceptance tests
- Given an empty registry, when ProviderMark renders any identifier, then the neutral glyph and a provider name (or the "other provider" word) are shown and no external mark is requested.
- Given an identifier with a regional routing prefix, when matched, then it resolves to the same provider as the bare identifier.
- Given an unknown identifier, when matched, then the key is `other` and no real provider's mark is shown.
- Given a registered asset whose image fails, when rendered, then the fallback glyph appears.
- Given a registry entry without a licence note, when the registry is created, then it throws.
- Given the library's published files, when scanned, then no third-party mark data is included.

## Composition notes
- Used by AgentNode, AgentIdentity, AgentEditorDialog, NodePalette (model provider) and DataSourceNode (dialect).
- Licensing: the Simple Icons data is CC0, but the marks remain trademarks of their owners. Use is nominative (identifying the product the flow connects to), next to the product name, unmodified and without implying endorsement. Hosts list the icon set and its version in their third-party notices. Some brands are absent from that set at their owners' request; for those the fallback glyph is the answer, never a redrawn mark.
