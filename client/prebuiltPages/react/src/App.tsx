import { useEffect, useState } from "react";
import {
  BraintreePayPalProvider,
  BraintreePayPalOneTimePaymentButton,
  BraintreePayPalBillingAgreementButton,
  BraintreePayPalCheckoutWithVaultButton,
  INSTANCE_LOADING_STATE,
  useBraintreePayPal,
} from "@paypal/react-paypal-js/sdk-v6";
import type {
  BraintreeApprovalData,
  BraintreeOnCancelData,
  BraintreeV6Namespace,
} from "@paypal/react-paypal-js/sdk-v6";
import {
  completePayment,
  completePaymentAndVault,
  getBraintreeBrowserSafeClientToken,
  vaultPaymentMethod,
} from "../utils";

declare global {
  interface Window {
    braintree: BraintreeV6Namespace;
  }
}

const CheckoutButtons: React.FC = () => {
  const { braintreePayPalCheckoutInstance, loadingStatus } =
    useBraintreePayPal();
  const handleOnApprove = async (data: BraintreeApprovalData) => {
    console.log("Payment approved!", data);

    if (!braintreePayPalCheckoutInstance) {
      console.error("Braintree instance not available");
      return;
    }

    const { nonce } =
      await braintreePayPalCheckoutInstance.tokenizePayment(data);
    console.log("Nonce received from Braintree:", nonce);
    const orderData = await completePayment(nonce);
    console.log("Capture result data:", orderData);
  };

  const handleCheckoutWithVaultApprove = async (
    data: BraintreeApprovalData,
  ) => {
    if (!braintreePayPalCheckoutInstance) return;
    const { nonce } =
      await braintreePayPalCheckoutInstance.tokenizePayment(data);
    const orderData = await completePaymentAndVault(nonce);
    console.log("Checkout with vault result:", orderData);
  };

  const handleBillingAgreementApprove = async (data: BraintreeApprovalData) => {
    console.log("onApprove", data);

    if (!braintreePayPalCheckoutInstance) {
      console.error("Braintree instance not available");
      return;
    }

    const { nonce } =
      await braintreePayPalCheckoutInstance.tokenizePayment(data);
    const paymentMethodData = await vaultPaymentMethod(nonce);
    console.log("Vault result", paymentMethodData);
  };
  return (
    loadingStatus === INSTANCE_LOADING_STATE.RESOLVED && (
      <>
        <section style={{ marginTop: "2rem" }}>
          <h2>One-Time Payment</h2>
          <p>
            Charge the customer a single payment. The payment method is not
            saved.
          </p>
          <BraintreePayPalOneTimePaymentButton
            amount="100"
            currency="USD"
            onApprove={handleOnApprove}
          />
        </section>
        <section style={{ marginTop: "2rem" }}>
          <h2>Billing Agreement</h2>
          <p>
            Save the customer's PayPal account for future transactions without
            charging them now.
          </p>
          <BraintreePayPalBillingAgreementButton
            type="subscribe"
            onApprove={handleBillingAgreementApprove}
            onCancel={(data: BraintreeOnCancelData) => {
              console.log("onCancel", data);
            }}
            onError={(err) => {
              console.error("onError", err);
            }}
          />
        </section>
        <section style={{ marginTop: "2rem" }}>
          <h2>Checkout with Vault</h2>
          <p>
            Capture a one-time payment and save the customer's PayPal account in
            a single flow.
          </p>
          <BraintreePayPalCheckoutWithVaultButton
            amount="10.00"
            currency="USD"
            intent="capture"
            type="buynow"
            billingAgreementDetails={{
              description: "Save payment method for future purchases",
            }}
            onApprove={handleCheckoutWithVaultApprove}
            onCancel={() => {
              console.log("onCancel");
            }}
            onError={(err: Error) => {
              console.error("onError", err);
            }}
          />
        </section>
      </>
    )
  );
};

function App() {
  const [clientToken, setClientToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchClientToken() {
      const braintreeClientToken = await getBraintreeBrowserSafeClientToken();

      setClientToken(braintreeClientToken);
    }

    fetchClientToken();
  }, []);

  if (!clientToken) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Braintree PayPal Checkout Flows</h1>
      <BraintreePayPalProvider
        namespace={window.braintree}
        braintreeClientToken={clientToken}
      >
        <CheckoutButtons />
      </BraintreePayPalProvider>
    </div>
  );
}

export default App;
