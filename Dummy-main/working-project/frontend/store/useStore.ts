import { useState } from "react";

export function useStore() {
  const [products, setProducts] = useState([
    { id: 1, name: "Rice", price: 50, stock: 100 },
    { id: 2, name: "Oil", price: 120, stock: 50 },
  ]);

  const updateStock = (id: number, qty: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, stock: p.stock - qty } : p
      )
    );
  };

  return {
    state: { products },
    updateStock,
  };
}
