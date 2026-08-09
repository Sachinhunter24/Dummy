import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useApp } from '../../context/AppContext';
import { exportToCSV } from '../../context/DataContext';
import type { Role } from '../../types/erp';

interface AttModal { id: string; name: string; current: number }

export default function StaffManagement() {
  const { role, activeCategory, addStaffUser, currentUser } = useApp();
  const { staff, addStaff, updateStaff } = useData();
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [attModal, setAttModal] = useState<AttModal | null>(null);
  const [newAtt, setNewAtt] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', role: 'Cashier', department: 'Sales', salary: '', joiningDate: new Date().toISOString().slice(0, 10), username: '', password: '', staffRole: 'staff' as Role });
  const [saved, setSaved] = useState(false);

  const departments = ['All', ...Array.from(new Set(staff.map(s => s.department)))];
  const filtered = staff.filter(s =>
    (filterDept === 'All' || s.department === filterDept) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.role.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPayroll = staff.reduce((s, m) => s + m.salary, 0);
  const avgAtt = Math.round(staff.reduce((s, m) => s + m.attendance, 0) / Math.max(staff.length, 1));
  const activeCount = staff.filter(s => s.status === 'active').length;

  const toggleBlock = (id: string) => {
    if (role === 'staff') return;
    const s = staff.find(m => m.id === id);
    if (!s) return;
    if (role === 'manager' && s.role === 'Manager') return; // Manager can't block Manager
    updateStaff(id, { status: s.status === 'active' ? 'blocked' : 'active' });
  };

  const handleAdd = () => {
    if (!form.name || !form.salary) return;
    addStaff({ name: form.name, phone: form.phone, role: form.role, department: form.department, salary: +form.salary, joiningDate: form.joiningDate, attendance: 0, status: 'active' });
    // If credentials given, create a login account for this staff member
    if (form.username && form.password && currentUser) {
      addStaffUser({
        name: form.name, phone: form.phone, email: '', businessName: currentUser.businessName,
        category: activeCategory, role: form.staffRole, username: form.username, password: form.password, pin: '0000',
      });
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowAdd(false); setForm({ name: '', phone: '', role: 'Cashier', department: 'Sales', salary: '', joiningDate: new Date().toISOString().slice(0, 10), username: '', password: '', staffRole: 'staff' }); }, 1200);
  };

  const saveAttendance = () => {
    if (!attModal || !newAtt) return;
    updateStaff(attModal.id, { attendance: Math.min(31, Math.max(0, +newAtt)) });
    setAttModal(null);
    setNewAtt('');
  };

  const handlePayroll = () => {
    exportToCSV(
      ['Name', 'Role', 'Department', 'Salary', 'Attendance', 'Days', 'Payable'],
      staff.map(s => [s.name, s.role, s.department, String(s.salary), String(s.attendance), '30', String(Math.round(s.salary * s.attendance / 30))]),
      `Payroll_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  return (
    <div className="p-4 md:p-6 fade-up space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-indigo-900 dark:text-white">👥 Staff Management</h2>
          <p className="text-xs text-indigo-700 dark:text-white/50 mt-0.5">{role === 'owner' ? `Payroll: ₹${totalPayroll.toLocaleString()}/mo` : 'Manage your team'}</p>
        </div>
        <div className="flex gap-2">
          {role === 'owner' && (
            <button onClick={handlePayroll} className="btn-glass text-xs px-3 py-2 rounded-xl font-semibold text-indigo-900 dark:text-white">
              💰 Export Payroll
            </button>
          )}
          {role !== 'staff' && (
            <button onClick={() => setShowAdd(s => !s)} className="btn-primary text-xs px-3 py-2 rounded-xl font-semibold">
              {showAdd ? '✕ Cancel' : '＋ Add Staff'}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Staff', value: staff.length.toString(), icon: '👥', color: 'text-indigo-900 dark:text-violet-400' },
          { label: 'Active', value: activeCount.toString(), icon: '✅', color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Avg Attendance', value: `${avgAtt}/30`, icon: '📅', color: 'text-blue-600 dark:text-blue-400' },
          role === 'owner'
            ? { label: 'Payroll', value: `₹${(totalPayroll / 1000).toFixed(0)}K`, icon: '💵', color: 'text-amber-600 dark:text-amber-400' }
            : { label: 'Blocked', value: staff.filter(s => s.status === 'blocked').length.toString(), icon: '🚫', color: 'text-red-600 dark:text-red-400' },
        ].map((s, i) => (
          <div key={i} className="glass rounded-2xl p-4 kpi-card">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-indigo-600 dark:text-white/50 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add Staff Form */}
      {showAdd && (
        <div className="glass rounded-2xl p-5 border border-violet-500/30">
          <h3 className="font-bold text-indigo-900 dark:text-white text-sm mb-4">➕ Add New Staff Member</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-indigo-700 dark:text-white/55 block mb-1">Full Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Staff name" className="glass-input w-full rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-indigo-700 dark:text-white/55 block mb-1">Phone Number</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="Mobile number" className="glass-input w-full rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-indigo-700 dark:text-white/55 block mb-1">Role / Designation</label>
              <input value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} placeholder="e.g. Cashier" className="glass-input w-full rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-indigo-700 dark:text-white/55 block mb-1">Department</label>
              <input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} placeholder="e.g. Sales" className="glass-input w-full rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-indigo-700 dark:text-white/55 block mb-1">Monthly Salary (₹) *</label>
              <input type="number" value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} placeholder="e.g. 20000" className="glass-input w-full rounded-xl px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-indigo-700 dark:text-white/55 block mb-1">Joining Date</label>
              <input type="date" value={form.joiningDate} onChange={e => setForm(p => ({ ...p, joiningDate: e.target.value }))} className="glass-input w-full rounded-xl px-3 py-2 text-sm" />
            </div>
          </div>
          {/* Login Credentials */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-indigo-700 dark:text-white/55 mb-3 font-semibold">🔑 App Login Credentials (optional — allows staff to log in)</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-indigo-700 dark:text-white/55 block mb-1">Access Level</label>
                <select value={form.staffRole} onChange={e => setForm(p => ({ ...p, staffRole: e.target.value as Role }))} className="glass-input w-full rounded-xl px-3 py-2 text-sm">
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-indigo-700 dark:text-white/55 block mb-1">Username</label>
                <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} placeholder="Login ID" className="glass-input w-full rounded-xl px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-indigo-700 dark:text-white/55 block mb-1">Password</label>
                <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Set password" className="glass-input w-full rounded-xl px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
          {saved && <div className="mt-3 text-center text-emerald-500 text-sm font-bold">✅ Staff member added!</div>}
          <div className="flex gap-2 mt-4">
            <button onClick={handleAdd} disabled={!form.name || !form.salary} className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40">💾 Add Staff Member</button>
            <button onClick={() => setShowAdd(false)} className="btn-glass px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-900 dark:text-white">Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-48">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search staff..."
            className="glass-input w-full rounded-xl px-4 py-2.5 text-sm outline-none" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {departments.map(d => (
            <button key={d} onClick={() => setFilterDept(d)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap ${filterDept === d ? 'bg-violet-600 text-white' : 'btn-glass text-indigo-900 dark:text-white/80'}`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Attendance Modal */}
      {attModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAttModal(null)} />
          <div className="relative glass rounded-2xl p-5 w-72 shadow-2xl">
            <h4 className="font-bold text-indigo-900 dark:text-white mb-3">📅 Update Attendance</h4>
            <p className="text-sm text-indigo-700 dark:text-white/60 mb-3">{attModal.name} · Current: {attModal.current}/30</p>
            <input type="number" value={newAtt} onChange={e => setNewAtt(e.target.value)} min={0} max={31}
              placeholder="Days present (0-31)" className="glass-input w-full rounded-xl px-4 py-3 text-lg text-center font-bold" />
            <div className="flex gap-2 mt-4">
              <button onClick={saveAttendance} className="btn-primary flex-1 py-2 rounded-xl text-sm font-bold">Save</button>
              <button onClick={() => setAttModal(null)} className="btn-glass flex-1 py-2 rounded-xl text-sm font-semibold text-indigo-900 dark:text-white">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(member => {
          const pct = Math.round(member.attendance / 30 * 100);
          return (
            <div key={member.id} className={`glass rounded-2xl p-4 transition-all ${member.status === 'blocked' ? 'opacity-55 border border-red-500/30' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl text-white font-bold flex-shrink-0 ${member.status === 'blocked' ? 'bg-red-500/40' : 'bg-gradient-to-br from-violet-600 to-purple-700'}`}>
                    {member.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-indigo-900 dark:text-white">{member.name}</div>
                    <div className="text-xs text-indigo-600 dark:text-white/55">{member.role}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-medium">{member.department}</span>
                      {member.status === 'blocked' && <span className="text-xs bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded font-medium">BLOCKED</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {role === 'owner' && <div className="font-bold text-violet-600 dark:text-violet-400 text-sm">₹{member.salary.toLocaleString()}</div>}
                  <div className="flex items-center gap-1 mt-1">
                    <div className={`w-2 h-2 rounded-full ${member.status === 'active' ? 'bg-emerald-400 pulse-dot' : 'bg-red-400'}`} />
                    <span className="text-xs text-indigo-600 dark:text-white/55 capitalize">{member.status}</span>
                  </div>
                </div>
              </div>

              {/* Attendance */}
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-indigo-600 dark:text-white/50">Attendance this month</span>
                  <span className={`font-bold ${pct >= 90 ? 'text-emerald-500' : pct >= 75 ? 'text-amber-500' : 'text-red-500'}`}>{member.attendance}/30 ({pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-white/20">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: pct >= 90 ? '#10b981' : pct >= 75 ? '#f59e0b' : '#ef4444' }} />
                </div>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div>
                  <div className="text-xs text-indigo-600 dark:text-white/40">📞 {member.phone || '—'}</div>
                  <div className="text-xs text-indigo-600 dark:text-white/40">📅 Since {member.joiningDate}</div>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => setAttModal({ id: member.id, name: member.name, current: member.attendance })}
                    className="text-xs bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-1.5 rounded-lg hover:bg-blue-500/30 font-medium">📅 Att.</button>
                  {role !== 'staff' && (role === 'owner' || member.role !== 'Manager') && (
                    <button onClick={() => toggleBlock(member.id)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg font-bold transition-colors ${member.status === 'active' ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30'}`}>
                      {member.status === 'active' ? '🚫 Block' : '✅ Unblock'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payroll Table (Owner only) */}
      {role === 'owner' && (
        <div className="glass rounded-2xl p-5">
          <h3 className="font-bold text-indigo-900 dark:text-white mb-4 text-sm">💵 Payroll — {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
          <div className="overflow-x-auto">
            <table className="w-full erp-table">
              <thead><tr><th>Staff</th><th>Role</th><th>Salary</th><th>Days</th><th>Payable</th><th>Net Pay</th></tr></thead>
              <tbody>
                {staff.map(s => {
                  const payable = Math.round(s.salary * s.attendance / 30);
                  return (
                    <tr key={s.id}>
                      <td className="font-medium">{s.name}</td>
                      <td className="text-xs">{s.role}</td>
                      <td>₹{s.salary.toLocaleString()}</td>
                      <td>{s.attendance}/30</td>
                      <td>₹{payable.toLocaleString()}</td>
                      <td className="font-bold text-emerald-500">₹{payable.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between pt-3 mt-2 border-t border-white/10">
            <span className="text-sm text-indigo-700 dark:text-white/60">Total Monthly Payroll</span>
            <span className="font-extrabold text-lg text-violet-600 dark:text-violet-400">₹{totalPayroll.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
