export function updateStock(products, cart) {
  return products.map(product => {
    const item = cart.find(i => i.id === product.id);
    if (!item) return product;

    return {
      ...product,
      stock: product.stock - item.qty
    };
  });
}
