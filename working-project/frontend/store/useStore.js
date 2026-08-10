import { useState } from "react";
import { store as initialStore } from "./store";

export function useStore() {
  const [state, setState] = useState(initialStore);

  const addToCart = (product) => {
    setState(prev => {
      const existing = prev.cart.find(i => i.id === product.id);

      if (existing) {
        return {
          ...prev,
          cart: prev.cart.map(i =>
            i.id === product.id
              ? { ...i, qty: i.qty + 1 }
              : i
          )
        };
      }

      return {
        ...prev,
        cart: [...prev.cart, { ...product, qty: 1 }]
      };
    });
  };

  const removeFromCart = (id) => {
    setState(prev => ({
      ...prev,
      cart: prev.cart.filter(i => i.id !== id)
    }));
  };

  const clearCart = () => {
    setState(prev => ({ ...prev, cart: [] }));
  };

  const addSale = (sale) => {
    setState(prev => ({
      ...prev,
      sales: [...prev.sales, sale],
      cart: []
    }));
  };

  return {
    state,
    addToCart,
    removeFromCart,
    clearCart,
    addSale
  };
}
