import { useEffect, useState } from "react";
import { BraintreePayPalProvider } from "@paypal/react-paypal-js/sdk-v6";
import type { BraintreeV6Namespace } from "@paypal/react-paypal-js/sdk-v6";
import { getBraintreeBrowserSafeClientToken } from "../utils";

declare global {
  interface Window {
    braintree: BraintreeV6Namespace;
  }
}

function App() {
  const [clientToken, setClientToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchClientToken() {
      const braintreeClientToken = await getBraintreeBrowserSafeClientToken();

      setClientToken(braintreeClientToken);
    }

    fetchClientToken();
  }, []);

  if (!clientToken) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>React Prebuilt Page</h1>
      <p>Edit src/App.tsx and save to see changes.</p>
      <BraintreePayPalProvider
        namespace={window.braintree}
        braintreeClientToken={clientToken}
      >
        some text here
      </BraintreePayPalProvider>
    </div>
  );
}

export default App;
