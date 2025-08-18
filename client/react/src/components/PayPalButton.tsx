import React, { useContext, useRef, useEffect } from "react";
import { PayPalSDKContext } from "../context/sdkContext";
import { captureOrder, createOrder } from "../utils";
import {
  OnApproveData,
  PaymentSessionOptions,
  SessionOutput,
} from "../types/paypal";
import { useErrorBoundary } from "react-error-boundary";
import { ModalType } from "../sections/SoccerBall";

const PayPalButton: React.FC<{ setModalState: (state: ModalType) => void }> = ({
  setModalState,
}) => {
  const { paypalInstance, braintreePayPalCheckout } =
    useContext(PayPalSDKContext);
  const { showBoundary } = useErrorBoundary();
  const paypalSession = useRef<SessionOutput | null>(null);

  useEffect(() => {
    if (paypalInstance && braintreePayPalCheckout) {
      paypalSession.current = paypalInstance.createPayPalOneTimePaymentSession({
        onApprove: async (data: OnApproveData) => {
          console.log("Payment approved:", data);
          // @ts-ignore
          const { nonce } = await braintreePayPalCheckout.tokenizePayment({
            // @ts-ignore
            payerID: data.payerId,
            paymentID: data.orderId,
          });
          const captureResult = await captureOrder(nonce);
          console.log("Payment capture result:", captureResult);
          setModalState("success");
        },

        onCancel: () => {
          console.log("Payment cancelled");
          setModalState("cancel");
        },

        onError: (error: Error) => {
          console.error("Payment error:", error);
          setModalState("error");
        },
      });
    }
  }, [paypalInstance, braintreePayPalCheckout]);

  const payPalOnClickHandler = async () => {
    if (!paypalSession.current || !braintreePayPalCheckout) return;

    try {
      await paypalSession.current.start(
        { presentationMode: "auto" },
        createOrder(braintreePayPalCheckout)
      );
    } catch (e) {
      console.error(e);
      showBoundary(e);
    }
  };

  if (!paypalInstance || !braintreePayPalCheckout) {
    return null;
  }

  return (
    <paypal-button
      onClick={() => payPalOnClickHandler()}
      type="pay"
      id="paypal-button"
    ></paypal-button>
  );
};

export default PayPalButton;
