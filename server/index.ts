import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import braintree from "braintree";

dotenv.config();

const app = express();
const PORT: string = process.env.PORT || "8080";

app.use(express.json());
app.use(express.static("client"));

let gateway: braintree.BraintreeGateway | undefined;

function getBraintreeGateway(): braintree.BraintreeGateway {
  const merchantId: string | undefined =
    process.env.BRAINTREE_SANDBOX_MERCHANT_ID;
  const publicKey: string | undefined =
    process.env.BRAINTREE_SANDBOX_MERCHANT_PUBLIC_KEY;
  const privateKey: string | undefined =
    process.env.BRAINTREE_SANDBOX_MERCHANT_PRIVATE_KEY;

  if (!merchantId || !publicKey || !privateKey) {
    throw new Error("Braintree credentials not configured");
  }

  if (gateway === undefined) {
    gateway = new braintree.BraintreeGateway({
      environment: braintree.Environment.Sandbox,
      merchantId,
      publicKey,
      privateKey,
    });
  }

  return gateway;
}

app.get("/", (_req: Request, res: Response): void => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

app.get(
  "/api/braintree/browser-safe-client-token",
  async (
    _req: Request,
    res: Response<{ accessToken: string } | { error: string }>
  ) => {
    try {
      const gateway = getBraintreeGateway();
      const response = await gateway.clientToken.generate({});

      res.json({
        accessToken: response.clientToken,
      });
    } catch (error) {
      console.error("Failed to generate Braintree client token:", error);
      res.status(500).json({ error: "Failed to generate client token" });
    }
  }
);

app.post(
  "/api/braintree/transaction/sale",
  async (
    req: Request<{ amount: number | string; paymentMethodNonce: string }>,
    res: Response<
      | {
          success: true;
          result: braintree.ValidatedResponse<braintree.Transaction>;
        }
      | { success: false; errors: braintree.ValidationError[] | string[] }
    >
  ) => {
    try {
      const { amount, paymentMethodNonce } = req.body;
      const gateway = getBraintreeGateway();

      const result = await gateway.transaction.sale({
        amount: amount.toString(),
        paymentMethodNonce,
        options: {
          submitForSettlement: true,
        },
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          errors: result.errors.deepErrors(),
        });
        return;
      }

      res.json({
        success: true,
        result,
      });
    } catch (error) {
      console.error("Failed to complete Braintree transaction:", error);
      res
        .status(500)
        .json({ success: false, errors: ["Failed to complete transaction"] });
    }
  }
);

app.post(
  "/api/braintree/payment-method/save",
  async (
    req: Request<{ paymentMethodNonce: string }>,
    res: Response<
      | {
          success: true;
          paymentMethod: braintree.PayPalAccount;
          customer?: braintree.Customer;
        }
      | { success: false; errors: braintree.ValidationError[] | string[] }
    >
  ) => {
    try {
      const { paymentMethodNonce } = req.body;
      const gateway = getBraintreeGateway();

      const createCustomerResult = await gateway.customer.create({});

      if (!createCustomerResult.success) {
        res.status(400).json({
          success: false,
          errors: createCustomerResult.errors.deepErrors(),
        });
        return;
      }

      const customer = createCustomerResult.customer;

      const result = await gateway.paymentMethod.create({
        customerId: customer.id,
        paymentMethodNonce,
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          errors: result.errors.deepErrors(),
        });
        return;
      }

      res.json({
        success: true,
        paymentMethod: result.paymentMethod as braintree.PayPalAccount,
        customer,
      });
    } catch (error) {
      console.error("Failed to save payment method:", error);
      res
        .status(500)
        .json({ success: false, errors: ["Failed to save payment method"] });
    }
  }
);

app.listen(PORT, (): void => {
  console.log(`Server running on http://localhost:${PORT}`);
});
