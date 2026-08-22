import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowDownRight, ArrowUpRight, BarChart3, Boxes, BriefcaseBusiness, CalendarDays,
  CreditCard, Download, IndianRupee, LayoutDashboard, LogOut, Package,
  ShoppingCart, TrendingUp, Users, Wallet, X,
} from 'lucide-react';
import { Route, Switch, useLocation } from 'wouter';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/error-boundary';
import {
  mockCustomers, mockExpenses, mockNotifications, mockProducts, mockStaff, mockUdhaarAccounts,
} from '@/legacy/data/mockData';
import type {
  AppNotification, Customer, Expense, Product, StaffMember, UdhaarAccount,
} from '@/legacy/types/erp';

// SUPABASE & AUTH IMPORTS
import { supabase } from './lib/supabase';
import { AuthProvider, useAuth } from './context/AuthContext';

const queryClient = new QueryClient();
const money = (value: number) => `₹${Math.abs(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const dateToday = () => new Date().toISOString().slice(0, 10);
const timeNow = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
const daysAgo = (days: number) => {
  const value = new Date();
  value.setDate(value.getDate() - days);
  return value.toISOString().slice(0, 10);
};
const uid = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
const initials = (name: string) => name.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase();

const readStore = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
};
const writeStore = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));

type ModuleId = 'overview' | 'pos' | 'inventory' | 'udhaar' | 'expenses' | 'clients' | 'staff' | 'reports';
type ModalKind = 'product' | 'expense' | 'client' | 'staff' | null;
type SalePayment = 'Cash' | 'UPI' | 'Card' | 'Udhaar';
type ExportFormat = 'excel' | 'txt' | 'zip';

interface SaleItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  cost: number;
  total: number;
  profit: number;
}

interface Sale {
  id: string;
  date: string;
  time: string;
  customerId?: string;
  customerName: string;
  payment: SalePayment;
  items: SaleItem[];
  subtotal: number;
  grandTotal: number;
  profit: number;
}

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
  ] },
  { label: 'Business', items: [
    { id: 'staff', label: 'Staff & attendance', icon: BriefcaseBusiness, path: '/staff' },
    { id: 'reports', label: 'Reports', icon: FileBarChartIcon, path: '/reports' },
  ] },
];

function FileBarChartIcon(props: any) { return <BarChart3 {...props} />; }

function makeSeedSales(products: Product[], customers: Customer[]): Sale[] {
  const plans = [[0, 1], [1, 3], [2, 0], [4, 7], [5, 8], [6, 10], [8, 12]];
  return plans.map((indexes, day) => {
    const items = indexes.map((productIndex, position) => {
      const product = products[productIndex % products.length];
      const qty = ((day + position) % 3) + 1;
      return {
        productId: product.id,
        name: product.name,
        qty,
        price: product.price,
        cost: product.cost,
        total: product.price * qty,
        profit: (product.price - product.cost) * qty,
      };
    });
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    return {
      id: `seed_bill_${day + 1}`,
      date: daysAgo(6 - day),
      time: `${10 + day}:2${day}`,
      customerId: customers[day % customers.length]?.id,
      customerName: customers[day % customers.length]?.name || 'Walk-in customer',
      payment: (['Cash', 'UPI', 'Card', 'Cash', 'Udhaar', 'UPI', 'Cash'] as SalePayment[])[day],
      items,
      subtotal,
      grandTotal: subtotal,
      profit: items.reduce((sum, item) => sum + item.profit, 0),
    };
  });
}

function toCsv(headers: string[], rows: (string | number)[][]) {
  const quote = (value: string | number) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  return [headers, ...rows].map((row) => row.map(quote).join(',')).join('\n');
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

function downloadDataset(filename: string, headers: string[], rows: (string | number)[][], format: ExportFormat) {
  const csv = toCsv(headers, rows);
  downloadBlob(`${filename}.${format === 'excel' ? 'csv' : 'txt'}`, new Blob([csv], { type: format === 'excel' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8' }));
}

// AUTH SCREENS (LOGIN & REGISTER)
function AuthScreen() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isRegister) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) setError(error.message);
      else alert('Registration successful! Confirm your email or login directly.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="card-surface w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            {isRegister ? 'Register Nexa ERP' : 'Welcome Back'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isRegister ? 'Naya account banakar start karo' : 'Apna account login karo'}
          </p>
        </div>

        {error && <div className="rounded-md bg-destructive/15 p-3 text-xs text-destructive">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="mb-1 block text-xs font-medium">Full Name</label>
              <input
                type="text"
                placeholder="Don"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium">Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="button-primary w-full justify-center">
            {loading ? 'Processing...' : isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground">
          {isRegister ? 'Pehle se account hai? ' : 'Account nahi hai? '}
          <button onClick={() => setIsRegister(!isRegister)} className="font-semibold text-primary hover:underline">
            {isRegister ? 'Sign In' : 'Register Here'}
          </button>
        </div>
      </div>
    </div>
  );
}

// MAIN WORKSPACE
function Workspace() {
  const { user, signOut } = useAuth();
  const [dark, setDark] = useState(() => readStore('nexa_dark', false));
  const [products] = useState<Product[]>(() => readStore('nexa_products', mockProducts));
  const [expenses] = useState<Expense[]>(() => readStore('nexa_expenses', mockExpenses));
  const [sales] = useState<Sale[]>(() => readStore('nexa_sales', makeSeedSales(mockProducts, mockCustomers)));
  const [, setLocation] = useLocation();

  useEffect(() => { document.documentElement.classList.toggle('dark', dark); writeStore('nexa_dark', dark); }, [dark]);

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground">
        <div className="mb-8 flex items-center gap-2">
          <Logo />
          <span className="font-display text-lg font-bold">Nexa ERP</span>
        </div>
        <nav className="space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 text-[10px] font-bold uppercase text-sidebar-foreground/50">{group.label}</p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setLocation(item.path)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold hover:bg-sidebar-accent"
                  >
                    <item.icon size={16} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Welcome back, {user.user_metadata?.full_name || user.email}</h2>
            <p className="text-xs text-muted-foreground">App Dashboard and POS</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setDark(!dark)} className="icon-button">
              {dark ? '☀️' : '🌙'}
            </button>
            <button onClick={() => signOut()} className="button-secondary">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </header>

        <Reports expenses={expenses} products={products} sales={sales} />
      </main>
    </div>
  );
}

function Reports({ expenses, products, sales }: { expenses: Expense[]; products: Product[]; sales: Sale[] }) {
  const [fromDate, setFromDate] = useState(daysAgo(30));
  const [toDate, setToDate] = useState(dateToday());
  const [tab, setTab] = useState<'daily' | 'products' | 'stock'>('daily');

  const filteredSales = useMemo(() => sales.filter((sale) => sale.date >= fromDate && sale.date <= toDate), [fromDate, sales, toDate]);
  const filteredExpenses = expenses.filter((expense) => expense.date >= fromDate && expense.date <= toDate);
  const grossSales = filteredSales.reduce((sum, sale) => sum + sale.grandTotal, 0);
  const grossProfit = filteredSales.reduce((sum, sale) => sum + sale.profit, 0);
  const expenseTotal = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const reportRows = products.map((item) => [item.name, item.sku, item.quantity, item.price, item.cost * item.quantity]);

  return (
    <PageHeader eyebrow="Make better calls" title="Reports" description="Sales, Profit aur Inventory ki exact summary." actions={<ExportActions filename="nexa-report" headers={['Product', 'SKU', 'Stock', 'Price', 'Value']} rows={reportRows} />}>
      <section className="card-surface mb-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <p className="mb-2 text-xs font-semibold">Report period</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="From"><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></Field>
              <Field label="To"><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></Field>
            </div>
          </div>
          <div className="rounded-lg bg-muted/45 p-3 text-xs text-muted-foreground">
            <CalendarDays size={15} className="mb-1 text-primary" />{filteredSales.length} bills generated
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Gross sales" value={money(grossSales)} note={`${filteredSales.length} bills in selected period`} trend="up" icon={TrendingUp} />
        <MetricCard label="Gross profit" value={money(grossProfit)} note="Sales minus product cost" trend="up" icon={BarChart3} tone="gold" />
        <MetricCard label="Net profit" value={money(grossProfit - expenseTotal)} note={`${money(expenseTotal)} expenses deducted`} trend={grossProfit - expenseTotal >= 0 ? 'up' : 'down'} icon={IndianRupee} tone="ink" />
        <MetricCard label="Stock value" value={money(products.reduce((sum, item) => sum + item.cost * item.quantity, 0))} note="Total stock at cost" trend="neutral" icon={Boxes} tone="coral" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => setTab('daily')} className={tab === 'daily' ? 'button-primary' : 'button-secondary'}><CalendarDays size={14} /> Day-wise sales</button>
        <button onClick={() => setTab('products')} className={tab === 'products' ? 'button-primary' : 'button-secondary'}><BarChart3 size={14} /> Product profit</button>
        <button onClick={() => setTab('stock')} className={tab === 'stock' ? 'button-primary' : 'button-secondary'}><Boxes size={14} /> Remaining stock</button>
      </div>
    </PageHeader>
  );
}

function ExportActions({ filename, headers, rows }: { filename: string; headers: string[]; rows: (string | number)[][] }) {
  const [format, setFormat] = useState<ExportFormat>('excel');
  return (
    <div className="flex items-center gap-1">
      <select value={format} onChange={(event) => setFormat(event.target.value as ExportFormat)} className="w-auto text-[11px]">
        <option value="excel">Excel / CSV</option>
        <option value="txt">TXT</option>
      </select>
      <button onClick={() => downloadDataset(filename, headers, rows, format)} className="button-secondary">
        <Download size={14} /> Download
      </button>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, actions, children }: { eyebrow: string; title: string; description: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="animate-nexa-in">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-primary">{eyebrow}</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

function MetricCard({ label, value, note, trend, icon: Icon, tone = 'primary' }: { label: string; value: string; note: string; trend: 'up' | 'down' | 'neutral'; icon: typeof IndianRupee; tone?: 'primary' | 'coral' | 'gold' | 'ink' }) {
  const color = tone === 'coral' ? 'bg-accent/12 text-accent' : tone === 'gold' ? 'bg-[#e9bd55]/20 text-[#9a6b15]' : tone === 'ink' ? 'bg-foreground/8 text-foreground' : 'bg-primary/10 text-primary';
  return (
    <div className="card-surface">
      <div className="flex items-start justify-between">
        <span className={`rounded-lg p-2.5 ${color}`}><Icon size={17} /></span>
        <span className={`flex items-center gap-1 text-[10px] font-bold ${trend === 'up' ? 'text-primary' : trend === 'down' ? 'text-accent' : 'text-muted-foreground'}`}>
          {trend === 'up' && <ArrowUpRight size={13} />}
          {trend === 'down' && <ArrowDownRight size={13} />}
          {trend === 'up' ? 'Good' : trend === 'down' ? 'Follow up' : 'Tracking'}
        </span>
      </div>
      <p className="mt-5 text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-[11px] text-muted-foreground">{note}</p>
    </div>
  );
}

function Logo() { return <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-display font-bold">N</span>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="mb-1.5 block text-xs font-semibold">{label}</span>{children}</label>; }

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Switch>
            <Route path="*">
              <ErrorBoundary><Workspace /></ErrorBoundary>
            </Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
  
