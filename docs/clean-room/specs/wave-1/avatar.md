# Avatar

Wave 1 · data display · Status: specified

## Purpose
Represents a person or an agent with a picture or fallback initials, optionally as a pressable control.

## Anatomy
- **Frame** (circle or rounded square).
- **Image** (optional).
- **Fallback text** (initials) or **fallback icon** when no image and no text.
- **Pressable wrapper** (optional).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| src | string \| null | null | Image URL; on load error the fallback shows. |
| fallbackText | string | none | One or two characters shown when there is no image (derived by the host from a name). |
| name | string | none | Accessible name; required unless `decorative`. |
| decorative | boolean | false | Hides the avatar from assistive tech when the name is already shown next to it. |
| actorKind | 'person' \| 'agent' | 'person' | Person: circle with initials. Agent: rounded square with a bot icon and dashed border, never initials (§2.11). |
| size | 'xsmall' \| 'small' \| 'regular' \| 'large' | 'regular' | Size step. |
| tint | 'accent' \| 'neutral' | 'accent' | Fallback background: accent-soft or neutral (§2.3). |
| onPress / href | handler / string | none | Makes it a button or link. |

## States
Image loaded, image failed (fallback), no image (fallback), pressable: hover, pressed, focus-visible (§2.6).

## Keyboard and ARIA
- Static: an image role with `name` as the accessible name, or hidden when `decorative`.
- Pressable: APG **Button** or **Link**; RAC `Button` / `Link`; accessible name is the action, e.g. "Open profile of {name}" from I18n.
- Initials are never read as letters when a name exists.

## Responsive, touch, motion, forced colours
- Pressable avatars have a 44 × 44 px hit area at every size.
- No hover lift or glow; hover changes fill only (§2.7).
- Reduced transparency: opaque fallback background.
- Forced colours: frame border in `CanvasText`; initials in `CanvasText`.

## Acceptance tests
- Given `src` and `name`, when rendered, then an image with alternative text equal to the name is present.
- Given `src` fails to load, then the fallback text is shown.
- Given `fallbackText="NM"` and `name="Natália Mesquita"`, when read by a screen reader, then "Natália Mesquita" is announced, not "N M".
- Given `actorKind="agent"`, when rendered, then the frame is a rounded square with a bot icon and no initials.
- Given `decorative`, then the avatar is hidden from the accessibility tree.
- Given `onPress`, when activated with Enter, then it fires.
- Given `size="xsmall"` and `onPress`, when measured, then the hit area is at least 44 × 44 px.

## Open questions
- The fork offered a dozen tint hues; only accent and neutral are specified to respect the single accent of §2.3.
