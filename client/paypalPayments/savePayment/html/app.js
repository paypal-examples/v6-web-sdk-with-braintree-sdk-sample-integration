async function onPayPalWebSdkLoaded() {
  try {
    const braintreeClientToken = await getBraintreeBrowserSafeClientToken();
    const paypalInstance = await window.paypal.createInstance({
      clientToken: braintreeClientToken,
      components: ['paypal-billing-agreements'],
      pageType: 'checkout',
    });

    const braintreeInstance = await window.braintree.client.create({
      authorization: braintreeClientToken,
    });

    const braintreeCheckout = await window.braintree.paypalCheckout.create({
      client: braintreeInstance,
    });

    setupPayPalButton({ paypalInstance, braintreeCheckout });
  } catch (error) {
    console.error(error);
  }
}

async function setupPayPalButton({ paypalInstance, braintreeCheckout }) {
  const paypalPaymentSession =
    paypalInstance.createPayPalBillingAgreementWithoutPurchase({
      async onApprove(data) {
        console.log('onApprove', data);
        const { nonce } = await braintreeCheckout.tokenizePayment({
          billingToken: data.billingToken,
          payerID: data.payerId,
          paymentID: data.orderId,
          vault: true,
        });
        const orderData = await completePayment(nonce);
        console.log('Capture result', orderData);
      },
      onCancel(data) {
        console.log('onCancel', data);
      },
      onError(error) {
        console.log('onError', error);
      },
    });

  const paypalButton = document.querySelector('#paypal-button');
  paypalButton.removeAttribute('hidden');

  paypalButton.addEventListener('click', async () => {
    try {
      await paypalPaymentSession.start(
        {
          presentationMode: 'auto',
        },
        createOrder(braintreeCheckout)
      );
    } catch (error) {
      console.error(error);
    }
  });
}

async function createOrder(braintreeCheckout) {
  console.log('Creating payment>');
  const billingToken = await braintreeCheckout.createPayment({
    flow: 'vault', // Required
    billingAgreementDescription: 'Your agreement description',
    enableShippingAddress: true,
    shippingAddressEditable: false,
    shippingAddressOverride: {
      recipientName: 'Scruff McGruff',
      line1: '1234 Main St.',
      line2: 'Unit 1',
      city: 'Chicago',
      countryCode: 'US',
      postalCode: '60652',
      state: 'IL',
      phone: '123.456.7890',
    },
  });

  return { billingToken };
}

async function getBraintreeBrowserSafeClientToken() {
  const response = await fetch('/api/braintree/browser-safe-client-token', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const { accessToken } = await response.json();

  return accessToken;
}

async function completePayment(paymentMethodNonce) {
  const response = await fetch('/api/braintree/payment-method/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentMethodNonce,
    }),
  });
  const result = await response.json();

  return result;
}
