# PayPal v6 SDK with Braintree Integration Demo

This repository demonstrates how to process PayPal payments by integrating the Braintree Server/Client SDK with the PayPal v6 Web SDK.

## Setup Instructions

### 1. Clone and Setup Environment

```bash
git clone https://github.com/paypal-examples/v6-web-sdk-sample-integration.git

cd v6-web-sdk-with-braintree-sdk-sample-integration

npm install

cp .env.sample .env
```

### 2. Create a Braintree Sandbox Account

1. Go to [Braintree Sandbox](https://www.braintreepayments.com/sandbox)
2. Sign up for a free sandbox account
3. Note your **Merchant ID**, **Public Key**, and **Private Key** from Settings > API

### 3. Configure Environment Variables

Edit the `.env` file with your Braintree credentials from step 
```
BRAINTREE_SANDBOX_MERCHANT_ID=your_braintree_sandbox_merchant_id_here
BRAINTREE_SANDBOX_MERCHANT_PUBLIC_KEY=your_braintree_sandbox_public_key_here
BRAINTREE_SANDBOX_MERCHANT_PRIVATE_KEY=your_braintree_sandbox_private_key_here
```

### 4. Create a PayPal Sandbox Business Account

Go to [PayPal Developer Portal](https://www.paypal.com/signin/client?flow=provisionUser) and create a sandbox business account.

### 5. Link Braintree Sandbox Account with PayPal sandbox account.

Follow the [Linking Braintree to PayPal Guide](https://developer.paypal.com/braintree/docs/guides/paypal/testing-go-live/javascript/v3/#linked-paypal-testing) to enable PayPal payments through your Braintree integration.

### 6. Run the Application

```bash
npm start
```

Visit http://localhost:3000 to see the demo.
