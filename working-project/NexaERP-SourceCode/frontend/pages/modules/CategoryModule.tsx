import { useApp } from '../../context/AppContext';
import type { CategoryId } from '../../types/erp';
import { CATEGORIES } from '../../types/erp';

// ─── Category-specific sub-components ────────────────────────────────

function RealEstateModule() {
  const properties = [
    { id: 1, name: 'Green Valley Villa', type: 'Villa', area: '3200 sqft', price: '₹2.8Cr', status: 'Available', client: 'Rajesh Kumar' },
    { id: 2, name: 'Sky Tower 4B', type: 'Apartment', area: '1450 sqft', price: '₹85L', status: 'Booked', client: 'Priya Sharma' },
    { id: 3, name: 'Business Hub 201', type: 'Commercial', area: '2100 sqft', price: '₹1.2Cr', status: 'Available', client: '—' },
  ];
  const amenities = [
    { name: 'Metro Station', dist: '0.8 km', icon: '🚇' }, { name: 'Shopping Mall', dist: '1.2 km', icon: '🏬' },
    { name: 'Hospital', dist: '2.1 km', icon: '🏥' }, { name: 'School', dist: '0.5 km', icon: '🏫' },
    { name: 'Airport', dist: '18 km', icon: '✈️' }, { name: 'Park', dist: '0.3 km', icon: '🌳' },
  ];
  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-indigo-900 dark:text-white text-sm">🏢 Property Listings</h3>
          <button className="btn-primary text-xs px-3 py-1.5 rounded-xl font-semibold">🎬 AI 3D Tour</button>
        </div>
        <div className="space-y-3">
          {properties.map(p => (
            <div key={p.id} className="glass rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-indigo-900 dark:text-white text-sm">{p.name}</div>
                <div className="text-xs text-indigo-600 dark:text-white/50">{p.type} · {p.area}</div>
                <div className="text-xs text-indigo-600 dark:text-white/40">Client: {p.client}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-violet-600 dark:text-violet-400 text-sm">{p.price}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.status === 'Available' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="glass rounded-2xl p-4">
        <h3 className="font-bold text-indigo-900 dark:text-white text-sm mb-3">📍 Local Amenities Map</h3>
        <div className="grid grid-cols-3 gap-2">
          {amenities.map(a => (
            <div key={a.name} className="glass rounded-xl p-2.5 text-center">
              <div className="text-xl mb-1">{a.icon}</div>
              <div className="text-xs font-semibold text-indigo-900 dark:text-white">{a.name}</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">{a.dist}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CAModule() {
  const notices = [
    { id: 'N1', client: 'Mohan Yadav', type: 'GST Notice', arn: 'ARN-AA3120250001', due: '2025-02-15', status: 'Pending', priority: 'High' },
    { id: 'N2', client: 'Vikram Industries', type: 'ITR Notice', arn: 'ARN-BB8520250003', due: '2025-03-01', status: 'Responded', priority: 'Medium' },
    { id: 'N3', client: 'Priya Sharma', type: '26AS Mismatch', arn: 'ARN-CC4120250007', due: '2025-02-28', status: 'Pending', priority: 'Low' },
  ];
  const checklist = ['PAN Card', 'Aadhaar Card', 'Bank Statements (12 months)', 'Form 16 / 16A', 'Investment Proofs (80C)', 'Rent Receipts', 'TDS Certificates', 'Previous ITR Copy'];
  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4">
        <h3 className="font-bold text-indigo-900 dark:text-white text-sm mb-3">📋 GST/ITR Notice Tracker</h3>
        {notices.map(n => (
          <div key={n.id} className="glass rounded-xl p-3 mb-2 last:mb-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-indigo-900 dark:text-white text-sm">{n.client}</div>
                <div className="text-xs text-indigo-600 dark:text-white/50">{n.type} · {n.arn}</div>
                <div className="text-xs text-indigo-600 dark:text-white/40">Due: {n.due}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${n.priority === 'High' ? 'bg-red-500/20 text-red-500' : n.priority === 'Medium' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'}`}>{n.priority}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${n.status === 'Pending' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>{n.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="glass rounded-2xl p-4">
        <h3 className="font-bold text-indigo-900 dark:text-white text-sm mb-3">✅ AI Document Checklist — ITR Filing</h3>
        <div className="grid grid-cols-2 gap-2">
          {checklist.map((item, i) => (
            <div key={i} className="flex items-center gap-2 glass rounded-xl px-3 py-2">
              <div className="w-4 h-4 rounded border-2 border-violet-500 flex-shrink-0 flex items-center justify-center">
                {i < 5 && <div className="w-2 h-2 rounded-sm bg-violet-500" />}
              </div>
              <span className="text-xs text-indigo-900 dark:text-white/80">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LogisticsModule() {
  const deliveries = [
    { id: 'DEL001', customer: 'Rajesh Kumar', address: '12 MG Road, Delhi', status: 'Delivered', time: '10:23 AM', weight: '2.4kg', cod: 450 },
    { id: 'DEL002', customer: 'Priya Sharma', address: '45 Park St, Mumbai', status: 'In Transit', time: '11:45 AM', weight: '1.1kg', cod: 0 },
    { id: 'DEL003', customer: 'Amit Singh', address: '7 Lal Bagh, Bangalore', status: 'Pending', time: '—', weight: '0.8kg', cod: 850 },
    { id: 'DEL004', customer: 'Kavita Joshi', address: '18 Shivaji Nagar, Pune', status: 'Failed', time: '9:15 AM', weight: '3.2kg', cod: 1200 },
  ];
  const statusColor: Record<string, string> = { Delivered: 'text-emerald-500', 'In Transit': 'text-blue-500', Pending: 'text-amber-500', Failed: 'text-red-500' };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {[{ l: 'Total', v: deliveries.length, c: 'text-violet-500' }, { l: 'Delivered', v: deliveries.filter(d => d.status === 'Delivered').length, c: 'text-emerald-500' }, { l: 'Pending', v: deliveries.filter(d => d.status === 'Pending').length, c: 'text-amber-500' }, { l: 'Failed', v: deliveries.filter(d => d.status === 'Failed').length, c: 'text-red-500' }].map((s, i) => (
          <div key={i} className="glass rounded-2xl p-3 text-center kpi-card">
            <div className={`text-xl font-extrabold ${s.c}`}>{s.v}</div>
            <div className="text-xs text-indigo-600 dark:text-white/50">{s.l}</div>
          </div>
        ))}
      </div>
      <div className="glass rounded-2xl p-4">
        <h3 className="font-bold text-indigo-900 dark:text-white text-sm mb-3">🚚 Today's Run-Sheet</h3>
        <div className="space-y-2">
          {deliveries.map((d, i) => (
            <div key={d.id} className="glass rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-600/30 flex items-center justify-center text-violet-400 font-bold text-sm flex-shrink-0">{i + 1}</div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-indigo-900 dark:text-white">{d.customer}</div>
                <div className="text-xs text-indigo-600 dark:text-white/50 truncate">{d.address}</div>
                <div className="flex gap-2 mt-0.5">
                  <span className="text-xs text-indigo-600 dark:text-white/40">{d.weight}</span>
                  {d.cod > 0 && <span className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">COD ₹{d.cod}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`text-xs font-bold ${statusColor[d.status] ?? 'text-indigo-600'}`}>{d.status}</div>
                <div className="text-xs text-indigo-600 dark:text-white/40">{d.time}</div>
                <button className="text-xs bg-violet-500/20 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-lg mt-1 font-medium">QR POD</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PharmacyModule() {
  const drugs = [
    { name: 'Dolo 650mg', batch: 'BT2024012', exp: '2026-06-30', qty: 8, substitute: 'Crocin 650mg / Paracetamol 650mg', mfg: 'Micro Labs' },
    { name: 'Amoxicillin 500mg', batch: 'BT2024089', exp: '2025-04-15', qty: 45, substitute: 'Mox 500 / Novamox 500', mfg: 'GSK' },
    { name: 'Pantoprazole 40mg', batch: 'BT2024056', exp: '2025-02-20', qty: 12, substitute: 'Pan 40 / Pantocid 40', mfg: 'Sun Pharma' },
    { name: 'Metformin 500mg', batch: 'BT2024034', exp: '2026-10-31', qty: 200, substitute: 'Glycomet 500 / Glucophage', mfg: 'USV Ltd' },
  ];
  const isExpiringSoon = (exp: string) => new Date(exp) < new Date(Date.now() + 60 * 24 * 3600000);
  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4">
        <h3 className="font-bold text-indigo-900 dark:text-white text-sm mb-3">💊 Expiry Batch Tracker</h3>
        <div className="space-y-2">
          {drugs.map((d, i) => (
            <div key={i} className={`glass rounded-xl p-3 ${isExpiringSoon(d.exp) ? 'border border-amber-500/40' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-indigo-900 dark:text-white text-sm">{d.name}</div>
                  <div className="text-xs text-indigo-600 dark:text-white/50">Batch: {d.batch} · {d.mfg}</div>
                  <div className={`text-xs font-medium mt-0.5 ${isExpiringSoon(d.exp) ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-white/40'}`}>
                    Exp: {d.exp} {isExpiringSoon(d.exp) ? '⚠️' : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${d.qty < 15 ? 'text-red-500' : 'text-emerald-500'}`}>{d.qty} units</div>
                </div>
              </div>
              <div className="mt-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="text-xs text-blue-600 dark:text-blue-400"><span className="font-semibold">🔄 Substitute:</span> {d.substitute}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HotelModule() {
  const tables = Array.from({ length: 16 }, (_, i) => ({
    id: i + 1,
    capacity: [2, 4, 4, 6][i % 4] ?? 4,
    status: ['available', 'occupied', 'occupied', 'reserved', 'available', 'occupied', 'available', 'occupied', 'available', 'reserved', 'occupied', 'available', 'occupied', 'available', 'occupied', 'available'][i] ?? 'available',
    order: i % 3 === 1 ? `₹${(Math.random() * 2000 + 500).toFixed(0)}` : '',
  }));
  const kotOrders = [
    { table: 3, item: 'Butter Chicken x2, Naan x4', time: '12:15', status: 'Preparing' },
    { table: 7, item: 'Paneer Tikka, Dal Makhani', time: '12:22', status: 'Ready' },
    { table: 11, item: 'Veg Biryani x3, Raita x3', time: '12:30', status: 'Pending' },
  ];
  const statusConfig: Record<string, { bg: string; text: string }> = {
    available: { bg: 'bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
    occupied: { bg: 'bg-red-500/20', text: 'text-red-500' },
    reserved: { bg: 'bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400' },
  };
  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4">
        <h3 className="font-bold text-indigo-900 dark:text-white text-sm mb-3">🍽️ Table Grid Manager</h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {tables.map(t => {
            const cfg = statusConfig[t.status] ?? { bg: 'bg-white/10', text: 'text-white/50' };
            return (
              <div key={t.id} className={`${cfg.bg} rounded-xl p-2 text-center cursor-pointer hover:scale-105 transition-transform`}>
                <div className={`text-sm font-bold ${cfg.text}`}>T{t.id}</div>
                <div className="text-xs text-indigo-600 dark:text-white/40">{t.capacity}p</div>
                {t.order && <div className="text-xs text-violet-600 dark:text-violet-400 font-semibold">{t.order}</div>}
              </div>
            );
          })}
        </div>
        <div className="flex gap-3 mt-3">
          {Object.entries(statusConfig).map(([status, cfg]) => (
            <div key={status} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-sm ${cfg.bg}`} />
              <span className={`text-xs capitalize ${cfg.text}`}>{status}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="glass rounded-2xl p-4">
        <h3 className="font-bold text-indigo-900 dark:text-white text-sm mb-3">🎫 KOT — Kitchen Order Tickets</h3>
        {kotOrders.map((o, i) => (
          <div key={i} className="glass rounded-xl p-3 mb-2 last:mb-0 flex items-start justify-between">
            <div>
              <div className="text-sm font-bold text-indigo-900 dark:text-white">Table {o.table} · {o.time}</div>
              <div className="text-xs text-indigo-600 dark:text-white/60 mt-0.5">{o.item}</div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${o.status === 'Ready' ? 'bg-emerald-500/20 text-emerald-500' : o.status === 'Preparing' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'}`}>{o.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HospitalModule() {
  const beds = [
    { ward: 'OPD', total: 20, occupied: 15, available: 5 },
    { ward: 'General IPD', total: 30, occupied: 22, available: 8 },
    { ward: 'ICU', total: 10, occupied: 8, available: 2 },
    { ward: 'Emergency', total: 12, occupied: 7, available: 5 },
  ];
  const patients = [
    { id: 'P001', name: 'Arjun Mehta', bed: 'G-12', doctor: 'Dr. Sharma', diagnosis: 'Hypertension', admitted: '2025-01-20', status: 'Stable' },
    { id: 'P002', name: 'Sita Devi', bed: 'ICU-3', doctor: 'Dr. Patel', diagnosis: 'Post-Op Recovery', admitted: '2025-01-22', status: 'Critical' },
    { id: 'P003', name: 'Ravi Gupta', bed: 'G-07', doctor: 'Dr. Singh', diagnosis: 'Dengue Fever', admitted: '2025-01-23', status: 'Stable' },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {beds.map(b => (
          <div key={b.ward} className="glass rounded-2xl p-3 kpi-card">
            <div className="font-bold text-indigo-900 dark:text-white text-sm">{b.ward}</div>
            <div className="flex gap-2 mt-2">
              <div className="text-center flex-1">
                <div className="text-lg font-bold text-red-500">{b.occupied}</div>
                <div className="text-xs text-indigo-600 dark:text-white/50">Occupied</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-lg font-bold text-emerald-500">{b.available}</div>
                <div className="text-xs text-indigo-600 dark:text-white/50">Available</div>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-white/20 mt-2">
              <div className="h-full rounded-full bg-red-500" style={{ width: `${b.occupied / b.total * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="glass rounded-2xl p-4">
        <h3 className="font-bold text-indigo-900 dark:text-white text-sm mb-3">🛏️ IPD Patient Summary</h3>
        {patients.map(p => (
          <div key={p.id} className="glass rounded-xl p-3 mb-2 last:mb-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-indigo-900 dark:text-white text-sm">{p.name} <span className="text-xs text-indigo-600 dark:text-white/40">[{p.id}]</span></div>
                <div className="text-xs text-indigo-600 dark:text-white/55">Bed: {p.bed} · {p.doctor}</div>
                <div className="text-xs text-indigo-600 dark:text-white/50">Dx: {p.diagnosis}</div>
                <div className="text-xs text-indigo-600 dark:text-white/40">Admitted: {p.admitted}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.status === 'Stable' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>{p.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecurityModule() {
  const visitors = [
    { id: 'V001', name: 'Suresh Nair', phone: '9876543210', host: 'Mr. Arjun Patel', purpose: 'Business Meeting', in: '10:15', out: '11:30', pass: 'WA-OTP' },
    { id: 'V002', name: 'Meena Krishnan', phone: '8765432109', host: 'HR Dept', purpose: 'Interview', in: '09:45', out: '—', pass: 'WA-OTP' },
    { id: 'V003', name: 'Delivery Agent', phone: '7654321098', host: 'Warehouse', purpose: 'Goods Delivery', in: '11:00', out: '11:15', pass: 'Scan' },
  ];
  const anprLogs = [
    { plate: 'MH 01 AB 1234', time: '09:12 AM', type: 'Entry', status: 'Authorized' },
    { plate: 'DL 4C CD 5678', time: '09:45 AM', type: 'Entry', status: 'Unknown' },
    { plate: 'KA 03 EF 9012', time: '10:30 AM', type: 'Exit', status: 'Authorized' },
  ];
  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-indigo-900 dark:text-white text-sm">🪪 Visitor Log (WhatsApp OTP)</h3>
          <button className="btn-primary text-xs px-3 py-1.5 rounded-xl font-semibold">＋ New Visitor Pass</button>
        </div>
        <div className="space-y-2">
          {visitors.map(v => (
            <div key={v.id} className="glass rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-indigo-900 dark:text-white text-sm">{v.name}</div>
                <div className="text-xs text-indigo-600 dark:text-white/50">📞 {v.phone} · Host: {v.host}</div>
                <div className="text-xs text-indigo-600 dark:text-white/40">{v.purpose}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">IN {v.in}</div>
                {v.out !== '—' && <div className="text-xs text-red-500">OUT {v.out}</div>}
                <span className="text-xs bg-violet-500/20 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded font-medium">{v.pass}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="glass rounded-2xl p-4">
        <h3 className="font-bold text-indigo-900 dark:text-white text-sm mb-3">🚗 ANPR — Number Plate Reader</h3>
        <div className="space-y-2">
          {anprLogs.map((l, i) => (
            <div key={i} className="flex items-center justify-between glass rounded-xl px-4 py-3">
              <div className="font-mono font-bold text-indigo-900 dark:text-white text-sm bg-yellow-400/20 px-2 py-0.5 rounded">{l.plate}</div>
              <div className="text-xs text-indigo-600 dark:text-white/50">{l.time} · {l.type}</div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${l.status === 'Authorized' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>{l.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GenericModule({ categoryId }: { categoryId: CategoryId }) {
  const cat = CATEGORIES.find(c => c.id === categoryId);
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <div className="text-6xl mb-4">{cat?.icon}</div>
      <div className="font-bold text-indigo-900 dark:text-white text-lg">{cat?.label} Module</div>
      <div className="text-indigo-600 dark:text-white/50 text-sm mt-2">Specialized features for {cat?.label} industry</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────

export default function CategoryModule() {
  const { activeCategory } = useApp();
  const cat = CATEGORIES.find(c => c.id === activeCategory);

  const renderContent = () => {
    switch (activeCategory) {
      case 'realEstate': return <RealEstateModule />;
      case 'ca': return <CAModule />;
      case 'logistics': return <LogisticsModule />;
      case 'pharmacy': return <PharmacyModule />;
      case 'hotel': return <HotelModule />;
      case 'hospital': return <HospitalModule />;
      case 'security': return <SecurityModule />;
      default: return <GenericModule categoryId={activeCategory} />;
    }
  };

  return (
    <div className="p-4 md:p-6 fade-up space-y-4">
      <div className="flex items-center gap-3">
        <div className="text-3xl">{cat?.icon}</div>
        <div>
          <h2 className="text-lg font-bold text-indigo-900 dark:text-white">{cat?.label} — Specialized Features</h2>
          <p className="text-xs text-indigo-700 dark:text-white/50 mt-0.5">Industry-specific tools & workflows</p>
        </div>
      </div>

      {renderContent()}
    </div>
  );
}
