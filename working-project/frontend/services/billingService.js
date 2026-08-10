export function createBill(cart) {
  const total = cart.reduce((sum, item) => {
    return sum + item.price * item.qty;
  }, 0);

  return {
    id: Date.now(),
    items: cart,
    total,
    date: new Date().toLocaleString()
  };
}
