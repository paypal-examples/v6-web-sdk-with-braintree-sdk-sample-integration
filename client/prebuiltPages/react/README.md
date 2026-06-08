# Braintree PayPal v6 — React Demo

A working React + Vite app that demonstrates the recommended way to integrate Braintree's [`paypal-checkout-v6`](https://braintree.github.io/braintree-web/current/PayPalCheckoutV6.html) component using the [`@paypal/react-paypal-js`](https://github.com/paypal/paypal-js/tree/main/packages/react-paypal-js) (v10) library.

This page serves two purposes:

1. **Run the demo** — see all three Braintree PayPal flows working locally.
2. **Recommended integration guide** — copy the pattern into your own React app.

## What's demonstrated

| Flow | Button | When to use |
| --- | --- | --- |
| One-time payment | `BraintreePayPalOneTimePaymentButton` | Charge the buyer once. Don't save the payment method. |
| Billing agreement | `BraintreePayPalBillingAgreementButton` | Save the buyer's PayPal account for future use without charging now (subscriptions, vault-first flows). |
| Checkout with vault | `BraintreePayPalCheckoutWithVaultButton` | Charge the buyer once **and** save the payment method in a single flow. |

Stack: `@paypal/react-paypal-js@^10.0.0`, Braintree Web SDK `3.142.0` loaded from CDN, React 19, Vite 7.

## Run the demo

Follow the sandbox setup in the [repo root README](../../../README.md) first (Braintree + PayPal sandbox accounts and `.env` config), then start the backend server (e.g. `cd server/node && npm install && npm start`).

In a separate terminal:

```bash
cd client/prebuiltPages/react
npm install
npm start
```

The dev server proxies `/braintree-api/*` to the backend, so it must be running.

## Project layout

