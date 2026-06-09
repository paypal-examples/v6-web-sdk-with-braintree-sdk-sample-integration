import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BraintreePayPalCheckoutWithVaultButton,
  INSTANCE_LOADING_STATE,
  useBraintreePayPal,
} from "@paypal/react-paypal-js/sdk-v6";
import type { BraintreeApprovalData } from "@paypal/react-paypal-js/sdk-v6";
import { useCart } from "../storeDemo/context/useCart";
import { FlowNav } from "../storeDemo/components/FlowNav";
import { CartLineItem } from "../storeDemo/components/CartLineItem";
import { completePaymentAndVault } from "../../utils";

const FLOW_LABEL = "Checkout with Vault";
const FLOW_BASE = "/vault-with-purchase";

export const VaultWithPurchaseCheckout: React.FC = () => {
  const { lineItems, total, clear } = useCart();
  const { braintreePayPalCheckoutInstance, loadingStatus } =
    useBraintreePayPal();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string | null>(null);

  const empty = lineItems.length === 0;

  const handleApprove = async (data: BraintreeApprovalData) => {
    if (!braintreePayPalCheckoutInstance) return;
    const { nonce } =
      await braintreePayPalCheckoutInstance.tokenizePayment(data);
    const result = await completePaymentAndVault(nonce, total);
    console.log("Transaction + vault result", result);
    if (result.success) {
      clear();
      navigate("/confirmation", {
        state: {
          flowLabel: FLOW_LABEL,
          transactionId: result.transaction?.id,
          amount: total,
          vaulted: true,
        },
      });
    } else {
      setStatus(`Transaction failed: ${result.message}`);
    }
  };

  return (
    <div>
      <FlowNav
        flowLabel={FLOW_LABEL}
        steps={[
          { label: "Products", to: FLOW_BASE },
          { label: "Cart", to: `${FLOW_BASE}/cart` },
          { label: "Checkout" },
        ]}
      />
      <h1>Checkout & save PayPal</h1>
      <p>
        Charges the cart total <strong>and</strong> saves the buyer's PayPal
        account in a single approval.
      </p>

      {empty ? (
        <p>
          Your cart is empty. <Link to={FLOW_BASE}>Browse products</Link>.
        </p>
      ) : (
        <>
          <div className="cart-list">
            {lineItems.map((line) => (
              <CartLineItem
                key={line.sku}
                product={line.product}
                quantity={line.quantity}
                subtotal={line.subtotal}
                onQuantityChange={() => {}}
                onRemove={() => {}}
                readOnly
              />
            ))}
          </div>
          <div className="cart-summary">
            <strong>Total: ${total}</strong>
          </div>

          <div className="checkout-button-wrap">
            {loadingStatus === INSTANCE_LOADING_STATE.RESOLVED ? (
              <BraintreePayPalCheckoutWithVaultButton
                amount={total}
                currency="USD"
                intent="capture"
                type="buynow"
                billingAgreementDetails={{
                  description: "Save payment method for future purchases",
                }}
                onApprove={handleApprove}
              />
            ) : (
              <p>Loading PayPal…</p>
            )}
          </div>
          {status && <p className="error">{status}</p>}
        </>
      )}
    </div>
  );
};
