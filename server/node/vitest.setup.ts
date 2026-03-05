import { vi } from "vitest";

vi.stubEnv("BRAINTREE_SANDBOX_MERCHANT_ID", "fakeMerchantId");
vi.stubEnv("BRAINTREE_SANDBOX_MERCHANT_PUBLIC_KEY", "fakePublicKey");
vi.stubEnv("BRAINTREE_SANDBOX_MERCHANT_PRIVATE_KEY", "fakePrivateKey");
