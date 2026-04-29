export async function getBraintreeBrowserSafeClientToken(): Promise<string> {
  const response = await fetch(
    "/braintree-api/auth/browser-safe-client-token",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  const { clientToken } = await response.json();

  return clientToken;
}

export async function completePayment(
  paymentMethodNonce: string,
): Promise<any> {
  const response = await fetch("/braintree-api/transaction/sale", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentMethodNonce,
      amount: "10.00",
    }),
  });
  const result = await response.json();

  return result;
}
