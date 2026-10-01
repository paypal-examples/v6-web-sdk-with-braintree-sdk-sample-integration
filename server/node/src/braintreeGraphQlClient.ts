const {
  BRAINTREE_SANDBOX_MERCHANT_PUBLIC_KEY,
  BRAINTREE_SANDBOX_MERCHANT_PRIVATE_KEY,
} = process.env;

if (
  !BRAINTREE_SANDBOX_MERCHANT_PUBLIC_KEY ||
  !BRAINTREE_SANDBOX_MERCHANT_PRIVATE_KEY
) {
  throw new Error("Missing Braintree credentials");
}

const GRAPHQL_ENDPOINT = "https://payments.sandbox.braintree-api.com/graphql";

interface ICreateClientTokenResponse {
  data?: {
    createClientToken: {
      clientToken: string;
    };
  };
  errors?: Array<{ message: string }>;
}

/**
 * Embeds a `preferredPaymentMethodToken` (used by PayPal Checkout V6's Edit
 * Saved Payment flow) into a client token. The REST `client_token` endpoint
 * used by the Braintree Node SDK has no equivalent option, so this calls the
 * GraphQL API directly, where the field is named `paymentMethodId`.
 */
export async function generateClientTokenWithPreferredPaymentMethod(
  preferredPaymentMethodToken: string,
): Promise<string> {
  const authorization = Buffer.from(
    `${BRAINTREE_SANDBOX_MERCHANT_PUBLIC_KEY}:${BRAINTREE_SANDBOX_MERCHANT_PRIVATE_KEY}`,
  ).toString("base64");

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authorization}`,
      "Braintree-Version": "2023-07-03",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query:
        "mutation CreateClientToken($input: CreateClientTokenInput!) { createClientToken(input: $input) { clientToken } }",
      variables: {
        input: {
          clientToken: {
            paymentMethodId: preferredPaymentMethodToken,
          },
        },
      },
    }),
  });

  const result = (await response.json()) as ICreateClientTokenResponse;
  const clientToken = result.data?.createClientToken?.clientToken;

  if (!clientToken) {
    const graphQLErrorMessage = result.errors
      ?.map((error) => error.message)
      .join("; ");

    throw new Error(
      graphQLErrorMessage
        ? `Failed to generate client token: ${graphQLErrorMessage}`
        : "Failed to generate client token",
    );
  }

  return clientToken;
}
