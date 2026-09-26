Wave 2 · Utility · Status: specified

# EntityListLoader

## Purpose
A hook that loads a list of records for a page, reloads it when the person navigates back to the page, and exposes loading, error and manual refresh.

## Contract
Input: an async `fetcher` returning an array, plus options. Output: `{ items, loading, error, refresh, setItems }`.
- Fetches on mount.
- Fetches again whenever the revalidation key changes; by default the key is the router adapter's location key, so returning to the same page after a wizard refreshes it.
- `refresh()` sets loading, refetches, replaces items and clears the error on success; resolves when done.
- A response that arrives after unmount or after a newer key is ignored.
- A `null` or `undefined` response is treated as an empty list.
- Non-Error rejections are wrapped into an Error.
- The latest `fetcher` is always used, even if the caller passes an inline function (no refetch loop).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| fetcher | () => Promise<T[]> | required | Loader. |
| options.initial | T[] | [] | Items before the first response. |
| options.revalidationKey | string or number or null | router location key | Refetch trigger; `null` disables automatic fetching. |

## States
Loading (initially true); loaded; error (items keep their last value).

## Keyboard and ARIA
Not applicable. Pages using it set `aria-busy` on the list region while `loading` (§2.12).

## Responsive, touch, motion, forced colours
Not applicable.

## Acceptance tests
- Given a fetcher resolving to two items, then after it settles `items` has two entries and `loading` is false.
- Given the location key changes, then the fetcher is called again.
- Given `revalidationKey=null`, then no automatic fetch happens.
- Given a rejection with a string, then `error` is an Error with that message.
- Given the component unmounts before the fetcher resolves, then no state update warning occurs.
- Given `refresh()` after a failure, when it succeeds, then `error` becomes null.

## Open questions
- With `revalidationKey=null` the fork leaves `loading` true forever; the new hook sets it false.
