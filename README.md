# PayPal v6 SDK with Braintree Integration Demo

This repository demonstrates how to process PayPal payments by integrating the Braintree Server/Client SDK with PayPal Checkout V6.

## Setup Instructions

### 1. Clone and Setup Environment

```bash
git clone https://github.com/paypal-examples/v6-web-sdk-sample-integration.git

cd v6-web-sdk-with-braintree-sdk-sample-integration

cp .env.sample .env

npm install
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

1. Follow the [Linking Braintree to PayPal Guide](https://developer.paypal.com/braintree/docs/guides/paypal/testing-go-live/javascript/v3/#linked-paypal-testing) to enable PayPal payments through your Braintree integration.

2. After creating your sandbox account go to the [Apps & Credentials section](https://developer.paypal.com/dashboard/applications/sandbox) and click on the PayPal application you linked to your Braintree account. Scroll to the "Features" section and make sure the "Vault" and "PayPal and Venmo" boxes are checked.

### 6. Run the Application

To run the server, choose a server implementation from the `server` folder at the root of this repository and follow the instructions in that folder's README. For example, for Node.js run:
   ```bash
   cd server/node
   npm install
   npm start
   ```

After running the server, go to [http://localhost:8081](http://localhost:8081) to see the client examples.
