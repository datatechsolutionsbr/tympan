# Provenance

> **Rename note (2026-09-26).** The repository is now Tympan, an
> Astrlabe-family component published by Datatech; this package is
> `@datatechsolutions/tympan-tokens` (formerly `@fakhir/tokens`) and its
> custom properties use the `--ty-` prefix. This section was moved here from
> the package README on that date, unchanged.

## Ideas taken from public documentation (concepts only)

The user asked for a theme system inspired by shadcn/ui and Tailwind CSS (the
CSS framework). Only concepts from their public documentation
pages were used; no source file, class string, CSS file or palette value was
read or copied, and neither project is a dependency.

| Concept | Where it came from | How it appears here |
|---|---|---|
| Semantic roles in background/foreground pairs (background, card, popover, primary, secondary, muted, accent, destructive, border, input, ring, chart, sidebar) | shadcn/ui theming docs | `X` / `on-X` roles under our own names (`surface`, `surface-raised`, `brand`, `secondary`, `surface-sunken`, `danger`, `line`, `input`, `focus-ring`, `chart-1..8`, `nav-*`) |
| One radius base deriving the radius scale | shadcn/ui theming docs | `--ty-radius` with our own multipliers giving the §2.4 steps |
| Themes and dark mode as a swap of custom properties under a selector | shadcn/ui theming docs | attribute selectors `data-ty-theme` / `data-ty-mode` |
| 11-step colour scales named 50…950, defined in OKLCH | Tailwind CSS colours docs | `generateRamp()` with our own lightness and chroma curves; no Tailwind values |
| Theme variable namespaces (spacing from one base unit, breakpoints, container widths, text sizes paired with line heights, shadows, easings) | Tailwind CSS theme docs | our DTCG groups (`space`, `layout`, `font.size` + `font.line-height`, `shadow`, `ease`) with values from the design direction |

URLs consulted on 2026-09-26:

- https://ui.shadcn.com/docs/theming
- https://tailwindcss.com/docs/colors
- https://tailwindcss.com/docs/theme
