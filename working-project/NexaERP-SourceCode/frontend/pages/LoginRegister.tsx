import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useData, parseCSV } from '../context/DataContext';
import { CATEGORIES } from '../types/erp';
import type { CategoryId } from '../types/erp';
import '../styles/erp.css';

type AuthMode = 'login' | 'register';
type RegStep = 1 | 2 | 3 | 4;

const DEMO_OTP = '123456';

export default function LoginRegister() {
  const { login, register, registeredUsers } = useApp();
  const { importProducts, importCustomers } = useData();

  // Login state
  const [mode, setMode] = useState<AuthMode>('login');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [step, setStep] = useState<RegStep>(1);
  const [regForm, setRegForm] = useState({
    businessName: '', name: '', phone: '', email: '',
    username: '', password: '', confirmPassword: ''
  });
  const [regError, setRegError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [_otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [productsFile, setProductsFile] = useState<File | null>(null);
  const [customersFile, setCustomersFile] = useState<File | null>(null);
  const [uploadDone, setUploadDone] = useState({ products: false, customers: false });
  const prodRef = useRef<HTMLInputElement>(null);
  const custRef = useRef<HTMLInputElement>(null);

  /* ── LOGIN ── */
  const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) { setLoginError('Please fill in all fields'); return; }
    setLoginLoading(true);
    setLoginError('');
    await new Promise(r => setTimeout(r, 700));
    const result = login(loginForm.username, loginForm.password);
    setLoginLoading(false);
    if (!result.ok) setLoginError(result.error ?? 'Login failed');
  };

  /* ── REGISTER STEP 1 ── */
  const validateStep1 = () => {
    if (!regForm.businessName || !regForm.name || !regForm.phone || !regForm.username || !regForm.password)
      return 'All fields marked * are required';
    if (regForm.password !== regForm.confirmPassword) return 'Passwords do not match';
    if (regForm.password.length < 6) return 'Password must be at least 6 characters';
    if (registeredUsers.some(u => u.username.toLowerCase() === regForm.username.toLowerCase()))
      return 'Username already taken — choose another';
    if (!/^\d{10}$/.test(regForm.phone)) return 'Enter a valid 10-digit phone number';
    return '';
  };

  const goStep2 = () => {
    const err = validateStep1();
    if (err) { setRegError(err); return; }
    setRegError('');
    setOtpSent(true);
    setStep(2);
  };

  /* ── REGISTER STEP 2 ── */
  const verifyOTP = () => {
    if (otpInput !== DEMO_OTP) { setOtpError('Incorrect OTP. Try again.'); return; }
    setOtpError('');
    setStep(3);
  };

  /* ── REGISTER STEP 3 ── */
  const goStep4 = () => {
    if (!selectedCategory) return;
    setStep(4);
  };

  /* ── REGISTER STEP 4 ── */
  const readFile = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = e => res(e.target?.result as string ?? '');
      reader.onerror = rej;
      reader.readAsText(file);
    });

  const uploadProducts = async () => {
    if (!productsFile) return;
    const text = await readFile(productsFile);
    const rows = parseCSV(text);
    importProducts(rows.map(r => ({
      name: r['name'] ?? r['productname'] ?? 'Product',
      sku: r['sku'] ?? r['code'] ?? `SKU${Date.now()}`,
      price: parseFloat(r['price'] ?? r['sellingprice'] ?? '0') || 0,
      cost: parseFloat(r['cost'] ?? r['costprice'] ?? '0') || 0,
      quantity: parseInt(r['quantity'] ?? r['qty'] ?? r['stock'] ?? '0') || 0,
      category: r['category'] ?? 'General',
      ...(r['rack'] !== undefined ? { rack: r['rack'] } : r['location'] !== undefined ? { rack: r['location'] } : {}),
      unit: r['unit'] ?? 'piece',
      ...(r['hsn'] !== undefined ? { hsn: r['hsn'] } : {}),
      ...(r['expiry'] !== undefined ? { expiryDate: r['expiry'] } : r['expirydate'] !== undefined ? { expiryDate: r['expirydate'] } : {}),

    })));
    setUploadDone(d => ({ ...d, products: true }));
  };

  const uploadCustomers = async () => {
    if (!customersFile) return;
    const text = await readFile(customersFile);
    const rows = parseCSV(text);
    importCustomers(rows.map(r => ({
      name: r['name'] ?? r['customername'] ?? 'Customer',
      phone: r['phone'] ?? r['mobile'] ?? '',
      email: r['email'] ?? '',
      status: 'active' as const,
      balance: 0,
      lastContact: new Date().toISOString().slice(0, 10),
      totalPurchases: 0,
      ...(r['address'] !== undefined ? { address: r['address'] } : {}),
      ...(r['gstin'] !== undefined ? { gstin: r['gstin'] } : {}),
    })));
    setUploadDone(d => ({ ...d, customers: true }));
  };

  const finishRegistration = () => {
    if (!selectedCategory) return;
    register({
      businessName: regForm.businessName,
      name: regForm.name,
      phone: regForm.phone,
      email: regForm.email,
      category: selectedCategory,
      role: 'owner',
      username: regForm.username,
      password: regForm.password,
      pin: '0000',
    });
  };

  /* ── QUICK DEMO FILL ── */
  const fillDemo = (u: string, p: string) => setLoginForm({ username: u, password: p });

  /* ── RENDER ── */
  return (
    <div className="erp-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex w-16 h-16 rounded-2xl items-center justify-center text-3xl mb-3 shadow-2xl"
            style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899)' }}>⚡</div>
          <h1 className="text-3xl font-extrabold text-white drop-shadow">UniversalERP</h1>
          <p className="text-white/60 text-xs mt-1 tracking-wide">Universal Enterprise Platform</p>
        </div>

        {mode === 'login' ? (
          /* ─────────────── LOGIN FORM ─────────────── */
          <div className="glass rounded-3xl p-7 shadow-2xl">
            <h2 className="text-xl font-extrabold text-indigo-900 dark:text-white mb-1">Welcome back</h2>
            <p className="text-xs text-indigo-700 dark:text-white/50 mb-6">Sign in to your business dashboard</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-indigo-800 dark:text-white/65 mb-1.5 uppercase tracking-widest">Username</label>
                <input value={loginForm.username} onChange={e => { setLoginForm(f => ({ ...f, username: e.target.value })); setLoginError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter your username" className="glass-input w-full rounded-xl px-4 py-3 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-indigo-800 dark:text-white/65 mb-1.5 uppercase tracking-widest">Password</label>
                <input type="password" value={loginForm.password} onChange={e => { setLoginForm(f => ({ ...f, password: e.target.value })); setLoginError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter your password" className="glass-input w-full rounded-xl px-4 py-3 text-sm outline-none" />
              </div>
            </div>

            {loginError && (
              <div className="mt-3 flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-xl px-3 py-2.5">
                <span className="text-base">⚠️</span>
                <span className="text-xs text-red-600 dark:text-red-400 font-medium">{loginError}</span>
              </div>
            )}

            <button onClick={handleLogin} disabled={loginLoading}
              className="btn-primary w-full py-3.5 rounded-2xl font-bold text-base mt-5 flex items-center justify-center gap-2 disabled:opacity-60">
              {loginLoading
                ? <><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Signing in...</>
                : <><span>🚀</span> Sign In</>}
            </button>

            <div className="text-center mt-4">
              <span className="text-xs text-indigo-700 dark:text-white/50">New business? </span>
              <button onClick={() => { setMode('register'); setStep(1); setRegError(''); }}
                className="text-xs text-violet-600 dark:text-violet-400 font-bold hover:underline">Register your business →</button>
            </div>

            {/* Demo credentials */}
            <div className="mt-5 p-3 rounded-2xl bg-white/10 border border-white/20">
              <p className="text-[10px] text-indigo-700 dark:text-white/50 font-semibold mb-2 uppercase tracking-widest">Demo Accounts</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: '👑 Owner (Retail)', u: 'owner', p: 'owner123' },
                  { label: '🗂️ Manager', u: 'manager', p: 'manager123' },
                  { label: '🧑‍💼 Staff', u: 'staff', p: 'staff123' },
                  { label: '💊 Pharmacy', u: 'pharma', p: 'pharma123' },
                  { label: '🍽️ Restaurant', u: 'hotel', p: 'hotel123' },
                  { label: '🏢 Real Estate', u: 'realty', p: 'realty123' },
                ].map(d => (
                  <button key={d.u} onClick={() => fillDemo(d.u, d.p)}
                    className="text-left px-2 py-1.5 rounded-lg hover:bg-white/15 transition-colors">
                    <div className="text-[10px] font-semibold text-indigo-900 dark:text-white">{d.label}</div>
                    <div className="text-[9px] text-indigo-600 dark:text-white/40">{d.u} / {d.p}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

        ) : (
          /* ─────────────── REGISTER FLOW ─────────────── */
          <div className="glass rounded-3xl p-7 shadow-2xl">
            {/* Step indicator */}
            <div className="flex items-center gap-1 mb-5">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className="flex-1 flex items-center gap-1">
                  <div className={`flex-1 h-1 rounded-full transition-all ${s <= step ? 'bg-violet-500' : 'bg-white/20'}`} />
                  {s < 4 && <div className={`w-1 h-1 rounded-full flex-shrink-0 ${s < step ? 'bg-violet-500' : 'bg-white/20'}`} />}
                </div>
              ))}
            </div>

            {/* ── STEP 1: Details ── */}
            {step === 1 && (
              <>
                <h2 className="text-lg font-extrabold text-indigo-900 dark:text-white mb-0.5">Create your account</h2>
                <p className="text-xs text-indigo-700 dark:text-white/50 mb-4">Step 1 of 4 · Business & personal details</p>
                <div className="space-y-3">
                  {[
                    { key: 'businessName', label: 'Business Name *', placeholder: 'e.g. Shree Medical Store' },
                    { key: 'name', label: 'Your Full Name *', placeholder: 'e.g. Rajesh Kumar' },
                    { key: 'phone', label: 'Phone Number *', placeholder: '10-digit mobile number' },
                    { key: 'email', label: 'Email Address', placeholder: 'Optional' },
                    { key: 'username', label: 'Create Username *', placeholder: 'Unique login ID' },
                    { key: 'password', label: 'Create Password *', placeholder: 'Min 6 characters' },
                    { key: 'confirmPassword', label: 'Confirm Password *', placeholder: 'Repeat password' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-[10px] font-semibold text-indigo-800 dark:text-white/60 mb-1 uppercase tracking-widest">{f.label}</label>
                      <input type={f.key.toLowerCase().includes('password') ? 'password' : f.key === 'phone' ? 'tel' : 'text'}
                        value={regForm[f.key as keyof typeof regForm]}
                        onChange={e => { setRegForm(p => ({ ...p, [f.key]: e.target.value })); setRegError(''); }}
                        placeholder={f.placeholder} className="glass-input w-full rounded-xl px-3 py-2.5 text-sm outline-none" />
                    </div>
                  ))}
                </div>
                {regError && <div className="mt-3 bg-red-500/15 border border-red-500/30 rounded-xl px-3 py-2 text-xs text-red-600 dark:text-red-400 font-medium">{regError}</div>}
                <button onClick={goStep2} className="btn-primary w-full py-3 rounded-2xl font-bold text-sm mt-4">Next → Verify Phone</button>
                <div className="text-center mt-3">
                  <button onClick={() => setMode('login')} className="text-xs text-violet-600 dark:text-violet-400 hover:underline">← Back to Login</button>
                </div>
              </>
            )}

            {/* ── STEP 2: OTP ── */}
            {step === 2 && (
              <>
                <h2 className="text-lg font-extrabold text-indigo-900 dark:text-white mb-0.5">Verify Phone Number</h2>
                <p className="text-xs text-indigo-700 dark:text-white/50 mb-4">Step 2 of 4 · OTP sent to +91{regForm.phone}</p>
                <div className="bg-blue-500/15 border border-blue-500/30 rounded-xl p-3 mb-4 flex items-center gap-2">
                  <span className="text-xl">📱</span>
                  <div>
                    <div className="text-xs font-bold text-blue-700 dark:text-blue-300">Demo OTP: <span className="font-mono text-lg">{DEMO_OTP}</span></div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400/70">In production, real OTP is sent via SMS</div>
                  </div>
                </div>
                <label className="block text-[10px] font-semibold text-indigo-800 dark:text-white/60 mb-1.5 uppercase tracking-widest">Enter 6-digit OTP</label>
                <input value={otpInput} onChange={e => { setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }}
                  onKeyDown={e => e.key === 'Enter' && verifyOTP()}
                  placeholder="_ _ _ _ _ _" className="glass-input w-full rounded-xl px-4 py-4 text-2xl text-center font-mono tracking-[0.5em] outline-none" maxLength={6} />
                {otpError && <div className="mt-2 text-xs text-red-500 text-center font-medium">{otpError}</div>}
                <button onClick={verifyOTP} disabled={otpInput.length < 6} className="btn-primary w-full py-3 rounded-2xl font-bold text-sm mt-4 disabled:opacity-50">Verify & Continue</button>
                <button onClick={() => { setOtpSent(false); setOtpInput(''); setStep(1); }} className="btn-glass w-full py-2.5 rounded-2xl text-xs font-semibold text-indigo-900 dark:text-white mt-2">← Back</button>
              </>
            )}

            {/* ── STEP 3: Category ── */}
            {step === 3 && (
              <>
                <h2 className="text-lg font-extrabold text-indigo-900 dark:text-white mb-0.5">Select Your Business Type</h2>
                <p className="text-xs text-indigo-700 dark:text-white/50 mb-4">Step 3 of 4 · Choose the industry you operate in</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all text-center ${selectedCategory === cat.id ? 'border-violet-500 bg-violet-500/20 scale-[1.04]' : 'border-white/25 hover:border-white/50 hover:bg-white/10'}`}>
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="text-[9px] font-semibold text-indigo-900 dark:text-white leading-tight">{cat.label.split(' / ')[0]}</span>
                    </button>
                  ))}
                </div>
                {!selectedCategory && <div className="text-xs text-amber-600 dark:text-amber-400 text-center mb-2">Please select a category to continue</div>}
                <button onClick={goStep4} disabled={!selectedCategory} className="btn-primary w-full py-3 rounded-2xl font-bold text-sm disabled:opacity-50">Next → Import Data</button>
                <button onClick={() => setStep(2)} className="btn-glass w-full py-2.5 rounded-2xl text-xs font-semibold text-indigo-900 dark:text-white mt-2">← Back</button>
              </>
            )}

            {/* ── STEP 4: Upload Data ── */}
            {step === 4 && (
              <>
                <h2 className="text-lg font-extrabold text-indigo-900 dark:text-white mb-0.5">Import Your Business Data</h2>
                <p className="text-xs text-indigo-700 dark:text-white/50 mb-4">Step 4 of 4 · Upload existing data (CSV format) — skip if not ready</p>

                {/* Products Upload */}
                <div className={`glass rounded-2xl p-4 mb-3 border ${uploadDone.products ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/20'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-bold text-indigo-900 dark:text-white">📦 Products / Inventory</div>
                      <div className="text-[10px] text-indigo-600 dark:text-white/45">CSV: name, sku, price, cost, quantity, category, rack, unit</div>
                    </div>
                    {uploadDone.products && <span className="text-emerald-500 text-xl">✅</span>}
                  </div>
                  <input ref={prodRef} type="file" accept=".csv" className="hidden" onChange={e => setProductsFile(e.target.files?.[0] ?? null)} />
                  <div className="flex gap-2">
                    <button onClick={() => prodRef.current?.click()} className="btn-glass text-xs px-3 py-2 rounded-xl font-semibold text-indigo-900 dark:text-white flex-1">
                      {productsFile ? `📎 ${productsFile.name}` : '📁 Choose CSV File'}
                    </button>
                    {productsFile && !uploadDone.products && (
                      <button onClick={uploadProducts} className="btn-primary text-xs px-3 py-2 rounded-xl font-bold">Upload</button>
                    )}
                    <button onClick={() => setUploadDone(d => ({ ...d, products: true }))} className="text-xs text-indigo-600 dark:text-white/40 hover:text-indigo-900 dark:hover:text-white px-2 py-2 font-medium">Skip</button>
                  </div>
                </div>

                {/* Customers Upload */}
                <div className={`glass rounded-2xl p-4 mb-4 border ${uploadDone.customers ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/20'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-bold text-indigo-900 dark:text-white">👥 Customers / Clients</div>
                      <div className="text-[10px] text-indigo-600 dark:text-white/45">CSV: name, phone, email, address, gstin</div>
                    </div>
                    {uploadDone.customers && <span className="text-emerald-500 text-xl">✅</span>}
                  </div>
                  <input ref={custRef} type="file" accept=".csv" className="hidden" onChange={e => setCustomersFile(e.target.files?.[0] ?? null)} />
                  <div className="flex gap-2">
                    <button onClick={() => custRef.current?.click()} className="btn-glass text-xs px-3 py-2 rounded-xl font-semibold text-indigo-900 dark:text-white flex-1">
                      {customersFile ? `📎 ${customersFile.name}` : '📁 Choose CSV File'}
                    </button>
                    {customersFile && !uploadDone.customers && (
                      <button onClick={uploadCustomers} className="btn-primary text-xs px-3 py-2 rounded-xl font-bold">Upload</button>
                    )}
                    <button onClick={() => setUploadDone(d => ({ ...d, customers: true }))} className="text-xs text-indigo-600 dark:text-white/40 hover:text-indigo-900 dark:hover:text-white px-2 py-2 font-medium">Skip</button>
                  </div>
                </div>

                <button onClick={finishRegistration} className="btn-primary w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
                  <span>🚀</span> Launch My Dashboard
                </button>
                <button onClick={() => setStep(3)} className="btn-glass w-full py-2.5 rounded-2xl text-xs font-semibold text-indigo-900 dark:text-white mt-2">← Back</button>
              </>
            )}
          </div>
        )}

        <p className="text-center text-white/30 text-[10px] mt-5">UniversalERP v3.0 · Secured · Role-Based · Zero Trust</p>
      </div>
    </div>
  );
}
