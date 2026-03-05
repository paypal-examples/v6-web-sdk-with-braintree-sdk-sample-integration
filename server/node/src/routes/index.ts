import { Router } from "express";

import { clientTokenRouteHandler } from "./authRouteHandler";
import { transactionSaleRouteHandler } from "./transactionRouteHandler";
import { createPaymentMethodRouteHandler } from "./paymentMethodRouteHandler";
import { getProductsRouteHandler } from "./productRouteHandler";

const router = Router();

router.get(
  "/braintree-api/auth/browser-safe-client-token",
  clientTokenRouteHandler,
);

router.post("/braintree-api/transaction/sale", transactionSaleRouteHandler);
router.post(
  "/braintree-api/payment-method/save",
  createPaymentMethodRouteHandler,
);
router.get("/braintree-api/products", getProductsRouteHandler);

export default router;
