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
  } catch (error) {
    console.error(error);
  }
}

// Step 1: vault a PayPal account so there is a saved payment method to edit
async function setupVaultButton(paypalCheckoutV6Instance) {
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

        await setupEditSavedPayment(paymentMethodData.paymentMethod.token);
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

// Step 2: exchange the vaulted payment method token for a client token that
// embeds it as the `preferredPaymentMethodToken`, then set up the edit session
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

    const editSession =
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
          console.log("Edit FI approved", payload);
        },
        onCancel(data) {
          console.log("onCancel", data);
        },
        onError(error) {
          console.log("onError", error);
        },
      });

    const editButton = document.querySelector("#edit-button");
    document.querySelector("#edit-section").removeAttribute("hidden");

    editButton.addEventListener("click", async () => {
      try {
        await editSession.start({ presentationMode: "auto" });
      } catch (error) {
        console.error(error);
      }
    });
  } catch (error) {
    console.error(error);
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
