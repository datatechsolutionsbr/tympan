# ReportView

Wave 2 · chart · Status: specified

## Purpose
Read-only renderer for a structured report produced by an analysis or agent run: KPIs, charts, a table, a recommendation and an ordered list of typed sections.

## Anatomy (top to bottom)
- **Header**: title (`h2`, §2.2) and subtitle.
- **KPI row**: MetricTiles (value, unit, delta, tone).
- **Charts**: Chart figures, two per row on wide screens when `layout` is grid, one per row when stacked.
- **Table**: optional titled DataTable with typed columns (text, number, currency, percent; alignment per column).
- **Recommendation**: a highlighted InlineNotice-style block with the agent's advice.
- **Sections**: typed blocks in the given order (see kinds).
- **Footer**: metadata key/value pairs in `meta` type (generated at, source).

## Section kinds (concepts)
| Kind | Content |
|---|---|
| entity | summarised record: title, subtitle, key/value fields, optional StatusPill |
| narrative | free prose, optional agent identity (ActorChip) and duration |
| lifecycle | ordered steps with complete/current/upcoming, rendered as StepList |
| receipt | line items (description, quantity, unit price, total), subtotal, tax, total, currency |
| approval | decision (approved/rejected/pending), who, when, reason, original prompt |
| document | issued document metadata (identifier, access key, number, series, environment, link) |
| feed | timestamped entries with optional tone |
| score | label, 0 to 100 score with a meter, qualitative bucket, reasoning |
| note | toned callout (default, info, success, warning, danger) |
| markdown | prose rendered by MarkdownView |
| regionMap | items anchored to subdivision codes, rendered by RegionMap |
| inputRequest | a pending request for structured input; read-only summary here, interactive only via a host render function (see SchemaRequestForm) |
| unknown | any unrecognised kind renders as a neutral note with the raw payload in mono, never crashes |

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| report | Report object (title required; kpis, charts, table, recommendation, sections, layout, meta optional) | required | Content. |
| renderInputRequest | `(data) => node` | undefined | Replaces the read-only input-request summary. |
| locale / currency | string | from I18nAdapter | Number and currency formatting (never hard-coded). |

## Validation (pure function `validateReport`)
Returns a list of issues, empty when valid:
- `empty`: no KPIs, charts, non-empty table, non-blank recommendation or sections.
- `chartSeriesMissing` (with chart index): a chart whose series is absent, not a list, or empty.
- `tableColumnMissing` (with column key): a row key not declared in columns, reported once per key.
The validator must tolerate arbitrary JSON (pasted by hand) without throwing.

## States
- Complete; partial (sections appended over time by LiveReportView without re-announcing earlier ones); empty (EmptyState).

## Keyboard and ARIA
- A `region` labelled by the report title. Each section with a title is a heading one level below.
- Empty table cells show a dash with visually hidden "no value".
- No APG pattern for the container; children follow their own specs. No RAC primitive; custom.

## Responsive, touch, motion, forced colours
- KPI row reflows from four to two to one columns; charts to one column under 1024 px.
- Sections appear without staggered entrance motion (§2.7).
- Forced colours: section boundaries by border.

## Acceptance tests
- Given a report with only a title, when validated, then one `empty` issue is returned.
- Given a chart with a non-list series, when validated, then `chartSeriesMissing` with its index is returned and nothing throws.
- Given rows with an undeclared key used twice, when validated, then one `tableColumnMissing` issue is returned.
- Given a section of unknown kind, when rendered, then a neutral note appears.
- Given an inputRequest section without `renderInputRequest`, when rendered, then its prompt and field labels appear read-only.
- Given locale pt-BR and a currency column, when rendered, then values use pt-BR currency formatting.

## Open questions
- The fork formats currency and numbers with a fixed English locale and has hard-coded Portuguese strings; this spec requires i18n.
