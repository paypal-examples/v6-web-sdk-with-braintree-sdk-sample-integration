import type { Product } from "../../../utils";

interface ProductCardProps {
  product: Product;
  onAdd: (sku: string) => void;
  inCartQuantity: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAdd,
  inCartQuantity,
}) => (
  <div className="product-card">
    <div className="product-card-name">{product.name}</div>
    <div className="product-card-sku">SKU: {product.sku}</div>
    <div className="product-card-price">${product.price}</div>
    <button
      type="button"
      className="btn-primary"
      onClick={() => onAdd(product.sku)}
    >
      Add to cart
    </button>
    {inCartQuantity > 0 && (
      <div className="product-card-incart">{inCartQuantity} in cart</div>
    )}
  </div>
);
