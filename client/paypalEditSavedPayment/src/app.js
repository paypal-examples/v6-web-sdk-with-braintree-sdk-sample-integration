// Populated by the "Set" button below. Only one of the two is required.
const vaultConfig = {
  vaultId: "",
  targetCustomerId: "",
};

// Set when the buyer approves an edited funding instrument via the saved
// payment method component. The submit button charges this nonce instead of
// falling back to the vault ID entered below.
let approvedNonce = null;

const ORDER_AMOUNT = "10.00";

function onPayPalCheckoutV6Loaded() {
  document
    .querySelector("#set-vault-config")
    .addEventListener("click", setupEditSavedPayment);

  document
    .querySelector("#submit-button")
    .addEventListener("click", onSubmitOrder);
}

// Tracks the active session so the click handler (attached once) always
// uses the most recently configured SDK instance.
let editSavedPaymentSession;

// Exchange the merchant-provided vault ID or target customer ID for a client
// token, then render the saved payment method component.
async function setupEditSavedPayment() {
  try {
    // Changing the vault configuration invalidates any previously-approved
    // edit.
    approvedNonce = null;

    vaultConfig.vaultId = document.querySelector("#vault-id").value.trim();
    vaultConfig.targetCustomerId = document
      .querySelector("#target-customer-id")
      .value.trim();

    const { clientToken: editClientToken, preferredPaymentMethodToken } =
      await getBraintreeBrowserSafeClientToken({
        preferredPaymentMethodToken: vaultConfig.vaultId,
        customerId: vaultConfig.targetCustomerId,
      });
    vaultConfig.vaultId = preferredPaymentMethodToken;
    const editBraintreeInstance = await window.braintree.client.create({
      authorization: editClientToken,
    });

    const editPaypalCheckoutV6Instance =
      await window.braintree.paypalCheckoutV6.create({
        client: editBraintreeInstance,
      });

    await editPaypalCheckoutV6Instance.loadPayPalSDK();

    editSavedPaymentSession =
      editPaypalCheckoutV6Instance.createEditSavedPaymentSession({
        amount: ORDER_AMOUNT,
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
    document
      .querySelector("#saved-payment-method-container")
      .removeAttribute("hidden");
    document.querySelector("#submit-button").removeAttribute("hidden");
    document.querySelector("#vault-config").setAttribute("hidden", "");

    if (savedPaymentMethodComponent.dataset.listenerAttached) {
      return;
    }
    savedPaymentMethodComponent.dataset.listenerAttached = "true";

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
    if (!approvedNonce && !vaultConfig.vaultId) {
      renderAlert({
        type: "warning",
        message:
          "No payment method to submit — enter a vault ID above, or click the saved payment method to approve an edit first.",
      });
      return;
    }

    const transactionResult = await completePayment(
      approvedNonce
        ? { paymentMethodNonce: approvedNonce }
        : { paymentMethodToken: vaultConfig.vaultId },
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

async function getBraintreeBrowserSafeClientToken({
  preferredPaymentMethodToken,
  customerId,
} = {}) {
  const queryParams = new URLSearchParams();
  if (preferredPaymentMethodToken) {
    queryParams.append(
      "preferredPaymentMethodToken",
      preferredPaymentMethodToken,
    );
  }
  if (customerId) {
    queryParams.append("customerId", customerId);
  }

  const queryString = queryParams.toString();
  const url = queryString
    ? `/braintree-api/auth/browser-safe-client-token?${queryString}`
    : "/braintree-api/auth/browser-safe-client-token";

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.json();
}

async function completePayment(paymentSource) {
  const response = await fetch("/braintree-api/transaction/sale", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...paymentSource,
      amount: ORDER_AMOUNT,
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
