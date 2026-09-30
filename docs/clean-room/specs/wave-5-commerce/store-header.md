# StoreHeader, MegaMenu, StoreMenuSheet and StoreFooter

Wave 5 · commerce · navigation · Status: specified

## Purpose
The shopper-facing top of every store page: brand, category navigation with large drop-down panels, search, account and cart; an optional utility bar above it for a store-wide announcement, currency or region, and sign-in links; a sheet that holds the same navigation on narrow screens. StoreFooter is the matching bottom: link groups, newsletter sign-up, locale and currency, legal line. AppFrame and AppNavigation (waves 1 and 2) remain the frame for authenticated back-office screens; these are for storefronts.

## Anatomy
- **Utility bar** (optional): a region with an announcement line (host text, optionally a link), a currency or region selector, and account links (sign in, create account) or the signed-in shopper's name.
- **Main bar**:
  - **Menu button** (narrow screens): opens StoreMenuSheet.
  - **Brand slot**: host logo or wordmark as a link to the home page; the component ships no logo.
  - **Primary navigation**: top-level categories that open a MegaMenu, and plain page links.
  - **Search**: a button that opens a search overlay (host content, typically a combobox) or a link to a search page; or an inline search field on wide screens (`searchPresentation`).
  - **Account**: link or button with ToolbarTrigger (wave 2) look.
  - **CartButton**: icon button with the item count as CountBadge (wave 2); opens CartView as popover or drawer, or links to the cart page.
- **Secondary row** (optional, narrow screens): top-level categories as a horizontally scrolling row that stays visible (the persistent variant).
- **MegaMenu** (per category): a full-width panel under the bar with up to two featured items (host media, title, link, optional short line) and link groups (titled lists of links: categories, collections, brands). Column count follows content.
- **StoreMenuSheet**: Drawer (wave 1) from the start edge with a close button; Tabs (wave 1) across top-level categories, each panel showing featured items and the link groups; below the tabs, page links, account links and the currency selector.
- **StoreFooter**: link groups (titled lists), newsletter sign-up (TextField in e-mail mode plus Button, optional consent Checkbox, success and error messages), LocalePicker (wave 2) and currency selector, optional payment and security marks through ThirdPartyMarkSlot (wave 4), social links with text names, legal line (host text).

## Properties and events
### StoreHeader
| Name | Type | Default | Meaning |
|---|---|---|---|
| brand | { node; href; label } | required | Logo slot and accessible name of the home link. |
| categories | { id; label; href?; featured?: { title; href; media?; description? }[]; groups: { id; title; links: { label; href }[] }[] }[] | [] | Top-level categories with mega menu content. |
| pages | { label; href }[] | [] | Plain links after the categories. |
| currentPath | string | none | Marks the current link with `aria-current="page"`. |
| announcement | { text; href? } | none | Utility bar line. |
| currency | { value; options: { code; label }[]; onChange } | none | Currency selector (utility bar, sheet, footer). |
| account | { signedIn: boolean; name?; href; signInHref?; signUpHref? } | none | Account links. |
| cartCount | number | 0 | Count badge; zero hides the badge but keeps the button. |
| cartPresentation | 'link' \| 'popover' \| 'drawer' | 'drawer' | What the cart button does. |
| cartHref / onCartOpen | string / handler | none | Destination or opener. |
| searchPresentation | 'link' \| 'overlay' \| 'inline' | 'overlay' | Search control. |
| onSearchOpen / searchHref / renderSearch | handler / string / node | none | Search wiring. |
| persistentCategoryRow | boolean | false | Shows the scrolling category row on narrow screens. |
| sticky | 'none' \| 'always' \| 'on-scroll-up' | 'none' | Sticky behaviour of the main bar. |
| tone | 'surface' \| 'inverse' | 'surface' | Bar surface role (inverse uses the nav roles). |
| labels | object | from I18nAdapter | Open menu, close menu, search, account, cart with count (plural rules), currency, main navigation, featured, and more. |

### StoreFooter
| Name | Type | Default | Meaning |
|---|---|---|---|
| groups | { title; links: { label; href }[] }[] | [] | Link groups. |
| newsletter | { title; description?; onSubscribe(email, consent) => Promise; consentLabel? } | none | Sign-up. |
| locale / currency | LocalePicker props / as header | none | Pickers. |
| marks | ThirdPartyMarkSlot items | none | Payment and security marks. |
| social | { label; href; icon? }[] | none | Social links (name always in text or accessible name). |
| legal | string | none | Legal line (company name, tax id, address), host text. |

