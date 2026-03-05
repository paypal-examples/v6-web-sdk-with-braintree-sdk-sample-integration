import type { Request, Response } from "express";
import { z } from "zod/v4";

import { client } from "../braintreeServerSdkClient";

export async function createPaymentMethodRouteHandler(
  request: Request,
  response: Response,
) {
  const { paymentMethodNonce } = z
    .object({
      paymentMethodNonce: z.string(),
    })
    .parse(request.body);

  const createCustomerResponse = await client.customer.create({});
  const customer = createCustomerResponse.customer;

  const createPaymentMethodResponse = await client.paymentMethod.create({
    customerId: customer.id,
    paymentMethodNonce,
  });

  response.json(createPaymentMethodResponse);
}
