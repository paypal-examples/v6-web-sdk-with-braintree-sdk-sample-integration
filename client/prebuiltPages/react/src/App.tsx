import { useEffect, useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { BraintreePayPalProvider } from "@paypal/react-paypal-js/sdk-v6";
import type { BraintreeV6Namespace } from "@paypal/react-paypal-js/sdk-v6";
import { CartProvider } from "./storeDemo/context/CartContext";
import { Home } from "./storeDemo/pages/Home";
import { BaseProductPage } from "./storeDemo/pages/BaseProductPage";
import { BaseCartPage } from "./storeDemo/pages/BaseCartPage";
import { ConfirmationPage } from "./storeDemo/pages/ConfirmationPage";
import { OneTimePaymentCheckout } from "./paymentIntegrations/OneTimePaymentCheckout";
import { VaultWithPurchaseCheckout } from "./paymentIntegrations/VaultWithPurchaseCheckout";
import { SavePaymentPage } from "./paymentIntegrations/SavePaymentPage";
import { getBraintreeBrowserSafeClientToken } from "../utils";

declare global {
  interface Window {
    braintree: BraintreeV6Namespace;
  }
}

function App() {
  const [clientToken, setClientToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    getBraintreeBrowserSafeClientToken().then(setClientToken);
  }, []);

  if (!clientToken) {
    return <div>Loading…</div>;
  }

  return (
    <BraintreePayPalProvider
      namespace={window.braintree}
      braintreeClientToken={clientToken}
    >
      <CartProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Home />} />

            <Route
              path="/one-time-payment"
              element={
                <BaseProductPage
                  flowLabel="One-Time Payment"
                  flowBasePath="/one-time-payment"
                />
              }
            />
            <Route
              path="/one-time-payment/cart"
              element={
                <BaseCartPage
                  flowLabel="One-Time Payment"
                  flowBasePath="/one-time-payment"
                />
              }
            />
            <Route
              path="/one-time-payment/checkout"
              element={<OneTimePaymentCheckout />}
            />

            <Route
              path="/vault-with-purchase"
              element={
                <BaseProductPage
                  flowLabel="Checkout with Vault"
                  flowBasePath="/vault-with-purchase"
                />
              }
            />
            <Route
              path="/vault-with-purchase/cart"
              element={
                <BaseCartPage
                  flowLabel="Checkout with Vault"
                  flowBasePath="/vault-with-purchase"
                />
              }
            />
            <Route
              path="/vault-with-purchase/checkout"
              element={<VaultWithPurchaseCheckout />}
            />

            <Route path="/save-payment" element={<SavePaymentPage />} />
            <Route path="/confirmation" element={<ConfirmationPage />} />
          </Routes>
        </HashRouter>
      </CartProvider>
    </BraintreePayPalProvider>
  );
}

export default App;