## States
- Header: at rest; mega menu open (one at a time); sheet open; search overlay open; sticky visible or hidden (on scroll up); cart count updating (announced politely: "cart has {n} products"); signed in or out; loading navigation (Skeleton link placeholders; the brand and cart remain usable).
- Footer: newsletter idle, submitting (pending button), subscribed (success message replaces the form), failed (field error with host message).

## Keyboard and ARIA
- Header is a `header` landmark; the navigation is a `nav` labelled "Main navigation"; utility bar links are a second `nav` labelled "Account" or similar; SkipLink (wave 1) precedes the header.
- MegaMenu uses the APG **Disclosure Navigation Menu** pattern, not the menu role: each category is a button with `aria-expanded` controlling its panel; Enter or Space toggles; Escape closes and returns focus to the button; opening one closes others; focus leaving the header closes any open panel; links inside are ordinary links in reading order. Optional hover opening (`openOnHover`) uses an intent delay from motion tokens and never replaces the click behaviour.
- Category buttons that also have their own page offer a first link inside the panel ("All {category}") rather than a split control.
- StoreMenuSheet: APG **Dialog (modal)** via Drawer; focus goes to the sheet title; Tabs across categories follow APG **Tabs**; Escape closes; focus returns to the menu button.
- Search overlay: APG **Dialog (modal)** containing the host's combobox; the search button's `aria-expanded` is not used because it opens a dialog.
- CartButton: named "Cart, {n} products" (plural rules from i18n); with popover presentation it carries `aria-expanded` and `aria-controls`; with drawer presentation it opens a modal dialog.
- Currency selector: NativeSelect named "Currency".
- Footer: `footer` landmark; link groups as lists with headings; newsletter form with a visible label for the e-mail field and a status region for the result.

## Responsive, touch, motion, forced colours
- Wide screens: brand, categories and pages inline, actions at the end; mega menus span the header width.
- Below the medium layout width: menu button, brand, and the end actions (search, cart); categories move into the sheet; the optional persistent category row scrolls horizontally with the current category scrolled into view.
- Utility bar collapses to the announcement only on narrow screens; its selector and account links move into the sheet.
- Sticky header respects SafeAreaInset (wave 2) and never hides focused elements; `on-scroll-up` reappears on focus.
- Panels and sheet open with opacity and short movement from the motion tokens; reduced motion shows them instantly.
- Every control meets the touch-target token.
- Forced colours: open category button shows a system underline or border besides colour; count badge keeps a system border.
- Right-to-left: sheet enters from the right; mega menu columns start on the right; the brand stays at the start side.

## Acceptance tests
- Given three categories, when the second category button is activated, then its panel opens, `aria-expanded` is true, and any other open panel closes.
- Given an open panel, when Escape is pressed, then it closes and focus returns to its button.
- Given an open panel, when focus moves outside the header with Tab, then the panel closes.
- Given a narrow viewport, then categories are not inline and the menu button opens a modal sheet whose tabs list the categories.
- Given `cartCount` changes from 1 to 2, then the badge shows 2 and "cart has 2 products" is announced once.
- Given `cartCount` 0, then the badge is hidden and the button is still present and named.
- Given `currentPath` matching a page link, then that link has `aria-current="page"`.
- Given pt-BR, then all header labels come from the adapter; no hard-coded text is present.
- Given the newsletter form submitted with an invalid e-mail, then the field shows an error and `onSubscribe` is not called.
- Given `onSubscribe` resolves, then a success message replaces the form and is announced.
- Given axe on header (closed, panel open, sheet open) and footer, then no violations.

## Composition notes
Reuses SkipLink, Drawer, Tabs, NativeSelect, TextField, Button, Link, Checkbox, Skeleton (wave 1), CountBadge, ToolbarTrigger, LocalePicker, SafeAreaInset, RouterAdapter (wave 2), ThirdPartyMarkSlot (wave 4), CartView (wave 5). NavigationFlyout (wave 2) is the in-app counterpart and is not reused because store navigation has no search grid of destinations.

## Open questions
- Whether a search overlay with product suggestions (combobox with media rows) should become its own spec in a later wave.
