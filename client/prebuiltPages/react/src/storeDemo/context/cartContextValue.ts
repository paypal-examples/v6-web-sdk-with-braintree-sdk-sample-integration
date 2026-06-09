import { createContext } from "react";
import type { Product } from "../../../utils";

export interface CartItem {
  sku: string;
  quantity: number;
}

export interface LineItem extends CartItem {
  product: Product;
  subtotal: string;
}

export interface CartContextValue {
  items: CartItem[];
  lineItems: LineItem[];
  total: string;
  itemCount: number;
  add: (sku: string) => void;
  setQuantity: (sku: string, quantity: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
  productsLoading: boolean;
  productsError: string | null;
  products: Product[];
}

export const CartContext = createContext<CartContextValue | undefined>(
  undefined,
);
