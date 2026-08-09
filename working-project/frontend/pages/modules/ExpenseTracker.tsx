import { useState } from 'react';
import { useData, exportToCSV } from '../../context/DataContext';
import { expenseCategoryData } from '../../data/mockData';
import type { Expense } from '../../types/erp';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useApp } from '../../context/AppContext';

const EXPENSE_CATEGORIES = ['Rent', 'Electricity', 'Transport', 'Salary', 'Marketing', 'Maintenance', 'Stationery', 'Internet', 'Packaging', 'Miscellaneous'];

export default function ExpenseTracker() {
  const { expenses, addExpense } = useData();
  const { currentUser } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [filterCat, setFilterCat] = useState('All');
  const [newExp, setNewExp] = useState({ category: 'Rent', amount: '', description: '', paidBy: '' });
  const [saved, setSaved] = useState(false);

  const filtered = expenses.filter(e => filterCat === 'All' || e.category === filterCat);
  const total = filtered.reduce((s, e) => s + e.amount, 0);
  const todayTotal = expenses.filter(e => e.date === new Date().toISOString().slice(0, 10)).reduce((s, e) => s + e.amount, 0);

  const handleAdd = () => {
    if (!newExp.amount || !newExp.description) return;
    const exp: Omit<Expense, 'id'> = {
      date: new Date().toISOString().slice(0, 10),
      category: newExp.category, amount: parseFloat(newExp.amount),
      description: newExp.description, paidBy: newExp.paidBy || currentUser?.name || 'Owner'
    };
    addExpense(exp);
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowAdd(false); setNewExp({ category: 'Rent', amount: '', description: '', paidBy: '' }); }, 1000);
  };

  const handleExport = () => {
    exportToCSV(
      ['Date', 'Category', 'Description', 'Paid By', 'Amount'],
      filtered.map(e => [e.date, e.category, e.description, e.paidBy, String(e.amount)]),
      `Expenses_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  const weekData = [
    { day: 'Mon', amount: 3200 }, { day: 'Tue', amount: 8100 }, { day: 'Wed', amount: 2400 },
    { day: 'Thu', amount: 5600 }, { day: 'Fri', amount: 9800 }, { day: 'Sat', amount: 4100 }, { day: 'Sun', amount: 1200 },
  ];

  return (
    <div className="p-4 md:p-6 fade-up space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-indigo-900 dark:text-white">💸 Expense Tracker</h2>
          <p className="text-xs text-indigo-700 dark:text-white/50 mt-0.5">Today: <span className="text-red-500 font-bold">₹{todayTotal.toLocaleString()}</span></p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-glass text-xs px-3 py-2 rounded-xl font-semibold text-indigo-900 dark:text-white">📤 Export CSV</button>
          <button onClick={() => setShowAdd(s => !s)} className="btn-primary text-xs px-4 py-2 rounded-xl font-semibold">{showAdd ? '✕ Cancel' : '＋ Add Expense'}</button>
        </div>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="glass rounded-2xl p-5 border border-violet-500/30">
          <h3 className="font-bold text-indigo-900 dark:text-white mb-4 text-sm">➕ Add New Expense</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-indigo-700 dark:text-white/55 block mb-1">Category</label>
              <select value={newExp.category} onChange={e => setNewExp(p => ({ ...p, category: e.target.value }))}
                className="glass-input w-full rounded-xl px-3 py-2.5 text-sm">
                {EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-indigo-700 dark:text-white/55 block mb-1">Amount (₹) *</label>
              <input type="number" placeholder="0.00" value={newExp.amount} onChange={e => setNewExp(p => ({ ...p, amount: e.target.value }))}
                className="glass-input w-full rounded-xl px-3 py-2.5 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-indigo-700 dark:text-white/55 block mb-1">Description *</label>
              <input placeholder="What was this expense for?" value={newExp.description} onChange={e => setNewExp(p => ({ ...p, description: e.target.value }))}
                className="glass-input w-full rounded-xl px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="text-xs text-indigo-700 dark:text-white/55 block mb-1">Paid By</label>
              <input placeholder="Owner / Staff name" value={newExp.paidBy} onChange={e => setNewExp(p => ({ ...p, paidBy: e.target.value }))}
                className="glass-input w-full rounded-xl px-3 py-2.5 text-sm" />
            </div>
            <div className="flex items-end">
              <div className="flex gap-2 w-full">
                <button onClick={handleAdd} disabled={!newExp.amount || !newExp.description} className="btn-primary flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40">💾 Save</button>
                <button onClick={() => setShowAdd(false)} className="btn-glass flex-1 py-2.5 rounded-xl text-sm font-semibold text-indigo-900 dark:text-white">Cancel</button>
              </div>
            </div>
          </div>
          {saved && <div className="mt-3 text-center text-emerald-500 text-sm font-bold">✅ Expense recorded!</div>}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-4 lg:col-span-2">
          <h3 className="font-bold text-indigo-900 dark:text-white text-sm mb-3">📆 Weekly Expense Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weekData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${Number(v) / 1000}k`} />
              <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`]} contentStyle={{ background: 'rgba(15,12,41,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white', fontSize: 12 }} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {weekData.map((_entry, i) => <Cell key={i} fill={i === weekData.length - 1 ? '#8b5cf6' : '#f43f5e'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass rounded-2xl p-4">
          <h3 className="font-bold text-indigo-900 dark:text-white text-sm mb-1">By Category</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={expenseCategoryData} cx="50%" cy="50%" outerRadius={60} dataKey="value" paddingAngle={3}>
                {expenseCategoryData.map((_e, i) => <Cell key={i} fill={expenseCategoryData[i]?.color ?? '#888'} />)}
              </Pie>
              <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`]} contentStyle={{ background: 'rgba(15,12,41,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-1">
            {expenseCategoryData.slice(0, 3).map(e => (
              <div key={e.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: e.color }} />
                <span className="text-xs text-indigo-700 dark:text-white/60 flex-1">{e.name}</span>
                <span className="text-xs font-bold text-indigo-900 dark:text-white">₹{(e.value / 1000).toFixed(0)}k</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['All', ...EXPENSE_CATEGORIES].map(c => (
          <button key={c} onClick={() => setFilterCat(c)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 ${filterCat === c ? 'bg-violet-600 text-white shadow-lg' : 'btn-glass text-indigo-900 dark:text-white/80'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Expense Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full erp-table">
            <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Paid By</th><th className="text-right">Amount</th></tr></thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={e.id ?? i}>
                  <td className="text-xs">{e.date}</td>
                  <td><span className="bg-violet-500/20 text-violet-700 dark:text-violet-300 text-xs px-2 py-0.5 rounded-full font-medium">{e.category}</span></td>
                  <td>{e.description}</td>
                  <td className="text-indigo-600 dark:text-white/55 text-sm">{e.paidBy}</td>
                  <td className="text-right font-bold text-red-500">₹{e.amount.toLocaleString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-indigo-600 dark:text-white/30 text-sm">No expenses recorded</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-white/10 flex justify-between items-center">
          <span className="text-xs text-indigo-700 dark:text-white/40">{filtered.length} records · Total expenses: {expenses.length}</span>
          <span className="font-bold text-red-500 text-sm">₹{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
