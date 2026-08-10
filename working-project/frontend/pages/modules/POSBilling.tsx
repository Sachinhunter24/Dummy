import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function POSBilling() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);

  // 🔄 Load products from DB
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*");

    if (error) {
      console.error(error);
    } else {
      setProducts(data || []);
    }
  };

  // ➕ Add to cart
  const addToCart = (product: any) => {
    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  // ➖ Remove from cart
  const removeFromCart = (id: number) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  // 💰 Total
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  // ✅ COMPLETE SALE (DB CONNECTED)
  const completeSale = async () => {
    for (let item of cart) {
      // insert sale
      await supabase.from("sales").insert({
        product_id: item.id,
        quantity: item.qty,
        total: item.price * item.qty,
      });

      // update stock
      await supabase
        .from("products")
        .update({ stock: item.stock - item.qty })
        .eq("id", item.id);
    }

    alert("Sale Done ✅");

    setCart([]);
    fetchProducts(); // refresh stock
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>POS Billing</h2>

      {/* 🛒 Product List */}
      <h3>Products</h3>
      {products.map((p) => (
        <div key={p.id}>
          {p.name} - ₹{p.price} (Stock: {p.stock})
          <button onClick={() => addToCart(p)}>Add</button>
        </div>
      ))}

      {/* 🧾 Cart */}
      <h3>Cart</h3>
      {cart.map((item) => (
        <div key={item.id}>
          {item.name} x {item.qty} = ₹{item.price * item.qty}
          <button onClick={() => removeFromCart(item.id)}>Remove</button>
        </div>
      ))}

      <h3>Total: ₹{totalAmount}</h3>

      <button onClick={completeSale}>Complete Sale</button>
    </div>
  );
}
