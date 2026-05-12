import React from "react";
import { useBraintreePayPalOneTimePaymentSession } from "@paypal/react-paypal-js/sdk-v6";
import type { UseBraintreePayPalOneTimePaymentSessionProps } from "@paypal/react-paypal-js/sdk-v6";

export const PayPalOneTimePaymentButton: React.FC<
  UseBraintreePayPalOneTimePaymentSessionProps
> = (props) => {
  const { isPending, handleClick } =
    useBraintreePayPalOneTimePaymentSession(props);

  return (
    <paypal-button
      onClick={() => handleClick()}
      disabled={isPending}
    ></paypal-button>
  );
};
