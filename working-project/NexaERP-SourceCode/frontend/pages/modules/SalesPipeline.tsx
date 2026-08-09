import { useState } from 'react';
import { useData } from '../../context/DataContext';
import type { Lead } from '../../types/erp';

const STAGES: { id: Lead['stage']; label: string; icon: string; color: string; bg: string }[] = [
  { id: 'new', label: 'New', icon: '🆕', color: 'text-blue-500', bg: 'from-blue-500/20 to-blue-600/10' },
  { id: 'discussion', label: 'Discussion', icon: '💬', color: 'text-amber-500', bg: 'from-amber-500/20 to-amber-600/10' },
  { id: 'proposal', label: 'Proposal', icon: '📋', color: 'text-violet-500', bg: 'from-violet-500/20 to-violet-600/10' },
  { id: 'closed', label: 'Closed ✓', icon: '🏆', color: 'text-emerald-500', bg: 'from-emerald-500/20 to-emerald-600/10' },
];

export default function SalesPipeline() {
  const { leads, addLead, updateLead } = useData();
  const [showAdd, setShowAdd] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', company: '', value: '', phone: '', assignedTo: '' });
  const [saved, setSaved] = useState(false);

  const moveLeadStage = (lead: Lead, direction: 1 | -1) => {
    const order: Lead['stage'][] = ['new', 'discussion', 'proposal', 'closed'];
    const idx = order.indexOf(lead.stage);
    const newStage = order[idx + direction];
    if (!newStage) return;
    updateLead(lead.id, { stage: newStage, lastActivity: new Date().toISOString().slice(0, 10) });
  };

  const handleAdd = () => {
    if (!newLead.name || !newLead.company) return;
    addLead({
      name: newLead.name, company: newLead.company,
      value: parseFloat(newLead.value) || 0, stage: 'new',
      assignedTo: newLead.assignedTo || 'Unassigned',
      lastActivity: new Date().toISOString().slice(0, 10), phone: newLead.phone,
    });
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowAdd(false); setNewLead({ name: '', company: '', value: '', phone: '', assignedTo: '' }); }, 1000);
  };

  const openWhatsApp = (phone: string, name: string) => {
    if (!phone) return;
    const msg = encodeURIComponent(`Hello ${name}, we wanted to follow up on your enquiry. Please let us know how we can assist you!`);
    window.open(`https://wa.me/91${phone}?text=${msg}`, '_blank');
  };

  const totalValue = leads.filter(l => l.stage !== 'closed').reduce((s, l) => s + l.value, 0);
  const closedValue = leads.filter(l => l.stage === 'closed').reduce((s, l) => s + l.value, 0);

  return (
    <div className="p-4 md:p-6 fade-up space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-indigo-900 dark:text-white">🎯 Sales Pipeline</h2>
          <p className="text-xs text-indigo-700 dark:text-white/50 mt-0.5">
            Open: <span className="text-violet-600 dark:text-violet-400 font-bold">₹{(totalValue / 100000).toFixed(1)}L</span>
            &nbsp;·&nbsp;Won: <span className="text-emerald-600 dark:text-emerald-400 font-bold">₹{(closedValue / 100000).toFixed(1)}L</span>
          </p>
        </div>
        <button onClick={() => setShowAdd(s => !s)} className="btn-primary text-xs px-4 py-2 rounded-xl font-semibold">
          {showAdd ? '✕ Cancel' : '＋ Add Lead'}
        </button>
      </div>

      {/* Add Lead Form */}
      {showAdd && (
        <div className="glass rounded-2xl p-5 border border-violet-500/30">
          <h3 className="font-bold text-indigo-900 dark:text-white mb-4 text-sm">➕ New Lead</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'name', label: 'Contact Name *', type: 'text' },
              { key: 'company', label: 'Company *', type: 'text' },
              { key: 'value', label: 'Deal Value (₹)', type: 'number' },
              { key: 'phone', label: 'Phone Number', type: 'tel' },
              { key: 'assignedTo', label: 'Assigned To', type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-indigo-700 dark:text-white/55 block mb-1">{f.label}</label>
                <input type={f.type} value={newLead[f.key as keyof typeof newLead]}
                  onChange={e => setNewLead(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.label.replace(' *', '')} className="glass-input w-full rounded-xl px-3 py-2 text-sm" />
              </div>
            ))}
          </div>
          {saved && <div className="mt-3 text-center text-emerald-500 text-sm font-bold">✅ Lead added to pipeline!</div>}
          <div className="flex gap-2 mt-4">
            <button onClick={handleAdd} disabled={!newLead.name || !newLead.company} className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40">Add to Pipeline</button>
            <button onClick={() => setShowAdd(false)} className="btn-glass px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-900 dark:text-white">Cancel</button>
          </div>
        </div>
      )}

      {/* Stage Stats */}
      <div className="grid grid-cols-4 gap-2">
        {STAGES.map(s => {
          const stageLeads = leads.filter(l => l.stage === s.id);
          const stageValue = stageLeads.reduce((sum, l) => sum + l.value, 0);
          return (
            <div key={s.id} className="glass rounded-2xl p-3 text-center kpi-card">
              <div className="text-lg mb-0.5">{s.icon}</div>
              <div className={`text-lg font-extrabold ${s.color}`}>{stageLeads.length}</div>
              <div className="text-xs text-indigo-600 dark:text-white/50">{s.label}</div>
              <div className="text-xs font-semibold text-indigo-800 dark:text-white/60 mt-0.5">₹{(stageValue / 100000).toFixed(1)}L</div>
            </div>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {STAGES.map(stage => {
          const stageLeads = leads.filter(l => l.stage === stage.id);
          return (
            <div key={stage.id} className="kanban-col p-3 min-h-[280px]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">{stage.icon}</span>
                <span className={`font-bold text-sm ${stage.color}`}>{stage.label}</span>
                <span className="ml-auto text-xs bg-white/20 text-indigo-700 dark:text-white/60 px-2 py-0.5 rounded-full font-semibold">{stageLeads.length}</span>
              </div>
              <div className="space-y-2">
                {stageLeads.map(lead => (
                  <div key={lead.id} className={`glass rounded-xl p-3 bg-gradient-to-br ${stage.bg}`}>
                    <div className="font-bold text-indigo-900 dark:text-white text-sm truncate">{lead.name}</div>
                    <div className="text-xs text-indigo-600 dark:text-white/55 truncate">{lead.company}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-bold text-violet-600 dark:text-violet-400">₹{(lead.value / 100000).toFixed(2)}L</span>
                      <span className="text-xs text-indigo-600 dark:text-white/40">{lead.assignedTo.split(' ')[0]}</span>
                    </div>
                    <div className="text-xs text-indigo-500 dark:text-white/35 mt-0.5">📅 {lead.lastActivity}</div>
                    {lead.phone && <div className="text-xs text-indigo-500 dark:text-white/35">📞 {lead.phone}</div>}
                    <div className="flex gap-1 mt-2">
                      {stage.id !== 'new' && (
                        <button onClick={() => moveLeadStage(lead, -1)} className="flex-1 text-xs bg-white/20 hover:bg-white/30 text-indigo-700 dark:text-white/70 py-1 rounded-lg font-medium transition-colors">← Back</button>
                      )}
                      {stage.id !== 'closed' && (
                        <button onClick={() => moveLeadStage(lead, 1)} className="flex-1 text-xs bg-violet-500/30 hover:bg-violet-500/50 text-violet-700 dark:text-violet-300 py-1 rounded-lg font-bold transition-colors">Advance →</button>
                      )}
                      <button onClick={() => openWhatsApp(lead.phone, lead.name)} className="text-xs bg-green-500/20 hover:bg-green-500/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-lg font-medium transition-colors" title="Send WhatsApp">💬</button>
                    </div>
                  </div>
                ))}
                {stageLeads.length === 0 && (
                  <div className="text-center py-8 text-indigo-500 dark:text-white/25 text-xs">No leads here</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
