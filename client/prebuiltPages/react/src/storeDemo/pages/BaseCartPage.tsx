import { Link } from "react-router-dom";
import { useCart } from "../context/useCart";
import { FlowNav } from "../components/FlowNav";
import { CartLineItem } from "../components/CartLineItem";

interface BaseCartPageProps {
  flowLabel: string;
  flowBasePath: string;
}

export const BaseCartPage: React.FC<BaseCartPageProps> = ({
  flowLabel,
  flowBasePath,
}) => {
  const { lineItems, total, setQuantity, remove } = useCart();
  const empty = lineItems.length === 0;

  return (
    <div>
      <FlowNav
        flowLabel={flowLabel}
        steps={[{ label: "Products", to: flowBasePath }, { label: "Cart" }]}
      />
      <h1>Your cart</h1>

      {empty ? (
        <p>
          Your cart is empty. <Link to={flowBasePath}>Browse products</Link>.
        </p>
      ) : (
        <>
          <div className="cart-list">
            {lineItems.map((line) => (
              <CartLineItem
                key={line.sku}
                product={line.product}
                quantity={line.quantity}
                subtotal={line.subtotal}
                onQuantityChange={setQuantity}
                onRemove={remove}
              />
            ))}
          </div>
          <div className="cart-summary">
            <strong>Total: ${total}</strong>
          </div>
          <div className="page-actions">
            <Link to={flowBasePath}>← Continue shopping</Link>
            <Link to={`${flowBasePath}/checkout`} className="btn-primary">
              Checkout →
            </Link>
          </div>
        </>
      )}
    </div>
  );
};
