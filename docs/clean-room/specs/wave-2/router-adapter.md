Wave 2 · Utility · Status: specified

# RouterAdapter

## Purpose
Lets every component navigate and render links without importing a specific router; the app supplies an adapter once at the root.

## Contract
- A provider receives an adapter value: `{ pathname, navigate(href), replace(href), back(), forward(), prefetch(href), Link, locationKey? }`.
- `useRouter()` returns `{ push, replace, back, forward, refresh, prefetch }`.
- `usePathname()` returns the current path.
- `useLink()` returns the link component to render internal links.
- `useLocationKey()` returns a key that changes on every navigation (adapter key, else pathname).
- Without a provider, every function falls back to the browser's location and history, and `useLink()` returns a plain anchor, so components still work in isolation (stories, tests).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| adapter.pathname | string | required | Current path. |
| adapter.navigate / replace | (href: string) => void | required | Push or replace. |
| adapter.back / forward | () => void | required | History moves. |
| adapter.prefetch | (href: string) => void | required (may be a no-op) | Warm a route. |
| adapter.Link | component taking href, children, anchor attributes, ref | required | Router link. |
| adapter.locationKey | string | pathname | Changes on each navigation. |

## States
With provider; without provider (fallback).

## Keyboard and ARIA
Not applicable, except: the supplied Link must render a real anchor with `href` so middle-click, open-in-new-tab and screen reader link lists work; RAC `RouterProvider` should be wired to the same adapter so RAC links and menus navigate through it.

## Responsive, touch, motion, forced colours
Not applicable.

## Acceptance tests
- Given a provider, when `push('/x')` is called, then the adapter's navigate receives '/x'.
- Given no provider, then `usePathname()` returns the browser path and `useLink()` renders an anchor.
- Given an adapter without `locationKey`, then `useLocationKey()` equals the pathname.
- Given RAC links inside the provider, when activated, then navigation goes through the adapter.
