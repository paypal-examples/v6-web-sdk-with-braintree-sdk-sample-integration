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

    await setupPayLaterButton(paypalCheckoutV6Instance);
  } catch (error) {
    renderAlert({
      type: "danger",
      message: "Failed to initialize PayPal Pay Later",
    });
    console.error(error);
  }
}

async function setupPayLaterButton(paypalCheckoutV6Instance) {
  const amount = "100.00";
  const currency = "USD";

  // Check if Pay Later is eligible for this transaction
  const eligibility = await paypalCheckoutV6Instance.findEligibleMethods({
    amount,
    currency,
    countryCode: "US",
  });

  if (!eligibility.paylater) {
    renderAlert({
      type: "warning",
      message: "Pay Later is not eligible for this transaction",
    });
    console.log("Pay Later not eligible for this transaction");
    return;
  }

  // Get additional details for button configuration
  const details = eligibility.getDetails("paylater");
  const payLaterButton = document.querySelector("#paypal-pay-later-button");

  // Configure button with details from eligibility check
  payLaterButton.setAttribute("countryCode", details.countryCode);
  payLaterButton.setAttribute("productCode", details.productCode);

  const payLaterPaymentSession = paypalCheckoutV6Instance.createPayLaterSession(
    {
      flow: "checkout",
      amount,
      currency,
      intent: "capture",
      async onApprove(data) {
        console.log("onApprove", data);
        const { nonce } = await paypalCheckoutV6Instance.tokenizePayment({
          orderID: data.orderId,
          payerID: data.payerId,
        });
        const orderData = await completePayment(nonce, amount);
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
    },
  );

  payLaterButton.removeAttribute("hidden");

  payLaterButton.addEventListener("click", async () => {
    try {
      await payLaterPaymentSession.start();
    } catch (error) {
      renderAlert({
        type: "danger",
        message: `PayPal Pay Later button click failure: ${error.message}`,
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

async function completePayment(paymentMethodNonce, amount) {
  const response = await fetch("/braintree-api/transaction/sale", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentMethodNonce,
      amount,
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
