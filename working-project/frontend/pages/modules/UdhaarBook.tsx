import { useState } from 'react';
import { useData } from '../../context/DataContext';
import type { UdhaarAccount } from '../../types/erp';
import { useApp } from '../../context/AppContext';

export default function UdhaarBook() {
  const { udhaarAccounts, setUdhaarAccounts } = useData();
  const { currentUser } = useApp();
  const [selected, setSelected] = useState<UdhaarAccount | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<'credit' | 'payment'>('credit');
  const [addAmount, setAddAmount] = useState('');
  const [addNote, setAddNote] = useState('');
  const [search, setSearch] = useState('');
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [newAcc, setNewAcc] = useState({ name: '', phone: '' });

  const totalDue = udhaarAccounts.reduce((s, a) => s + a.balance, 0);
  const filteredAccounts = udhaarAccounts.filter(a =>
    a.customerName.toLowerCase().includes(search.toLowerCase()) ||
    a.phone.includes(search)
  );

  const handleTransaction = () => {
    if (!selected || !addAmount) return;
    const amt = parseFloat(addAmount);
    const newBalance = addType === 'credit' ? selected.balance + amt : Math.max(0, selected.balance - amt);
    const newEntry = {
      id: Date.now().toString(), customerId: selected.customerId,
      customerName: selected.customerName, phone: selected.phone,
      date: new Date().toISOString().slice(0, 10), amount: amt, type: addType, note: addNote || (addType === 'credit' ? 'Credit given' : 'Payment received')
    };
    const updated: UdhaarAccount = { ...selected, balance: newBalance, lastTransaction: newEntry.date, entries: [newEntry, ...selected.entries] };
    setUdhaarAccounts(udhaarAccounts.map(a => a.customerId === selected.customerId ? updated : a));
    setSelected(updated);
    setAddAmount(''); setAddNote(''); setShowAdd(false);
  };

  const sendWhatsAppReminder = (account: UdhaarAccount) => {
    const msg = encodeURIComponent(
      `Dear ${account.customerName},\n\nThis is a friendly reminder from ${currentUser?.businessName ?? 'our store'}.\n\n` +
      `Your outstanding balance is *₹${account.balance.toLocaleString()}*.\n\n` +
      `Please clear your dues at your earliest convenience.\n\nThank you! 🙏`
    );
    window.open(`https://wa.me/91${account.phone}?text=${msg}`, '_blank');
  };

  const addNewAccount = () => {
    if (!newAcc.name || !newAcc.phone) return;
    const acc: UdhaarAccount = {
      customerId: `c_${Date.now()}`, customerName: newAcc.name, phone: newAcc.phone,
      balance: 0, lastTransaction: new Date().toISOString().slice(0, 10), entries: []
    };
    setUdhaarAccounts([...udhaarAccounts, acc]);
    setNewAcc({ name: '', phone: '' }); setShowNewAccount(false);
  };

  return (
    <div className="p-4 md:p-6 fade-up space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-indigo-900 dark:text-white">📒 Udhaar / Khata Book</h2>
          <p className="text-xs text-indigo-700 dark:text-white/50 mt-0.5">Total due: <span className="text-red-500 font-bold">₹{totalDue.toLocaleString()}</span></p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowNewAccount(s => !s)} className="btn-primary text-xs px-3 py-2 rounded-xl font-semibold">＋ New Account</button>
        </div>
      </div>

      {/* New Account Form */}
      {showNewAccount && (
        <div className="glass rounded-2xl p-4 border border-violet-500/30 flex gap-3 flex-wrap items-end">
          <div>
            <label className="text-xs text-indigo-700 dark:text-white/55 block mb-1">Customer Name *</label>
            <input value={newAcc.name} onChange={e => setNewAcc(p => ({ ...p, name: e.target.value }))} placeholder="Full name" className="glass-input rounded-xl px-3 py-2 text-sm w-44" />
          </div>
          <div>
            <label className="text-xs text-indigo-700 dark:text-white/55 block mb-1">Phone Number *</label>
            <input value={newAcc.phone} onChange={e => setNewAcc(p => ({ ...p, phone: e.target.value }))} placeholder="10-digit mobile" className="glass-input rounded-xl px-3 py-2 text-sm w-40" />
          </div>
          <button onClick={addNewAccount} disabled={!newAcc.name || !newAcc.phone} className="btn-primary px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40">Add</button>
          <button onClick={() => setShowNewAccount(false)} className="btn-glass px-4 py-2 rounded-xl text-sm font-semibold text-indigo-900 dark:text-white">Cancel</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Account List */}
        <div className="lg:col-span-2 space-y-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search customer..."
            className="glass-input w-full rounded-xl px-4 py-2.5 text-sm outline-none" />

          <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
            {filteredAccounts.map(a => (
              <button key={a.customerId} onClick={() => setSelected(a)}
                className={`w-full glass rounded-2xl p-4 text-left hover:scale-[1.01] transition-all ${selected?.customerId === a.customerId ? 'border-violet-500/60 shadow-lg' : 'border-transparent'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">{a.customerName[0]}</div>
                    <div>
                      <div className="font-bold text-indigo-900 dark:text-white text-sm">{a.customerName}</div>
                      <div className="text-xs text-indigo-600 dark:text-white/45">{a.phone}</div>
                      <div className="text-xs text-indigo-600 dark:text-white/35">Last: {a.lastTransaction}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-extrabold text-sm ${a.balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>₹{a.balance.toLocaleString()}</div>
                    <div className="text-xs text-indigo-600 dark:text-white/40">{a.entries.length} txns</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  {a.balance > 3000 && <span className="text-xs bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full font-medium">High Dues</span>}
                  {a.balance > 0 && new Date(a.lastTransaction) < new Date(Date.now() - 30 * 24 * 3600000) && (
                    <span className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">30+ days</span>
                  )}
                </div>
              </button>
            ))}
            {filteredAccounts.length === 0 && (
              <div className="text-center py-8 text-indigo-600 dark:text-white/30 text-sm">No accounts found</div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-3 space-y-3">
          {selected ? (
            <>
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-3xl text-white font-bold">{selected.customerName[0]}</div>
                    <div>
                      <div className="font-extrabold text-indigo-900 dark:text-white">{selected.customerName}</div>
                      <div className="text-sm text-indigo-600 dark:text-white/55">📞 {selected.phone}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-indigo-600 dark:text-white/50 mb-1">Outstanding</div>
                    <div className={`text-2xl font-extrabold ${selected.balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>₹{selected.balance.toLocaleString()}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <button onClick={() => { setAddType('credit'); setShowAdd(true); }}
                    className="bg-red-500/20 text-red-600 dark:text-red-400 text-xs py-2.5 rounded-xl font-bold hover:bg-red-500/30">➕ Give Credit</button>
                  <button onClick={() => { setAddType('payment'); setShowAdd(true); }}
                    className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs py-2.5 rounded-xl font-bold hover:bg-emerald-500/30">✅ Collect ₹</button>
                  <button onClick={() => sendWhatsAppReminder(selected)}
                    className="bg-green-500/20 text-green-600 dark:text-green-400 text-xs py-2.5 rounded-xl font-bold hover:bg-green-500/30">💬 WhatsApp</button>
                </div>
              </div>

              {showAdd && (
                <div className="glass rounded-2xl p-4 border border-violet-500/30">
                  <h4 className="font-bold text-indigo-900 dark:text-white text-sm mb-3">{addType === 'credit' ? '➕ Add Credit' : '✅ Record Payment'}</h4>
                  <div className="space-y-3">
                    <input type="number" placeholder="Amount (₹)" value={addAmount} onChange={e => setAddAmount(e.target.value)}
                      className="glass-input w-full rounded-xl px-4 py-3 text-lg font-bold text-center outline-none" />
                    <input placeholder="Note (optional)" value={addNote} onChange={e => setAddNote(e.target.value)}
                      className="glass-input w-full rounded-xl px-4 py-2.5 text-sm outline-none" />
                    <div className="flex gap-2">
                      <button onClick={handleTransaction} disabled={!addAmount} className="btn-primary flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40">Confirm</button>
                      <button onClick={() => { setShowAdd(false); setAddAmount(''); setAddNote(''); }} className="btn-glass flex-1 py-2.5 rounded-xl text-sm font-semibold text-indigo-900 dark:text-white">Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="glass rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <h4 className="font-bold text-indigo-900 dark:text-white text-sm">📋 Transaction History</h4>
                  <span className="text-xs text-indigo-600 dark:text-white/40">{selected.entries.length} records</span>
                </div>
                {selected.entries.length === 0
                  ? <div className="text-center py-8 text-indigo-600 dark:text-white/30 text-sm">No transactions yet</div>
                  : (
                    <div className="divide-y divide-white/10 max-h-64 overflow-y-auto">
                      {selected.entries.map(e => (
                        <div key={e.id} className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${e.type === 'credit' ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                              {e.type === 'credit' ? '↑' : '↓'}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-indigo-900 dark:text-white">{e.note}</div>
                              <div className="text-xs text-indigo-600 dark:text-white/45">{e.date}</div>
                            </div>
                          </div>
                          <div className={`font-bold text-sm ${e.type === 'credit' ? 'text-red-500' : 'text-emerald-500'}`}>
                            {e.type === 'credit' ? '+' : '-'}₹{e.amount.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </>
          ) : (
            <div className="glass rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">📒</div>
              <div className="font-semibold text-indigo-900 dark:text-white">Select an account</div>
              <div className="text-sm text-indigo-600 dark:text-white/50 mt-1">Choose a customer from the list to view their khata</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
