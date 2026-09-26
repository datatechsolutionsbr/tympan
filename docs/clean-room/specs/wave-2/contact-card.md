Wave 2 · Data display · Status: specified

# ContactCard

## Purpose
Blocks for a public contact page: a card per contact channel (e-mail and phone for a purpose such as press or partnerships), a card per office address, and a section wrapper with title and subtitle.

## Anatomy
- **Channel card**: purpose heading, description list with e-mail (mail link) and phone (tel link).
- **Office card**: city heading and a postal address block.
- **Contact section**: heading (h2), subtitle, and a responsive grid of cards.

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| Channel: purposeLabel | string | required | Heading text (the host translates it). |
| Channel: email | string | required | Rendered as a mail link. |
| Channel: phone | string | none | Rendered as a tel link. |
| Office: city | string | required | Heading. |
| Office: addressLines | string[] | required | Lines of the address. |
| Section: title, subtitle | string | required | Section heading and lead. |
| Section: children | ReactNode | required | Cards. |

## States
Static. Links have hover and focus-visible states per §2.3 and §2.6.

## Keyboard and ARIA
- Channel data uses a description list (term: "E-mail", "Phone" from i18n).
- Office uses the address element.
- Heading levels are configurable so the section fits the page outline.
- No APG pattern; links are native (RAC `Link` if routing is involved).

## Responsive, touch, motion, forced colours
- Grid of one column below 640 px, two to three above.
- Links have 44 px tall targets on touch.
- Forced colours: card border visible; links underlined.

## Acceptance tests
- Given an e-mail, then a link with a mail scheme and the address as its name exists.
- Given a phone, then a tel link exists.
- Given an office, then the address is inside an address element.
- Given a section title, then it is exposed as a heading at the configured level.

## Open questions
- The fork hard-codes four purposes; the new component takes a free label instead.
