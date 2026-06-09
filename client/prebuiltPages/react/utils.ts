export async function getBraintreeBrowserSafeClientToken(): Promise<string> {
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

// Slim subset of braintree's ValidatedResponse<Transaction>. See @types/braintree for full types.
interface TransactionSaleResponseObject {
  success: boolean;
  message: string;
  transaction: {
    id: string;
    amount: string;
    status: string;
    type: string;
    currencyIsoCode: string;
    processorResponseCode: string;
    processorResponseText: string;
  };
}

export async function completePayment(
  paymentMethodNonce: string,
  amount: string,
): Promise<TransactionSaleResponseObject> {
  const response = await fetch("/braintree-api/transaction/sale", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentMethodNonce,
      amount,
    }),
  });
  const result = await response.json();

  return result;
}

export async function vaultPaymentMethod(paymentMethodNonce: string) {
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

export async function completePaymentAndVault(
  paymentMethodNonce: string,
  amount: string,
) {
  const response = await fetch("/braintree-api/transaction/sale", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentMethodNonce,
      amount,
      options: {
        storeInVaultOnSuccess: true,
      },
    }),
  });
  const result = await response.json();

  return result;
}

export interface Product {
  sku: string;
  name: string;
  price: string;
}

export async function getProducts(): Promise<Product[]> {
  const response = await fetch("/braintree-api/products");
  return response.json();
}
