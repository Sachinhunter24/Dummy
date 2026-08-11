import { useApp } from '../../context/AppContext';
import { useData } from '../../context/DataContext';
import { revenueData, expenseCategoryData } from '../../data/mockData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function Overview() {
  const { role, setActiveModule, currentUser } = useApp();
  const { products, customers, udhaarAccounts, expenses } = useData();

  const lowStock = products.filter(p => p.quantity < 15);
  const totalUdhaar = udhaarAccounts.reduce((s, a) => s + a.balance, 0);
  const vipCount = customers.filter(c => c.status === 'vip').length;
  const weekRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);
  const weekExpenses = revenueData.reduce((s, d) => s + d.expenses, 0);
  const todayRev = revenueData[revenueData.length - 1]?.revenue ?? 0;
  const todayExpenses = expenses.filter(e => e.date === new Date().toISOString().slice(0, 10)).reduce((s, e) => s + e.amount, 0);

  const kpis = [
    { label: "Today's Revenue", value: `₹${(todayRev / 1000).toFixed(1)}K`, icon: '💰', sub: '+12% vs yesterday', color: 'from-violet-600 to-purple-700', glow: '0 0 20px rgba(139,92,246,0.5)' },
    { label: 'Weekly Revenue', value: `₹${(weekRevenue / 1000).toFixed(0)}K`, icon: '📈', sub: `Expense: ₹${(weekExpenses / 1000).toFixed(0)}K`, color: 'from-blue-500 to-cyan-600', glow: '0 0 20px rgba(59,130,246,0.5)' },
    { label: 'Total Udhaar', value: `₹${totalUdhaar.toLocaleString()}`, icon: '📒', sub: `${udhaarAccounts.length} accounts`, color: 'from-amber-500 to-orange-600', glow: '0 0 20px rgba(245,158,11,0.5)' },
    { label: 'VIP Customers', value: vipCount.toString(), icon: '⭐', sub: `of ${customers.length} total`, color: 'from-pink-500 to-rose-600', glow: '0 0 20px rgba(236,72,153,0.5)' },
  ];

  const ownerKPIs = [
    { label: 'Net Profit (Week)', value: `₹${((weekRevenue - weekExpenses) / 1000).toFixed(0)}K`, icon: '🏦', sub: `${Math.round((weekRevenue - weekExpenses) / weekRevenue * 100)}% margin`, color: 'from-emerald-500 to-teal-600', glow: '0 0 20px rgba(16,185,129,0.5)' },
    { label: 'Low Stock Items', value: lowStock.length.toString(), icon: '⚠️', sub: 'Need restocking', color: 'from-red-500 to-rose-700', glow: '0 0 20px rgba(239,68,68,0.5)' },
  ];

  const quickActions = [
    { icon: '🧾', label: 'New Invoice', module: 'pos' as const, color: 'from-violet-600 to-purple-700' },
    { icon: '📦', label: 'Inventory', module: 'inventory' as const, color: 'from-blue-500 to-cyan-600' },
    { icon: '👤', label: 'Add Client', module: 'clients' as const, color: 'from-emerald-500 to-teal-600' },
    { icon: '💸', label: 'Expenses', module: 'expenses' as const, color: 'from-amber-500 to-orange-600' },
    { icon: '🎯', label: 'Pipeline', module: 'pipeline' as const, color: 'from-indigo-500 to-blue-600' },
    { icon: '👥', label: 'Staff', module: 'staff' as const, color: 'from-pink-500 to-rose-600' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 fade-up">
      {/* Welcome banner */}
      <div className="glass rounded-2xl p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899)' }}>⚡</div>
        <div>
          <div className="font-extrabold text-indigo-900 dark:text-white">Welcome back, {currentUser?.name?.split(' ')[0] ?? 'User'}! 👋</div>
          <div className="text-xs text-indigo-600 dark:text-white/50">{currentUser?.businessName} · <span className="capitalize">{currentUser?.role}</span> Dashboard</div>
        </div>
        {todayExpenses > 0 && (
          <div className="ml-auto text-right hidden sm:block">
            <div className="text-xs text-indigo-600 dark:text-white/50">Today's Expenses</div>
            <div className="font-bold text-red-500">₹{todayExpenses.toLocaleString()}</div>
          </div>
        )}
      </div>

      {/* KPI Grid */}
      <div>
        <h2 className="text-base font-bold text-indigo-900 dark:text-white mb-3">📊 Business Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...kpis, ...(role === 'owner' ? ownerKPIs : [])].map((k, i) => (
            <div key={i} className="glass rounded-2xl p-4 kpi-card" style={{ boxShadow: k.glow }}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.color} flex items-center justify-center text-xl mb-3 shadow-lg`}>{k.icon}</div>
              <div className="text-xl font-extrabold text-indigo-900 dark:text-white leading-none">{k.value}</div>
              <div className="text-xs font-semibold text-indigo-800 dark:text-white/80 mt-1">{k.label}</div>
              <div className="text-[11px] text-indigo-600 dark:text-white/45 mt-0.5">{k.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-4 lg:col-span-2">
          <h3 className="font-bold text-indigo-900 dark:text-white mb-4 text-sm">📉 Revenue vs Expenses (7 Days)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={revenueData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.6)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${Number(v) / 1000}k`} />
              <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`]} contentStyle={{ background: 'rgba(15,12,41,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white', fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
              <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fill="url(#expGrad)" name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {role === 'owner' && (
          <div className="glass rounded-2xl p-4">
            <h3 className="font-bold text-indigo-900 dark:text-white mb-3 text-sm">💸 Expense Split</h3>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={expenseCategoryData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} dataKey="value" paddingAngle={3}>
                  {expenseCategoryData.map((_e, i) => <Cell key={i} fill={expenseCategoryData[i]?.color ?? '#888'} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }} />
                <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`]} contentStyle={{ background: 'rgba(15,12,41,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Quick Actions + Low Stock */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-4">
          <h3 className="font-bold text-indigo-900 dark:text-white mb-3 text-sm">⚡ Quick Actions</h3>
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((a, i) => (
              <button key={i} onClick={() => setActiveModule(a.module)}
                className={`bg-gradient-to-br ${a.color} text-white rounded-xl p-3 flex flex-col items-center gap-1 text-xs font-semibold hover:scale-[1.04] transition-all shadow-md`}>
                <span className="text-xl">{a.icon}</span>{a.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-4">
          <h3 className="font-bold text-indigo-900 dark:text-white mb-3 text-sm flex items-center gap-2">
            ⚠️ Low Stock Alert
            <span className="bg-red-500/20 text-red-500 text-xs px-2 py-0.5 rounded-full font-semibold">{lowStock.length}</span>
          </h3>
          <div className="space-y-2">
            {lowStock.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-white/10 last:border-0">
                <div>
                  <div className="text-sm font-medium text-indigo-900 dark:text-white">{p.name}</div>
                  <div className="text-xs text-indigo-600 dark:text-white/40">{p.sku} · {p.rack}</div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${p.quantity < 10 ? 'text-red-500' : 'text-amber-500'}`}>{p.quantity}</div>
                  <div className="text-xs text-indigo-600 dark:text-white/40">{p.unit}s</div>
                </div>
              </div>
            ))}
            {lowStock.length === 0 && <div className="text-center py-4 text-indigo-600 dark:text-white/30 text-sm">All stock levels OK ✅</div>}
          </div>
        </div>
      </div>

      {/* Udhaar Snapshot */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-indigo-900 dark:text-white text-sm">📒 Udhaar Snapshot</h3>
          <button onClick={() => setActiveModule('udhaar')} className="text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline">View All →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full erp-table">
            <thead><tr><th>Customer</th><th>Phone</th><th>Balance Due</th><th>Last Txn</th><th>Action</th></tr></thead>
            <tbody>
              {udhaarAccounts.filter(a => a.balance > 0).slice(0, 4).map(a => (
                <tr key={a.customerId}>
                  <td className="font-medium">{a.customerName}</td>
                  <td>{a.phone}</td>
                  <td><span className="text-red-500 font-bold">₹{a.balance.toLocaleString()}</span></td>
                  <td className="text-xs">{a.lastTransaction}</td>
                  <td>
                    <button onClick={() => {
                      const msg = encodeURIComponent(`Dear ${a.customerName}, your outstanding balance is ₹${a.balance.toLocaleString()}. Please clear at the earliest. Thank you!`);
                      window.open(`https://wa.me/91${a.phone}?text=${msg}`, '_blank');
                    }} className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-1 rounded-lg font-semibold hover:bg-green-500/30">
                      💬 Remind
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
