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
    renderAlert({ type: "danger", message: "Failed to initialize PayPal" });
    console.error(error);
  }
}

async function setupPayPalButton(paypalCheckoutV6Instance) {
  const paypalPaymentSession =
    paypalCheckoutV6Instance.createBillingAgreementSession({
      billingAgreementDescription: "Save PayPal account for future payments",
      async onApprove(data) {
        console.log("onApprove", data);
        const { nonce } = await paypalCheckoutV6Instance.tokenizePayment({
          billingToken: data.billingToken,
        });
        const paymentMethodData = await vaultPaymentMethod(nonce);
        renderAlert({
          type: "success",
          message: `Payment method successfully vaulted: ${JSON.stringify(data)}`,
        });
        console.log("Vault result", paymentMethodData);
      },
      onCancel(data) {
        renderAlert({ type: "warning", message: `onCancel() callback called: ${data.billingToken ?? ""}` });
        console.log("onCancel", data);
      },
      onError(error) {
        renderAlert({ type: "danger", message: `onError() callback called: ${error.message}` });
        console.log("onError", error);
      },
    });

  const paypalButton = document.querySelector("#paypal-button");
  paypalButton.removeAttribute("hidden");

  paypalButton.addEventListener("click", async () => {
    try {
      await paypalPaymentSession.start();
    } catch (error) {
      renderAlert({ type: "danger", message: `PayPal button click failure: ${error.message}` });
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

function renderAlert({ type, message }) {
  const alertComponentElement = document.querySelector("alert-component");
  if (!alertComponentElement) {
    return;
  }

  alertComponentElement.setAttribute("type", type);
  alertComponentElement.innerText = message;
}
