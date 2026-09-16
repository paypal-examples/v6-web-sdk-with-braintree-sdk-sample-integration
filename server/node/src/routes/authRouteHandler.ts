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

  if (preferredPaymentMethodToken) {
    const clientToken = await generateClientTokenWithPreferredPaymentMethod(
      preferredPaymentMethodToken,
    );

    response.json({ clientToken });
    return;
  }

  const { clientToken } = await client.clientToken.generate(
    customerId ? { customerId } : {},
  );

  response.json({
    clientToken,
  });
}
