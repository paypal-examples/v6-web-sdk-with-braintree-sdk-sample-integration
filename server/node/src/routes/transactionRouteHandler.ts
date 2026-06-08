import type { Request, Response } from "express";
import { z } from "zod/v4";

import { client } from "../braintreeServerSdkClient";

export async function transactionSaleRouteHandler(
  request: Request,
  response: Response,
) {
  const { amount, paymentMethodNonce, options } = z
    .object({
      amount: z.string(),
      paymentMethodNonce: z.string(),
      options: z.object({ storeInVaultOnSuccess: z.boolean() }).optional(),
    })
    .parse(request.body);

  const transactionSaleResponse = await client.transaction.sale({
    amount,
    paymentMethodNonce,
    options: {
      submitForSettlement: true,
      storeInVaultOnSuccess: options?.storeInVaultOnSuccess,
    },
  });

  response.json(transactionSaleResponse);
}
