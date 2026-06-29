import { useEffect, useRef, useState } from "react";
import { useBraintreePayPalMessages } from "@paypal/react-paypal-js/sdk-v6";
import type {
  PayPalMessagesElement,
  BraintreeMessageContent,
} from "@paypal/react-paypal-js/sdk-v6";
import { FlowNav } from "../storeDemo/components/FlowNav";

const FLOW_LABEL = "PayPal Messages";

export const PayPalMessagesPage: React.FC = () => {
  const messageRef = useRef<PayPalMessagesElement | null>(null);
  // Holds the last fetched content so we can update the amount cheaply
  // (content.update) instead of re-fetching on every keystroke.
  const contentRef = useRef<BraintreeMessageContent | null>(null);
  const [amount, setAmount] = useState("50");

  const { handleFetchContent, isReady, isLoading, error } =
    useBraintreePayPalMessages({
      buyerCountry: "US",
      currencyCode: "USD",
    });

  useEffect(() => {
    if (!isReady) return;

    // Cheap path: if we already have content, just update the amount.
    if (contentRef.current) {
      contentRef.current.update({ amount });
      return;
    }

    // First load: fetch content and hand it to the <paypal-message> element.
    handleFetchContent({
      amount,
      onReady: (content) => {
        contentRef.current = content;
        messageRef.current?.setContent?.(content);
      },
    });
  }, [amount, isReady, handleFetchContent]);

  return (
    <div>
      <FlowNav flowLabel={FLOW_LABEL} steps={[{ label: "Messages" }]} />
      <h1>PayPal Messages</h1>
      <p>
        Promotional / BNPL messaging rendered with the{" "}
        <code>useBraintreePayPalMessages</code> hook, which wraps Braintree&apos;s
        async <code>createMessages</code>. Change the amount to see the message
        update.
      </p>

      <label className="messages-amount">
        Amount (USD)
        <input
          type="number"
          min="1"
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>

      <div className="messages-wrap">
        {error ? (
          <p className="error">{error.message}</p>
        ) : isLoading ? (
          <p>Loading messaging…</p>
        ) : null}
        <paypal-message ref={messageRef} />
      </div>
    </div>
  );
};
