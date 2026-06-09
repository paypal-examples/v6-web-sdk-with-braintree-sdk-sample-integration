import { Link, useLocation } from "react-router-dom";

interface ConfirmationState {
  flowLabel?: string;
  transactionId?: string;
  amount?: string;
  vaulted?: boolean;
}

export const ConfirmationPage: React.FC = () => {
  const location = useLocation();
  const state = (location.state ?? {}) as ConfirmationState;

  return (
    <div>
      <h1>Thanks for your order!</h1>
      <p>
        Your payment was processed successfully
        {state.flowLabel ? ` via the ${state.flowLabel} flow` : ""}.
      </p>
      <div className="confirmation-details">
        {state.amount && (
          <div>
            <strong>Amount:</strong> ${state.amount}
          </div>
        )}
        {state.transactionId && (
          <div>
            <strong>Transaction ID:</strong>{" "}
            <code>{state.transactionId}</code>
          </div>
        )}
        {state.vaulted && (
          <div>Your PayPal account has been saved for future purchases.</div>
        )}
      </div>
      <div className="page-actions">
        <Link to="/" className="btn-primary">
          ← Back to home
        </Link>
      </div>
    </div>
  );
};
