import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { DataProvider } from './context/DataContext';
import LoginRegister from './pages/LoginRegister';
import Dashboard from './pages/Dashboard';
import { downloadSourceZip, TOTAL_FILES, TOTAL_LINES } from './utils/downloadZip';
import './styles/erp.css';

function AppContent() {
  const { isLoggedIn } = useApp();
  return (
    <div className="flex flex-col" style={{ minHeight: '100vh' }}>
      <div className="flex-1">
        <Routes>
          <Route path="/login"  element={isLoggedIn ? <Navigate to="/app" replace /> : <LoginRegister />} />
          <Route path="/app"    element={isLoggedIn ? <Dashboard />    : <Navigate to="/login" replace />} />
          <Route path="*"       element={<Navigate to={isLoggedIn ? '/app' : '/login'} replace />} />
        </Routes>
      </div>
      <AppFooter />
    </div>
  );
}

/* ─── Source Code Download Footer ──────────────────────────────────────────── */
function AppFooter() {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [progress, setProgress] = useState(0);

  const handleDownload = async () => {
    if (state === 'loading') return;
    setState('loading');
    setProgress(0);
    try {
      await downloadSourceZip((pct) => setProgress(pct));
      setState('done');
      setTimeout(() => setState('idle'), 3000);
    } catch (err) {
      console.error('ZIP download failed:', err);
      setState('idle');
    }
  };

  return (
    <footer
      className="glass-header border-t border-white/10 flex-shrink-0 z-10"
      style={{ minHeight: 56 }}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-2 h-full">
        {/* Branding */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899)' }}
          >⚡</div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-indigo-900 dark:text-white">UniversalERP v3.0</span>
            <span className="text-xs text-indigo-600 dark:text-white/40 hidden sm:block">
              · Universal Enterprise Platform · 9 Industries · 3 Roles · AI-Powered
            </span>
            <span className="text-[10px] text-indigo-500 dark:text-white/30 hidden md:block">
              · {TOTAL_FILES} files · {TOTAL_LINES.toLocaleString()} lines
            </span>
          </div>
        </div>

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={state === 'loading'}
          className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs text-white flex-shrink-0 hover:scale-105 active:scale-95 transition-all shadow-lg disabled:cursor-wait disabled:scale-100 relative overflow-hidden"
          style={{
            background: state === 'done'
              ? 'linear-gradient(135deg,#10b981,#059669)'
              : 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
            boxShadow: state === 'done'
              ? '0 4px 15px rgba(16,185,129,0.4)'
              : '0 4px 15px rgba(139,92,246,0.4)',
          }}
        >
          {/* Progress bar overlay */}
          {state === 'loading' && (
            <div
              className="absolute inset-0 bg-white/20 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          )}
          <span className="relative z-10 text-base leading-none">
            {state === 'loading' ? '⏳' : state === 'done' ? '✅' : '📥'}
          </span>
          <span className="relative z-10">
            {state === 'loading'
              ? `Packing ZIP… ${progress}%`
              : state === 'done'
              ? 'Downloaded!'
              : 'Download Full Source Code (.zip)'}
          </span>
        </button>
      </div>
    </footer>
  );
}

/* ─── Root ──────────────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <AppProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AppProvider>
  );
}
