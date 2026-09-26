# ShowcaseBackdrop and AccentBand

Wave 4 · layout · Status: specified

## Purpose
Two decorative colour fields for public showcase sections, derived from design direction §2.5 (Ambient) and §2.3 (single accent):

- **ShowcaseBackdrop**: soft glows behind one section (not the whole viewport), so a glass sheet placed on top reads as glass. It is the section-scoped sibling of AmbientBackdrop (wave 2).
- **AccentBand**: a thin horizontal band of the brand accent used to mark the top of a showcase section or a hero sheet.

Neither carries meaning. The CTA gradient (`--fk-cta`) stays reserved for the primary button (§2.3); these parts never reuse it.

## Anatomy
- ShowcaseBackdrop: a clipping container filling its positioned parent, with two glows placed in opposite corners (upper end and lower start by default). Hues are the two Ambient hues of §2.5 (teal and sky); intensity uses the Ambient opacity tokens for the current theme.
- AccentBand: a single strip using `--fk-accent` fading to `--fk-accent-soft` along its length.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| placement (backdrop) | 'corners' \| 'top' \| 'bottom' | 'corners' | Where the glows sit. |
| intensity (backdrop) | 'calm' \| 'faint' | 'calm' | 'calm' uses the Ambient tokens; 'faint' halves their effect for dense sections. |
| edge (band) | 'top' \| 'bottom' | 'top' | Which edge of the parent the band sticks to. |
| className / style passthrough | | | Layout only. |

No colour property: hues come from tokens so the single-accent rule of §2.3 cannot be broken per instance.

## States
Static. Theme changes (light and dark) swap the token values; nothing else changes.

## Keyboard and ARIA
- Both parts are `aria-hidden` and not focusable; they never intercept pointer events.

## Responsive, touch, motion, forced colours
- Glows scale with the section and never cause horizontal scroll (clipped by the container).
- No animation of any kind (§2.5: fixed, no motion).
- `prefers-reduced-transparency: reduce` and missing backdrop-filter support: ShowcaseBackdrop renders nothing; AccentBand becomes a solid accent strip.
- `forced-colors: active`: both render nothing (no gradients in forced colours, §2.5).
- Never placed behind body text in a way that lowers contrast below AA; the glass sheet on top carries the text.

## Acceptance tests
- Given a ShowcaseBackdrop, when inspected with an accessibility tree, then it is absent from it.
- Given a section of any width, when the backdrop is present, then the document has no horizontal overflow.
- Given reduced transparency, when rendered, then the backdrop produces no visible glow.
- Given forced colours, when rendered, then neither part is visible.
- Given a pointer click over a glow, when a button sits beneath, then the button receives the click.

## Open questions
- None. If a host wants more hues, that is a change to the design direction, not a property.
