# CountryProfileData (country records for Formatters and RegionMap)

Wave 4 · utility (data) · Status: specified

## Purpose
Defines the country-level record that Formatters (wave 2: `getCountry`, `registerCountry`, `listCountries`, money and address formatting) and RegionMap (wave 2: map geometry and projection) read, and lists the modules to build. It completes RegionThemeData, which covers subdivisions. As with every data module in wave 4, values are regenerated from public, citable sources; nothing is taken from the fork.

## Anatomy (data format)
A `CountryProfile`:

| Field | Type | Rule | Source |
|---|---|---|---|
| code | string | ISO 3166-1 alpha-2 | ISO 3166 |
| names | { en: string; local: string } | English short name and the name in the main official language | ISO 3166, Unicode CLDR |
| flagEmoji | computed | derived from the two regional indicator letters of `code`, not stored | Unicode |
| languages | { tag: BCP 47; name: string; official: boolean }[] | official and main languages | CLDR territory data |
| locale | { default: BCP 47 tag; dateStyle?: string } | default locale for formatting | CLDR |
| currency | { code: ISO 4217 } | symbol, position, separators and precision are **not stored**: Formatters derives them from the locale through the platform's internationalisation API, so they stay current | ISO 4217, CLDR |
| address | { template: ordered field keys with line breaks; required: field keys; postalCodePattern?: string } | order and required fields of a postal address | the national postal operator's addressing standard, or the Universal Postal Union's published address formats |
| tax | { consumptionTaxName?: string; businessIdName?: string; personalIdName?: string } | names only, for labels (no rates) | national tax authority |
| map | { geometryKey: string; subdivisionProperty: string; projection: 'mercator' \| 'equal-area-composite' } | the key of the host-provided boundary file and the property holding subdivision codes; composite projection for countries with distant territories | host geometry built from public-domain boundaries (for example Natural Earth) |
| regionTheme | reference to the country's RegionThemeData entry, optional | | |
| sources, version | as in RegionThemeData | | |

The library ships no geometry files; the host serves them under `geometryKey`.

## Country modules to build (30)
The same thirty as RegionThemeData: AR, AU, BR, CA, CL, CO, EG, FR, DE, IN, ID, IT, JP, MX, NL, NZ, NG, NO, PE, PH, PL, PT, ZA, KR, ES, SE, TH, TR, GB, US. Further countries use the same format.

## Properties and events
Each module exports its profile and a `register()` that calls Formatters' `registerCountry`. No module registers on import. Registration validates the record and throws with the field name on error.

## States
Not applicable (static data).

## Keyboard and ARIA
Not applicable. Names are used as accessible labels, so they must be complete and correctly accented. The emoji flag is decorative wherever it is shown.

## Responsive, touch, motion, forced colours
Not applicable.

## Acceptance tests
- Given each module, when validated, then every required field is present and codes are valid ISO values.
- Given Brazil registered, when a money value is formatted for BR, then the result matches the platform's formatting for the default locale and currency (no stored symbol used).
- Given Brazil registered, when an address is formatted, then fields follow the module's template and empty fields leave no doubled separators.
- Given each module, then every field group has a citation in `sources`.
- Given a host importing only one country, then no other country's data is bundled.
