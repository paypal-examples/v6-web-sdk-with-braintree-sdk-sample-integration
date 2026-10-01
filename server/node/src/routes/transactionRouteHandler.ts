import type { Request, Response } from "express";
import { z } from "zod/v4";

import { client } from "../braintreeServerSdkClient";

export async function transactionSaleRouteHandler(
  request: Request,
  response: Response,
) {
  const { amount, paymentMethodNonce, paymentMethodToken, options } = z
    .object({
      amount: z.string(),
      paymentMethodNonce: z.string().optional(),
      paymentMethodToken: z.string().optional(),
      options: z.object({ storeInVaultOnSuccess: z.boolean() }).optional(),
    })
    .refine(
      (data) =>
        Boolean(data.paymentMethodNonce) !== Boolean(data.paymentMethodToken),
      {
        message:
          "Provide exactly one of paymentMethodNonce or paymentMethodToken",
      },
    )
    .parse(request.body);

  const transactionSaleResponse = await client.transaction.sale({
    amount,
    ...(paymentMethodNonce ? { paymentMethodNonce } : { paymentMethodToken }),
    options: {
      submitForSettlement: true,
      storeInVaultOnSuccess: options?.storeInVaultOnSuccess,
    },
  });

  response.json(transactionSaleResponse);
}
