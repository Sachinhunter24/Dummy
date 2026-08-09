import { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useData } from '../../context/DataContext';
import type { ModuleId } from '../../types/erp';

interface Result {
  label: string;
  sub: string;
  icon: string;
  module: ModuleId;
}

export function GlobalSearch() {
  const { globalSearch, setGlobalSearch, setActiveModule } = useApp();
  const { products, customers, staff, leads } = useData();
  const inputRef = useRef<HTMLInputElement>(null);

  const q = globalSearch.toLowerCase().trim();
  const results: Result[] = [];

  if (q.length >= 1) {
    products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 3).forEach(p => {
      results.push({ label: p.name, sub: `SKU: ${p.sku} · ₹${p.price} · Stock: ${p.quantity}`, icon: '📦', module: 'inventory' });
    });
    customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q)).slice(0, 3).forEach(c => {
      results.push({ label: c.name, sub: `${c.phone} · ${c.status.toUpperCase()} · ₹${c.totalPurchases.toLocaleString()}`, icon: '👤', module: 'clients' });
    });
    staff.filter(s => s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q)).slice(0, 2).forEach(s => {
      results.push({ label: s.name, sub: `${s.role} · ${s.department} · ${s.status}`, icon: '🧑‍💼', module: 'staff' });
    });
    leads.filter(l => l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q)).slice(0, 2).forEach(l => {
      results.push({ label: l.name, sub: `${l.company} · ₹${(l.value / 100000).toFixed(1)}L · ${l.stage}`, icon: '🎯', module: 'pipeline' });
    });
  }

  const navigate = (module: ModuleId) => {
    setActiveModule(module);
    setGlobalSearch('');
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') setGlobalSearch('');
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [setGlobalSearch]);

  return (
    <div className="relative hidden md:flex items-center flex-1 max-w-xs">
      <div className="glass rounded-xl px-3 py-2 flex items-center gap-2 w-full">
        <span className="text-sm text-indigo-600 dark:text-white/50">🔍</span>
        <input
          ref={inputRef}
          value={globalSearch}
          onChange={e => setGlobalSearch(e.target.value)}
          placeholder="Search products, clients, staff... (⌘K)"
          className="bg-transparent text-xs text-indigo-900 dark:text-white placeholder-indigo-500 dark:placeholder-white/35 outline-none w-full"
        />
        {globalSearch && (
          <button onClick={() => setGlobalSearch('')} className="text-xs text-indigo-500 dark:text-white/40 hover:text-indigo-900 dark:hover:text-white">✕</button>
        )}
      </div>

      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 glass rounded-2xl overflow-hidden shadow-2xl z-50">
          <div className="px-3 py-2 border-b border-white/10">
            <span className="text-[10px] text-indigo-600 dark:text-white/40 font-semibold uppercase tracking-widest">{results.length} results for "{globalSearch}"</span>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {results.map((r, i) => (
              <button key={i} onClick={() => navigate(r.module)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/15 text-left transition-colors border-b border-white/5 last:border-0">
                <span className="text-base flex-shrink-0">{r.icon}</span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-indigo-900 dark:text-white truncate">{r.label}</div>
                  <div className="text-[10px] text-indigo-600 dark:text-white/45 truncate">{r.sub}</div>
                </div>
                <div className="ml-auto text-[9px] bg-violet-500/20 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded font-semibold flex-shrink-0">{r.module}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {globalSearch && results.length === 0 && q.length >= 1 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 glass rounded-2xl p-4 text-center shadow-2xl z-50">
          <div className="text-xl mb-1">🔍</div>
          <div className="text-xs text-indigo-700 dark:text-white/60">No results for "{globalSearch}"</div>
        </div>
      )}
    </div>
  );
}
