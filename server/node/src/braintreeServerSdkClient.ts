import braintree from "braintree";

const {
  BRAINTREE_SANDBOX_MERCHANT_ID,
  BRAINTREE_SANDBOX_MERCHANT_PUBLIC_KEY,
  BRAINTREE_SANDBOX_MERCHANT_PRIVATE_KEY,
} = process.env;

if (
  !BRAINTREE_SANDBOX_MERCHANT_ID ||
  !BRAINTREE_SANDBOX_MERCHANT_PUBLIC_KEY ||
  !BRAINTREE_SANDBOX_MERCHANT_PRIVATE_KEY
) {
  throw new Error("Missing Braintree credentials");
}

export const client = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: BRAINTREE_SANDBOX_MERCHANT_ID,
  publicKey: BRAINTREE_SANDBOX_MERCHANT_PUBLIC_KEY,
  privateKey: BRAINTREE_SANDBOX_MERCHANT_PRIVATE_KEY,
});
