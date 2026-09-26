# RegionThemeRegistry

Wave 4 · utility · Status: specified

## Purpose
A registry that holds optional identity data for the first-level subdivisions of countries (states, provinces, regions and so on) and answers queries about it: name, identity colours, label point on the map, statistical macro-region, and a flag image address. RegionMap (wave 2), region lists and filters use it when a host wants subdivisions shown with their own identity instead of data colours. The registry holds no country data itself; data modules (see RegionThemeData) register at start-up.

## Anatomy
- **Registry**: map from country code (ISO 3166-1 alpha-2, upper case) to a country entry in the RegionThemeData format.
- **Registration**: `registerRegionTheme(entry)` validates the entry against the data format and stores it; registering the same country again replaces it. `unregisterRegionTheme(country)` removes it. A `createRegionThemeRegistry()` factory returns an isolated registry for tests and for hosts that do not want a global one; the default export functions use a module-level default registry.
- **Queries** (all case-insensitive on input, all returning nothing when unknown):
  - `getSubdivision(country, code)`: the subdivision record (code, local name, English name, kind).
  - `listSubdivisions(country)`: records in the data order.
  - `isKnownSubdivision(country, code)`.
  - `getIdentityColours(country, code)`: `{ primary, secondary, onPrimary: 'light' | 'dark' }`. `onPrimary` is computed by the registry from contrast (the text colour that reaches 4.5:1 on primary), not stored in data.
  - `getIdentityTone(country, code)`: the nearest ToneName among the categorical tones, for places that must stay inside the token palette (legends, chips).
  - `getLabelPoint(country, code)` and `getCountryView(country)`: longitude and latitude of the label point and of the default map centre.
  - `getMacroRegions(country)`: groups with id, label key and member codes.
  - `getFlagUrl(country, code)`: resolved from the entry's flag URL template, or nothing.
- **Identity mode rule**: identity colours are used only by map fills, legends and region chips in an explicit "identity" display mode (§2.3 restricts categorical colour to maps, charts, legends and graph nodes). In tables and records a subdivision appears as text.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| registerRegionTheme | (entry: RegionThemeEntry) => void | | Validate and store. |
| unregisterRegionTheme | (country: string) => void | | Remove. |
| createRegionThemeRegistry | () => Registry | | Isolated registry with the same query methods. |
| query functions | see Anatomy | | Pure reads. |
| RegionThemeProvider | { registry; children } | default registry | Lets components receive an isolated registry. |

Validation errors name the country, the field and the offending subdivision code.

## States
Empty; country registered; country replaced; invalid entry rejected (nothing stored).

## Keyboard and ARIA
Not applicable for the registry itself. Consumers must use the subdivision name (localised through the I18nAdapter, falling back to the local name) as the accessible label, never the code alone; flags are decorative next to the name.

## Responsive, touch, motion, forced colours
Not applicable. Consumers in forced colours ignore identity colours and use system colours with the name.

## Acceptance tests
- Given the Brazil module registered, when `getSubdivision('br', 'sp')` is called, then the São Paulo record is returned.
- Given an unregistered country, when any query runs, then it returns nothing and does not throw.
- Given an entry with a colour that is not a six-digit hex value, when registered, then registration throws naming the field and code.
- Given identity colours with a dark primary, when `getIdentityColours` runs, then `onPrimary` is light and the pair reaches 4.5:1.
- Given two isolated registries, when a country is registered in one, then the other does not see it.
- Given a flag URL template, when `getFlagUrl` runs for an unknown code, then nothing is returned.
