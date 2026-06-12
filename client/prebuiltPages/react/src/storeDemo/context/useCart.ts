import { useContext } from "react";
import { CartContext } from "./cartContextValue";
import type { CartContextValue } from "./cartContextValue";

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
