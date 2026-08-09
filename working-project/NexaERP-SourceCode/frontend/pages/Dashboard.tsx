import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../types/erp';
import type { ModuleId } from '../types/erp';
import { AIDrawer } from '../components/erp/AIDrawer';
import { ScannerModal } from '../components/erp/ScannerModal';
import { GlobalSearch } from '../components/erp/GlobalSearch';
import { EditProfileModal } from '../components/erp/EditProfileModal';
import Overview from './modules/Overview';
import POSBilling from './modules/POSBilling';
import Inventory from './modules/Inventory';
import UdhaarBook from './modules/UdhaarBook';
import ExpenseTracker from './modules/ExpenseTracker';
import ClientDirectory from './modules/ClientDirectory';
import SalesPipeline from './modules/SalesPipeline';
import StaffManagement from './modules/StaffManagement';
import CategoryModule from './modules/CategoryModule';
import '../styles/erp.css';

type ProfileModal = 'profile' | 'pin' | 'subscription' | null;

interface NavItem { id: ModuleId; label: string; icon: string; roles?: ('owner' | 'manager' | 'staff')[] }
const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Dashboard', icon: '📊' },
  { id: 'pos', label: 'POS Billing', icon: '🧾' },
  { id: 'inventory', label: 'Inventory', icon: '📦', roles: ['owner', 'manager'] },
  { id: 'udhaar', label: 'Udhaar Book', icon: '📒', roles: ['owner', 'manager'] },
  { id: 'expenses', label: 'Expenses', icon: '💸', roles: ['owner', 'manager'] },
  { id: 'clients', label: 'Clients', icon: '👥' },
  { id: 'pipeline', label: 'Sales Pipeline', icon: '🎯' },
  { id: 'staff', label: 'Staff', icon: '🧑‍💼', roles: ['owner', 'manager'] },
  { id: 'reports', label: 'Reports', icon: '📈', roles: ['owner'] },
  { id: 'category', label: 'Industry', icon: '🏭' },
];

function ModuleCanvas() {
  const { activeModule } = useApp();
  switch (activeModule) {
    case 'overview': return <Overview />;
    case 'pos': return <POSBilling />;
    case 'inventory': return <Inventory />;
    case 'udhaar': return <UdhaarBook />;
    case 'expenses': return <ExpenseTracker />;
    case 'clients': return <ClientDirectory />;
    case 'pipeline': return <SalesPipeline />;
    case 'staff': return <StaffManagement />;
    case 'reports': return <OwnerReports />;
    case 'category': return <CategoryModule />;
    default: return <Overview />;
  }
}

