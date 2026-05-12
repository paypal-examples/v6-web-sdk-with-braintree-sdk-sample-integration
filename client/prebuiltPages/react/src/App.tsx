import { useEffect, useState } from "react";
import {
  BraintreePayPalProvider,
  BraintreePayPalOneTimePaymentButton,
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

import { PayPalBillingAgreementButton } from "./customButtons/BraintreePayPalBillingAgreementButton";
import { BraintreePayPalCheckoutWithVaultButton } from "./customButtons/BraintreePayPalCheckoutWithVaultButton";

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

    const { nonce } = await braintreePayPalCheckoutInstance.tokenizePayment({
      orderID: data.orderId,
      payerID: data.payerId,
    });
    console.log("Nonce received from Braintree:", nonce);
    const orderData = await completePayment(nonce);
    console.log("Capture result data:", orderData);
  };

  const handleCheckoutWithVaultApprove = async (data: BraintreeApprovalData) => {
    if (!braintreePayPalCheckoutInstance) return;
    const { nonce } = await braintreePayPalCheckoutInstance.tokenizePayment({
      orderID: data.orderId,
      payerID: data.payerId,
    });
    const orderData = await completePaymentAndVault(nonce);
    console.log("Checkout with vault result:", orderData);
  };

  const handleBillingAgreementApprove = async (data: BraintreeApprovalData) => {
    console.log("onApprove", data);

    if (!braintreePayPalCheckoutInstance) {
      console.error("Braintree instance not available");
      return;
    }

    const { nonce } = await braintreePayPalCheckoutInstance.tokenizePayment({
      billingToken: data.billingToken,
    });
    const paymentMethodData = await vaultPaymentMethod(nonce);
    console.log("Vault result", paymentMethodData);
  };
  return (
    loadingStatus === INSTANCE_LOADING_STATE.RESOLVED && (
      <>
        <BraintreePayPalOneTimePaymentButton
          amount="100"
          currency="USD"
          onApprove={handleOnApprove}
        />
        <PayPalBillingAgreementButton
          onApprove={handleBillingAgreementApprove}
          onCancel={(data: BraintreeOnCancelData) => {
            console.log("onCancel", data);
          }}
          onError={(err) => {
            console.error("onError", err);
          }}
        />
        <BraintreePayPalCheckoutWithVaultButton
          amount="10.00"
          currency="USD"
          intent="capture"
          billingAgreementDetails={{
            description: "Save payment method for future purchases",
          }}
          onApprove={handleCheckoutWithVaultApprove}
          onCancel={() => {
            console.log("onCancel");
          }}
          onError={(err) => {
            console.error("onError", err);
          }}
        />
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
      <h1>React Prebuilt Page</h1>
      <p>Edit src/App.tsx and save to see changes.</p>
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
