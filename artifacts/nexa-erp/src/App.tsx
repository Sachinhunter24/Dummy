import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowDownRight, ArrowUpRight, BarChart3, Bell, Boxes, BriefcaseBusiness, Check,
  ChevronDown, ChevronLeft, ChevronRight, CircleHelp, ClipboardList, CreditCard,
  FileBarChart, FileText, IndianRupee, LayoutDashboard, ListFilter, LogOut, Menu,
  MoreHorizontal, Moon, Package, Plus, Receipt, Search, Settings, ShieldCheck,
  ShoppingCart, Sparkles, Sun, Tag, Trash2, TrendingUp, UserPlus, Users, Wallet,
  X, Zap,
} from 'lucide-react';
import { Link, Route, Switch, useLocation } from 'wouter';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/error-boundary';
import {
  mockCustomers, mockExpenses, mockLeads, mockProducts, mockStaff, mockUdhaarAccounts,
  revenueData,
} from '@/legacy/data/mockData';
import type {
  Customer, Expense, Lead, Product, StaffMember, UdhaarAccount, UdhaarEntry,
} from '@/legacy/types/erp';

const queryClient = new QueryClient();
const money = (value: number) => `₹${Math.abs(value).toLocaleString('en-IN')}`;
const dateToday = () => new Date().toISOString().slice(0, 10);
const uid = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
const initials = (name: string) => name.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase();
const readStore = <T,>(key: string, fallback: T): T => {
  try { const item = localStorage.getItem(key); return item ? JSON.parse(item) as T : fallback; } catch { return fallback; }
};
const writeStore = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));

type ModuleId = 'overview' | 'pos' | 'inventory' | 'udhaar' | 'expenses' | 'clients' | 'pipeline' | 'staff' | 'reports' | 'industry';
type ModalKind = 'product' | 'expense' | 'client' | 'staff' | 'lead' | null;

const navGroups: { label: string; items: { id: ModuleId; label: string; icon: typeof LayoutDashboard; path: string }[] }[] = [
  { label: 'Workspace', items: [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/' },
    { id: 'pos', label: 'POS billing', icon: ShoppingCart, path: '/pos' },
    { id: 'inventory', label: 'Inventory', icon: Boxes, path: '/inventory' },
    { id: 'udhaar', label: 'Udhaar', icon: CreditCard, path: '/udhaar' },
    { id: 'expenses', label: 'Expenses', icon: Wallet, path: '/expenses' },
  ] },
  { label: 'Relationships', items: [
    { id: 'clients', label: 'Clients', icon: Users, path: '/clients' },
    { id: 'pipeline', label: 'Pipeline', icon: TrendingUp, path: '/pipeline' },
  ] },
  { label: 'Business', items: [
    { id: 'staff', label: 'Staff & attendance', icon: BriefcaseBusiness, path: '/staff' },
    { id: 'reports', label: 'Reports', icon: FileBarChart, path: '/reports' },
    { id: 'industry', label: 'Industry view', icon: Sparkles, path: '/industry' },
  ] },
];

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Switch>
          <Route path="*">
            <ErrorBoundary>
              <Workspace />
            </ErrorBoundary>
          </Route>
        </Switch>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function Workspace() {
  const [session, setSession] = useState(() => readStore<{ name: string; username: string; business: string } | null>('nexa_session', null));
  const [dark, setDark] = useState(() => readStore('nexa_dark', false));
  const [products, setProducts] = useState<Product[]>(() => readStore('nexa_products', mockProducts));
  const [customers, setCustomers] = useState<Customer[]>(() => readStore('nexa_customers', mockCustomers));
  const [staff, setStaff] = useState<StaffMember[]>(() => readStore('nexa_staff', mockStaff));
  const [leads, setLeads] = useState<Lead[]>(() => readStore('nexa_leads', mockLeads));
  const [expenses, setExpenses] = useState<Expense[]>(() => readStore('nexa_expenses', mockExpenses));
  const [udhaar, setUdhaar] = useState<UdhaarAccount[]>(() => readStore('nexa_udhaar', mockUdhaarAccounts));
  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([]);
  const [modal, setModal] = useState<ModalKind>(null);
  const [flash, setFlash] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useLocation();

  useEffect(() => { document.documentElement.classList.toggle('dark', dark); writeStore('nexa_dark', dark); }, [dark]);
  useEffect(() => writeStore('nexa_products', products), [products]);
  useEffect(() => writeStore('nexa_customers', customers), [customers]);
  useEffect(() => writeStore('nexa_staff', staff), [staff]);
  useEffect(() => writeStore('nexa_leads', leads), [leads]);
  useEffect(() => writeStore('nexa_expenses', expenses), [expenses]);
  useEffect(() => writeStore('nexa_udhaar', udhaar), [udhaar]);
  useEffect(() => { if (!flash) return; const timer = window.setTimeout(() => setFlash(''), 2800); return () => window.clearTimeout(timer); }, [flash]);

  const rawActive = location.split('/')[1] || 'overview';
  const active = (navGroups.flatMap((group) => group.items).some((item) => item.id === rawActive) ? rawActive : 'overview') as ModuleId;
  const go = (path: string) => { setLocation(path); setSidebarOpen(false); setSearch(''); };
  if (!session) return <Login onLogin={(next) => { setSession(next); writeStore('nexa_session', next); }} />;

  const addProduct = (form: Record<string, string>) => {
    setProducts((current) => [{ id: uid('p'), name: form.name, sku: form.sku || `SKU${Date.now().toString().slice(-4)}`, price: Number(form.price), cost: Number(form.cost || form.price), quantity: Number(form.quantity), category: form.category || 'General', rack: form.rack, unit: form.unit || 'piece' }, ...current]);
    setModal(null); setFlash('Product added to your catalogue');
  };
  const addExpense = (form: Record<string, string>) => {
    setExpenses((current) => [{ id: uid('e'), date: form.date || dateToday(), category: form.category, amount: Number(form.amount), description: form.description, paidBy: form.paidBy || session.name }, ...current]);
    setModal(null); setFlash('Expense recorded locally');
  };
  const addClient = (form: Record<string, string>) => {
    setCustomers((current) => [{ id: uid('c'), name: form.name, phone: form.phone, email: form.email || '', status: 'active', balance: 0, lastContact: dateToday(), totalPurchases: 0, address: form.address }, ...current]);
    setModal(null); setFlash('Client added to your book');
  };
  const addStaff = (form: Record<string, string>) => {
    setStaff((current) => [{ id: uid('s'), name: form.name, phone: form.phone, role: form.role, salary: Number(form.salary), attendance: 0, status: 'active', joiningDate: dateToday(), department: form.department || 'Operations' }, ...current]);
    setModal(null); setFlash('Team member added');
  };
  const addLead = (form: Record<string, string>) => {
    setLeads((current) => [{ id: uid('l'), name: form.name, company: form.company || form.name, phone: form.phone, value: Number(form.value), stage: 'new', assignedTo: form.assignedTo || session.name, lastActivity: dateToday() }, ...current]);
    setModal(null); setFlash('Lead added to pipeline');
  };
  const checkout = (payment: string) => {
    if (!cart.length) return;
    const total = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
    setProducts((current) => current.map((product) => {
      const item = cart.find((entry) => entry.product.id === product.id);
      return item ? { ...product, quantity: Math.max(0, product.quantity - item.qty) } : product;
    }));
    setCart([]); setFlash(`Sale of ${money(total)} recorded via ${payment}`);
  };
  const updateLead = (id: string, stage: Lead['stage']) => { setLeads((current) => current.map((lead) => lead.id === id ? { ...lead, stage, lastActivity: dateToday() } : lead)); setFlash('Pipeline updated'); };
  const recordPayment = (account: UdhaarAccount, amount: number) => {
    const entry: UdhaarEntry = { id: uid('u'), customerId: account.customerId, customerName: account.customerName, phone: account.phone, date: dateToday(), amount, type: 'payment', note: 'Payment received' };
    setUdhaar((current) => current.map((item) => item.customerId === account.customerId ? { ...item, balance: Math.max(0, item.balance - amount), lastTransaction: dateToday(), entries: [entry, ...item.entries] } : item));
    setFlash(`${money(amount)} payment added for ${account.customerName}`);
  };
  const unread = 4;

  return (
    <div className="nexa-noise min-h-[100dvh] bg-background text-foreground">
      <div className="flex min-h-[100dvh]">
        <Sidebar active={active} open={sidebarOpen} onClose={() => setSidebarOpen(false)} session={session} onLogout={() => { setSession(null); localStorage.removeItem('nexa_session'); }} />
        <main className="min-w-0 flex-1 lg:pl-[248px]">
          <Topbar active={active} search={search} onSearch={setSearch} unread={unread} dark={dark} onTheme={() => setDark((value) => !value)} onMenu={() => setSidebarOpen(true)} />
          <div className="mx-auto max-w-[1560px] px-4 pb-12 pt-5 sm:px-6 lg:px-9">
            {active === 'overview' && <Dashboard products={products} customers={customers} expenses={expenses} udhaar={udhaar} go={go} />}
            {active === 'pos' && <POS products={products} cart={cart} setCart={setCart} onCheckout={checkout} />}
            {active === 'inventory' && <Inventory products={products} search={search} setSearch={setSearch} onAdd={() => setModal('product')} onDelete={(id) => { setProducts((current) => current.filter((item) => item.id !== id)); setFlash('Product removed'); }} onAdjust={(id, delta) => setProducts((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item))} />}
            {active === 'udhaar' && <Udhaar accounts={udhaar} onPayment={recordPayment} />}
            {active === 'expenses' && <Expenses expenses={expenses} onAdd={() => setModal('expense')} />}
            {active === 'clients' && <Clients customers={customers} onAdd={() => setModal('client')} />}
            {active === 'pipeline' && <Pipeline leads={leads} onAdd={() => setModal('lead')} onMove={updateLead} />}
            {active === 'staff' && <Staff staff={staff} onAdd={() => setModal('staff')} onToggle={(id) => setStaff((current) => current.map((item) => item.id === id ? { ...item, status: item.status === 'active' ? 'blocked' : 'active' } : item))} />}
            {active === 'reports' && <Reports expenses={expenses} products={products} />}
            {active === 'industry' && <Industry />}
          </div>
        </main>
      </div>
      {modal && <EntryModal kind={modal} onClose={() => setModal(null)} onSubmit={modal === 'product' ? addProduct : modal === 'expense' ? addExpense : modal === 'client' ? addClient : modal === 'staff' ? addStaff : addLead} />}
      {flash && <div data-testid="status-toast" className="animate-nexa-pop fixed bottom-5 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full border border-primary/20 bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-xl"><Check size={16} className="text-primary" />{flash}</div>}
    </div>
  );
}

