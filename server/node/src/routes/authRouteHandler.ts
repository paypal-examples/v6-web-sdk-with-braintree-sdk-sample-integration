import type { Request, Response } from "express";
import { z } from "zod/v4";

import { client } from "../braintreeServerSdkClient";
import { generateClientTokenWithPreferredPaymentMethod } from "../braintreeGraphQlClient";

export async function clientTokenRouteHandler(
  request: Request,
  response: Response,
) {
  const { preferredPaymentMethodToken, customerId } = z
    .object({
      preferredPaymentMethodToken: z.string().optional(),
      customerId: z.string().optional(),
    })
    .parse(request.query);

  const resolvedPreferredPaymentMethodToken =
    preferredPaymentMethodToken ||
    (customerId
      ? await findPayPalAccountTokenForCustomer(customerId)
      : undefined);

  if (resolvedPreferredPaymentMethodToken) {
    const clientToken = await generateClientTokenWithPreferredPaymentMethod(
      resolvedPreferredPaymentMethodToken,
    );

    response.json({
      clientToken,
      preferredPaymentMethodToken: resolvedPreferredPaymentMethodToken,
    });
    return;
  }

  const { clientToken } = await client.clientToken.generate({});

  response.json({
    clientToken,
  });
}

async function findPayPalAccountTokenForCustomer(
  customerId: string,
): Promise<string> {
  const customer = await client.customer.find(customerId);
  const paypalAccount =
    customer.paypalAccounts?.find((account) => account.default) ??
    customer.paypalAccounts?.[0];

  if (!paypalAccount) {
    throw new Error(
      `No vaulted PayPal account found for customerId: ${customerId}`,
    );
  }

  return paypalAccount.token;
}
