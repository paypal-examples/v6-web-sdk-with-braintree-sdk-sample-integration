const LINE_ITEMS = [
  { quantity: "2", unitAmount: "15.00", name: "Widget", kind: "debit" },
  { quantity: "1", unitAmount: "10.00", name: "Gadget", kind: "debit" },
];

const itemTotal = LINE_ITEMS.reduce(
  (total, item) =>
    total + parseFloat(item.quantity) * parseFloat(item.unitAmount),
  0,
).toFixed(2);

const SHIPPING_OPTIONS = [
  {
    id: "standard",
    label: "Standard Shipping (5-7 days)",
    type: "SHIPPING",
    amount: { currency: "USD", value: "5.00" },
  },
  {
    id: "express",
    label: "Express Shipping (3-5 days)",
    type: "SHIPPING",
    amount: { currency: "USD", value: "12.00" },
  },
  {
    id: "pickup",
    label: "Store Pickup (Free)",
    type: "PICKUP",
    amount: { currency: "USD", value: "0.00" },
  },
];

function getShippingCost(shippingId) {
  return SHIPPING_OPTIONS.find((option) => option.id === shippingId)?.amount
    ?.value;
}

function getShippingOptions(selectedId) {
  return SHIPPING_OPTIONS.map((option) => ({
    ...option,
    selected: option.id === selectedId,
  }));
}

function getAmountBreakdown({ itemTotal, shippingCost }) {
  return {
    itemTotal,
    discount: "0.00",
    shipping: shippingCost,
    handling: "0.00",
    taxTotal: "0.00",
    insurance: "0.00",
    shippingDiscount: "0.00",
  };
}

function calculateAmount({ itemTotal, shippingCost }) {
  return (parseFloat(itemTotal) + parseFloat(shippingCost)).toFixed(2);
}

function getOrderId(data) {
  return data.orderID || data.orderId || "";
}

function updateOrderDetails(shippingId) {
  shippingOptions = getShippingOptions(shippingId);
  shippingCost = getShippingCost(shippingId);
  amountBreakdown = getAmountBreakdown({ itemTotal, shippingCost });
  amount = calculateAmount({ itemTotal, shippingCost });
}

let shippingId = "standard";
let shippingOptions;
let shippingCost;
let amountBreakdown;
let amount;

updateOrderDetails(shippingId);

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
    paypalCheckoutV6Instance.createOneTimePaymentSession({
      amount,
      currency: "USD",
      intent: "capture",
      lineItems: LINE_ITEMS,
      shippingOptions,
      amountBreakdown,
      onShippingAddressChange(data) {
        if (data?.shippingAddress?.countryCode !== "US") {
          throw new Error(data?.errors?.COUNTRY_ERROR);
        }

        const postalCode = parseFloat(data?.shippingAddress?.postalCode);

        if (postalCode === 28786) {
          shippingId = "pickup";
          updateOrderDetails(shippingId);
        } else if (postalCode >= 70000) {
          shippingId = "express";
          updateOrderDetails(shippingId);
        } else {
          shippingId = "standard";
          updateOrderDetails(shippingId);
        }

        return paypalCheckoutV6Instance
          .updatePayment({
            paymentId: getOrderId(data),
            amount,
            currency: "USD",
            lineItems: LINE_ITEMS,
            shippingOptions,
            amountBreakdown,
          })
          .then((response) => response);
      },
      async onApprove(data) {
        const { nonce } = await paypalCheckoutV6Instance.tokenizePayment({
          orderID: getOrderId(data),
          payerID: data.payerID || data.payerId || data.PayerID,
        });
        const orderData = await completePayment(nonce);
        console.log("Capture result", orderData);
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

async function completePayment(paymentMethodNonce) {
  const response = await fetch("/braintree-api/transaction/sale", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentMethodNonce,
      // In production, fetch the final amount from your server
      amount,
    }),
  });
  const result = await response.json();

  return result;
}
