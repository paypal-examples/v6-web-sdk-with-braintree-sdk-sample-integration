import { beforeEach, describe, expect, test, vi } from "vitest";
import request from "supertest";
import express, { type Express } from "express";

import { clientTokenRouteHandler } from "./authRouteHandler";

vi.mock("../braintreeServerSdkClient", async () => {
  const actual = await vi.importActual("../braintreeServerSdkClient");
  const clientTokenMock = vi.fn().mockResolvedValue({
    success: true,
    clientToken: "fakeValue",
  });

  return {
    ...actual,
    client: {
      clientToken: {
        generate: clientTokenMock,
      },
    },
  };
});

describe("clientTokenRouteHandler", () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.get(
      "/braintree-api/auth/browser-safe-client-token",
      clientTokenRouteHandler,
    );
  });

  test("should return a successful response", async () => {
    const response = await request(app).get(
      "/braintree-api/auth/browser-safe-client-token",
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        clientToken: "fakeValue",
      }),
    );
  });
});
