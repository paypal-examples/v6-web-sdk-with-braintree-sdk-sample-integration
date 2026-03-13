async function onPayPalCheckoutV6Loaded() {
  try {
    const braintreeClientToken = await getBraintreeBrowserSafeClientToken();
    const braintreeInstance = await window.braintree.client.create({
      authorization: braintreeClientToken,
    });

    const paypalCheckoutV6Instance =
      await window.braintree.paypalCheckoutV6.create({
        client: braintreeInstance,
      });

    await paypalCheckoutV6Instance.loadPayPalSDK();

    setupPayPalButton(paypalCheckoutV6Instance);
  } catch (error) {
    console.error(error);
  }
}

async function setupPayPalButton(paypalCheckoutV6Instance) {
  const paypalPaymentSession =
    paypalCheckoutV6Instance.createBillingAgreementSession({
      billingAgreementDescription: "Pay-as-you-go service",
      planType: "UNSCHEDULED",
      amount: "29.99",
      currency: "USD",
      planMetadata: {
        billingCycles: [
          {
            billingFrequency: "1",
            billingFrequencyUnit: "MONTH",
            numberOfExecutions: "1",
            sequence: "1",
            startDate: new Date(Date.now() + 86400000)
              .toISOString()
              .split("T")[0],
            trial: false,
            pricingScheme: {
              pricingModel: "AUTO_RELOAD",
              price: "29.99",
            },
          },
        ],
        currencyIsoCode: "USD",
        name: "On-Demand Billing",
        productDescription: "Charges as services are provided",
        productQuantity: "1.0",
        productPrice: "29.99",
        totalAmount: "29.99",
      },
      async onApprove(data) {
        console.log("onApprove", data);
        const { nonce } = await paypalCheckoutV6Instance.tokenizePayment({
          billingToken: data.billingToken,
        });
        const paymentMethodData = await vaultPaymentMethod(nonce);
        console.log("Vault result", paymentMethodData);
      },
      onCancel(data) {
        console.log("onCancel", data);
      },
      onError(error) {
        console.log("onError", error);
      },
    });

  const paypalButton = document.querySelector("#paypal-button");
  paypalButton.removeAttribute("hidden");

  paypalButton.addEventListener("click", async () => {
    try {
      await paypalPaymentSession.start();
    } catch (error) {
      console.error(error);
    }
  });
}

async function getBraintreeBrowserSafeClientToken() {
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

async function vaultPaymentMethod(paymentMethodNonce) {
  const response = await fetch("/braintree-api/payment-method/save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentMethodNonce,
    }),
  });
  const result = await response.json();

  return result;
}
