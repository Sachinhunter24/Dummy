import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useData } from '../../context/DataContext';
import { InvoiceModal } from '../../components/erp/InvoiceModal';
import type { CartItem, Invoice } from '../../types/erp';

const GST_RATES: Record<string, number> = { Medicine: 12, 'Personal Care': 18, Detergent: 18, Food: 5, Grocery: 0, Grains: 0, Dairy: 5, Beverages: 12, Oils: 5, Household: 18 };

export default function POSBilling() {
  const { role } = useApp();
  const { products, customers } = useData();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [gstEnabled, setGstEnabled] = useState(true);
  const [discount, setDiscount] = useState(0);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'card'>('cash');

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: (typeof products)[number]) => {
    setCart(prev => {
      const ex = prev.find(c => c.product.id === product.id);
      if (ex) return prev.map(c => c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) { setCart(prev => prev.filter(c => c.product.id !== id)); return; }
    setCart(prev => prev.map(c => c.product.id === id ? { ...c, qty } : c));
  };

  const subtotal = cart.reduce((s, c) => s + c.product.price * c.qty, 0);
  const totalGst = gstEnabled ? cart.reduce((s, c) => s + (c.product.price * c.qty * (GST_RATES[c.product.category] ?? 0) / 100), 0) : 0;
  const discountAmt = subtotal * discount / 100;
  const grandTotal = subtotal + totalGst - discountAmt;

  const generateInvoice = () => {
    if (cart.length === 0) return;
    const invoice: Invoice = {
      id: `INV-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString('en-IN'),
      customerName: selectedCustomer?.name ?? 'Walk-in Customer',
      customerPhone: selectedCustomer?.phone ?? '',
      items: cart.map(c => ({
        name: c.product.name,
        qty: c.qty,
        price: c.product.price,
        gst: GST_RATES[c.product.category] ?? 0,
        total: c.product.price * c.qty * (1 + (gstEnabled ? (GST_RATES[c.product.category] ?? 0) / 100 : 0)),
      })),
      subtotal,
      gstTotal: totalGst,
      discount: discountAmt,
      grandTotal,
      gstEnabled,
    };
    setCurrentInvoice(invoice);
    setCart([]);
    setSelectedCustomerId('');
    setDiscount(0);
  };

  return (
    <div className="p-4 md:p-6 fade-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-indigo-900 dark:text-white">🧾 POS Billing</h2>
          <p className="text-xs text-indigo-700 dark:text-white/50 mt-0.5">Quick billing with GST · auto invoice</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-indigo-700 dark:text-white/60">GST</span>
          <button onClick={() => setGstEnabled(g => !g)} className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 ${gstEnabled ? 'bg-violet-600' : 'bg-white/20'}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${gstEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
          <span className="text-xs font-semibold text-indigo-900 dark:text-white">{gstEnabled ? 'GST' : 'Non-GST'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Product Catalog */}
        <div className="lg:col-span-3 space-y-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search product by name or SKU..."
            className="glass-input w-full rounded-xl px-4 py-3 text-sm outline-none" />

          <div className="glass rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 text-xs font-semibold text-indigo-700 dark:text-white/50 bg-white/10">
              <div className="px-3 py-2.5">Product</div>
              <div className="px-3 py-2.5 text-center">Price</div>
              <div className="px-3 py-2.5 text-right">Stock</div>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-white/10">
              {filtered.map(p => (
                <button key={p.id} onClick={() => addToCart(p)} disabled={p.quantity === 0}
                  className="w-full flex items-center px-3 py-2.5 hover:bg-white/10 transition-colors text-left disabled:opacity-40">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-indigo-900 dark:text-white truncate">{p.name}</div>
                    <div className="text-xs text-indigo-600 dark:text-white/40">{p.sku} · {p.rack}</div>
                  </div>
                  <div className="text-sm font-bold text-violet-600 dark:text-violet-400 mx-4">₹{p.price}</div>
                  <div className={`text-xs font-semibold ${p.quantity < 10 ? 'text-red-500' : 'text-emerald-500'}`}>{p.quantity}</div>
                </button>
              ))}
              {filtered.length === 0 && <div className="text-center py-6 text-xs text-indigo-600 dark:text-white/30">No products found</div>}
            </div>
          </div>

          {/* Customer + Payment Mode */}
          <div className="glass rounded-2xl p-4 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-indigo-700 dark:text-white/60 mb-1.5 uppercase tracking-widest">Customer</label>
              <select value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}
                className="glass-input w-full rounded-xl px-3 py-2.5 text-sm">
                <option value="">Walk-in Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-indigo-700 dark:text-white/60 mb-1.5 uppercase tracking-widest">Payment Mode</label>
              <div className="flex gap-1">
                {(['cash', 'upi', 'card'] as const).map(m => (
                  <button key={m} onClick={() => setPaymentMode(m)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition-all ${paymentMode === m ? 'bg-violet-600 text-white' : 'btn-glass text-indigo-900 dark:text-white/80'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Cart & Bill */}
        <div className="lg:col-span-2 space-y-3">
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-indigo-900 dark:text-white text-sm">🛒 Cart ({cart.length})</h3>
              {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-400 font-medium">Clear all</button>}
            </div>
            {cart.length === 0
              ? <div className="text-center py-8 text-indigo-600 dark:text-white/30 text-sm">Tap items to add them to cart</div>
              : (
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex items-center gap-2 py-1.5 border-b border-white/10 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-indigo-900 dark:text-white truncate">{item.product.name}</div>
                        <div className="text-xs text-indigo-600 dark:text-white/40">₹{item.product.price} × {item.qty}</div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => updateQty(item.product.id, item.qty - 1)} className="w-6 h-6 rounded-md bg-white/20 text-indigo-900 dark:text-white flex items-center justify-center hover:bg-white/30 font-bold text-sm">−</button>
                        <span className="w-5 text-center text-xs font-bold text-indigo-900 dark:text-white">{item.qty}</span>
                        <button onClick={() => updateQty(item.product.id, item.qty + 1)} className="w-6 h-6 rounded-md bg-white/20 text-indigo-900 dark:text-white flex items-center justify-center hover:bg-white/30 font-bold text-sm">+</button>
                      </div>
                      <div className="text-xs font-bold text-violet-600 dark:text-violet-400 w-14 text-right">₹{(item.product.price * item.qty).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* Bill Summary */}
          <div className="glass rounded-2xl p-4 space-y-2">
            <div className="text-xs font-semibold text-indigo-700 dark:text-white/60 uppercase tracking-widest mb-2">Bill Summary</div>
            <div className="flex justify-between text-sm text-indigo-900 dark:text-white/80"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
            {gstEnabled && <div className="flex justify-between text-sm text-amber-600 dark:text-amber-400"><span>GST (weighted avg)</span><span>+₹{totalGst.toFixed(0)}</span></div>}
            <div className="flex items-center gap-2">
              <span className="text-sm text-indigo-900 dark:text-white/80 flex-1">Discount %</span>
              <input type="number" value={discount} onChange={e => setDiscount(Math.min(50, Math.max(0, +e.target.value)))}
                className="glass-input w-16 rounded-lg px-2 py-1 text-sm text-center" min={0} max={50} />
              <span className="text-sm text-emerald-600 dark:text-emerald-400 w-16 text-right">-₹{discountAmt.toFixed(0)}</span>
            </div>
            <div className="border-t border-white/20 pt-2 flex justify-between font-extrabold text-lg text-indigo-900 dark:text-white">
              <span>Total</span><span className="text-violet-600 dark:text-violet-400">₹{grandTotal.toFixed(0)}</span>
            </div>
            <div className="text-xs text-center text-indigo-600 dark:text-white/40 bg-violet-500/10 rounded-lg py-1.5 font-medium">
              {paymentMode === 'cash' ? '💵 Cash' : paymentMode === 'upi' ? '📲 UPI' : '💳 Card'} Payment
            </div>
            <button onClick={generateInvoice} disabled={cart.length === 0}
              className="btn-primary w-full py-3 rounded-xl font-bold text-sm mt-1 disabled:opacity-40">
              🧾 Generate Invoice
            </button>
            {role !== 'staff' && (
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button className="btn-glass py-2 rounded-xl text-xs font-semibold text-indigo-900 dark:text-white">📧 Email</button>
                <button onClick={() => {
                  if (selectedCustomer?.phone) {
                    const msg = encodeURIComponent(`Dear ${selectedCustomer.name}, your bill of ₹${grandTotal.toFixed(0)} is ready. Thank you for shopping with us!`);
                    window.open(`https://wa.me/91${selectedCustomer.phone}?text=${msg}`, '_blank');
                  }
                }} className="btn-glass py-2 rounded-xl text-xs font-semibold text-indigo-900 dark:text-white">💬 WhatsApp</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <InvoiceModal invoice={currentInvoice} onClose={() => setCurrentInvoice(null)} />
    </div>
  );
}
