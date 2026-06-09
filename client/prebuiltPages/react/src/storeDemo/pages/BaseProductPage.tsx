import { Link } from "react-router-dom";
import { useCart } from "../context/useCart";
import { FlowNav } from "../components/FlowNav";
import { ProductCard } from "../components/ProductCard";

interface BaseProductPageProps {
  flowLabel: string;
  flowBasePath: string;
}

export const BaseProductPage: React.FC<BaseProductPageProps> = ({
  flowLabel,
  flowBasePath,
}) => {
  const { products, productsLoading, productsError, items, itemCount, add } =
    useCart();

  return (
    <div>
      <FlowNav
        flowLabel={flowLabel}
        steps={[{ label: "Products" }]}
      />
      <h1>Products</h1>
      <p>Add items to your cart, then continue to checkout.</p>
      {productsLoading && <p>Loading products…</p>}
      {productsError && (
        <p className="error">Failed to load products: {productsError}</p>
      )}
      <div className="product-grid">
        {products.map((p) => {
          const inCart =
            items.find((i) => i.sku === p.sku)?.quantity ?? 0;
          return (
            <ProductCard
              key={p.sku}
              product={p}
              onAdd={add}
              inCartQuantity={inCart}
            />
          );
        })}
      </div>
      <div className="page-actions">
        <Link to={`${flowBasePath}/cart`} className="btn-primary">
          Go to cart ({itemCount})
        </Link>
      </div>
    </div>
  );
};
