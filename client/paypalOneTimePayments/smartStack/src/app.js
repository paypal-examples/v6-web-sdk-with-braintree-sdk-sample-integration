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

    await setupSmartPaymentStack(paypalCheckoutV6Instance);
  } catch (error) {
    renderAlert({
      type: "danger",
      message: "Failed to initialize PayPal Smart Payment Stack",
    });
    console.error(error);
  }
}

async function setupSmartPaymentStack(paypalCheckoutV6Instance) {
  const amount = "100.00";
  const currency = "USD";

  const callbacks = {
    async onApprove(data) {
      console.log("onApprove", data);
      const { nonce } = await paypalCheckoutV6Instance.tokenizePayment(data);
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
  };

  // Check eligibility for all payment methods
  const eligibility = await paypalCheckoutV6Instance.findEligibleMethods({
    amount,
    currency,
  });

  // Set up PayPal button (always available)
  const paypalButton = document.querySelector("#paypal-button");
  const paypalSession = paypalCheckoutV6Instance.createOneTimePaymentSession({
    amount,
    currency,
    intent: "capture",
    ...callbacks,
  });
  paypalButton.removeAttribute("hidden");
  paypalButton.addEventListener("click", () => paypalSession.start());

  // Set up Pay Later button if eligible
  if (eligibility.paylater) {
    const details = eligibility.getDetails("paylater");
    const paylaterButton = document.querySelector("#paylater-button");
    paylaterButton.setAttribute("countryCode", details.countryCode);
    paylaterButton.setAttribute("productCode", details.productCode);
    const paylaterSession = paypalCheckoutV6Instance.createPayLaterSession({
      amount,
      currency,
      intent: "capture",
      ...callbacks,
    });
    paylaterButton.removeAttribute("hidden");
    paylaterButton.addEventListener("click", () => paylaterSession.start());
  }

  // Set up PayPal Credit button if eligible
  if (eligibility.credit) {
    const details = eligibility.getDetails("credit");
    const creditButton = document.querySelector("#paypal-credit-button");
    creditButton.setAttribute("countryCode", details.countryCode);
    const creditSession = paypalCheckoutV6Instance.createOneTimePaymentSession({
      amount,
      currency,
      intent: "capture",
      offerCredit: true,
      ...callbacks,
    });
    creditButton.removeAttribute("hidden");
    creditButton.addEventListener("click", () => creditSession.start());
  }
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
