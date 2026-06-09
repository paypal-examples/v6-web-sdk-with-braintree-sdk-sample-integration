import type { Product } from "../../../utils";

interface CartLineItemProps {
  product: Product;
  quantity: number;
  subtotal: string;
  onQuantityChange: (sku: string, quantity: number) => void;
  onRemove: (sku: string) => void;
  readOnly?: boolean;
}

export const CartLineItem: React.FC<CartLineItemProps> = ({
  product,
  quantity,
  subtotal,
  onQuantityChange,
  onRemove,
  readOnly = false,
}) => (
  <div className="cart-line">
    <div className="cart-line-name">
      <strong>{product.name}</strong>
      <div className="cart-line-unit">${product.price} each</div>
    </div>
    <div className="cart-line-qty">
      {readOnly ? (
        <span>Qty: {quantity}</span>
      ) : (
        <>
          <button
            type="button"
            onClick={() => onQuantityChange(product.sku, quantity - 1)}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="cart-line-qty-value">{quantity}</span>
          <button
            type="button"
            onClick={() => onQuantityChange(product.sku, quantity + 1)}
            aria-label="Increase quantity"
          >
            +
          </button>
        </>
      )}
    </div>
    <div className="cart-line-subtotal">${subtotal}</div>
    {!readOnly && (
      <button
        type="button"
        className="cart-line-remove"
        onClick={() => onRemove(product.sku)}
      >
        Remove
      </button>
    )}
  </div>
);
