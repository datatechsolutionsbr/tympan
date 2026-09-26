# Chart

Wave 2 · chart · Status: specified

## Purpose
Renders a declarative chart description (produced by analyses and agents) as an accessible figure, with a table alternative and keyboard access to every data point.

## Anatomy
- **Figure**: wrapper with a caption (title, optional subtitle, finding sentence under the title per design direction §5).
- **Plot area**: value axis with a small number of evenly spaced ticks and gridlines, category axis with thinned labels when crowded, marks, optional annotations (vertical reference line with a short label at a category).
- **Legend**: one entry per series with swatch and name; dashed series show a dashed swatch.
- **View switch**: toggle between "chart" and "table" (the table is the same data as a DataTable).
- **Point readout**: tooltip-like box showing category, series and value for the focused or hovered point.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| spec.type | `'line' \| 'bar' \| 'area' \| 'histogram'` | required | Chart kind. |
| spec.title / subtitle / finding | string | title required | Caption texts. |
| spec.xAxis | `{ key: string; label?: string }` | required | Category field. |
| spec.yAxis | `{ label?: string; unit?: string; domain?: [number, number] }` | required | Value axis; unit suffixes tick labels. |
| spec.series | `{ name: string; colorToken?: string; dashed?: boolean }[]` | required | Series in order; colours default to the categorical tokens (§2.3). |
| spec.data | `{ x: string \| number; [series: string]: string \| number }[]` | required | Rows; non-numeric values count as missing. |
| spec.annotations | `{ x: string \| number; label: string }[]` | undefined | Reference markers. |
| view / defaultView | `'chart' \| 'table'` | `'chart'` | Current view. |
| aspect | number | responsive | Width-to-height ratio; the chart fills its container width. |

## Chart kinds
- **line**: one polyline per series with a point marker at every datum; dashed series for estimates or projections.
- **area**: like line with a translucent fill down to the axis.
- **bar**: grouped bars per category, one per series, with gaps between groups.
- **histogram**: pre-binned categories; bins touch without gaps; multiple series overlap semi-transparently.
- Domain: explicit `domain` wins; otherwise min to max of all values with a margin; a flat series gets a symmetric margin; no data gives a unit domain.

## States
- Empty data: EmptyState inside the figure ("no data"). Missing values: gap in line, no bar.
- Hover or focus on a point: readout shown, point emphasised.

## Keyboard and ARIA
- Figure element with the caption as its accessible name; the plot is `role="img"` only when not interactive; when interactive it is an APG Grid-like composite: one tab stop, arrow Left/Right move between categories, Up/Down between series, Home/End to first/last category, Esc hides the readout.
- The readout is announced via a polite live region.
- The view switch is a SegmentedControl (RAC `ToggleButtonGroup`).
- Table view is always complete; it is the canonical text alternative (WCAG 1.1.1).

## Responsive, touch, motion, forced colours
- Series distinguishable without colour: distinct dash patterns or marker shapes, direct labels when there are few series.
- Tapping a point on touch shows the readout; the hit area per point is at least 44 px wide or snaps to the nearest category.
- No drawing animation. Forced colours: marks use system colours with patterns; gridlines visible.

## Acceptance tests
- Given a line spec with two series, when rendered, then a figure named by the title has two legend entries and one mark per datum per series.
- Given a histogram, when rendered, then bins have no gaps.
- Given focus on the plot, when Right is pressed twice, then the readout announces the third category.
- Given table view, when switched, then a table with one column per series and one row per datum appears.
- Given no data, when rendered, then an empty message appears and no axes are drawn.
- Given a string value "n/a", when rendered, then that point is treated as missing.
- Given an annotation at an existing category, when rendered, then a labelled marker appears there; at an unknown category, nothing appears.

## Open questions
- The fork offers neither keyboard access to points nor a table view; both are new requirements.
- The fork substitutes zero for non-numeric values; this spec treats them as missing.

## Renamed in implementation

The library (a new package with no consumers yet) gives the input description
its own vocabulary. Behaviour is unchanged.

| Spec name | Implementation name |
|---|---|
| chart description (`ChartSpec`) | `ChartFigure` |
| `type`: line, area, bar, histogram | `form`: `trend`, `band`, `columns`, `bins` |
| `title`, `subtitle`, `finding` | `heading`, `aside`, `reading` |
| `xAxis { key, label }` | `across { field, caption }` |
| `yAxis { label, unit, domain }` | `up { caption, unit, bounds }` (optional) |
| `series [{ name, colorToken, dashed }]` | `layers [{ field, tone, projected }]` |
| `data` rows (category also readable as `x`) | `records` (category read only from `across.field`) |
| `annotations [{ x, label }]` | `notes [{ at, text }]` |
| Chart props `spec`, `view`/`defaultView`/`onViewChange` (`chart` \| `table`) | `figure`, `face`/`defaultFace`/`onFaceChange` (`drawing` \| `table`) |
| types `ChartKind`, `ChartSeries`, `ChartRow`, `ChartView` | `ChartForm`, `ChartLayer`, `ChartRecord`, `ChartFace` (plus `ChartNote`) |
