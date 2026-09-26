Wave 2 · Data display · Status: specified

# ProfileSummary

## Purpose
A compact identity block for the signed-in person (account menu, settings header): picture or initials, name, optional e-mail and role.

## Anatomy
- **Avatar**: the wave-1 Avatar, image when available, otherwise initials (§2.11: people are circles with initials).
- **Name**: Sans 600.
- **E-mail**: `meta` text, optional.
- **Role**: small Tag above or beside the name, optional.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| name | string | required | Display name. |
| initials | string | derived from name | Fallback text inside the avatar. |
| pictureUrl | string | none | Image for the avatar. |
| email | string | none | Shown only when `showEmail` is true. |
| showEmail | boolean | false | Privacy switch (e.g. on shared screens). |
| role | string | none | Role label. |

## States
With picture; picture failed to load (falls back to initials without layout shift); without e-mail; without role.

## Keyboard and ARIA
- Not interactive. The avatar image has empty alternative text because the name is adjacent; initials are hidden from assistive technology for the same reason.
- No APG pattern; no RAC primitive needed.

## Responsive, touch, motion, forced colours
- Name and e-mail truncate with the full value available as a title.
- No motion.
- Forced colours: avatar keeps a visible border.

## Acceptance tests
- Given `pictureUrl` that fails, when rendered, then the initials are shown.
- Given `showEmail=false` and an e-mail, then the e-mail is not in the document.
- Given a name, then a screen reader reads the name once (not twice via avatar and text).
- Given `role`, then the role text is present as text, not only colour.
