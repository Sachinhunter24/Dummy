import { useState, useRef } from 'react';
import { useData, exportToCSV, parseCSV } from '../../context/DataContext';
import type { Product } from '../../types/erp';

const BLANK: Omit<Product, 'id'> = { name: '', sku: '', price: 0, cost: 0, quantity: 0, category: 'General', unit: 'piece', rack: '' };

export default function Inventory() {
  const { products, addProduct, updateProduct, deleteProduct, importProducts } = useData();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Product, 'id'>>(BLANK);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  const filtered = products.filter(p =>
    (filterCat === 'All' || p.category === filterCat) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) ||
     p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const openEdit = (p: Product) => {
    setEditId(p.id);
    const { id: _id, ...rest } = p;
    setForm(rest);
    setShowAddForm(true);
  };

  const handleSave = () => {
    if (!form.name || !form.sku) return;
    if (editId) { updateProduct(editId, form); }
    else { addProduct(form); }
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowAddForm(false); setEditId(null); setForm(BLANK); }, 1000);
  };

  const handleCSVImport = async (file: File) => {
    const text = await file.text();
    const rows = parseCSV(text);
    importProducts(rows.map(r => ({
      name: r['name'] ?? 'Product',
      sku: r['sku'] ?? `SKU${Date.now()}`,
      price: parseFloat(r['price'] ?? '0') || 0,
      cost: parseFloat(r['cost'] ?? '0') || 0,
      quantity: parseInt(r['quantity'] ?? r['qty'] ?? '0') || 0,
      category: r['category'] ?? 'General',
      unit: r['unit'] ?? 'piece',
      ...(r['rack'] ? { rack: r['rack'] } : {}),
      ...(r['hsn'] ? { hsn: r['hsn'] } : {}),
      ...(r['expiry'] ? { expiryDate: r['expiry'] } : {}),
    })));
  };

  const handleExport = () => {
    exportToCSV(
      ['Name', 'SKU', 'Category', 'Price', 'Cost', 'Quantity', 'Unit', 'Rack', 'Expiry'],
      filtered.map(p => [p.name, p.sku, p.category, String(p.price), String(p.cost), String(p.quantity), p.unit, p.rack ?? '', p.expiryDate ?? '']),
      `Inventory_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  const lowStock = products.filter(p => p.quantity < 15).length;
  const totalValue = products.reduce((s, p) => s + p.price * p.quantity, 0);
  const expiring = products.filter(p => p.expiryDate && new Date(p.expiryDate) < new Date(Date.now() + 30 * 24 * 3600000)).length;

  return (
    <div className="p-4 md:p-6 fade-up space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-indigo-900 dark:text-white">📦 Inventory Manager</h2>
          <p className="text-xs text-indigo-700 dark:text-white/50 mt-0.5">{products.length} products · Value: ₹{(totalValue/1000).toFixed(0)}K</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleCSVImport(f); e.target.value = ''; }} />
          <button onClick={() => fileRef.current?.click()} className="btn-glass text-xs px-3 py-2 rounded-xl font-semibold text-indigo-900 dark:text-white flex items-center gap-1.5">
            📁 CSV Import
          </button>
          <button onClick={handleExport} className="btn-glass text-xs px-3 py-2 rounded-xl font-semibold text-indigo-900 dark:text-white flex items-center gap-1.5">
            📤 Export CSV
          </button>
          <button onClick={() => { setEditId(null); setForm(BLANK); setShowAddForm(s => !s); }} className="btn-primary text-xs px-4 py-2 rounded-xl font-semibold">
            {showAddForm && !editId ? '✕ Cancel' : '＋ Add Product'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total SKUs', value: products.length, icon: '📦', color: 'text-indigo-900 dark:text-violet-400' },
          { label: 'Low Stock', value: lowStock, icon: '⚠️', color: 'text-red-600 dark:text-red-400' },
          { label: 'Expiring Soon', value: expiring, icon: '⏰', color: 'text-amber-600 dark:text-amber-400' },
        ].map((s, i) => (
          <div key={i} className="glass rounded-2xl p-3 text-center kpi-card">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-indigo-600 dark:text-white/50 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add / Edit Form */}
      {showAddForm && (
        <div className="glass rounded-2xl p-5 border border-violet-500/30">
          <h3 className="font-bold text-indigo-900 dark:text-white mb-4 text-sm">{editId ? '✏️ Edit Product' : '➕ Add New Product'}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: 'name', label: 'Product Name *', type: 'text' },
              { key: 'sku', label: 'SKU / Code *', type: 'text' },
              { key: 'category', label: 'Category', type: 'text' },
              { key: 'price', label: 'Selling Price (₹)', type: 'number' },
              { key: 'cost', label: 'Cost Price (₹)', type: 'number' },
              { key: 'quantity', label: 'Stock Quantity', type: 'number' },
              { key: 'unit', label: 'Unit (piece/kg/box)', type: 'text' },
              { key: 'rack', label: 'Rack Location', type: 'text' },
              { key: 'hsn', label: 'HSN Code', type: 'text' },
              { key: 'expiryDate', label: 'Expiry Date', type: 'date' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-indigo-700 dark:text-white/55 mb-1 block">{f.label}</label>
                <input type={f.type} placeholder={f.label}
                  value={String(form[f.key as keyof typeof form] ?? '')}
                  onChange={e => setForm(p => ({ ...p, [f.key]: f.type === 'number' ? +e.target.value : e.target.value }))}
                  className="glass-input w-full rounded-xl px-3 py-2 text-sm outline-none" />
              </div>
            ))}
          </div>
          {saved && <div className="mt-3 text-center text-emerald-500 text-sm font-bold">✅ {editId ? 'Product updated!' : 'Product added!'}</div>}
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={!form.name || !form.sku} className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40">
              💾 {editId ? 'Save Changes' : 'Add Product'}
            </button>
            <button onClick={() => { setShowAddForm(false); setEditId(null); setForm(BLANK); }} className="btn-glass px-6 py-2.5 rounded-xl text-sm font-semibold text-indigo-900 dark:text-white">Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-40">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by name or SKU..."
            className="glass-input w-full rounded-xl px-4 py-2.5 text-sm outline-none" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {categories.map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${filterCat === c ? 'bg-violet-600 text-white shadow-lg' : 'btn-glass text-indigo-900 dark:text-white/80'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full erp-table">
            <thead>
              <tr><th>Product</th><th>SKU</th><th>Rack</th><th>Price</th><th>Cost</th><th>Stock</th><th>Status</th><th>Expiry</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const isLow = p.quantity < 15;
                const isExpiring = p.expiryDate && new Date(p.expiryDate) < new Date(Date.now() + 30 * 24 * 3600000);
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="font-semibold text-indigo-900 dark:text-white text-sm">{p.name}</div>
                      <div className="text-xs text-indigo-600 dark:text-white/40">{p.category} · {p.unit}</div>
                    </td>
                    <td className="font-mono text-xs">{p.sku}</td>
                    <td><span className="bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-lg text-xs font-medium">{p.rack ?? '—'}</span></td>
                    <td className="font-bold text-violet-600 dark:text-violet-400">₹{p.price}</td>
                    <td className="text-indigo-700 dark:text-white/60 text-xs">₹{p.cost}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${isLow ? 'text-red-500' : 'text-emerald-500'}`}>{p.quantity}</span>
                        <div className="w-12 h-1.5 rounded-full bg-white/20">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, p.quantity)}%`, background: isLow ? '#ef4444' : '#10b981' }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isLow ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                        {isLow ? 'Low' : 'OK'}
                      </span>
                    </td>
                    <td>
                      {p.expiryDate
                        ? <span className={`text-xs font-medium ${isExpiring ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-white/45'}`}>{p.expiryDate}</span>
                        : '—'}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(p)} className="text-xs bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg hover:bg-blue-500/30 font-medium">✏️</button>
                        <button onClick={() => updateProduct(p.id, { quantity: p.quantity + 10 })} className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-1 rounded-lg hover:bg-green-500/30 font-medium">+10</button>
                        <button onClick={() => { if (confirm(`Delete ${p.name}?`)) deleteProduct(p.id); }} className="text-xs bg-red-500/20 text-red-500 px-2 py-1 rounded-lg hover:bg-red-500/30 font-medium">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-indigo-700 dark:text-white/40">Stock Value: <strong className="text-indigo-900 dark:text-white">₹{totalValue.toLocaleString()}</strong></span>
          <span className="text-xs text-indigo-700 dark:text-white/40">Showing {filtered.length} of {products.length}</span>
        </div>
      </div>
    </div>
  );
}
