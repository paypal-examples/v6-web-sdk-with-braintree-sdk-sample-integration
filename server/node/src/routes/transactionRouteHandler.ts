import type { Request, Response } from "express";
import { z } from "zod/v4";

import { client } from "../braintreeServerSdkClient";

export async function transactionSaleRouteHandler(
  request: Request,
  response: Response,
) {
  const { amount, paymentMethodNonce } = z
    .object({
      amount: z.string(),
      paymentMethodNonce: z.string(),
    })
    .parse(request.body);

  const transactionSaleResponse = await client.transaction.sale({
    amount,
    paymentMethodNonce,
    options: {
      submitForSettlement: true,
    },
  });

  response.json(transactionSaleResponse);
}
