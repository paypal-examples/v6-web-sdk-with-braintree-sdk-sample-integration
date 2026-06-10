# Braintree PayPal v6 Integration Code

**This directory contains the critical Braintree integration code. Start here if you're looking for the pattern to copy into your own app.**

Everything in the sibling `src/storeDemo/` directory (Home, BaseProductPage, BaseCartPage, ConfirmationPage, CartContext, hooks, presentational components) is generic ecommerce scaffolding used to make the demo realistic — it has no Braintree-specific logic.

## Files

| File                            | Braintree component                      | Demonstrates                                                                                                                                                   |
| ------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OneTimePaymentCheckout.tsx`    | `BraintreePayPalOneTimePaymentButton`    | Guest checkout. Tokenizes the buyer's PayPal, posts the nonce + cart total to `POST /braintree-api/transaction/sale`.                                          |
| `VaultWithPurchaseCheckout.tsx` | `BraintreePayPalCheckoutWithVaultButton` | Charge + save in one approval. Same `/transaction/sale` endpoint with `options.storeInVaultOnSuccess: true`.                                                   |
| `SavePaymentPage.tsx`           | `BraintreePayPalBillingAgreementButton`  | Vault-only flow (no charge). Posts the nonce to `POST /braintree-api/payment-method/save`. No cart involved.                                                   |
| `customButtons/`                | Session hooks + `<paypal-button>`        | Lower-level pattern: same three flows built with `useBraintreePayPal*Session` hooks when you need a custom UI. Reference only — not wired into the app routes. |

## Integration pattern

All three prebuilt-button integrations share the same shape:

1. Read the Braintree instance from `useBraintreePayPal()` and gate on `loadingStatus === INSTANCE_LOADING_STATE.RESOLVED`.
2. Render the matching `BraintreePayPal*Button` from `@paypal/react-paypal-js/sdk-v6` with its props (`amount`, `currency`, etc.).
3. In `onApprove`, call `braintreePayPalCheckoutInstance.tokenizePayment(data)` to get a `nonce`.
4. Post the nonce to your backend (helpers in `../../utils.ts`: `completePayment`, `completePaymentAndVault`, `vaultPaymentMethod`).

The provider, client-token fetch, and routing wiring live in `../App.tsx`.
