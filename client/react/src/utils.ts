import type { PayPalCheckout } from "braintree-web";

export const getBrowserSafeClientToken = async () => {
  {
    const response = await fetch("/api/braintree/browser-safe-client-token", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const { accessToken } = await response.json();

    return accessToken;
  }
};

export const createOrder = async (braintreeCheckout: PayPalCheckout) => {
  const orderId = await braintreeCheckout.createPayment({
    // @ts-ignore
    flow: "checkout",
    amount: 10.0,
    currency: "USD",
    // @ts-ignore
    intent: "capture",
  });

  return { orderId };
};

export const captureOrder = async (paymentMethodNonce: string) => {
  const response = await fetch("/api/braintree/transaction/sale", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentMethodNonce,
      amount: 10.0,
    }),
  });
  const result = await response.json();

  return result;
};
