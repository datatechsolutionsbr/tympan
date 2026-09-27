# CheckoutForm

Wave 5 · commerce · form · Status: specified

## Purpose
Collect what is needed to place an order (contact, delivery address, delivery option, payment, billing address, consent) and show the order being paid for, then submit. One component with three flows: everything on one page, a stepped flow with one section per step, and a split page with the order summary in its own column. It never handles raw card data itself: card entry is a host slot for the payment provider's secure fields.

## Anatomy
- **Page title** (optional) and **step indicator** (stepped flow): StepList (wave 2) of the host's steps, completed steps revisitable.
- **Express payment** (optional): a row of host-supplied wallet buttons at the top, followed by a Separator (wave 1) with a caption ("or").
- **ContactSection**: e-mail (TextField, e-mail mode), optional phone, optional "create an account" or "sign in" Link, optional marketing opt-in Checkbox (off by default).
- **AddressSection** (shipping): fields driven by the country's address template from the Formatters country registry (wave 2): name, company (optional), postal code, street, number, complement, district, city, region, country. Postal-code lookup is optional: when the host supplies `lookupPostalCode`, entering a complete code fills street, district, city and region, leaving them editable. Country is a combobox for long lists (ListboxSelect with search) or NativeSelect for short ones; region is a select when the country defines regions, else a text field. Optional tax identifier field (for Brazil, CPF or CNPJ) with format validation from the host.
- **Saved addresses** (optional, signed-in shoppers): ChoiceCard (wave 2) radio group of stored addresses plus "use a new address".
- **DeliveryOptions**: ChoiceCard radio group; each option shows name, estimated time, price (or "free") and optional pickup location; loads after a valid address.
- **PaymentSection**: a radio group of host payment methods (for example card, Pix, bank slip, wallet); each method reveals its own panel: card panel is a **host slot** for secure fields (the provider's hosted inputs), with an optional installments NativeSelect showing each plan's amount and total; instant-transfer panel shows the instructions the host supplies after submission; other methods show host text.
- **Billing address**: a "bill to the delivery address" Checkbox (on by default) whose unchecking reveals a second AddressSection.
- **Order notes** (optional): TextArea (wave 1).
- **Consent**: required terms Checkbox with a Link to the terms, and optional extra consents, all text from the host.
- **Summary**: CartLineItem list (read-only, or with quantity and remove when `editableLines`), promo code field, PriceBreakdown. On narrow screens it collapses to a bar showing the total with a Disclosure to expand the full summary.
- **Submit**: FormActions (wave 2) with the primary "place order" or "continue" Button, optional back action (stepped), and a reassurance line from the host (for example a line saying payment is taken only on confirmation).

## Properties and events
| Name | Type | Default | Meaning |
|---|---|---|---|
| flow | 'single-page' \| 'stepped' \| 'split' | 'single-page' | Arrangement. Split: form in one column, summary in a separate column with its own background role; single page: summary as a sidebar after the form in DOM order. |
| steps | { id; label; sections: SectionId[] }[] | contact, delivery, payment, review | Stepped flow grouping. |
| step / onStepChange | id / handler | first | Controlled step. |
| value | CheckoutDraft (contact, shippingAddress, billingSameAsShipping, billingAddress, deliveryOptionId, paymentMethodId, installments, notes, consents) | required | Form values (controlled). |
| onChange | (draft, field) => void | required | Every edit. |
| countries | CountryConfig[] | from registry | Allowed destination countries; `defaultCountry` BR in the documented example. |
| lookupPostalCode | (country, code) => promise of a partial Address | none | Address autofill. |
| savedAddresses | Address[] | none | For signed-in shoppers. |
| deliveryOptions | { id; label; estimate; price: Money \| 'free'; pickup?: string }[] | [] | Loaded by the host after the address. |
| deliveryStatus | 'idle' \| 'loading' \| 'ready' \| 'error' \| 'unavailable' | 'idle' | Unavailable: no delivery to that address (message from host). |
| paymentMethods | { id; label; icon?; description?; kind: 'card' \| 'instant-transfer' \| 'slip' \| 'wallet' \| 'other' }[] | required | Methods. |
| renderPaymentPanel | (methodId) => node | none | Host slot: provider secure fields, instructions. |
| installmentOptions | { count; perInstalment: Money; total: Money; interestFree: boolean }[] | none | Card installments. |
| expressPayments | node | none | Host wallet buttons (marks via ThirdPartyMarkSlot, wave 4). |
| lines / totals | LineItem[] / PriceBreakdown value | required | Summary content. |
| editableLines | boolean | false | Quantity and remove in the summary (with CartView line callbacks). |
| promo | as CartView | none | Promo codes in the summary. |
| taxIdField | { kind: 'cpf-cnpj' \| 'vat' \| 'none'; validate(value): string or null } | 'none' | Tax identifier. |
| validate | (draft, stepId?) => Record<fieldPath, message> | none | Host validation; the component also enforces required fields and input types. |
| onSubmit | (draft) => Promise<{ ok } \| { errors } \| { redirect }> | required | Final submit; errors map to fields or to a form-level notice; redirect lets the host hand over to a payment page. |
| status | 'ready' \| 'loading' \| 'submitting' \| 'error' | 'ready' | Form state. |
| labels | object | from I18nAdapter | Every section title, field label, hint and button. |

## States
Editing; field invalid (message under the field after first blur or on submit); section complete (stepped: step marked complete with a check and a written "completed"); delivery options loading (Skeleton choice cards), unavailable (InlineNotice); payment method switched (its panel revealed, others hidden and their values kept); billing different (second address revealed); submitting (all inputs read-only, primary button pending; the page must not be submittable twice); submit failed at field level (focus to an error summary listing the fields as links); submit failed at form level (InlineNotice at top with host message, for example payment declined, focus moved to it); price changed on submit (host returns new totals; a warning notice asks for confirmation before resubmitting); success (host navigates to OrderDetail confirmation).

## Keyboard and ARIA
- One `form` element; each section is a `fieldset` or a region labelled by its heading.
- Every field has a visible label (Field, wave 1), correct input type and `autocomplete` tokens (email, tel, name, organization, postal-code, address-line1, address-line2, address-level2, address-level1, country, and the billing variants), so browsers and password managers can fill it.
- Required fields are marked with a word or symbol explained once, plus `aria-required`.
- Country: APG **Combobox** (list autocomplete) when searchable, else native select.
- Saved addresses, delivery options, payment methods: APG **Radio Group** of ChoiceCards; each card's name is its title and its description carries estimate and price.
- Billing same as delivery: a plain checkbox; the billing region it reveals is placed directly after it in DOM order and referenced with `aria-controls`, so no expanded state is needed on the checkbox.
- Summary on narrow screens: APG **Disclosure** button whose name includes the total ("Show order summary, total {amount}").
- Stepped flow: StepList as a navigation list; the current step has `aria-current="step"`; moving to a new step moves focus to its heading; back keeps entered values.
- Error summary on submit: a region with a heading and one link per invalid field; activating a link focuses the field.
- Postal-code lookup: when fields are filled, a polite message says which fields were completed; lookup failure is a hint, not an error.
- Installments: native select whose options read count, amount per instalment and total.
- Payment slot: the host's secure fields must meet the same labelling rules; the component provides the label and error containers around the slot.

## Responsive, touch, motion, forced colours
- Wide screens: two columns (form and summary); narrow screens: one column, summary collapsed at the top, submit at the bottom with an optional sticky total bar.
- Field grid from FormLayout (wave 2): pairs such as city and region sit side by side on wide screens only.
- Input types trigger the right on-screen keyboards (e-mail, telephone, numeric for postal code and tax identifier using `inputmode`).
- Revealed panels appear with opacity only; reduced motion shows them instantly.
- Forced colours: selected choice cards keep a system border plus check glyph; step states keep icons and words.
- Right-to-left: columns mirror; address field order follows the country template, not the direction.

## Acceptance tests
- Given the Brazilian address template and `lookupPostalCode` resolving street, district, city and region, when a complete postal code is typed, then those fields fill, remain editable and a polite message lists them.
- Given a lookup failure, then no error is shown and fields stay empty for manual entry.
- Given an incomplete form and submit, then an error summary receives focus and each link moves focus to its field.
- Given delivery options loading, then skeleton cards show and the payment section remains usable.
- Given `deliveryStatus="unavailable"`, then a notice with the host's message shows and submit is disabled with a reason.
- Given payment method changed from card to instant transfer, then the card slot is hidden, the transfer panel shows, and values entered in the card slot are not submitted.
- Given billing same as delivery unchecked, then a second address section appears after the checkbox and its fields use billing autocomplete tokens.
- Given submitting, when the primary button is activated again, then `onSubmit` is not called a second time.
- Given `onSubmit` returns a form-level error, then the notice appears at the top, is announced and receives focus.
- Given `onSubmit` returns new totals, then a warning asks the shopper to confirm the new total before placing the order.
- Given stepped flow on step two, when back is activated, then step one shows with its values kept and focus on its heading.
- Given a narrow viewport, then the summary is collapsed with the total in the toggle's name.
- Given installments for BRL in pt-BR, then each option reads count, per-instalment amount and total in Brazilian format.
- Given axe on every step and state, then no violations; every input has a label and an autocomplete token where one exists.

## Composition notes
Reuses Field, TextField, TextArea, Checkbox, NativeSelect, ListboxSelect, Separator, Link, Button, InlineNotice, Skeleton (wave 1), StepList, ChoiceCard, FormLayout, FormActions, Formatters (country registry and `formatAddress`), SafeAreaInset (wave 2), ThirdPartyMarkSlot (wave 4), and CartLineItem, PriceBreakdown (cart-view). WizardPage (wave 2) is not used: checkout keeps the summary visible across steps.

## Open questions
- Whether guest checkout versus sign-in should be a first step owned by the component or by the host page.
- Whether to ship validators for Brazilian tax identifiers and postal codes in the library, or only the hook for host validators.
