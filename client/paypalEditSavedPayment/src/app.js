// Set once the one-time checkout below vaults a PayPal account.
let vaultedPaymentMethodToken = null;

// Set when the buyer approves an edited funding instrument via the saved
// payment method component. The submit button charges this nonce instead of
// the previously vaulted token.
let approvedNonce = null;

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

    setupVaultButton(paypalCheckoutV6Instance);

    document
      .querySelector("#submit-button")
      .addEventListener("click", onSubmitOrder);
  } catch (error) {
    console.error(error);
    renderAlert({ type: "danger", message: `Initialization failed: ${error}` });
  }
}

// A one-time checkout that vaults a PayPal account, so there is a saved
// payment method to preview/edit below.
function setupVaultButton(paypalCheckoutV6Instance) {
  const paypalPaymentSession =
    paypalCheckoutV6Instance.createBillingAgreementSession({
      billingAgreementDescription: "Save PayPal account to edit later",
      async onApprove(data) {
        console.log("onApprove", data);
        const { nonce } = await paypalCheckoutV6Instance.tokenizePayment({
          billingToken: data.billingToken,
        });
        const paymentMethodData = await vaultPaymentMethod(nonce);
        console.log("Vault result", paymentMethodData);

        vaultedPaymentMethodToken = paymentMethodData.paymentMethod.token;
        renderAlert({
          type: "success",
          message:
            'PayPal account saved — click it below to edit, or "Submit Order" to pay with it as-is.',
        });

        await setupEditSavedPayment(vaultedPaymentMethodToken);
      },
      onCancel(data) {
        renderAlert({ type: "warning", message: "onCancel() callback called" });
        console.log("onCancel", data);
      },
      onError(error) {
        renderAlert({
          type: "danger",
          message: `onError() callback called: ${error}`,
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
      console.error(error);
    }
  });
}

// Exchanges the vaulted payment method token for a client token that embeds
// it as the `preferredPaymentMethodToken`, then reveals the saved payment
// method component so the buyer can preview/edit it.
async function setupEditSavedPayment(preferredPaymentMethodToken) {
  try {
    const editClientToken = await getBraintreeBrowserSafeClientToken(
      preferredPaymentMethodToken,
    );
    const editBraintreeInstance = await window.braintree.client.create({
      authorization: editClientToken,
    });

    const editPaypalCheckoutV6Instance =
      await window.braintree.paypalCheckoutV6.create({
        client: editBraintreeInstance,
      });

    await editPaypalCheckoutV6Instance.loadPayPalSDK();

    const editSavedPaymentSession =
      editPaypalCheckoutV6Instance.createEditSavedPaymentSession({
        amount: "10.00",
        currency: "USD",
        intent: "authorize",
        commit: false,
        async onApprove(data) {
          console.log("onApprove", data);
          const payload = await editPaypalCheckoutV6Instance.tokenizePayment({
            orderId: data.orderId,
            payerId: data.payerId,
          });
          approvedNonce = payload.nonce;
          renderAlert({
            type: "success",
            message: `Payment method successfully updated for order ${data.orderId} — click "Submit Order" to charge it. ${JSON.stringify(data)}`,
          });
        },
        onCancel(data) {
          renderAlert({
            type: "warning",
            message: "onCancel() callback called",
          });
          console.log("onCancel", data);
        },
        onError(error) {
          renderAlert({
            type: "danger",
            message: `onError() callback called: ${error}`,
          });
          console.log("onError", error);
        },
      });

    const savedPaymentMethodComponent = document.querySelector(
      "#saved-payment-method",
    );
    savedPaymentMethodComponent.removeAttribute("hidden");

    savedPaymentMethodComponent.addEventListener("click", async () => {
      try {
        await editSavedPaymentSession.start({ presentationMode: "auto" });
      } catch (error) {
        console.error(error);
      }
    });
  } catch (error) {
    console.error(error);
    renderAlert({
      type: "danger",
      message: `Edit session setup failed: ${error}`,
    });
  }
}

async function onSubmitOrder() {
  const submitButton = document.querySelector("#submit-button");
  submitButton.disabled = true;

  try {
    if (!approvedNonce && !vaultedPaymentMethodToken) {
      renderAlert({
        type: "warning",
        message:
          "No payment method to submit — save a PayPal account first, or click it to approve an edit.",
      });
      return;
    }

    const transactionResult = await completePayment(
      approvedNonce
        ? { paymentMethodNonce: approvedNonce }
        : { paymentMethodToken: vaultedPaymentMethodToken },
    );

    approvedNonce = null;
    console.log("Sale result", transactionResult);
    renderAlert({
      type: "success",
      message: `Order successfully captured! ${JSON.stringify(transactionResult)}`,
    });
  } catch (error) {
    console.error(error);
    renderAlert({
      type: "danger",
      message: `Order submit failed: ${error.message}`,
    });
  } finally {
    submitButton.disabled = false;
  }
}

async function getBraintreeBrowserSafeClientToken(preferredPaymentMethodToken) {
  const url = preferredPaymentMethodToken
    ? `/braintree-api/auth/browser-safe-client-token?preferredPaymentMethodToken=${encodeURIComponent(preferredPaymentMethodToken)}`
    : "/braintree-api/auth/browser-safe-client-token";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
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

async function completePayment(paymentSource) {
  const response = await fetch("/braintree-api/transaction/sale", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...paymentSource,
      amount: "10.00",
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
