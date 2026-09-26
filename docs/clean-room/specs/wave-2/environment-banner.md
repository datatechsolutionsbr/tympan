Wave 2 · Feedback · Status: specified

# EnvironmentBanner

## Purpose
A strip at the top of the app, shown only in local or test environments, stating the environment and debugging facts (app name, port, API base, simulated user and role).

## Anatomy
- **Environment word**: e.g. "Development", in a Tag.
- **Message**.
- **Facts**: app name, port, API base, user e-mail and role, each as label and value.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| environment | string or null | read from host config | Banner renders only when this indicates a non-production environment. |
| forceShow | boolean | false | For stories and visual tests. |
| user | { email?: string, role?: string } | none | Simulated user facts. |
| facts | { appName?, port?, apiBase? } | detected by host | Host passes them; the component does not read environment variables itself. |
| texts | { label, message } | from i18n | Copy. |

## States
Hidden in production; shown otherwise.

## Keyboard and ARIA
- Region landmark labelled "Environment" placed before the main content; not a live region.
- No interactive controls in the base spec; a host may place GlassCheckToggle (`wave-4/glass-check-toggle.md`) inside the banner.
- No APG pattern.

## Responsive, touch, motion, forced colours
- Wraps onto several lines on narrow screens; never overlaps the top bar (it pushes content down).
- No animation.
- Uses the pending semantic tone (§2.3) plus the word; forced colours keep a border.

## Acceptance tests
- Given a production environment and no `forceShow`, then nothing renders.
- Given `forceShow`, then the banner renders with the environment word.
- Given user facts, then e-mail and role appear as text.
- Given an unavailable host config, then the component renders nothing and does not throw.
