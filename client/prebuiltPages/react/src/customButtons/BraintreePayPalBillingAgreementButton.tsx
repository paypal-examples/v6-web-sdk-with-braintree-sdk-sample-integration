import React from "react";
import { useBraintreePayPalBillingAgreementSession } from "@paypal/react-paypal-js/sdk-v6";
import type { UseBraintreePayPalBillingAgreementSessionProps } from "@paypal/react-paypal-js/sdk-v6";

export const PayPalBillingAgreementButton: React.FC<
  UseBraintreePayPalBillingAgreementSessionProps
> = (props) => {
  const { isPending, handleClick } = useBraintreePayPalBillingAgreementSession(props);

  return (
    <paypal-button
      type="checkout"
      onClick={() => handleClick()}
      disabled={isPending}
    ></paypal-button>
  );
};
