// Populated by the "Set" button in Step 2. Only one of the two is required.
const vaultConfig = {
  vaultId: "",
  targetCustomerId: "",
};

// Set when the buyer approves an edited funding instrument via the saved
// payment method component. The submit button charges this nonce instead of
// falling back to the vault ID entered in Step 2.
let approvedNonce = null;

const ORDER_AMOUNT = "10.00";

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
      .querySelector("#set-vault-config")
      .addEventListener("click", setupEditSavedPayment);

    document
      .querySelector("#submit-button")
      .addEventListener("click", onSubmitOrder);
  } catch (error) {
    console.error(error);
    renderAlert("#step1-alert", {
      type: "danger",
      message: `Initialization failed: ${error}`,
    });
  }
}

// Step 1: a one-time checkout that vaults a PayPal account. Displays the
// resulting vault ID and customer ID, which a merchant would normally save
// server-side to look up this payment method on a future visit.
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

        const { token: vaultId, customerId } = paymentMethodData.paymentMethod;
        displayVaultedIds({ vaultId, customerId });
        renderAlert("#step1-alert", {
          type: "success",
          message: "Vaulted! Use one of the IDs below in Step 2.",
        });
      },
      onCancel(data) {
        renderAlert("#step1-alert", {
          type: "warning",
          message: "onCancel() callback called",
        });
        console.log("onCancel", data);
      },
      onError(error) {
        renderAlert("#step1-alert", {
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

// Tracks the active session so the click handler (attached once) always
// uses the most recently configured SDK instance.
let editSavedPaymentSession;

// Step 2: exchange the merchant-provided vault ID or target customer ID for
// a client token, then render the saved payment method component.
async function setupEditSavedPayment() {
  try {
    // Changing the vault configuration invalidates any previously-approved
    // edit.
    approvedNonce = null;

    vaultConfig.vaultId = document.querySelector("#vault-id").value.trim();
    vaultConfig.targetCustomerId = document
      .querySelector("#target-customer-id")
      .value.trim();

    const editClientToken = await getBraintreeBrowserSafeClientToken({
      preferredPaymentMethodToken: vaultConfig.vaultId,
      customerId: vaultConfig.targetCustomerId,
    });
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
          renderAlert("#step2-alert", {
            type: "success",
            message: `Payment method successfully updated for order ${data.orderId} — click "Submit Order" to charge it. ${JSON.stringify(data)}`,
          });
        },
        onCancel(data) {
          renderAlert("#step2-alert", {
            type: "warning",
            message: "onCancel() callback called",
          });
          console.log("onCancel", data);
        },
        onError(error) {
          renderAlert("#step2-alert", {
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
    renderAlert("#step2-alert", {
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
      renderAlert("#step2-alert", {
        type: "warning",
        message:
          "No payment method to submit — enter a vault ID in Step 2, or click the saved payment method to approve an edit first.",
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
    renderAlert("#step2-alert", {
      type: "success",
      message: `Order successfully captured! ${JSON.stringify(transactionResult)}`,
    });
  } catch (error) {
    console.error(error);
    renderAlert("#step2-alert", {
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
      amount: ORDER_AMOUNT,
    }),
  });
  const result = await response.json();

  return result;
}

function renderAlert(target, { type, message }) {
  const alertComponentElement = document.querySelector(target);
  if (!alertComponentElement) {
    return;
  }

  alertComponentElement.setAttribute("type", type);
  alertComponentElement.innerText = message;
}

// Persists the vaulted IDs on the page (rather than just the transient
// alert) so a merchant can copy them into the Step 2 form.
function displayVaultedIds({ vaultId, customerId }) {
  document.querySelector("#vaulted-customer-id").textContent = customerId;
  document.querySelector("#vaulted-vault-id").textContent = vaultId;
  document.querySelector("#vaulted-ids").removeAttribute("hidden");
}
