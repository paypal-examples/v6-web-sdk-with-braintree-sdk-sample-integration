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
    paypalCheckoutV6Instance.createOneTimePaymentSession({
      amount: "35.00",
      currency: "USD",
      intent: "capture",
      lineItems: [
        { quantity: "2", unitAmount: "15.00", name: "Widget", kind: "debit" },
        { quantity: "1", unitAmount: "10.00", name: "Gadget", kind: "debit" },
        { quantity: "1", unitAmount: "5.00", name: "Discount", kind: "credit" },
      ],
      amountBreakdown: {
        itemTotal: "40.00",
        discount: "5.00",
      },
      async onApprove(data) {
        console.log("onApprove", data);
        const { nonce } = await paypalCheckoutV6Instance.tokenizePayment(data);
        const orderData = await completePayment(nonce);
        renderAlert({
          type: "success",
          message: `Order successfully captured: ${JSON.stringify(data)}`,
        });
        console.log("Capture result", orderData);
      },
      onCancel(data) {
        renderAlert({
          type: "warning",
          message: `onCancel() callback called: ${data.orderId ?? ""}`,
        });
        console.log("onCancel", data);
      },
      onError(error) {
        renderAlert({
          type: "danger",
          message: `onError() callback called: ${error.message}`,
        });
        console.log("onError", error);
      },
    });

  const paypalButton = document.querySelector("#paypal-button");
  paypalButton.removeAttribute("hidden");

  paypalButton.addEventListener("click", async () => {
    try {
      await paypalPaymentSession.start();
    } catch (error) {
      renderAlert({
        type: "danger",
        message: `PayPal button click failure: ${error.message}`,
      });
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

async function completePayment(paymentMethodNonce) {
  const response = await fetch("/braintree-api/transaction/sale", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentMethodNonce,
      // In production, fetch the final amount from your server
      amount: "35.00",
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
