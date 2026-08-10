import React from "react";
import { useStore } from "../../store/useStore";
import { formatCurrency } from "../../utils/helpers";

export default function Inventory() {
  const { state } = useStore();
  const { products } = state;

  return (
    <div style={{ padding: 20 }}>
      <h2>Inventory</h2>

      {products.length === 0 && <p>No products available</p>}

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
          </tr>
        </thead>

        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{formatCurrency(p.price)}</td>
              <td>{p.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
