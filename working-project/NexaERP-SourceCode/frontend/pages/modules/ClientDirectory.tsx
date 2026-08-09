import { useState, useRef } from 'react';
import { useData, exportToCSV, parseCSV } from '../../context/DataContext';
import { useApp } from '../../context/AppContext';
import type { Customer } from '../../types/erp';

const STATUS_COLORS = {
  vip: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
  active: 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white',
  inactive: 'bg-white/20 text-indigo-700 dark:text-white/60',
};

const BLANK: Omit<Customer, 'id'> = { name: '', phone: '', email: '', status: 'active', balance: 0, lastContact: new Date().toISOString().slice(0, 10), totalPurchases: 0 };

export default function ClientDirectory() {
  const { role } = useApp();
  const { customers, addCustomer, updateCustomer, importCustomers } = useData();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'vip' | 'active' | 'inactive'>('all');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Omit<Customer, 'id'>>(BLANK);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = customers.filter(c =>
    (filterStatus === 'all' || c.status === filterStatus) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) ||
     c.phone.includes(search) ||
     c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const vip = customers.filter(c => c.status === 'vip').length;
  const active = customers.filter(c => c.status === 'active').length;
  const inactive = customers.filter(c => c.status === 'inactive').length;
  const totalRevenue = customers.reduce((s, c) => s + c.totalPurchases, 0);

  const openAdd = () => { setForm(BLANK); setEditMode(false); setShowAdd(true); };
  const openEdit = (c: Customer) => {
    const { id: _id, ...rest } = c;
    setForm(rest); setEditMode(true); setShowAdd(true); setSelected(null);
  };

  const handleSave = () => {
    if (!form.name || !form.phone) return;
    if (editMode && selected) {
      updateCustomer(selected.id, form);
    } else {
      addCustomer(form);
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowAdd(false); setForm(BLANK); }, 1000);
  };

  const handleCSVImport = async (file: File) => {
    const text = await file.text();
    const rows = parseCSV(text);
    importCustomers(rows.map(r => ({
      name: r['name'] ?? 'Customer',
      phone: r['phone'] ?? r['mobile'] ?? '',
      email: r['email'] ?? '',
      status: 'active' as const,
      balance: 0,
      lastContact: new Date().toISOString().slice(0, 10),
      totalPurchases: 0,
      ...(r['address'] ? { address: r['address'] } : {}),
      ...(r['gstin'] ? { gstin: r['gstin'] } : {}),
    })));
  };

  const handleExport = () => {
    exportToCSV(
      ['Name', 'Phone', 'Email', 'Status', 'Balance', 'Total Purchases', 'Last Contact'],
      filtered.map(c => [c.name, c.phone, c.email, c.status, String(c.balance), String(c.totalPurchases), c.lastContact]),
      `Clients_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  const openWhatsApp = (phone: string, name: string) => {
    const msg = encodeURIComponent(`Hello ${name}, greetings from our team! How can we assist you today?`);
    window.open(`https://wa.me/91${phone}?text=${msg}`, '_blank');
  };

  const openSMS = (phone: string) => {
    window.open(`sms:+91${phone}`, '_blank');
  };

  return (
    <div className="p-4 md:p-6 fade-up space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-indigo-900 dark:text-white">👥 Client Directory</h2>
          <p className="text-xs text-indigo-700 dark:text-white/50 mt-0.5">{customers.length} clients · ₹{(totalRevenue / 100000).toFixed(1)}L lifetime value</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleCSVImport(f); e.target.value = ''; }} />
          <button onClick={() => fileRef.current?.click()} className="btn-glass text-xs px-3 py-2 rounded-xl font-semibold text-indigo-900 dark:text-white">📁 CSV Import</button>
          <button onClick={handleExport} className="btn-glass text-xs px-3 py-2 rounded-xl font-semibold text-indigo-900 dark:text-white">📤 Export</button>
          <button onClick={openAdd} className="btn-primary text-xs px-3 py-2 rounded-xl font-semibold">＋ Add Client</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: customers.length, icon: '👥', filter: 'all' },
          { label: 'VIP', value: vip, icon: '⭐', filter: 'vip' },
          { label: 'Active', value: active, icon: '✅', filter: 'active' },
          { label: 'Inactive', value: inactive, icon: '😴', filter: 'inactive' },
        ].map(s => (
          <div key={s.filter} className="glass rounded-2xl p-3 text-center kpi-card cursor-pointer" onClick={() => setFilterStatus(s.filter as typeof filterStatus)}>
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="text-xl font-extrabold text-indigo-900 dark:text-violet-400">{s.value}</div>
            <div className="text-xs text-indigo-600 dark:text-white/50">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add / Edit Form */}
      {showAdd && (
        <div className="glass rounded-2xl p-5 border border-violet-500/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-indigo-900 dark:text-white text-sm">{editMode ? '✏️ Edit Client' : '➕ Add New Client'}</h3>
            <button onClick={() => setShowAdd(false)} className="btn-glass w-7 h-7 rounded-lg text-xs flex items-center justify-center text-indigo-900 dark:text-white">✕</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: 'name', label: 'Full Name *', type: 'text' },
              { key: 'phone', label: 'Phone Number *', type: 'tel' },
              { key: 'email', label: 'Email Address', type: 'email' },
              { key: 'address', label: 'Address', type: 'text' },
              { key: 'gstin', label: 'GSTIN', type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-indigo-700 dark:text-white/55 block mb-1">{f.label}</label>
                <input type={f.type} value={String((form as Record<string, unknown>)[f.key] ?? '')}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.label.replace(' *', '')} className="glass-input w-full rounded-xl px-3 py-2 text-sm" />
              </div>
            ))}
            <div>
              <label className="text-xs text-indigo-700 dark:text-white/55 block mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Customer['status'] }))}
                className="glass-input w-full rounded-xl px-3 py-2 text-sm">
                <option value="active">Active</option>
                <option value="vip">VIP</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-indigo-700 dark:text-white/55 block mb-1">Notes</label>
              <input value={form.notes ?? ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Any notes..." className="glass-input w-full rounded-xl px-3 py-2 text-sm" />
            </div>
          </div>
          {saved && <div className="mt-3 text-center text-emerald-500 text-sm font-bold">✅ {editMode ? 'Client updated!' : 'Client added!'}</div>}
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={!form.name || !form.phone} className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40">💾 {editMode ? 'Update' : 'Add'} Client</button>
            <button onClick={() => setShowAdd(false)} className="btn-glass px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-900 dark:text-white">Cancel</button>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by name, phone, email..."
            className="glass-input w-full rounded-xl px-4 py-2.5 text-sm outline-none" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'vip', 'active', 'inactive'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize ${filterStatus === s ? 'bg-violet-600 text-white' : 'btn-glass text-indigo-900 dark:text-white/80'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Table */}
        <div className={selected ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full erp-table">
                <thead><tr><th>Client</th><th>Phone</th><th>Status</th>{role !== 'staff' && <th>Balance</th>}{role !== 'staff' && <th>Purchases</th>}<th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="cursor-pointer" onClick={() => setSelected(c)}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{c.name[0]}</div>
                          <div>
                            <div className="font-semibold text-indigo-900 dark:text-white text-sm">{c.name}</div>
                            <div className="text-xs text-indigo-600 dark:text-white/40 truncate max-w-[120px]">{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm font-mono">{c.phone}</td>
                      <td><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[c.status]}`}>{c.status.toUpperCase()}</span></td>
                      {role !== 'staff' && <td className={`font-bold text-sm ${c.balance < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{c.balance < 0 ? `₹${Math.abs(c.balance).toLocaleString()}` : '—'}</td>}
                      {role !== 'staff' && <td className="font-semibold text-sm">₹{(c.totalPurchases / 1000).toFixed(1)}K</td>}
                      <td onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <button onClick={() => openWhatsApp(c.phone, c.name)} className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-1 rounded-lg hover:bg-green-500/30 font-medium" title="Open WhatsApp">💬</button>
                          <button onClick={() => openSMS(c.phone)} className="text-xs bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg hover:bg-blue-500/30 font-medium" title="Send SMS">📲</button>
                          <button onClick={() => { setSelected(c); openEdit(c); }} className="text-xs bg-violet-500/20 text-violet-600 dark:text-violet-400 px-2 py-1 rounded-lg hover:bg-violet-500/30 font-medium">✏️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-indigo-600 dark:text-white/30 text-sm">No clients found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        {selected && !showAdd && (
          <div className="glass rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-indigo-900 dark:text-white text-sm">Customer Profile</h3>
              <button onClick={() => setSelected(null)} className="btn-glass w-6 h-6 rounded-lg text-xs flex items-center justify-center text-indigo-900 dark:text-white">✕</button>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-3xl text-white font-bold mx-auto mb-2">{selected.name[0]}</div>
              <div className="font-extrabold text-indigo-900 dark:text-white">{selected.name}</div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold mt-1 inline-block ${STATUS_COLORS[selected.status]}`}>{selected.status.toUpperCase()}</span>
            </div>
            <div className="space-y-2 text-sm">
              {[
                { label: '📞', val: selected.phone },
                { label: '📧', val: selected.email || '—' },
                ...(selected.address ? [{ label: '📍', val: selected.address }] : []),
                ...(selected.gstin ? [{ label: '🏛️', val: selected.gstin }] : []),
                ...(role !== 'staff' ? [
                  { label: '💰', val: `₹${selected.totalPurchases.toLocaleString()}` },
                  { label: '📒', val: selected.balance < 0 ? `₹${Math.abs(selected.balance).toLocaleString()} due` : 'No dues' },
                ] : []),
                { label: '📅', val: selected.lastContact },
              ].map((item, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-sm w-6 flex-shrink-0">{item.label}</span>
                  <span className="text-xs text-indigo-900 dark:text-white/80 break-all">{item.val}</span>
                </div>
              ))}
            </div>
            {selected.notes && <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">{selected.notes}</div>}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => openWhatsApp(selected.phone, selected.name)} className="bg-green-500/20 text-green-600 dark:text-green-400 text-xs py-2.5 rounded-xl font-bold hover:bg-green-500/30">💬 WhatsApp</button>
              <button onClick={() => openSMS(selected.phone)} className="bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs py-2.5 rounded-xl font-bold hover:bg-blue-500/30">📲 SMS</button>
              <button onClick={() => openEdit(selected)} className="btn-glass text-xs py-2.5 rounded-xl font-semibold text-indigo-900 dark:text-white col-span-2">✏️ Edit Profile</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
