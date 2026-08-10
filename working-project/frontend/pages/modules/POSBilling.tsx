import React from "react";
import { useStore } from "../../store/useStore";
import { createBill } from "../../services/billingService";
import { updateStock } from "../../services/inventoryService";
import { formatCurrency } from "../../utils/helpers";

export default function POSBilling() {
  const {
    state,
    addToCart,
    removeFromCart,
    clearCart,
    addSale
  } = useStore();

  const { products, cart } = state;

  const handleCheckout = () => {
    if (cart.length === 0) return alert("Cart is empty");

    const bill = createBill(cart);

    // update stock
    const updatedProducts = updateStock(products, cart);

    // save sale
    addSale(bill);

    // update products manually
    state.products = updatedProducts;

    alert("Bill Generated!");
    clearCart();
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  return (
    <div style={{ padding: 20 }}>
      <h2>POS Billing</h2>

      <div style={{ display: "flex", gap: 40 }}>
        
        {/* PRODUCTS */}
        <div>
          <h3>Products</h3>
          {products.map((p) => (
            <div key={p.id} style={{ marginBottom: 10 }}>
              <b>{p.name}</b> - {formatCurrency(p.price)} (Stock: {p.stock})
              <br />
              <button onClick={() => addToCart(p)}>
                Add
              </button>
            </div>
          ))}
        </div>

        {/* CART */}
        <div>
          <h3>Cart</h3>
          {cart.length === 0 && <p>No items</p>}

          {cart.map((item) => (
            <div key={item.id}>
              {item.name} x {item.qty} ={" "}
              {formatCurrency(item.price * item.qty)}
              <button onClick={() => removeFromCart(item.id)}>
                ❌
              </button>
            </div>
          ))}

          <hr />

          <h3>Total: {formatCurrency(total)}</h3>

          <button onClick={handleCheckout}>
            Generate Bill
          </button>

          <button onClick={clearCart}>
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
}