function OwnerReports() {
  const { currentUser } = useApp();
  return (
    <div className="p-4 md:p-6 fade-up space-y-4">
      <h2 className="text-lg font-bold text-indigo-900 dark:text-white">📈 Financial Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Monthly Revenue', val: '₹5.2L', sub: '+18% YoY', color: 'from-violet-600 to-purple-700', icon: '💰' },
          { label: 'Monthly Expenses', val: '₹1.8L', sub: '32% ratio', color: 'from-red-500 to-rose-700', icon: '💸' },
          { label: 'Net Profit', val: '₹3.4L', sub: '65% margin', color: 'from-emerald-500 to-teal-600', icon: '🏦' },
        ].map((k, i) => (
          <div key={i} className="glass rounded-2xl p-5 kpi-card">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${k.color} flex items-center justify-center text-2xl mb-3`}>{k.icon}</div>
            <div className="text-2xl font-extrabold text-indigo-900 dark:text-white">{k.val}</div>
            <div className="text-sm text-indigo-800 dark:text-white/70 mt-1">{k.label}</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>
      <div className="glass rounded-2xl p-5">
        <h3 className="font-bold text-indigo-900 dark:text-white text-sm mb-3">📋 Subscription & Plan</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-3xl flex-shrink-0">👑</div>
          <div className="flex-1">
            <div className="font-bold text-indigo-900 dark:text-white">UniversalERP Enterprise Plan</div>
            <div className="text-sm text-indigo-600 dark:text-white/60 mt-0.5">{currentUser?.businessName} · All modules · Unlimited staff</div>
            <div className="text-xs text-indigo-600 dark:text-white/40 mt-1">Valid till: 31 December 2025 · Auto-renew ON</div>
          </div>
          <div className="text-right flex-shrink-0"><div className="font-extrabold text-violet-600 dark:text-violet-400 text-xl">₹2,999</div><div className="text-xs text-indigo-600 dark:text-white/40">/month</div></div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { role, activeModule, setActiveModule, activeCategory, darkMode, toggleDarkMode, notifications, markAllRead, setIsAIOpen, setIsScannerOpen, logout, currentUser, addNotification } = useApp();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [profileModal, setProfileModal] = useState<ProfileModal>(null);

  const unread = notifications.filter(n => !n.read).length;
  const allowedNav = NAV_ITEMS.filter(n => !n.roles || n.roles.includes(role));
  const currentCat = CATEGORIES.find(c => c.id === activeCategory);

  const closeAll = () => { setNotifOpen(false); setProfileOpen(false); };

  return (
    <div className="erp-bg flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 48px)' }}>
      {/* ── HEADER ── */}
      <header className="glass-header flex items-center px-3 h-13 gap-2.5 flex-shrink-0 z-30 relative" style={{ minHeight: 52 }}>
        {/* Mobile menu */}
        <button onClick={() => setMobileSidebar(s => !s)} className="lg:hidden btn-glass w-8 h-8 rounded-xl flex items-center justify-center text-lg text-indigo-900 dark:text-white flex-shrink-0">☰</button>

        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899)' }}>⚡</div>
          <span className="font-extrabold text-indigo-900 dark:text-white text-sm hidden sm:block">UniversalERP</span>
        </div>

        {/* Business Name */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 glass rounded-xl flex-shrink-0">
          <div className="w-5 h-5 rounded-md bg-violet-600 flex items-center justify-center text-[10px] text-white font-bold">{currentUser?.businessName?.[0] ?? 'N'}</div>
          <span className="text-xs font-semibold text-indigo-900 dark:text-white truncate max-w-[120px]">{currentUser?.businessName}</span>
        </div>

        {/* Category Badge (read-only, fixed to user's category) */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 glass rounded-xl flex-shrink-0">
          <span className="text-base leading-none">{currentCat?.icon}</span>
          <span className="text-xs font-semibold text-indigo-900 dark:text-white hidden md:block truncate max-w-[80px]">{currentCat?.label?.split(' / ')[0] ?? currentCat?.label}</span>
        </div>

        {/* Global Search */}
        <GlobalSearch />

        <div className="flex-1" />

        {/* Dark Mode */}
        <button onClick={toggleDarkMode} className="btn-glass w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0" title="Toggle dark/light mode">
          {darkMode ? '☀️' : '🌙'}
        </button>

        {/* Notifications */}
        <div className="relative flex-shrink-0">
          <button onClick={() => { setNotifOpen(s => !s); setProfileOpen(false); }} className="btn-glass w-8 h-8 rounded-xl flex items-center justify-center relative text-base">
            🔔
            {unread > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold animate-pulse">{unread}</span>}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-10 w-80 glass rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <span className="font-bold text-indigo-900 dark:text-white text-sm">Notifications</span>
                <button onClick={markAllRead} className="text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline">Mark all read</button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-white/10">
                {notifications.map(n => (
                  <div key={n.id} className={`px-4 py-3 ${!n.read ? 'bg-violet-500/10' : ''}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-base mt-0.5">{n.type === 'warning' ? '⚠️' : n.type === 'success' ? '✅' : n.type === 'error' ? '🚨' : 'ℹ️'}</span>
                      <div>
                        <div className="text-xs font-bold text-indigo-900 dark:text-white">{n.title}</div>
                        <div className="text-xs text-indigo-600 dark:text-white/55 mt-0.5">{n.message}</div>
                        <div className="text-[10px] text-indigo-500 dark:text-white/35 mt-0.5">{n.time}</div>
                      </div>
                      {!n.read && <div className="ml-auto w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 mt-1" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile / Three-dots */}
        <div className="relative flex-shrink-0">
          <button onClick={() => { setProfileOpen(s => !s); setNotifOpen(false); }} className="btn-glass w-8 h-8 rounded-xl flex items-center justify-center text-base font-bold text-indigo-900 dark:text-white">
            ⋮
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-10 w-56 glass rounded-2xl shadow-2xl z-50 overflow-hidden">
              {/* User info */}
              <div className="px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white font-bold text-sm">
                    {currentUser?.name?.[0] ?? 'U'}
                  </div>
                  <div>
                    <div className="font-bold text-indigo-900 dark:text-white text-xs">{currentUser?.name}</div>
                    <div className="text-[10px] text-indigo-600 dark:text-white/50 capitalize">{currentUser?.role} · {currentUser?.username}</div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              {[
                { icon: '✏️', label: 'Edit Profile', action: () => { setProfileModal('profile'); setProfileOpen(false); } },
                { icon: '🔑', label: 'Change PIN', action: () => { setProfileModal('pin'); setProfileOpen(false); } },
                { icon: darkMode ? '☀️' : '🌙', label: `${darkMode ? 'Light' : 'Dark'} Mode`, action: () => { toggleDarkMode(); setProfileOpen(false); } },
                { icon: '📊', label: 'Subscription', action: () => { setProfileModal('subscription'); setProfileOpen(false); } },
                { icon: '🔔', label: 'Test Notification', action: () => { addNotification({ title: 'Test Alert', message: 'Notification system working!', type: 'success' }); setProfileOpen(false); } },
                { icon: '🚪', label: 'Logout', action: () => { logout(); setProfileOpen(false); }, danger: true },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/10 text-left transition-colors ${item.danger ? 'border-t border-white/10' : ''}`}>
                  <span className="text-base w-5">{item.icon}</span>
                  <span className={`text-xs font-medium ${item.danger ? 'text-red-500 dark:text-red-400' : 'text-indigo-900 dark:text-white'}`}>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── SIDEBAR (Desktop) ── */}
        <aside className="glass-nav flex-col py-3 overflow-y-auto z-20 hidden lg:flex" style={{ width: 196, flexShrink: 0 }}>
          {/* Role badge */}
          <div className="px-3 mb-3">
            <div className={`px-3 py-2 rounded-xl text-xs font-bold text-center capitalize ${role === 'owner' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : role === 'manager' ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
              {role === 'owner' ? '👑' : role === 'manager' ? '🗂️' : '🧑‍💼'} {role}
            </div>
          </div>

          {allowedNav.map(item => (
            <button key={item.id} onClick={() => setActiveModule(item.id)}
              className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-0.5 ${activeModule === item.id ? 'bg-violet-600 text-white shadow-lg' : 'text-indigo-800 dark:text-white/70 hover:bg-white/15 hover:text-indigo-900 dark:hover:text-white'}`}>
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}

          {currentCat && (
            <div className="mx-3 mt-3 p-3 rounded-xl bg-violet-600/15 border border-violet-500/25">
              <div className="text-lg text-center mb-1">{currentCat.icon}</div>
              <div className="text-[10px] text-violet-700 dark:text-violet-300 text-center font-semibold leading-tight">{currentCat.label}</div>
            </div>
          )}
        </aside>

        {/* ── MOBILE SIDEBAR ── */}
        {mobileSidebar && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebar(false)} />
            <div className="relative glass-nav flex flex-col py-4 w-56 overflow-y-auto">
              <div className="px-3 mb-3">
                <div className="font-bold text-indigo-900 dark:text-white text-sm">{currentUser?.name}</div>
                <div className="text-xs text-indigo-600 dark:text-white/50 capitalize">{currentUser?.businessName}</div>
              </div>
              {allowedNav.map(item => (
                <button key={item.id} onClick={() => { setActiveModule(item.id); setMobileSidebar(false); }}
                  className={`flex items-center gap-3 mx-2 px-3 py-3 rounded-xl text-sm font-semibold transition-all mb-0.5 ${activeModule === item.id ? 'bg-violet-600 text-white' : 'text-indigo-800 dark:text-white/70 hover:bg-white/15'}`}>
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── MAIN CANVAS ── */}
        <main className="flex-1 overflow-y-auto relative pb-16 lg:pb-0" onClick={closeAll}>
          <ModuleCanvas />
        </main>
      </div>

      {/* ── BOTTOM NAV (Mobile) ── */}
      <div className="bottom-nav flex lg:hidden justify-around items-center h-14 px-2 flex-shrink-0 z-20">
        {allowedNav.slice(0, 5).map(item => (
          <button key={item.id} onClick={() => setActiveModule(item.id)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl flex-1 ${activeModule === item.id ? 'text-violet-500' : 'text-indigo-600 dark:text-white/50'}`}>
            <span className="text-xl">{item.icon}</span>
            <span className="text-[9px] font-semibold">{item.label}</span>
          </button>
        ))}
      </div>

      {/* ── FLOATING ACTION BAR ── */}
      <div className="fixed bottom-16 lg:bottom-16 right-4 flex flex-col gap-3 z-30">
        <button onClick={() => setIsScannerOpen(true)} title="Barcode Scanner"
          className="w-12 h-12 rounded-2xl shadow-2xl flex items-center justify-center text-xl transition-all hover:scale-110 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#06b6d4,#0891b2)', boxShadow: '0 0 20px rgba(6,182,212,0.5)' }}>
          📸
        </button>
        <button onClick={() => setIsAIOpen(true)} title="AI Assistant"
          className="w-12 h-12 rounded-2xl shadow-2xl flex items-center justify-center text-xl transition-all hover:scale-110 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', boxShadow: '0 0 25px rgba(139,92,246,0.6)' }}>
          💬
        </button>
      </div>

      {/* Modals & Drawers */}
      <AIDrawer />
      <ScannerModal />
      <EditProfileModal mode={profileModal} onClose={() => setProfileModal(null)} />
    </div>
  );
}
