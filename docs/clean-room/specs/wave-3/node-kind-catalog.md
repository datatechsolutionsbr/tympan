# NodeKindCatalog

Wave 3 · utility · Status: specified

## Purpose
The single place that tells canvas components how to present each node kind: label, category, icon, tone, ports and default configuration, loaded from the backend's node catalog and overridable by a host.

## Contract
- **Catalog store**: install the list of node kind entries fetched from the backend (kind, category, icon key, tone, port topology, default configuration, configuration schema, experimental flag, deprecated flag). Installing replaces the previous list. Queries: is loaded, get entry, kind exists, list kinds in catalog order, kinds grouped by category, field enum options for a kind and field, default configuration, is experimental, is deprecated. Everything returns empty or false while not loaded.
- **Default configuration factory**: returns a deep copy of a kind's default configuration with every empty identifier filled with a new unique id; returns nothing for kinds configured by a picker (agent, rule, data source) or when not loaded.
- **Render catalog context**: an object with resolvers used by nodes: entry (label, category), icon key, tone, port topology, optional per-instance identity (icon, title, description) that wins over per-kind data, badge tone, run accent. A provider lets a host replace any resolver; without one, the store above is used.
- **Floating connections flag**: when on, connectors attach to the nearest border point and ports become invisible but keep their ids.
- **Icon registry**: maps an icon key to an icon from the product icon set (lucide, §4.4); unknown keys map to a neutral generic icon.
- **Port topology**: inputs and outputs, each with id, side (start, end, top, bottom), optional offset along the side as a percentage, optional label and tone.
- Tones come from the categorical tokens of §2.3; the catalog never carries raw colour values.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| installCatalog | (entries) => void | n/a | loads the backend catalog |
| provider value | RenderCatalog | built-in | host overrides |
| resolveIdentity | (kind, data) => Identity or null | none | per-instance icon and title |
| floatingConnections | boolean | false | border-attached connectors |

## States
Not loaded (fallback icon and neutral tone per kind); loaded; overridden by host.

## Keyboard and ARIA
not applicable. Labels from the catalog feed accessible names of nodes and palette items; raw kind keys are never shown to people (§2.13).

## Responsive, touch, motion, forced colours
not applicable

## Acceptance tests
- Given no catalog, when an entry is requested, then nothing is returned and "exists" is false.
- Given an installed catalog, when kinds are grouped, then order follows the catalog.
- Given a default configuration with two empty ids, when the factory runs twice, then each result has distinct new ids and the stored default is unchanged.
- Given a host provider overriding the icon resolver, when a generic node renders, then it uses the host icon.
- Given resolveIdentity returns a title for one node, when rendered, then that node shows it while others of the same kind keep the catalog label.
- Given an unknown icon key, when resolved, then the neutral icon is used.