function Login({ onLogin }: { onLogin: (session: { name: string; username: string; business: string }) => void }) {
  const [username, setUsername] = useState('owner');
  const [password, setPassword] = useState('owner123');
  const [error, setError] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (username.toLowerCase() === 'owner' && password === 'owner123') onLogin({ name: 'Sachin Rajojha', username: 'owner', business: 'Shree Business Hub' });
    else setError('That demo login does not match. Try the account shown below.');
  };
  return (
    <div className="surface-grid flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#103c35] px-4 py-8">
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-[#e9bd55]/20 blur-3xl" />
      <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-[#e97752]/25 blur-3xl" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[1.6rem] border border-white/15 bg-[#f8f1e4] shadow-2xl lg:grid-cols-[1.05fr_.95fr]">
        <div className="hidden flex-col justify-between bg-[#103c35] p-10 text-[#f8f1e4] lg:flex">
          <div><div className="mb-14 flex items-center gap-3"><Logo inverted /><span className="font-display text-xl font-semibold tracking-tight">nexa</span></div><p className="max-w-sm font-display text-5xl font-semibold leading-[1.04]">Run the shop.<br /><span className="text-[#e9bd55]">Keep your head clear.</span></p><p className="mt-6 max-w-sm text-sm leading-6 text-white/65">A calm daily command centre for sales, stock, people and the little details that keep Indian businesses moving.</p></div>
          <div className="flex items-center gap-3 text-xs text-white/55"><ShieldCheck size={16} /> Your demo workspace stays in this browser.</div>
        </div>
        <div className="p-7 sm:p-10 lg:p-12">
          <div className="mb-10 lg:hidden"><Logo /></div>
          <div className="mb-8"><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-primary">Welcome back</p><h1 className="font-display text-3xl font-semibold tracking-tight text-[#103c35]">Good to see you.</h1><p className="mt-2 text-sm text-slate-500">Sign in to pick up where your business left off.</p></div>
          <form onSubmit={submit} className="space-y-5">
            <Field label="Username"><input data-testid="input-login-username" value={username} onChange={(event) => setUsername(event.target.value)} /></Field>
            <Field label="Password"><input data-testid="input-login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></Field>
            {error && <p data-testid="status-login-error" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
            <button data-testid="button-login" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#103c35] font-semibold text-[#f8f1e4] transition hover:bg-[#195c4f]">Enter workspace <ChevronRight size={17} /></button>
          </form>
          <div className="mt-8 rounded-xl border border-[#dcd2c2] bg-[#efe6d7] p-4"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#62736d]">Demo account</p><div className="mt-2 flex items-center justify-between text-sm"><span className="font-semibold text-[#103c35]">owner</span><span className="font-mono text-xs text-[#62736d]">owner123</span></div></div>
          <p className="mt-8 text-center text-xs text-slate-400">Local demo · no account or server required</p>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ active, open, onClose, session, onLogout }: { active: ModuleId; open: boolean; onClose: () => void; session: { name: string; username: string; business: string }; onLogout: () => void }) {
  return <aside className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
    <div className="flex h-[76px] items-center justify-between border-b border-sidebar-border px-6"><Link href="/" className="flex items-center gap-3" onClick={onClose}><Logo inverted /><span className="font-display text-xl font-semibold tracking-tight">nexa</span></Link><button data-testid="button-close-sidebar" onClick={onClose} className="rounded-lg p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent lg:hidden"><X size={18} /></button></div>
    <div className="border-b border-sidebar-border px-5 py-5"><p className="mb-1 text-[10px] font-bold uppercase tracking-[.18em] text-sidebar-foreground/45">Your workspace</p><p className="truncate text-sm font-semibold">{session.business}</p><div className="mt-3 flex items-center gap-2 text-[11px] text-sidebar-foreground/55"><span className="h-2 w-2 rounded-full bg-[#e9bd55]" /> Local demo mode</div></div>
    <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-5">{navGroups.map((group) => <div key={group.label} className="mb-6"><p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-sidebar-foreground/38">{group.label}</p>{group.items.map((item) => { const Icon = item.icon; const selected = active === item.id; return <Link key={item.id} href={item.path} onClick={onClose} data-testid={`link-nav-${item.id}`} className={`group mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${selected ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm' : 'text-sidebar-foreground/67 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}><Icon size={17} strokeWidth={selected ? 2.4 : 1.8} /><span>{item.label}</span>{item.id === 'udhaar' && <span className={`ml-auto rounded px-1.5 py-0.5 text-[10px] ${selected ? 'bg-sidebar-primary-foreground/15' : 'bg-sidebar-accent text-sidebar-foreground/50'}`}>5</span>}</Link>; })}</div>)}</nav>
    <div className="border-t border-sidebar-border p-3"><div className="flex items-center gap-3 rounded-lg px-3 py-2.5"><Avatar name={session.name} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{session.name}</p><p className="text-[10px] text-sidebar-foreground/45">Owner access</p></div><button data-testid="button-logout" onClick={onLogout} title="Sign out" className="text-sidebar-foreground/45 hover:text-sidebar-foreground"><LogOut size={16} /></button></div></div>
  </aside>;
}

function Topbar({ active, search, onSearch, unread, dark, onTheme, onMenu }: { active: ModuleId; search: string; onSearch: (value: string) => void; unread: number; dark: boolean; onTheme: () => void; onMenu: () => void }) {
  const label = navGroups.flatMap((group) => group.items).find((item) => item.id === active)?.label || 'Overview';
  return <header className="sticky top-0 z-30 flex h-[76px] items-center gap-3 border-b border-border/80 bg-background/90 px-4 backdrop-blur-md sm:px-6 lg:px-9"><button data-testid="button-open-sidebar" onClick={onMenu} className="rounded-lg p-2 hover:bg-muted lg:hidden"><Menu size={20} /></button><div className="min-w-0 flex-1"><p className="text-[11px] font-medium text-muted-foreground">Shree Business Hub /</p><h1 className="truncate font-display text-lg font-semibold tracking-tight">{label}</h1></div><div className="hidden w-full max-w-xs items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:flex"><Search size={16} className="text-muted-foreground" /><input data-testid="input-global-search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search anything..." className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/70" /></div><button data-testid="button-theme" onClick={onTheme} className="rounded-lg border border-border bg-card p-2.5 text-muted-foreground hover:text-foreground">{dark ? <Sun size={17} /> : <Moon size={17} />}</button><button data-testid="button-notifications" className="relative rounded-lg border border-border bg-card p-2.5 text-muted-foreground hover:text-foreground"><Bell size={17} /><span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground">{unread}</span></button></header>;
}

function Dashboard({ products, customers, expenses, udhaar, go }: { products: Product[]; customers: Customer[]; expenses: Expense[]; udhaar: UdhaarAccount[]; go: (path: string) => void }) {
  const lowStock = products.filter((item) => item.quantity < 15);
  const totalDue = udhaar.reduce((sum, item) => sum + item.balance, 0);
  const sales = 184300;
  return <PageHeader eyebrow="Tuesday, 28 January 2025" title="Good morning, Sachin." description="Here is the pulse of your business today." actions={<button data-testid="button-dashboard-pos" onClick={() => go('/pos')} className="button-primary"><ShoppingCart size={16} /> New sale</button>}>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Sales this week" value={money(sales)} note="+12.8% vs last week" trend="up" icon={IndianRupee} />
      <MetricCard label="Outstanding udhaar" value={money(totalDue)} note="5 customers to follow up" trend="down" icon={CreditCard} tone="coral" />
      <MetricCard label="Items in stock" value={products.reduce((sum, item) => sum + item.quantity, 0).toLocaleString('en-IN')} note={`${lowStock.length} need attention`} trend="neutral" icon={Package} tone="gold" />
      <MetricCard label="Operating expenses" value={money(expenses.reduce((sum, item) => sum + item.amount, 0))} note="Across 10 entries" trend="neutral" icon={Wallet} tone="ink" />
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
      <section className="card-surface min-h-[330px]"><SectionHeading title="Cash flow" detail="Last 7 days" action={<button data-testid="button-view-reports" onClick={() => go('/reports')} className="text-xs font-bold text-primary">View report <ChevronRight className="inline" size={14} /></button>} /><div className="mt-7 flex h-[215px] items-end gap-2 sm:gap-4">{revenueData.map((day, index) => { const height = Math.round((day.revenue / 41000) * 100); return <div key={day.day} className="group flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="relative flex h-full w-full items-end justify-center gap-1.5"><div className="w-[45%] rounded-t-md bg-primary/80 transition-all group-hover:bg-primary" style={{ height: `${height}%` }} /><div className="w-[45%] rounded-t-md bg-accent/55" style={{ height: `${Math.max(12, (day.expenses / 14200) * 56)}%` }} /><div className="pointer-events-none absolute -top-1 hidden rounded-md bg-foreground px-2 py-1 text-[10px] text-background group-hover:block">{money(day.revenue)}</div></div><span className="text-[10px] font-medium text-muted-foreground">{day.day}</span></div>; })}</div><div className="mt-3 flex items-center gap-5 text-[11px] text-muted-foreground"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-primary" /> Sales</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-accent/60" /> Expenses</span></div></section>
      <section className="card-surface"><SectionHeading title="Needs your eye" detail="Actionable today" /><div className="mt-5 space-y-2.5">{lowStock.slice(0, 3).map((item) => <button data-testid={`button-low-stock-${item.id}`} key={item.id} onClick={() => go('/inventory')} className="flex w-full items-center gap-3 rounded-lg border border-border bg-muted/45 p-3 text-left transition hover:border-primary/40 hover:bg-muted"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent"><Package size={16} /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{item.name}</span><span className="text-[11px] text-muted-foreground">{item.quantity} {item.unit}s left · {item.rack}</span></span><ChevronRight size={15} className="text-muted-foreground" /></button>)}<button data-testid="button-open-udhaar" onClick={() => go('/udhaar')} className="flex w-full items-center gap-3 rounded-lg border border-border bg-muted/45 p-3 text-left transition hover:border-primary/40 hover:bg-muted"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><CreditCard size={16} /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold">Udhaar follow-ups</span><span className="text-[11px] text-muted-foreground">{money(totalDue)} due from regulars</span></span><ChevronRight size={15} className="text-muted-foreground" /></button><button data-testid="button-open-pipeline" onClick={() => go('/pipeline')} className="flex w-full items-center gap-3 rounded-lg border border-border bg-muted/45 p-3 text-left transition hover:border-primary/40 hover:bg-muted"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-[#ae7b1b]"><TrendingUp size={16} /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold">Pipeline has momentum</span><span className="text-[11px] text-muted-foreground">8 opportunities · ₹21.2L potential</span></span><ChevronRight size={15} className="text-muted-foreground" /></button></div></section>
    </div>
    <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><section className="card-surface"><SectionHeading title="Top customers" detail="By lifetime value" action={<button data-testid="button-view-clients" onClick={() => go('/clients')} className="text-xs font-bold text-primary">View all</button>} /><div className="mt-4 overflow-x-auto"><table className="data-table"><thead><tr><th>Customer</th><th>Last visit</th><th className="text-right">Lifetime</th></tr></thead><tbody>{customers.slice(0, 4).map((customer) => <tr key={customer.id}><td><div className="flex items-center gap-2.5"><Avatar name={customer.name} small /><span className="font-semibold">{customer.name}</span></div></td><td className="text-muted-foreground">{customer.lastContact}</td><td className="text-right font-display font-semibold">{money(customer.totalPurchases)}</td></tr>)}</tbody></table></div></section><section className="card-surface"><SectionHeading title="Quick start" detail="Make today lighter" /><div className="mt-4 grid grid-cols-2 gap-2">{[{ label: 'Record sale', icon: Receipt, path: '/pos' }, { label: 'Add stock', icon: Package, path: '/inventory' }, { label: 'Log expense', icon: Wallet, path: '/expenses' }, { label: 'Add client', icon: UserPlus, path: '/clients' }].map((item) => { const Icon = item.icon; return <button data-testid={`button-quick-${item.label.replace(' ', '-').toLowerCase()}`} key={item.label} onClick={() => go(item.path)} className="flex flex-col items-start gap-3 rounded-xl border border-border bg-muted/30 p-3.5 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card"><span className="rounded-lg bg-primary/10 p-2 text-primary"><Icon size={16} /></span><span className="text-xs font-semibold">{item.label}</span></button>; })}</div></section></div>
  </PageHeader>;
}

function POS({ products, cart, setCart, onCheckout }: { products: Product[]; cart: { product: Product; qty: number }[]; setCart: (value: { product: Product; qty: number }[]) => void; onCheckout: (payment: string) => void }) {
  const [query, setQuery] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const filtered = products.filter((item) => `${item.name} ${item.sku} ${item.category}`.toLowerCase().includes(query.toLowerCase())).slice(0, 12);
  const total = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const add = (product: Product) => setCart(cart.some((item) => item.product.id === product.id) ? cart.map((item) => item.product.id === product.id ? { ...item, qty: Math.min(product.quantity, item.qty + 1) } : item) : [...cart, { product, qty: 1 }]);
  return <PageHeader eyebrow="Point of sale" title="Make a sale" description="Fast billing for the counter, without the clutter." actions={<span className="status-pill"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Counter 01 · Ready</span>}><div className="grid gap-5 xl:grid-cols-[1fr_380px]"><section className="card-surface"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-base font-semibold">Catalogue</h2><p className="text-xs text-muted-foreground">Tap an item to add it to the bill</p></div><div className="flex w-full items-center gap-2 rounded-lg border border-border bg-muted/35 px-3 py-2 sm:w-64"><Search size={16} className="text-muted-foreground" /><input data-testid="input-pos-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search product or SKU" className="w-full bg-transparent text-xs outline-none" /></div></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((product) => <button data-testid={`button-pos-product-${product.id}`} key={product.id} onClick={() => add(product)} disabled={product.quantity === 0} className="group rounded-xl border border-border bg-muted/25 p-3 text-left transition hover:-translate-y-0.5 hover:border-primary/45 hover:bg-card disabled:cursor-not-allowed disabled:opacity-45"><div className="mb-5 flex items-start justify-between"><span className="rounded-md bg-primary/10 px-1.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">{product.category}</span><Plus size={16} className="text-muted-foreground transition group-hover:text-primary" /></div><p className="line-clamp-2 min-h-9 text-xs font-semibold">{product.name}</p><div className="mt-2 flex items-center justify-between"><span className="font-display text-sm font-semibold">{money(product.price)}</span><span className="text-[10px] text-muted-foreground">{product.quantity} left</span></div></button>)}</div></section><section className="card-surface flex min-h-[520px] flex-col"><div className="flex items-start justify-between border-b border-border pb-4"><div><h2 className="font-display text-base font-semibold">Current bill</h2><p className="text-xs text-muted-foreground">Invoice #{Date.now().toString().slice(-5)}</p></div><button data-testid="button-clear-cart" onClick={() => setCart([])} disabled={!cart.length} className="text-xs font-semibold text-muted-foreground hover:text-destructive disabled:opacity-30">Clear</button></div>{cart.length ? <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto py-4">{cart.map((item) => <div key={item.product.id} className="flex items-center gap-2"><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{item.product.name}</p><p className="text-[10px] text-muted-foreground">{money(item.product.price)} each</p></div><div className="flex items-center rounded-md border border-border"><button data-testid={`button-pos-minus-${item.product.id}`} onClick={() => setCart(item.qty === 1 ? cart.filter((entry) => entry.product.id !== item.product.id) : cart.map((entry) => entry.product.id === item.product.id ? { ...entry, qty: entry.qty - 1 } : entry))} className="px-2 py-1 text-muted-foreground hover:text-foreground">−</button><span className="w-6 text-center text-xs font-semibold">{item.qty}</span><button data-testid={`button-pos-plus-${item.product.id}`} onClick={() => add(item.product)} className="px-2 py-1 text-muted-foreground hover:text-foreground">+</button></div><span className="w-16 text-right font-display text-xs font-semibold">{money(item.product.price * item.qty)}</span></div>)}</div> : <div className="flex flex-1 flex-col items-center justify-center text-center"><div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground"><ShoppingCart size={22} /></div><p className="text-sm font-semibold">Your bill is empty</p><p className="mt-1 max-w-[200px] text-xs leading-5 text-muted-foreground">Select products from the catalogue to start a quick bill.</p></div>}<div className="border-t border-border pt-4"><div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>Subtotal</span><span>{money(total)}</span></div><div className="mb-4 flex justify-between text-base font-bold"><span>Total</span><span className="font-display">{money(total)}</span></div><button data-testid="button-proceed-payment" onClick={() => setPaymentOpen(true)} disabled={!cart.length} className="button-primary h-11 w-full justify-center disabled:cursor-not-allowed disabled:opacity-40">Proceed to payment <ChevronRight size={16} /></button></div></section></div>{paymentOpen && <div className="mt-3 flex flex-wrap items-center justify-end gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3"><span className="mr-auto text-xs font-semibold">Choose payment mode</span>{['Cash', 'UPI', 'Card', 'Udhaar'].map((mode) => <button data-testid={`button-payment-${mode.toLowerCase()}`} key={mode} onClick={() => { onCheckout(mode); setPaymentOpen(false); }} className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold hover:border-primary">{mode}</button>)}</div>}</PageHeader>;
}

function Inventory({ products, search, setSearch, onAdd, onDelete, onAdjust }: { products: Product[]; search: string; setSearch: (value: string) => void; onAdd: () => void; onDelete: (id: string) => void; onAdjust: (id: string, delta: number) => void }) {
  const filtered = products.filter((item) => `${item.name} ${item.sku} ${item.category}`.toLowerCase().includes(search.toLowerCase()));
  return <PageHeader eyebrow="Stock room" title="Inventory" description={`${products.length} products · ${products.filter((item) => item.quantity < 15).length} need a refill`} actions={<button data-testid="button-add-product" onClick={onAdd} className="button-primary"><Plus size={16} /> Add product</button>}><section className="card-surface"><div className="mb-5 flex flex-wrap gap-3"><div className="flex min-w-[230px] flex-1 items-center gap-2 rounded-lg border border-border bg-muted/35 px-3 py-2"><Search size={16} className="text-muted-foreground" /><input data-testid="input-inventory-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search stock, SKU or category" className="w-full bg-transparent text-xs outline-none" /></div><button data-testid="button-stock-filter" className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"><ListFilter size={15} /> Filter</button></div><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Sell price</th><th>Available</th><th className="text-right">Actions</th></tr></thead><tbody>{filtered.map((product) => <tr key={product.id}><td><div className="flex items-center gap-3"><div className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold ${product.quantity < 15 ? 'bg-accent/15 text-accent' : 'bg-primary/10 text-primary'}`}>{product.name.slice(0, 2).toUpperCase()}</div><div><p className="font-semibold">{product.name}</p><p className="text-[11px] text-muted-foreground">{product.rack || 'Unassigned rack'} · per {product.unit}</p></div></div></td><td className="font-mono text-xs text-muted-foreground">{product.sku}</td><td><span className="soft-pill">{product.category}</span></td><td className="font-display font-semibold">{money(product.price)}</td><td><span className={`font-semibold ${product.quantity < 15 ? 'text-accent' : ''}`}>{product.quantity}</span> <span className="text-xs text-muted-foreground">{product.unit}s</span></td><td><div className="flex justify-end gap-1"><button data-testid={`button-stock-minus-${product.id}`} onClick={() => onAdjust(product.id, -1)} className="icon-button">−</button><button data-testid={`button-stock-plus-${product.id}`} onClick={() => onAdjust(product.id, 1)} className="icon-button">+</button><button data-testid={`button-delete-product-${product.id}`} onClick={() => onDelete(product.id)} className="icon-button text-muted-foreground hover:text-destructive"><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>{!filtered.length && <EmptyState icon={Package} title="No stock found" detail="Try a different product, SKU or category." />}</section></PageHeader>;
}

function Udhaar({ accounts, onPayment }: { accounts: UdhaarAccount[]; onPayment: (account: UdhaarAccount, amount: number) => void }) {
  const [selected, setSelected] = useState<UdhaarAccount | null>(null);
  const total = accounts.reduce((sum, account) => sum + account.balance, 0);
  return <PageHeader eyebrow="The trusted ledger" title="Udhaar" description="Keep credit human, visible and easy to collect." actions={<span className="status-pill"><CreditCard size={14} /> {money(total)} outstanding</span>}><div className="mb-5 grid gap-4 sm:grid-cols-3"><MiniStat label="Total outstanding" value={money(total)} tone="coral" /><MiniStat label="Customers on credit" value={String(accounts.length)} /><MiniStat label="Collected this month" value={money(12400)} tone="gold" /></div><section className="card-surface"><SectionHeading title="Open balances" detail="Tap a customer to see their ledger" /><div className="mt-4 grid gap-2 md:grid-cols-2">{accounts.map((account) => <button data-testid={`button-udhaar-account-${account.customerId}`} key={account.customerId} onClick={() => setSelected(account)} className="flex items-center gap-3 rounded-xl border border-border p-3 text-left transition hover:border-primary/45 hover:bg-muted/35"><Avatar name={account.customerName} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{account.customerName}</p><p className="text-[11px] text-muted-foreground">{account.phone} · Last activity {account.lastTransaction}</p></div><div className="text-right"><p className="font-display text-sm font-bold text-accent">{money(account.balance)}</p><p className="text-[10px] text-muted-foreground">due <ChevronRight className="inline" size={12} /></p></div></button>)}</div></section>{selected && <Modal title={selected.customerName} subtitle={`${selected.phone} · ${money(selected.balance)} currently due`} onClose={() => setSelected(null)}><div className="space-y-2">{selected.entries.map((entry) => <div key={entry.id} className="flex items-center gap-3 rounded-lg bg-muted/45 p-3"><span className={`rounded-md p-1.5 ${entry.type === 'payment' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>{entry.type === 'payment' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}</span><div className="flex-1"><p className="text-xs font-semibold">{entry.note}</p><p className="text-[10px] text-muted-foreground">{entry.date} · {entry.type === 'payment' ? 'Payment received' : 'Credit added'}</p></div><span className={`font-display text-xs font-semibold ${entry.type === 'payment' ? 'text-primary' : 'text-accent'}`}>{entry.type === 'payment' ? '−' : '+'}{money(entry.amount)}</span></div>)}</div><div className="mt-5 flex gap-2"><button data-testid="button-udhaar-payment" onClick={() => { const amount = Number(window.prompt(`Payment from ${selected.customerName}`, String(selected.balance))); if (amount > 0) { onPayment(selected, Math.min(amount, selected.balance)); setSelected(null); } }} className="button-primary flex-1 justify-center"><IndianRupee size={15} /> Record payment</button><button data-testid="button-udhaar-reminder" onClick={() => setSelected(null)} className="button-secondary flex-1 justify-center">Mark reminder sent</button></div></Modal>}</PageHeader>;
}

function Expenses({ expenses, onAdd }: { expenses: Expense[]; onAdd: () => void }) {
  return <PageHeader eyebrow="Money out" title="Expenses" description="Know where the rupees are going, before month-end." actions={<button data-testid="button-add-expense" onClick={onAdd} className="button-primary"><Plus size={16} /> Log expense</button>}><div className="mb-5 grid gap-4 sm:grid-cols-3"><MiniStat label="This month" value={money(expenses.reduce((sum, item) => sum + item.amount, 0))} /><MiniStat label="Largest category" value="Salary" tone="gold" /><MiniStat label="Entries" value={String(expenses.length)} /></div><section className="card-surface"><SectionHeading title="Recent expenses" detail="Newest first" action={<button data-testid="button-export-expenses" className="button-secondary"><FileText size={14} /> Export</button>} /><div className="mt-4 overflow-x-auto"><table className="data-table"><thead><tr><th>Date</th><th>Expense</th><th>Category</th><th>Paid by</th><th className="text-right">Amount</th></tr></thead><tbody>{expenses.map((expense) => <tr key={expense.id}><td className="text-muted-foreground">{expense.date}</td><td><p className="font-semibold">{expense.description}</p></td><td><span className="soft-pill">{expense.category}</span></td><td className="text-muted-foreground">{expense.paidBy}</td><td className="text-right font-display font-semibold">{money(expense.amount)}</td></tr>)}</tbody></table></div></section></PageHeader>;
}

function Clients({ customers, onAdd }: { customers: Customer[]; onAdd: () => void }) {
  return <PageHeader eyebrow="People who return" title="Clients" description="Your customer book, with the context that matters." actions={<button data-testid="button-add-client" onClick={onAdd} className="button-primary"><UserPlus size={16} /> Add client</button>}><section className="card-surface"><div className="mb-5 flex items-center justify-between"><SectionHeading title="Customer book" detail={`${customers.length} people`} /><button data-testid="button-client-filter" className="button-secondary"><ListFilter size={14} /> Filter</button></div><div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{customers.map((customer) => <div data-testid={`card-client-${customer.id}`} key={customer.id} className="group rounded-xl border border-border bg-muted/20 p-4 transition hover:border-primary/35 hover:bg-card"><div className="flex items-start gap-3"><Avatar name={customer.name} /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold">{customer.name}</p>{customer.status === 'vip' && <span className="rounded bg-[#e9bd55]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#9a6b15]">VIP</span>}</div><p className="mt-0.5 text-xs text-muted-foreground">{customer.phone}</p></div><MoreHorizontal size={17} className="text-muted-foreground" /></div><div className="mt-4 flex items-end justify-between border-t border-border pt-3"><div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Lifetime spend</p><p className="font-display text-sm font-semibold">{money(customer.totalPurchases)}</p></div><div className="text-right"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Balance</p><p className={`font-display text-sm font-semibold ${customer.balance < 0 ? 'text-accent' : 'text-primary'}`}>{customer.balance < 0 ? money(customer.balance) : 'Clear'}</p></div></div></div>)}</div></section></PageHeader>;
}

const stages: Lead['stage'][] = ['new', 'discussion', 'proposal', 'closed'];
const stageLabels: Record<Lead['stage'], string> = { new: 'New', discussion: 'In discussion', proposal: 'Proposal sent', closed: 'Closed' };
function Pipeline({ leads, onAdd, onMove }: { leads: Lead[]; onAdd: () => void; onMove: (id: string, stage: Lead['stage']) => void }) {
  return <PageHeader eyebrow="Relationships" title="Pipeline" description="A simple view of what could become your next good month." actions={<button data-testid="button-add-lead" onClick={onAdd} className="button-primary"><Plus size={16} /> Add opportunity</button>}><div className="mb-5 flex items-center gap-2 overflow-x-auto pb-1"><span className="text-xs text-muted-foreground">Potential value</span><span className="font-display text-lg font-semibold">{money(leads.reduce((sum, lead) => sum + lead.value, 0))}</span><span className="ml-1 soft-pill text-primary">+18.4% this month</span></div><div className="grid gap-4 overflow-x-auto lg:grid-cols-4">{stages.map((stage) => <section key={stage} className="min-w-[260px] rounded-xl border border-border bg-muted/30 p-3"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${stage === 'new' ? 'bg-primary' : stage === 'discussion' ? 'bg-[#e9bd55]' : stage === 'proposal' ? 'bg-accent' : 'bg-slate-400'}`} /><h2 className="text-xs font-bold">{stageLabels[stage]}</h2></div><span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{leads.filter((lead) => lead.stage === stage).length}</span></div><div className="space-y-2">{leads.filter((lead) => lead.stage === stage).map((lead) => <div data-testid={`card-lead-${lead.id}`} key={lead.id} className="rounded-lg border border-border bg-card p-3 shadow-sm"><div className="flex items-start justify-between gap-2"><p className="text-xs font-semibold">{lead.company}</p><MoreHorizontal size={14} className="shrink-0 text-muted-foreground" /></div><p className="mt-1 text-[11px] text-muted-foreground">{lead.name} · {lead.assignedTo}</p><div className="mt-3 flex items-center justify-between"><span className="font-display text-sm font-semibold">{money(lead.value)}</span><select data-testid={`select-lead-stage-${lead.id}`} value={lead.stage} onChange={(event) => onMove(lead.id, event.target.value as Lead['stage'])} className="max-w-[92px] rounded border border-border bg-transparent px-1 py-1 text-[9px] text-muted-foreground outline-none"><option value="new">Move</option>{stages.map((value) => <option key={value} value={value}>{stageLabels[value]}</option>)}</select></div></div>)}</div></section>)}</div></PageHeader>;
}

function Staff({ staff, onAdd, onToggle }: { staff: StaffMember[]; onAdd: () => void; onToggle: (id: string) => void }) {
  return <PageHeader eyebrow="Your people" title="Staff & attendance" description="Know who is in, who needs support and where the shift stands." actions={<button data-testid="button-add-staff" onClick={onAdd} className="button-primary"><UserPlus size={16} /> Add team member</button>}><section className="card-surface"><SectionHeading title="Team roster" detail={`${staff.filter((item) => item.status === 'active').length} active today`} /><div className="mt-5 overflow-x-auto"><table className="data-table"><thead><tr><th>Team member</th><th>Role</th><th>Department</th><th>Attendance</th><th>Status</th><th className="text-right">Manage</th></tr></thead><tbody>{staff.map((member) => <tr key={member.id}><td><div className="flex items-center gap-3"><Avatar name={member.name} /><div><p className="font-semibold">{member.name}</p><p className="text-[11px] text-muted-foreground">{member.phone}</p></div></div></td><td>{member.role}</td><td className="text-muted-foreground">{member.department}</td><td><div className="flex items-center gap-2"><div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (member.attendance / 30) * 100)}%` }} /></div><span className="text-xs font-semibold">{member.attendance}/30</span></div></td><td><span className={`status-pill ${member.status === 'active' ? 'text-primary' : 'text-accent'}`}><span className={`h-1.5 w-1.5 rounded-full ${member.status === 'active' ? 'bg-primary' : 'bg-accent'}`} />{member.status === 'active' ? 'Active' : 'Blocked'}</span></td><td className="text-right"><button data-testid={`button-toggle-staff-${member.id}`} onClick={() => onToggle(member.id)} className="text-xs font-semibold text-primary hover:underline">{member.status === 'active' ? 'Block' : 'Activate'}</button></td></tr>)}</tbody></table></div></section></PageHeader>;
}

function Reports({ expenses, products }: { expenses: Expense[]; products: Product[] }) {
  const categories = [...new Set(expenses.map((item) => item.category))].map((category) => ({ category, value: expenses.filter((item) => item.category === category).reduce((sum, item) => sum + item.amount, 0) })).sort((a, b) => b.value - a.value);
  return <PageHeader eyebrow="Make better calls" title="Reports" description="The useful numbers, without making you feel like an accountant." actions={<button data-testid="button-download-report" className="button-secondary"><FileText size={14} /> Download summary</button>}><div className="grid gap-4 md:grid-cols-3"><MetricCard label="Gross sales" value={money(286400)} note="+14.2% month on month" trend="up" icon={TrendingUp} /><MetricCard label="Gross margin" value="23.8%" note="Healthy for your mix" trend="up" icon={BarChart3} tone="gold" /><MetricCard label="Stock value" value={money(products.reduce((sum, item) => sum + item.cost * item.quantity, 0))} note="At cost price" trend="neutral" icon={Boxes} tone="coral" /></div><div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><section className="card-surface"><SectionHeading title="Sales pulse" detail="This week vs last week" /><div className="mt-6 space-y-4">{revenueData.map((day) => <div key={day.day} className="flex items-center gap-3"><span className="w-7 text-[11px] font-semibold text-muted-foreground">{day.day}</span><div className="h-3 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(day.revenue / 41000) * 100}%` }} /></div><span className="w-20 text-right font-display text-xs font-semibold">{money(day.revenue)}</span></div>)}</div></section><section className="card-surface"><SectionHeading title="Spend by category" detail="Current period" /><div className="mt-5 space-y-4">{categories.slice(0, 6).map((item, index) => <div key={item.category} className="flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full ${['bg-primary', 'bg-accent', 'bg-[#e9bd55]', 'bg-sky-500', 'bg-violet-500', 'bg-slate-400'][index]}`} /><span className="flex-1 text-xs font-medium">{item.category}</span><span className="font-display text-xs font-semibold">{money(item.value)}</span></div>)}</div></section></div></PageHeader>;
}

function Industry() {
  const cards = [{ title: 'Fast-moving stock', detail: 'Daily essentials and breakfast items lead your basket.', value: '61%', icon: Zap }, { title: 'Repeat customers', detail: 'Customers who came back this month.', value: '74', icon: Users }, { title: 'Best counter hour', detail: 'Your busiest sales window.', value: '6–8 PM', icon: TrendingUp }];
  return <PageHeader eyebrow="A view made for your trade" title="Retail / general store" description="Signals shaped around how a neighbourhood business actually runs." actions={<button data-testid="button-industry-settings" className="button-secondary"><Settings size={14} /> Configure view</button>}><div className="grid gap-4 md:grid-cols-3">{cards.map((card) => { const Icon = card.icon; return <div key={card.title} className="card-surface group relative overflow-hidden"><div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-primary/6 transition group-hover:scale-125" /><Icon size={18} className="mb-8 text-primary" /><p className="font-display text-3xl font-semibold">{card.value}</p><p className="mt-2 text-sm font-semibold">{card.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{card.detail}</p></div>; })}</div><section className="card-surface mt-5"><SectionHeading title="Your operating rhythm" detail="A practical snapshot of the week" /><div className="mt-5 grid gap-4 md:grid-cols-3"><div className="rounded-xl bg-[#103c35] p-5 text-[#f8f1e4]"><p className="text-xs text-white/60">Morning</p><p className="mt-2 font-display text-lg font-semibold">Restock the essentials</p><p className="mt-2 text-xs leading-5 text-white/60">Check Dolo, oil and dairy before the first rush.</p></div><div className="rounded-xl bg-[#e9bd55]/20 p-5"><p className="text-xs text-[#82611e]">Afternoon</p><p className="mt-2 font-display text-lg font-semibold text-[#554319]">Close open credit</p><p className="mt-2 text-xs leading-5 text-[#82611e]">Two regulars are due for a gentle follow-up today.</p></div><div className="rounded-xl bg-accent/10 p-5"><p className="text-xs text-accent">Evening</p><p className="mt-2 font-display text-lg font-semibold">Watch the counter</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Your strongest window starts around 6 PM.</p></div></div></section></PageHeader>;
}

function EntryModal({ kind, onClose, onSubmit }: { kind: Exclude<ModalKind, null>; onClose: () => void; onSubmit: (form: Record<string, string>) => void }) {
  const [form, setForm] = useState<Record<string, string>>({});
  const config: Record<Exclude<ModalKind, null>, { title: string; subtitle: string; fields: { key: string; label: string; type?: string; placeholder?: string }[]; submit: string }> = {
    product: { title: 'Add a product', subtitle: 'Keep your catalogue ready for the next sale.', submit: 'Add product', fields: [{ key: 'name', label: 'Product name', placeholder: 'e.g. Aashirvaad Atta 5kg' }, { key: 'sku', label: 'SKU', placeholder: 'Optional code' }, { key: 'category', label: 'Category', placeholder: 'e.g. Grocery' }, { key: 'price', label: 'Selling price', type: 'number', placeholder: '0' }, { key: 'cost', label: 'Cost price', type: 'number', placeholder: '0' }, { key: 'quantity', label: 'Opening quantity', type: 'number', placeholder: '0' }],
    },
    expense: { title: 'Log an expense', subtitle: 'A small note now saves a scramble later.', submit: 'Save expense', fields: [{ key: 'description', label: 'What was it for?', placeholder: 'e.g. Shop rent for January' }, { key: 'category', label: 'Category', placeholder: 'e.g. Rent, Transport, Salary' }, { key: 'amount', label: 'Amount', type: 'number', placeholder: '0' }, { key: 'date', label: 'Date', type: 'date' }, { key: 'paidBy', label: 'Paid by', placeholder: 'Owner' }],
    },
    client: { title: 'Add a client', subtitle: 'Save the details you will want at the counter.', submit: 'Add client', fields: [{ key: 'name', label: 'Full name', placeholder: 'e.g. Meera Nair' }, { key: 'phone', label: 'Phone number', placeholder: '10 digit mobile number' }, { key: 'email', label: 'Email', type: 'email', placeholder: 'Optional' }, { key: 'address', label: 'Address', placeholder: 'Optional' }],
    },
    staff: { title: 'Add team member', subtitle: 'Keep your roster current and clear.', submit: 'Add member', fields: [{ key: 'name', label: 'Full name', placeholder: 'e.g. Kavya Rao' }, { key: 'phone', label: 'Phone number', placeholder: '10 digit mobile number' }, { key: 'role', label: 'Role', placeholder: 'e.g. Sales executive' }, { key: 'department', label: 'Department', placeholder: 'e.g. Sales' }, { key: 'salary', label: 'Monthly salary', type: 'number', placeholder: '0' }],
    },
    lead: { title: 'Add opportunity', subtitle: 'Give the next conversation somewhere to go.', submit: 'Add to pipeline', fields: [{ key: 'name', label: 'Contact name', placeholder: 'e.g. Aditya Mehta' }, { key: 'company', label: 'Business name', placeholder: 'e.g. Mehta Distributors' }, { key: 'phone', label: 'Phone number', placeholder: '10 digit mobile number' }, { key: 'value', label: 'Opportunity value', type: 'number', placeholder: '0' }, { key: 'assignedTo', label: 'Assigned to', placeholder: 'Your name' }],
    },
  };
  const current = config[kind];
  const update = (key: string, value: string) => setForm((valueMap) => ({ ...valueMap, [key]: value }));
  return <Modal title={current.title} subtitle={current.subtitle} onClose={onClose}><form onSubmit={(event) => { event.preventDefault(); onSubmit(form); }} className="space-y-4">{current.fields.map((field) => <Field key={field.key} label={field.label}><input data-testid={`input-${kind}-${field.key}`} required={['name', 'description', 'amount', 'price', 'quantity', 'phone', 'role', 'value'].includes(field.key)} type={field.type || 'text'} placeholder={field.placeholder} value={form[field.key] || ''} onChange={(event) => update(field.key, event.target.value)} /></Field>)}<div className="flex gap-2 pt-3"><button data-testid={`button-submit-${kind}`} className="button-primary flex-1 justify-center">{current.submit}</button><button type="button" data-testid={`button-cancel-${kind}`} onClick={onClose} className="button-secondary flex-1 justify-center">Cancel</button></div></form></Modal>;
}

function PageHeader({ eyebrow, title, description, actions, children }: { eyebrow: string; title: string; description: string; actions?: ReactNode; children: ReactNode }) {
  return <div className="animate-nexa-in"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-primary">{eyebrow}</p><h1 data-testid="text-page-title" className="font-display text-3xl font-semibold tracking-tight sm:text-[2.2rem]">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{description}</p></div>{actions && <div className="flex items-center gap-2">{actions}</div>}</div>{children}</div>;
}
function SectionHeading({ title, detail, action }: { title: string; detail?: string; action?: ReactNode }) { return <div className="flex items-center justify-between gap-3"><div><h2 className="font-display text-sm font-semibold">{title}</h2>{detail && <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>}</div>{action}</div>; }
function MetricCard({ label, value, note, trend, icon: Icon, tone = 'primary' }: { label: string; value: string; note: string; trend: 'up' | 'down' | 'neutral'; icon: typeof IndianRupee; tone?: 'primary' | 'coral' | 'gold' | 'ink' }) { const color = tone === 'coral' ? 'bg-accent/12 text-accent' : tone === 'gold' ? 'bg-[#e9bd55]/20 text-[#9a6b15]' : tone === 'ink' ? 'bg-foreground/8 text-foreground' : 'bg-primary/10 text-primary'; return <div className="card-surface"><div className="flex items-start justify-between"><span className={`rounded-lg p-2.5 ${color}`}><Icon size={17} /></span><span className={`flex items-center gap-1 text-[10px] font-bold ${trend === 'up' ? 'text-primary' : trend === 'down' ? 'text-accent' : 'text-muted-foreground'}`}>{trend === 'up' && <ArrowUpRight size={13} />}{trend === 'down' && <ArrowDownRight size={13} />}{trend === 'up' ? 'Good' : trend === 'down' ? 'Follow up' : 'Tracking'}</span></div><p className="mt-5 text-xs text-muted-foreground">{label}</p><p className="mt-1 font-display text-2xl font-semibold tracking-tight">{value}</p><p className="mt-2 text-[11px] text-muted-foreground">{note}</p></div>; }
function MiniStat({ label, value, tone = 'primary' }: { label: string; value: string; tone?: 'primary' | 'coral' | 'gold' }) { return <div className="card-surface"><p className="text-[11px] text-muted-foreground">{label}</p><p className={`mt-2 font-display text-xl font-semibold ${tone === 'coral' ? 'text-accent' : tone === 'gold' ? 'text-[#ae7b1b]' : ''}`}>{value}</p></div>; }
function Avatar({ name, small = false }: { name: string; small?: boolean }) { return <span data-testid={`avatar-${name.replace(/\s/g, '-').toLowerCase()}`} className={`flex shrink-0 items-center justify-center rounded-full bg-primary/12 font-bold text-primary ${small ? 'h-7 w-7 text-[9px]' : 'h-9 w-9 text-[10px]'}`}>{initials(name)}</span>; }
function Logo({ inverted = false }: { inverted?: boolean }) { return <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${inverted ? 'bg-[#e9bd55] text-[#103c35]' : 'bg-primary text-primary-foreground'}`}><span className="font-display text-sm font-bold">n</span></span>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="mb-1.5 block text-xs font-semibold">{label}</span>{children}</label>; }
function Modal({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: ReactNode }) { return <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#103c35]/35 p-0 backdrop-blur-sm sm:items-center sm:p-4"><div className="animate-nexa-pop max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-border bg-card p-6 shadow-2xl sm:rounded-2xl"><div className="mb-6 flex items-start justify-between gap-4"><div><h2 className="font-display text-xl font-semibold">{title}</h2><p className="mt-1 text-xs text-muted-foreground">{subtitle}</p></div><button data-testid="button-close-modal" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><X size={18} /></button></div>{children}</div></div>; }
function EmptyState({ icon: Icon, title, detail }: { icon: typeof Package; title: string; detail: string }) { return <div className="py-12 text-center"><Icon size={24} className="mx-auto text-muted-foreground" /><p className="mt-3 text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>; }

export default App;