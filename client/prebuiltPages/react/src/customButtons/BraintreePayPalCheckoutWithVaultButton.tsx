import React from "react";
import { useBraintreeCheckoutWithVaultSession } from "@paypal/react-paypal-js/sdk-v6";
import type { UseBraintreeCheckoutWithVaultSessionProps } from "@paypal/react-paypal-js/sdk-v6";

export const BraintreePayPalCheckoutWithVaultButton: React.FC<
  UseBraintreeCheckoutWithVaultSessionProps
> = (props) => {
  const { isPending, handleClick } =
    useBraintreeCheckoutWithVaultSession(props);

  return (
    <paypal-button
      type="pay"
      onClick={() => handleClick()}
      disabled={isPending}
    ></paypal-button>
  );
};
