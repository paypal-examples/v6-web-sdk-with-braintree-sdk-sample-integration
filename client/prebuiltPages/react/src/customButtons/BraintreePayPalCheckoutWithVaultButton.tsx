import React from "react";
import { useBraintreePayPalCheckoutWithVaultSession } from "@paypal/react-paypal-js/sdk-v6";
import type { UseBraintreePayPalCheckoutWithVaultSessionProps } from "@paypal/react-paypal-js/sdk-v6";

export const BraintreePayPalCheckoutWithVaultButton: React.FC<
  UseBraintreePayPalCheckoutWithVaultSessionProps
> = (props) => {
  const { isPending, handleClick } =
    useBraintreePayPalCheckoutWithVaultSession(props);

  return (
    <paypal-button
      type="pay"
      onClick={() => handleClick()}
      disabled={isPending}
    ></paypal-button>
  );
};
