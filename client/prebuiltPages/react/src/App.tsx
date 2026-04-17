import { useEffect, useState } from "react";
import {
  BraintreePayPalProvider,
  INSTANCE_LOADING_STATE,
  useBraintreePayPal,
} from "@paypal/react-paypal-js/sdk-v6";
import type {
  BraintreeApprovalData,
  BraintreeV6Namespace,
} from "@paypal/react-paypal-js/sdk-v6";
import { completePayment, getBraintreeBrowserSafeClientToken } from "../utils";
import { PayPalOneTimePaymentButton } from "./PayPalOneTimePaymentButton";

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

    const { nonce } = await braintreePayPalCheckoutInstance?.tokenizePayment({
      orderID: data.orderId,
      payerID: data.payerId,
    });
    console.log("Nonce received from Braintree:", nonce);
    const orderData = await completePayment(nonce);
    console.log("Capture result data:", orderData);
  };
  return (
    loadingStatus === INSTANCE_LOADING_STATE.RESOLVED && (
      <PayPalOneTimePaymentButton
        amount="100"
        currency="USD"
        onApprove={handleOnApprove}
      />
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