| File | Purpose |
| --- | --- |
| `index.html` | Loads the Braintree CDN scripts (`client.min.js`, `paypal-checkout-v6.min.js`) before the React bundle so `window.braintree` is defined when the app boots. |
| `src/main.tsx` | Standard React entry point. |
| `src/App.tsx` | Fetches the Braintree client token, wraps the tree in `BraintreePayPalProvider`, and renders the three prebuilt buttons. **Start here.** |
| `src/customButtons/` | Alternative pattern: same flows built with the `useBraintreePayPal*Session` hooks and the bare `<paypal-button>` web component. See [Advanced: build your own button](#advanced-build-your-own-button-with-hooks). |
| `utils.ts` | Backend fetch helpers — `getBraintreeBrowserSafeClientToken`, `completePayment`, `vaultPaymentMethod`, `completePaymentAndVault`. |

## Recommended integration

The fastest path is the three prebuilt `BraintreePayPal*Button` components plus `BraintreePayPalProvider`. Five steps.

### 1. Install

```bash
npm install @paypal/react-paypal-js
```

### 2. Load the Braintree SDK in your HTML

Both scripts must be present **before** your React bundle runs:

```html
<!-- index.html -->
<script src="https://js.braintreegateway.com/web/3.142.0/js/client.min.js"></script>
<script src="https://js.braintreegateway.com/web/3.142.0/js/paypal-checkout-v6.min.js"></script>
```

Check the [Braintree Web SDK releases](https://github.com/braintree/braintree-web/releases) for the latest version.

### 3. Type `window.braintree`

Add this once (e.g. in `App.tsx` or a `global.d.ts`) so TypeScript knows about the global injected by the CDN scripts:

```tsx
import type { BraintreeV6Namespace } from "@paypal/react-paypal-js/sdk-v6";

declare global {
  interface Window {
    braintree: BraintreeV6Namespace;
  }
}
```

### 4. Wrap your tree in `BraintreePayPalProvider`

Fetch a client token from your server, then mount the provider:

```tsx
import { useEffect, useState } from "react";
import { BraintreePayPalProvider } from "@paypal/react-paypal-js/sdk-v6";

function App() {
  const [clientToken, setClientToken] = useState<string | undefined>();

  useEffect(() => {
    fetch("/braintree-api/auth/browser-safe-client-token")
      .then((r) => r.json())
      .then(({ clientToken }) => setClientToken(clientToken));
  }, []);

  if (!clientToken) return <div>Loading...</div>;

  return (
    <BraintreePayPalProvider
      namespace={window.braintree}
      braintreeClientToken={clientToken}
    >
      <CheckoutButtons />
    </BraintreePayPalProvider>
  );
}
```

Gate any consumer of the Braintree instance on the provider being ready:

```tsx
import {
  INSTANCE_LOADING_STATE,
  useBraintreePayPal,
} from "@paypal/react-paypal-js/sdk-v6";

function CheckoutButtons() {
  const { braintreePayPalCheckoutInstance, loadingStatus } = useBraintreePayPal();
  if (loadingStatus !== INSTANCE_LOADING_STATE.RESOLVED) return null;
  // ... render buttons
}
```

### 5. Render a button per flow

Each button's `onApprove` callback receives `BraintreeApprovalData` (`{ orderId?, payerId?, billingToken? }`). The pattern is always: call `braintreePayPalCheckoutInstance.tokenizePayment(...)`, then send the returned `nonce` to your server.

**One-time payment:**

```tsx
<BraintreePayPalOneTimePaymentButton
  amount="100"
  currency="USD"
  onApprove={async (data) => {
    const { nonce } = await braintreePayPalCheckoutInstance.tokenizePayment(data);
    await fetch("/braintree-api/transaction/sale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethodNonce: nonce, amount: "100" }),
    });
  }}
/>
```

**Billing agreement (vault only, no charge):**

```tsx
<BraintreePayPalBillingAgreementButton
  type="subscribe"
  onApprove={async (data) => {
    const { nonce } = await braintreePayPalCheckoutInstance.tokenizePayment(data);
    await fetch("/braintree-api/payment-method/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethodNonce: nonce }),
    });
  }}
/>
```

**Checkout with vault (charge + save):**

```tsx
<BraintreePayPalCheckoutWithVaultButton
  amount="10.00"
  currency="USD"
  intent="capture"
  type="buynow"
  billingAgreementDetails={{ description: "Save payment method for future purchases" }}
  onApprove={async (data) => {
    const { nonce } = await braintreePayPalCheckoutInstance.tokenizePayment(data);
    await fetch("/braintree-api/transaction/sale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentMethodNonce: nonce,
        amount: "10.00",
        options: { storeInVaultOnSuccess: true },
      }),
    });
  }}
/>
```

See `src/App.tsx` for all three in context.

### Backend contract

The demo expects the server to expose three endpoints. Yours can have any shape — the provider only cares about the client token; the rest is wiring you control:

| Endpoint | Used by | Purpose |
| --- | --- | --- |
| `GET /braintree-api/auth/browser-safe-client-token` | Provider setup | Returns `{ clientToken }`. Generate with the Braintree server SDK. |
| `POST /braintree-api/transaction/sale` | One-time + checkout-with-vault | Body: `{ paymentMethodNonce, amount, options?: { storeInVaultOnSuccess } }`. |
| `POST /braintree-api/payment-method/save` | Billing agreement | Body: `{ paymentMethodNonce }`. Vaults the payment method. |

See [`utils.ts`](./utils.ts) for the client-side wrappers and `server/*` in the repo root for reference implementations.

The Node reference server uses the official [`braintree`](https://www.npmjs.com/package/braintree) package ([source](https://github.com/braintree/braintree_node)). Instantiate a gateway once with your merchant credentials, then call it from your route handlers:

```ts
import braintree from "braintree";

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox, // or .Production
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_MERCHANT_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_MERCHANT_PRIVATE_KEY,
});

// Maps to the three endpoints above:
await gateway.clientToken.generate({});                                // → clientToken
await gateway.transaction.sale({ paymentMethodNonce, amount, options }); // → sale (+ optional vault)
await gateway.paymentMethod.create({ customerId, paymentMethodNonce });  // → vault only
```

See `server/node/src/braintreeServerSdkClient.ts` and the handlers under `server/node/src/routes/` for the full wiring.

## Advanced: build your own button with hooks

When you need a custom button UI, your own layout, or finer-grained control over `isPending` / `error` state, drop down to the matching session hook and render the bare `<paypal-button>` web component yourself. The handler pattern (`onApprove` → `tokenizePayment` → backend) is identical.

```tsx
// src/customButtons/PayPalOneTimePaymentButton.tsx
import { useBraintreePayPalOneTimePaymentSession } from "@paypal/react-paypal-js/sdk-v6";
import type { UseBraintreePayPalOneTimePaymentSessionProps } from "@paypal/react-paypal-js/sdk-v6";

export const PayPalOneTimePaymentButton: React.FC<
  UseBraintreePayPalOneTimePaymentSessionProps
> = (props) => {
  const { isPending, handleClick } = useBraintreePayPalOneTimePaymentSession(props);

  return (
    <paypal-button
      type="pay"
      onClick={() => handleClick()}
      disabled={isPending}
    ></paypal-button>
  );
};
```

The three hooks (`useBraintreePayPalOneTimePaymentSession`, `useBraintreePayPalBillingAgreementSession`, `useBraintreePayPalCheckoutWithVaultSession`) all accept the same props as their matching prebuilt button and return `{ isPending, error, handleClick }`. See `src/customButtons/` for working examples of all three.

## Reference

### `BraintreePayPalProvider` props

| Prop | Type | Notes |
| --- | --- | --- |
| `namespace` | `BraintreeV6Namespace` | Pass `window.braintree`. Must be referentially stable. |
| `braintreeClientToken` | `string \| undefined` | Generated server-side via Braintree's gateway SDK. |
| `children` | `ReactNode` | Anything below can call `useBraintreePayPal()` and the session hooks. |

### `useBraintreePayPal()` return

| Field | Type | Notes |
| --- | --- | --- |
| `braintreePayPalCheckoutInstance` | `BraintreePayPalCheckoutInstance \| null` | The Braintree instance. Call `.tokenizePayment(data)` in your `onApprove` handlers. |
| `loadingStatus` | `INSTANCE_LOADING_STATE` | Compare against `INSTANCE_LOADING_STATE.RESOLVED` before consuming the instance. |
| `error` | `Error \| null` | Provider-level setup error. |
| `isHydrated` | `boolean` | True once the underlying web component has mounted. |

### `BraintreePayPalOneTimePaymentButton` props

Required: `amount` (string), `currency` (ISO 4217), `onApprove`.

| Category | Props |
| --- | --- |
| Callbacks | `onApprove`, `onCancel`, `onError`, `onShippingAddressChange`, `onShippingOptionsChange` |
| UX | `type` (`"pay"` \| `"checkout"` \| `"buynow"` \| `"donate"` \| `"subscribe"`, default `"pay"`), `disabled`, `displayName`, `presentationMode`, `commit` |
| Payment data | `intent` (`"capture"` \| `"authorize"` \| `"order"`), `offerCredit`, `userAuthenticationEmail`, `returnUrl`, `cancelUrl`, `lineItems`, `shippingOptions`, `amountBreakdown` |

### `BraintreePayPalCheckoutWithVaultButton` props

Same as `BraintreePayPalOneTimePaymentButton` (minus `offerCredit`) plus:

| Prop | Notes |
| --- | --- |
| `billingAgreementDetails` | `{ description: string }` — shown to the buyer at consent time. |

### `BraintreePayPalBillingAgreementButton` props

Vault-first flow with its own prop surface (no `amount`/`currency` required since nothing is charged):

| Category | Props |
| --- | --- |
| Callbacks | `onApprove`, `onCancel`, `onError` |
| UX | `type`, `disabled`, `displayName`, `presentationMode`, `userAction` |
| Vault data | `billingAgreementDescription`, `planType`, `planMetadata`, `shippingAddressOverride`, `amount`, `currency`, `offerCredit`, `returnUrl`, `cancelUrl` |

### Session hooks

| Hook | Accepts | Returns |
| --- | --- | --- |
| `useBraintreePayPalOneTimePaymentSession` | `UseBraintreePayPalOneTimePaymentSessionProps` (the button props minus `type` / `disabled`) | `{ handleClick, isPending, error }` |
| `useBraintreePayPalBillingAgreementSession` | `UseBraintreePayPalBillingAgreementSessionProps` | `{ handleClick, isPending, error }` |
| `useBraintreePayPalCheckoutWithVaultSession` | `UseBraintreePayPalCheckoutWithVaultSessionProps` | `{ handleClick, isPending, error }` |

### Key types

```ts
type BraintreeApprovalData = {
  payerId?: string;
  orderId?: string;
  billingToken?: string;
};

type BraintreeTokenizePayload = {
  nonce: string;        // send this to your server
  type: string;
  details: { email: string; payerId: string; firstName: string; lastName: string; /* ... */ };
};
```

The exhaustive type definitions live in `@paypal/react-paypal-js/sdk-v6` — import from there rather than redeclaring.

## Further reading

- [Braintree `PayPalCheckoutV6` API reference](https://braintree.github.io/braintree-web/current/PayPalCheckoutV6.html)
- [`@paypal/react-paypal-js` repository](https://github.com/paypal/paypal-js/tree/main/packages/react-paypal-js)
- [Repo root README](../../../README.md) — Braintree + PayPal sandbox setup
- [Braintree Server SDK guide](https://developer.paypal.com/braintree/docs/start/hello-server)
