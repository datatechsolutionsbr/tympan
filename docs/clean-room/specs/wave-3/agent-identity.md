# AgentIdentity

Wave 3 · data display · Status: specified

## Purpose
Show who an automated agent is, the same way everywhere (palette, canvas node, dialogs, timelines): its mark, name, role and the model it runs on; plus helpers for its rating tier.

## Anatomy
- Agent mark: per design direction §2.11 an agent is a rounded square with a dashed boundary and a bot icon, never a round face or initials. A host-supplied image may fill the square; if it fails to load, the bot icon shows.
- Agent badge: a small corner marker on the mark indicating "automated", decorative.
- Name: primary text.
- Secondary line: role, else a fallback role, else the model line.
- Model line: "provider · model" (or whichever is present), in monospace meta text; shown as a separate chip only when a role is also shown.
- The word "agent" is always visible next to or under the name (§2.11).
- Tier helper `agentTier(rating?)`: maps a numeric rating to one of four ordered tiers (beginner, intermediate, advanced, expert) using thresholds from configuration; missing rating counts as the lowest. Returns the tier key only; presentation uses a Tag with the tier word.

## Properties and events
| name | type | default | meaning |
|---|---|---|---|
| agent | `{ name: string; image?: string; role?: string; provider?: string; model?: string }` | required | Identity. |
| size | `'sm' \| 'md'` | md | Mark size step. |
| fallbackRole | `string` | none | Secondary line when role is absent. |
| showKindWord | `boolean` | true | Show "agent". Can be hidden only where a column header already says it. |

## States
- Image loading, loaded, failed (icon shown, no broken image).
- No provider or model: model line omitted.

## Keyboard and ARIA
- Not interactive by itself; no RAC primitive; custom. The mark is decorative (`alt=""`) because the name is text.
- When used inside a link or button, the accessible name is "‹name›, agent".

## Responsive, touch, motion, forced colours
- Name and secondary line truncate with the full text available as a title/tooltip.
- Dashed boundary and square shape must remain visible in forced colours (use system border colour).
- No motion.

## Acceptance tests
- Given an agent without an image, then the bot icon is shown in a square mark, not generated face art.
- Given an image that errors, then the icon replaces it and no broken image is shown.
- Given role "Reviewer" and model "m1" from provider "p", then the secondary line is "Reviewer" and a chip reads "p · m1".
- Given no role and no fallback, then the secondary line is the model line.
- Given thresholds [a,b,c] and a rating below a, then `agentTier` returns beginner; above c returns expert; undefined returns beginner.
- Given any render, then the word "agent" is visible.

## Open questions
- The fork derives a default face from a third-party avatar service keyed by the agent's name. That sends names to an external host and contradicts §2.11; the clean version uses no external service.
