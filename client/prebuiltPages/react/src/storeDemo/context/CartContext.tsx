import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useProducts } from "../hooks/useProducts";
import { CartContext } from "./cartContextValue";
import type { CartContextValue, CartItem, LineItem } from "./cartContextValue";

const STORAGE_KEY = "braintree-demo-cart";

function loadInitialItems(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i) => typeof i?.sku === "string" && typeof i?.quantity === "number",
    );
  } catch {
    return [];
  }
}

export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const {
    products,
    loading: productsLoading,
    error: productsError,
  } = useProducts();
  const [items, setItems] = useState<CartItem[]>(loadInitialItems);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = useCallback((sku: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.sku === sku);
      if (existing) {
        return prev.map((i) =>
          i.sku === sku ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { sku, quantity: 1 }];
    });
  }, []);

  const setQuantity = useCallback((sku: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.sku !== sku)
        : prev.map((i) => (i.sku === sku ? { ...i, quantity } : i)),
    );
  }, []);

  const remove = useCallback((sku: string) => {
    setItems((prev) => prev.filter((i) => i.sku !== sku));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const productMap = new Map(products.map((p) => [p.sku, p]));
    const lineItems: LineItem[] = items
      .map((item) => {
        const product = productMap.get(item.sku);
        if (!product) return null;
        const subtotal = (parseFloat(product.price) * item.quantity).toFixed(2);
        return { ...item, product, subtotal };
      })
      .filter((l): l is LineItem => l !== null);

    const total = lineItems
      .reduce((sum, l) => sum + parseFloat(l.subtotal), 0)
      .toFixed(2);

    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

    return {
      items,
      lineItems,
      total,
      itemCount,
      add,
      setQuantity,
      remove,
      clear,
      productsLoading,
      productsError,
      products,
    };
  }, [
    items,
    products,
    productsLoading,
    productsError,
    add,
    setQuantity,
    remove,
    clear,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
