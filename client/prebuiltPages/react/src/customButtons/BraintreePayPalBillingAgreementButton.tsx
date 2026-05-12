import React from "react";
import { useBraintreeBillingAgreementSession } from "@paypal/react-paypal-js/sdk-v6";
import type { UseBraintreeBillingAgreementSessionProps } from "@paypal/react-paypal-js/sdk-v6";

export const PayPalBillingAgreementButton: React.FC<
  UseBraintreeBillingAgreementSessionProps
> = (props) => {
  const { isPending, handleClick } =
    useBraintreeBillingAgreementSession(props);

  return (
    <paypal-button
      type="checkout"
      onClick={() => handleClick()}
      disabled={isPending}
    ></paypal-button>
  );
};
