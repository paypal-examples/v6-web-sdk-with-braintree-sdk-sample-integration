import { Link } from "react-router-dom";

const FLOWS = [
  {
    to: "/one-time-payment",
    title: "One-Time Payment",
    component: "BraintreePayPalOneTimePaymentButton",
    description:
      "Standard ecommerce checkout. Charge the buyer once for the cart total. Payment method is not saved.",
    cta: "Shop & pay",
  },
  {
    to: "/vault-with-purchase",
    title: "Checkout with Vault",
    component: "BraintreePayPalCheckoutWithVaultButton",
    description:
      "Buy now and save the PayPal account in the same flow, so the buyer can check out faster next time.",
    cta: "Shop & save PayPal",
  },
  {
    to: "/save-payment",
    title: "Billing Agreement (Save PayPal)",
    component: "BraintreePayPalBillingAgreementButton",
    description:
      "Save the buyer's PayPal account for future charges without taking a payment now. Settings-style flow — no cart.",
    cta: "Save PayPal",
  },
];

export const Home: React.FC = () => (
  <div>
    <h1>Braintree PayPal v6 — Ecommerce Demo</h1>
    <p>
      Three Braintree PayPal flows demonstrated inside a minimal ecommerce
      store. Pick a flow to see how its v6 button component fits into a product
      → cart → checkout journey.
    </p>
    <div className="home-flow-grid">
      {FLOWS.map((flow) => (
        <div key={flow.to} className="home-flow-card">
          <h2>{flow.title}</h2>
          <code className="home-flow-component">{flow.component}</code>
          <p>{flow.description}</p>
          <Link to={flow.to} className="btn-primary">
            {flow.cta} →
          </Link>
        </div>
      ))}
    </div>
  </div>
);
