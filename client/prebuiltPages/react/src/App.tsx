import { BraintreePayPalProvider } from "@paypal/react-paypal-js/sdk-v6";
import type { BraintreeV6Namespace } from "@paypal/react-paypal-js/sdk-v6";

declare global {
  interface Window {
    braintree: BraintreeV6Namespace;
  }
}

function App() {
  return (
    <div>
      <h1>React Prebuilt Page</h1>
      <p>Edit src/App.tsx and save to see changes.</p>
      <BraintreePayPalProvider namespace={window.braintree} braintreeClientToken="">
        some text here
      </BraintreePayPalProvider>
    </div>
  );
}

export default App;
