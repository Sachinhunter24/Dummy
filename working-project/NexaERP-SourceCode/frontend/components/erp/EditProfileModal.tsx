import { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface Props {
  mode: 'profile' | 'pin' | 'subscription' | null;
  onClose: () => void;
}

export function EditProfileModal({ mode, onClose }: Props) {
  const { currentUser, updateProfile, changePIN } = useApp();
  const [form, setForm] = useState({
    name: currentUser?.name ?? '',
    phone: currentUser?.phone ?? '',
    email: currentUser?.email ?? '',
    businessName: currentUser?.businessName ?? '',
  });
  const [pin, setPin] = useState({ old: '', newPin: '', confirm: '' });
  const [saved, setSaved] = useState(false);
  const [pinError, setPinError] = useState('');

  const saveProfile = () => {
    if (!form.name || !form.phone) return;
    updateProfile({ name: form.name, phone: form.phone, email: form.email, businessName: form.businessName });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  };

  const savePin = () => {
    setPinError('');
    if (!pin.old || !pin.newPin || !pin.confirm) { setPinError('All fields are required'); return; }
    if (pin.newPin !== pin.confirm) { setPinError('New PINs do not match'); return; }
    if (pin.newPin.length < 4) { setPinError('PIN must be at least 4 digits'); return; }
    const ok = changePIN(pin.old, pin.newPin);
    if (!ok) { setPinError('Current PIN is incorrect'); return; }
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  };

  if (!mode) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-3xl p-6 w-full max-w-sm shadow-2xl">

        {/* Profile Edit */}
        {mode === 'profile' && (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-indigo-900 dark:text-white">✏️ Edit Profile</h3>
              <button onClick={onClose} className="btn-glass w-7 h-7 rounded-lg text-xs flex items-center justify-center text-indigo-900 dark:text-white">✕</button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'businessName', label: 'Business Name', placeholder: 'Your business name' },
                { key: 'name', label: 'Your Name', placeholder: 'Full name' },
                { key: 'phone', label: 'Phone Number', placeholder: '10-digit mobile' },
                { key: 'email', label: 'Email Address', placeholder: 'your@email.com' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[10px] font-semibold text-indigo-700 dark:text-white/55 mb-1 uppercase tracking-widest">{f.label}</label>
                  <input value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="glass-input w-full rounded-xl px-3 py-2.5 text-sm outline-none" />
                </div>
              ))}
            </div>
            {saved && <div className="mt-3 text-center text-emerald-500 text-sm font-bold">✅ Profile updated!</div>}
            <div className="flex gap-2 mt-4">
              <button onClick={saveProfile} className="btn-primary flex-1 py-2.5 rounded-xl font-bold text-sm">💾 Save Changes</button>
              <button onClick={onClose} className="btn-glass flex-1 py-2.5 rounded-xl font-semibold text-sm text-indigo-900 dark:text-white">Cancel</button>
            </div>
            {/* Show current username (read-only) */}
            <div className="mt-3 pt-3 border-t border-white/10 text-center">
              <span className="text-[10px] text-indigo-600 dark:text-white/35">Username: <strong className="text-indigo-800 dark:text-white/60">{currentUser?.username}</strong> · Role: <strong className="text-indigo-800 dark:text-white/60 capitalize">{currentUser?.role}</strong></span>
            </div>
          </>
        )}

        {/* Change PIN */}
        {mode === 'pin' && (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-indigo-900 dark:text-white">🔑 Change PIN</h3>
              <button onClick={onClose} className="btn-glass w-7 h-7 rounded-lg text-xs flex items-center justify-center text-indigo-900 dark:text-white">✕</button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'old', label: 'Current PIN', placeholder: 'Enter current PIN' },
                { key: 'newPin', label: 'New PIN', placeholder: 'Enter new PIN (min 4 digits)' },
                { key: 'confirm', label: 'Confirm New PIN', placeholder: 'Repeat new PIN' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[10px] font-semibold text-indigo-700 dark:text-white/55 mb-1 uppercase tracking-widest">{f.label}</label>
                  <input type="password" inputMode="numeric" maxLength={8}
                    value={pin[f.key as keyof typeof pin]}
                    onChange={e => setPin(p => ({ ...p, [f.key]: e.target.value.replace(/\D/g, '') }))}
                    placeholder={f.placeholder}
                    className="glass-input w-full rounded-xl px-3 py-3 text-xl text-center font-mono tracking-widest outline-none" />
                </div>
              ))}
            </div>
            {pinError && <div className="mt-2 text-xs text-red-500 font-medium text-center">{pinError}</div>}
            {saved && <div className="mt-2 text-center text-emerald-500 text-sm font-bold">✅ PIN changed successfully!</div>}
            <div className="flex gap-2 mt-4">
              <button onClick={savePin} className="btn-primary flex-1 py-2.5 rounded-xl font-bold text-sm">🔐 Change PIN</button>
              <button onClick={onClose} className="btn-glass flex-1 py-2.5 rounded-xl font-semibold text-sm text-indigo-900 dark:text-white">Cancel</button>
            </div>
            <p className="text-center text-[10px] text-indigo-600 dark:text-white/35 mt-2">Demo default PIN: 0000</p>
          </>
        )}

        {/* Subscription */}
        {mode === 'subscription' && (
          <>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-indigo-900 dark:text-white">📊 Subscription Plan</h3>
              <button onClick={onClose} className="btn-glass w-7 h-7 rounded-lg text-xs flex items-center justify-center text-indigo-900 dark:text-white">✕</button>
            </div>
            <div className="text-center mb-4">
              <div className="inline-flex w-20 h-20 rounded-3xl items-center justify-center text-4xl mb-3" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>👑</div>
              <div className="font-extrabold text-indigo-900 dark:text-white text-xl">Enterprise Plan</div>
              <div className="text-violet-600 dark:text-violet-400 font-bold text-2xl mt-1">₹2,999<span className="text-sm text-indigo-600 dark:text-white/50 font-normal">/month</span></div>
            </div>
            <div className="space-y-2 mb-4">
              {['✅ All 9 Industry Modules', '✅ Unlimited Staff Accounts', '✅ AI Business Assistant', '✅ Barcode & OCR Scanner', '✅ WhatsApp/SMS Reminders', '✅ PDF & CSV Export/Import', '✅ Priority Support 24/7', '✅ Auto GST Invoicing'].map(f => (
                <div key={f} className="flex items-center gap-2 text-xs text-indigo-900 dark:text-white/80 font-medium">{f}</div>
              ))}
            </div>
            <div className="glass rounded-xl p-3 text-center mb-3">
              <div className="text-xs text-indigo-700 dark:text-white/55">Valid till <strong className="text-indigo-900 dark:text-white">31 December 2025</strong></div>
              <div className="text-xs text-emerald-500 mt-0.5 font-medium">Auto-renew: ON</div>
            </div>
            <button onClick={onClose} className="btn-glass w-full py-2.5 rounded-xl font-semibold text-sm text-indigo-900 dark:text-white">Close</button>
          </>
        )}
      </div>
    </div>
  );
}
