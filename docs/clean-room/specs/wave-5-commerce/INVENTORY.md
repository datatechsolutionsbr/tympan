# Wave 5 commerce inventory

Date: 2026-09-26. Source read by the spec writer only: a commercial e-commerce kit (source withheld), its React variants (the other framework variants duplicate them). Its licence forbids publishing derivatives, so nothing from it (code, markup, copy, product names, images, file names, visual values) is in these specs. Behaviour was abstracted and rewritten; commerce requirements the kit does not cover (currency formatting, i18n, stock and variant states, quantity limits, loading, empty and error states, accessibility patterns, right-to-left, Brazilian address and payment needs) were added.

The implementer builds from these files only and must not look for or open the source kit.

## Families

| Source family (generic category) | Spec file | New components | Existing Tympan components reused |
|---|---|---|---|
| Category filter family | `faceted-filter-bar.md` | FacetedFilterBar (layouts popovers, panel, sidebar; filter sheet on narrow screens) | Checkbox, ActionMenu, Popover, Drawer, SegmentedControl, Skeleton, FilterChips, CurrencyField, CountBadge |
| Category preview family | `category-showcase.md` | CategoryShowcase (mosaic, columns, banner, scroll row, split) | SectionHeading, Link, Button, Skeleton, InlineNotice |
| Checkout form family | `checkout-form.md` | CheckoutForm (single page, stepped, split), with Contact, Address, DeliveryOptions, Payment, Billing, Consent sections | Field, TextField, TextArea, Checkbox, NativeSelect, ListboxSelect, Separator, Link, Button, InlineNotice, Skeleton, StepList, ChoiceCard, FormLayout, FormActions, Formatters (country registry, addresses), SafeAreaInset, ThirdPartyMarkSlot |
| Incentive family | `benefit-strip.md` | BenefitStrip (row, grid, inline) | Heading, Text, Link, Skeleton |
| Order history family | `order-history-list.md` | OrderHistoryList (cards, table, list, quick actions) | PageHeader, SectionHeading, DataTable, ActionMenu, StatusPill, Pagination, SegmentedControl, NativeSelect, Button, Link, Skeleton, EmptyState, ErrorState, Toast, FilterField, Formatters |
| Order summary family | `order-detail.md` | OrderDetail (confirmation and detail modes), ShipmentProgress | PageHeader, StatusPill, Separator, Link, Button, Skeleton, InlineNotice, EmptyState, ErrorState, CopyIdentifier, Formatters, ThirdPartyMarkSlot |
| Product feature family | `product-feature-section.md` | ProductFeatureSection (specs, tabs, alternating, grid, split) | Tabs, Heading, Text, Skeleton |
| Product list family | `product-grid.md` | ProductGrid, ProductCard | SectionHeading, Link, Tag, Button, Skeleton, EmptyState, ErrorState, Pagination (beside) |
| Product overview family | `product-detail.md` | ProductDetail, MediaGallery, VariantPicker | Breadcrumbs, Button, Tag, Tabs, InlineNotice, Skeleton, ErrorState, PageDots, MarkdownView, SafeAreaInset |
| Product quick-view family | `product-quick-view.md` | ProductQuickView | ModalDialog, Button, Link, Skeleton, ErrorState, InlineNotice |
| Promo section family | `promo-banner.md` | PromoBanner (background, tiles, split, text only), offer strip, TestimonialList | Button, Link, Heading, Text, StatusPill, Skeleton, CopyIdentifier, Formatters |
| Review family | `review-list.md` | ReviewSummary, ReviewList | ProgressBar, Avatar, Tag, Button, NativeSelect, Pagination, Skeleton, EmptyState, ErrorState, FilterChips, Formatters, MarkdownView |
| Shopping cart family | `cart-view.md` | CartView (page, drawer, dialog, popover), CartLineItem, PriceBreakdown | Drawer, ModalDialog, Popover, Button, Link, TextField, Tag, InlineNotice, Skeleton, EmptyState, ErrorState, SwipeRow, SafeAreaInset, Formatters |
| Store navigation family | `store-header.md` | StoreHeader, MegaMenu, StoreMenuSheet, CartButton, StoreFooter | SkipLink, Drawer, Tabs, NativeSelect, TextField, Button, Link, Checkbox, Skeleton, CountBadge, ToolbarTrigger, LocalePicker, SafeAreaInset, RouterAdapter, ThirdPartyMarkSlot |

## Shared foundation (not a source family)

| Spec file | New components | Existing Tympan components reused |
|---|---|---|
| `commerce-primitives.md` | Money and product data model, Price, QuantityStepper, RatingDisplay, StockStatus, SwatchGroup, media contract | Formatters, I18nAdapter, CurrencyField (input counterpart), NativeSelect, Skeleton |

## Pages

| Source page type (generic) | Composition in `page-compositions.md` | Main components |
|---|---|---|
| Storefront pages | Storefront | StorePage, StoreHeader, PromoBanner, CategoryShowcase, ProductGrid, ProductFeatureSection, BenefitStrip, StoreFooter |
| Category pages | Category | StorePage, Breadcrumbs, PageHeader, FacetedFilterBar, ProductGrid, Pagination |
| Product pages | Product | StorePage, Breadcrumbs, ProductDetail, BenefitStrip, ProductFeatureSection, ReviewSummary, ReviewList, ProductGrid |
| Shopping cart pages | Shopping cart | StorePage, PageHeader, CartView, BenefitStrip, ProductGrid |
| Checkout pages | Checkout | StorePage (minimal chrome), CheckoutForm, CartLineItem, PriceBreakdown |
| Order history pages | Order history | StorePage, PageHeader, OrderHistoryList, Pagination |
| Order detail pages | Order detail and confirmation | StorePage, OrderDetail, ShipmentProgress, ProductGrid |

New frame: StorePage (in `page-compositions.md`).

## Dependencies between wave-5 components

- Every component uses commerce primitives for money, stock, rating and variants.
- CartLineItem and PriceBreakdown (cart-view) are reused by CheckoutForm and OrderDetail.
- ProductQuickView reuses ProductDetail parts; ProductGrid opens it.
- StoreHeader's CartButton opens CartView.
- Build order suggestion: commerce primitives, ProductGrid, CartView, ProductDetail, ProductQuickView, FacetedFilterBar, StoreHeader and StoreFooter, CheckoutForm, OrderDetail, OrderHistoryList, ReviewSummary and ReviewList, then the content sections (CategoryShowcase, PromoBanner, BenefitStrip, ProductFeatureSection) and the page compositions.

## Open questions (collected)

1. Unit-price line in Price or host copy (commerce-primitives).
2. Built-in load more versus host Pagination (product-grid).
3. Hierarchical category facet now or later (faceted-filter-bar).
4. Variant selection in the address: component or host (product-detail).
5. Rating input for the host's review form (review-list).
6. Save for later as its own list (cart-view).
7. Guest versus sign-in step ownership; shipping Brazilian tax-id and postal-code validators in the library (checkout-form).
8. Search overlay with product suggestions as a later spec (store-header).
