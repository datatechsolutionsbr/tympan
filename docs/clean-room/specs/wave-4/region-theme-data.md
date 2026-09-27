# RegionThemeData (data format and country modules)

Wave 4 · utility (data) · Status: specified

## Purpose
Defines the format of one country's subdivision identity data and lists the country modules to build. Every value must be regenerated from public, citable sources; nothing is taken from the fork. Each module is a plain data file plus one registration call, loaded only by hosts that need it (tree-shakeable, one module per country).

## Anatomy (data format)
A `RegionThemeEntry`:

| Field | Type | Rule | Source |
|---|---|---|---|
| country | string | ISO 3166-1 alpha-2, upper case | ISO 3166 |
| subdivisionKind | string key | one of: state, province, region, department, governorate, prefecture, county, voivodeship, district, nation; labelled through i18n | ISO 3166-2 category names |
| subdivisions | list | every first-level subdivision of the chosen level, in ISO 3166-2 order | ISO 3166-2, national statistics office |
| subdivisions[].code | string | the part after the hyphen of the ISO 3166-2 code, upper case (for the United Kingdom, the four nations use the codes the module documents) | ISO 3166-2 |
| subdivisions[].name | { local: string; en?: string } | official name in the local language and script | national statistics office or gazette |
| subdivisions[].identity | { primary: hex; secondary: hex } or absent | two colours taken from the subdivision's official flag or coat of arms specification; absent when the subdivision has no official flag | the law or decree that defines the flag, or its official description; secondary sources only when the primary is unavailable and cited |
| subdivisions[].labelPoint | [longitude, latitude] | a point inside the polygon suitable for a label (pole of inaccessibility or official centroid) | computed from public-domain boundary data (for example Natural Earth) |
| view | { centre: [longitude, latitude]; zoomHint?: number } | default map view of the country | computed from the same boundary data |
| macroRegions | { id; labelKey; codes[] }[] | official statistical groupings only (for example the national statistics office's regions, or the first NUTS level in the European Union); omitted when none exist | national statistics office, Eurostat |
| flagUrlTemplate | string with `{code}` placeholder, or absent | points to assets the host serves; the library ships no flag images | host |
| sources | { field; citation; url; retrievedOn }[] | at least one citation per field group | |
| version | date string | date the data was last regenerated | |

Colours in data are identity facts, not UI tokens: they never become interactive or state colours, and the registry derives text colour by contrast (see RegionThemeRegistry).

## Country modules to build (30)
Level of subdivision in brackets.

Argentina AR (provinces and the autonomous city) · Australia AU (states and territories) · Brazil BR (states and the federal district) · Canada CA (provinces and territories) · Chile CL (regions) · Colombia CO (departments and the capital district) · Egypt EG (governorates) · France FR (regions) · Germany DE (states) · India IN (states and union territories) · Indonesia ID (provinces) · Italy IT (regions) · Japan JP (prefectures) · Mexico MX (states and the capital) · Netherlands NL (provinces) · New Zealand NZ (regions) · Nigeria NG (states and the capital territory) · Norway NO (counties) · Peru PE (departments) · Philippines PH (provinces) · Poland PL (voivodeships) · Portugal PT (districts and autonomous regions) · South Africa ZA (provinces) · South Korea KR (provinces and metropolitan cities) · Spain ES (provinces) · Sweden SE (counties) · Thailand TH (provinces) · Turkey TR (provinces) · United Kingdom GB (nations) · United States US (states and the district).

Further countries (for example those a host application needs for its own data) are added with the same format; no code change is needed.

Country-level records (names, languages, locale, currency, address, map geometry) are in CountryProfileData (`country-profile-data.md`).

## Properties and events
Each module exports its entry and a `register()` function that calls `registerRegionTheme` with it. Modules never register themselves on import.

## States
Not applicable (static data).

## Keyboard and ARIA
Not applicable. Names in `name.local` must be complete and correctly accented, since they are used as accessible labels.

## Responsive, touch, motion, forced colours
Not applicable.

## Acceptance tests
- Given each module, when validated against the format, then it passes with no missing required field.
- Given each module, when its subdivision codes are compared with the current ISO 3166-2 list for the chosen level, then the sets are equal (test fixture regenerated from the public list).
- Given each module, when every label point is tested against its boundary polygon, then it lies inside.
- Given each module, then every identity colour has a citation in `sources`.
- Given a subdivision without an official flag, then `identity` is absent and consumers fall back to data colours.
- Given the package build, when a host imports only Brazil, then no other country's data is in the bundle.

## Open questions
- Whether identity colours are wanted at all in Fakhir screens. The design direction restricts colour on maps to data tokens; identity mode stays opt-in and off in the Fakhir app until the author asks for it.
