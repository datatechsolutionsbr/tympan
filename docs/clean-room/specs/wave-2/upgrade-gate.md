Wave 2 · Feedback · Status: specified

# UpgradeGate

## Purpose
A full-surface blocking screen shown when the organisation has no active subscription, offering to view plans or sign out.

## Anatomy
- **Backdrop**: the app background with the calm Ambient (§2.5).
- **Header**: eyebrow, title (h1), description (PageHeader, wave 1).
- **Notice**: InlineNotice with warning tone explaining what is blocked.
- **Primary action**: "view plans" (the one primary button of the view, §2.10).
- **Secondary action**: "sign out" (quiet button).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| onViewPlans | () => void | required | Navigates to plans or checkout. |
| onSignOut | () => void | required | Ends the session. |
| busy | boolean | false | Primary action shows loading and is disabled while checkout starts. |
| texts | { eyebrow, title, description, noticeTitle, noticeBody, viewPlans, signOut } | from i18n | All copy. |

## States
Idle; busy (primary shows Spinner inside the button and `aria-busy`); secondary remains enabled while busy.

## Keyboard and ARIA
- Modal dialog semantics: role `dialog`, `aria-modal`, labelled by the title. Focus moves to the title or primary action on mount and is trapped; the rest of the app is inert.
- Escape does nothing (the gate cannot be dismissed), which must be stated to screen reader users through the description.
- APG "Dialog (Modal)"; RAC `Modal` with `isDismissable=false` and `Dialog`.

## Responsive, touch, motion, forced colours
- Actions full width below 640 px; both 44 px tall.
- Enters without animation under reduced motion; otherwise fade only (§2.7 quick).
- Reduced transparency: opaque surface. Forced colours: buttons keep borders.

## Acceptance tests
- Given the gate is shown, then focus is inside it and Tab never reaches content behind it.
- Given Escape is pressed, then the gate remains.
- Given `busy`, then the primary action is disabled, announces busy, and `onViewPlans` is not called on activation.
- Given sign out is activated, then `onSignOut` is called once.
- Given axe audit, then no violations.
