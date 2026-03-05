import type { Request, Response } from "express";

import { client } from "../braintreeServerSdkClient";

export async function clientTokenRouteHandler(
  _request: Request,
  response: Response,
) {
  const { clientToken } = await client.clientToken.generate({});

  response.json({
    clientToken,
  });
}
