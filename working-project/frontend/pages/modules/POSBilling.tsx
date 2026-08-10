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
};
