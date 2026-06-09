import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BraintreePayPalBillingAgreementButton,
  INSTANCE_LOADING_STATE,
  useBraintreePayPal,
} from "@paypal/react-paypal-js/sdk-v6";
import type {
  BraintreeApprovalData,
  BraintreeOnCancelData,
} from "@paypal/react-paypal-js/sdk-v6";
import { FlowNav } from "../storeDemo/components/FlowNav";
import { vaultPaymentMethod } from "../../utils";

const FLOW_LABEL = "Billing Agreement (Save PayPal)";

export const SavePaymentPage: React.FC = () => {
  const { braintreePayPalCheckoutInstance, loadingStatus } =
    useBraintreePayPal();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string | null>(null);

  const handleApprove = async (data: BraintreeApprovalData) => {
    if (!braintreePayPalCheckoutInstance) return;
    const { nonce } =
      await braintreePayPalCheckoutInstance.tokenizePayment(data);
    const result = await vaultPaymentMethod(nonce);
    console.log("Vault result", result);
    navigate("/confirmation", {
      state: { flowLabel: FLOW_LABEL, vaulted: true },
    });
  };

  return (
    <div>
      <FlowNav flowLabel={FLOW_LABEL} />
      <h1>Save your PayPal account</h1>
      <p>
        This flow saves the buyer's PayPal account on your Braintree vault
        without charging anything now. Use it for account-settings pages,
        subscription sign-up before the first billing cycle, or any vault-first
        flow.
      </p>
      <p>
        On approval, the demo calls{" "}
        <code>POST /braintree-api/payment-method/save</code> with the tokenized
        nonce.
      </p>

      <div className="checkout-button-wrap">
        {loadingStatus === INSTANCE_LOADING_STATE.RESOLVED ? (
          <BraintreePayPalBillingAgreementButton
            type="subscribe"
            onApprove={handleApprove}
            onCancel={(data: BraintreeOnCancelData) => {
              console.log("onCancel", data);
              setStatus("Cancelled.");
            }}
            onError={(err) => {
              console.error("onError", err);
              setStatus(`Error: ${err.message}`);
            }}
          />
        ) : (
          <p>Loading PayPal…</p>
        )}
      </div>
      {status && <p>{status}</p>}
    </div>
  );
};
