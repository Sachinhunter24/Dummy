import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import {
  ArrowDownRight, ArrowUpRight, BarChart3, Bell, Boxes, BriefcaseBusiness, CalendarDays, Check,
  CheckCircle2, ChevronRight, CircleAlert, CreditCard, Download, Eye, FileBarChart, FileSpreadsheet,
  FileText, Filter, IndianRupee, LayoutDashboard, LogOut, Menu, MoreHorizontal, Moon, Package,
  Plus, Printer, Receipt, Search, ShieldCheck, ShoppingCart, Sun, Trash2, TrendingUp, Upload,
  UserPlus, Users, Wallet, X,
} from 'lucide-react';
import { Link, Route, Switch, useLocation } from 'wouter';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/error-boundary';
import {
  mockCustomers, mockExpenses, mockNotifications, mockProducts, mockStaff, mockUdhaarAccounts,
} from '@/legacy/data/mockData';
import type {
  AppNotification, Customer, Expense, Product, StaffMember, UdhaarAccount, UdhaarEntry,
} from '@/legacy/types/erp';

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
    return item ? JSON.parse(item) as T : fallback;
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
    { id: 'reports', label: 'Reports', icon: FileBarChart, path: '/reports' },
  ] },
];

function makeSeedSales(products: Product[], customers: Customer[]): Sale[] {
  const plans = [[0, 1], [1, 3], [2, 0], [4, 7], [5, 8], [6, 10], [8, 12]];
  return plans.map((indexes, day) => {
    const items = indexes.map((productIndex, position) => {
      const product = products[productIndex % products.length];
      const qty = (day + position) % 3 + 1;
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

function normaliseHeader(value: string) {
  return value.toLowerCase().replace(/[\s_-]+/g, '').replace(/[^\w]/g, '');
}

function parseNumber(value: unknown) {
  const parsed = Number(String(value ?? '').replace(/[₹,\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function splitDelimitedLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function parseDelimited(text: string): string[][] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  return lines.map((line) => splitDelimitedLine(line, delimiter));
}

function zipText(entries: { name: string; data: string }[]) {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const directory: Uint8Array[] = [];
  let offset = 0;
  const u16 = (value: number) => {
    const bytes = new Uint8Array(2);
    new DataView(bytes.buffer).setUint16(0, value, true);
    return bytes;
  };
  const u32 = (value: number) => {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value >>> 0, true);
    return bytes;
  };
  const join = (parts: Uint8Array[]) => {
    const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
    let cursor = 0;
    parts.forEach((part) => { result.set(part, cursor); cursor += part.length; });
    return result;
  };
  const crc32 = (bytes: Uint8Array) => {
    let crc = 0 ^ -1;
    for (const byte of bytes) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
    }
    return (crc ^ -1) >>> 0;
  };
  entries.forEach((entry) => {
    const name = encoder.encode(entry.name);
    const data = encoder.encode(entry.data);
    const local = join([u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc32(data)), u32(data.length), u32(data.length), u16(name.length), u16(0), name, data]);
    chunks.push(local);
    const central = join([u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc32(data)), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name]);
    directory.push(central);
    offset += local.length;
  });
  const centralBytes = join(directory);
  const end = join([u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length), u32(centralBytes.length), u32(offset), u16(0)]);
  const blobParts = [...chunks, centralBytes, end].map((part) => part.buffer.slice(part.byteOffset, part.byteOffset + part.byteLength) as ArrayBuffer);
  return new Blob(blobParts, { type: 'application/zip' });
}

async function parseXlsx(file: File): Promise<string[][]> {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let eocd = -1;
  for (let index = bytes.length - 22; index >= Math.max(0, bytes.length - 65557); index -= 1) {
    if (view.getUint32(index, true) === 0x06054b50) { eocd = index; break; }
  }
  if (eocd < 0) throw new Error('This Excel file could not be opened.');
  const entries: { name: string; compression: number; compressedSize: number; localOffset: number }[] = [];
  const decoder = new TextDecoder();
  const entryCount = view.getUint16(eocd + 10, true);
  let cursor = view.getUint32(eocd + 16, true);
  for (let index = 0; index < entryCount; index += 1) {
    if (view.getUint32(cursor, true) !== 0x02014b50) break;
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    entries.push({
      name: decoder.decode(bytes.slice(cursor + 46, cursor + 46 + nameLength)),
      compression: view.getUint16(cursor + 10, true),
      compressedSize: view.getUint32(cursor + 20, true),
      localOffset: view.getUint32(cursor + 42, true),
    });
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  const readEntry = async (name: string) => {
    const entry = entries.find((item) => item.name === name);
    if (!entry) return '';
    const local = entry.localOffset;
    const nameLength = view.getUint16(local + 26, true);
    const extraLength = view.getUint16(local + 28, true);
    const content = bytes.slice(local + 30 + nameLength + extraLength, local + 30 + nameLength + extraLength + entry.compressedSize);
    if (entry.compression === 0) return decoder.decode(content);
    if (entry.compression !== 8) throw new Error('This Excel compression format is not supported.');
    const stream = new Blob([content]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return decoder.decode(await new Response(stream).arrayBuffer());
  };
  const stringsXml = await readEntry('xl/sharedStrings.xml');
  const sheetName = entries.find((entry) => /^xl\/worksheets\/sheet\d+\.xml$/.test(entry.name))?.name;
  const sheetXml = sheetName ? await readEntry(sheetName) : '';
  if (!sheetXml) throw new Error('No worksheet was found in this Excel file.');
  const sharedDocument = stringsXml ? new DOMParser().parseFromString(stringsXml, 'application/xml') : null;
  const sharedStrings = sharedDocument ? Array.from(sharedDocument.querySelectorAll('si')).map((item) => Array.from(item.querySelectorAll('t')).map((text) => text.textContent || '').join('')) : [];
  const sheetDocument = new DOMParser().parseFromString(sheetXml, 'application/xml');
  const columnIndex = (reference: string | null, fallback: number) => {
    const letters = reference?.match(/[A-Z]+/i)?.[0]?.toUpperCase();
    if (!letters) return fallback;
    return letters.split('').reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;
  };
  return Array.from(sheetDocument.querySelectorAll('sheetData > row')).map((row) => {
    const output: string[] = [];
    Array.from(row.querySelectorAll(':scope > c')).forEach((cell, index) => {
      const type = cell.getAttribute('t');
      const value = cell.querySelector('v')?.textContent || '';
      const inline = Array.from(cell.querySelectorAll('is t')).map((text) => text.textContent || '').join('');
      const parsed = type === 's' ? (sharedStrings[Number(value)] || '') : type === 'inlineStr' ? inline : value;
      output[columnIndex(cell.getAttribute('r'), index)] = parsed;
    });
    return output.map((value) => value || '');
  });
}

async function readSpreadsheet(file: File) {
  return /\.(xlsx|xls)$/i.test(file.name) ? parseXlsx(file) : parseDelimited(await file.text());
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
  if (format === 'zip') {
    downloadBlob(`${filename}.zip`, zipText([
      { name: `${filename}.csv`, data: csv },
      { name: 'README.txt', data: 'This folder contains an Excel-compatible CSV export from Nexa ERP. Open the CSV in Excel or Google Sheets.' },
    ]));
  } else {
    downloadBlob(`${filename}.${format === 'excel' ? 'csv' : 'txt'}`, new Blob([csv], { type: format === 'excel' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8' }));
  }
}

function inventoryRows(rows: string[][]) {
  if (rows.length < 2) return [];
  const headers = rows[0].map(normaliseHeader);
  const indexOf = (...names: string[]) => names.map(normaliseHeader).map((name) => headers.indexOf(name)).find((index) => index >= 0) ?? -1;
  const nameIndex = indexOf('name', 'product', 'productname', 'item', 'itemname');
  const skuIndex = indexOf('sku', 'code', 'productcode', 'barcode');
  const categoryIndex = indexOf('category', 'group', 'department');
  const priceIndex = indexOf('price', 'sellingprice', 'sellprice', 'rate', 'mrp');
  const costIndex = indexOf('cost', 'costprice', 'purchaseprice');
  const quantityIndex = indexOf('quantity', 'qty', 'stock', 'openingstock', 'available');
  const unitIndex = indexOf('unit', 'uom');
  const rackIndex = indexOf('rack', 'shelf', 'location');
  return rows.slice(1).map((row, rowIndex) => ({
    id: uid(`import_${rowIndex}`),
    name: row[nameIndex >= 0 ? nameIndex : 0]?.trim() || '',
    sku: row[skuIndex]?.trim() || `IMP${Date.now().toString().slice(-5)}${rowIndex}`,
    category: row[categoryIndex]?.trim() || 'Imported',
    price: parseNumber(row[priceIndex]),
    cost: parseNumber(row[costIndex]) || parseNumber(row[priceIndex]),
    quantity: parseNumber(row[quantityIndex]),
    unit: row[unitIndex]?.trim() || 'piece',
    rack: row[rackIndex]?.trim() || 'Imported',
  })).filter((item) => item.name);
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Switch>
          <Route path="*">
            <ErrorBoundary><Workspace /></ErrorBoundary>
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
  const [expenses, setExpenses] = useState<Expense[]>(() => readStore('nexa_expenses', mockExpenses));
  const [udhaar, setUdhaar] = useState<UdhaarAccount[]>(() => readStore('nexa_udhaar', mockUdhaarAccounts));
  const [sales, setSales] = useState<Sale[]>(() => readStore('nexa_sales', makeSeedSales(mockProducts, mockCustomers)));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => readStore('nexa_notifications', mockNotifications));
  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([]);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [flash, setFlash] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useLocation();

  useEffect(() => { document.documentElement.classList.toggle('dark', dark); writeStore('nexa_dark', dark); }, [dark]);
  useEffect(() => writeStore('nexa_products', products), [products]);
  useEffect(() => writeStore('nexa_customers', customers), [customers]);
  useEffect(() => writeStore('nexa_staff', staff), [staff]);
  useEffect(() => writeStore('nexa_expenses', expenses), [expenses]);
  useEffect(() => writeStore('nexa_udhaar', udhaar), [udhaar]);
  useEffect(() => writeStore('nexa_sales', sales), [sales]);
  useEffect(() => writeStore('nexa_notifications', notifications), [notifications]);
  useEffect(() => { if (!flash) return; const timer = window.setTimeout(() => setFlash(''), 2800); return () => window.clearTimeout(timer); }, [flash]);

  const rawActive = location.split('/')[1] || 'overview';
  const active = (navGroups.flatMap((group) => group.items).some((item) => item.id === rawActive) ? rawActive : 'overview') as ModuleId;
  const go = (path: string) => { setLocation(path); setSidebarOpen(false); setSearch(''); };
  const unread = notifications.filter((notification) => !notification.read).length;
  const notify = (next: Omit<AppNotification, 'id' | 'time' | 'read'>) => {
    setNotifications((current) => [{ ...next, id: uid('n'), time: 'Just now', read: false }, ...current].slice(0, 20));
  };
  const addProduct = (form: Record<string, string>) => {
    setProducts((current) => [{ id: uid('p'), name: form.name, sku: form.sku || `SKU${Date.now().toString().slice(-4)}`, price: Number(form.price), cost: Number(form.cost || form.price), quantity: Number(form.quantity), category: form.category || 'General', rack: form.rack || 'New', unit: form.unit || 'piece' }, ...current]);
    setModal(null); setFlash('Product added to your catalogue');
  };
  const addExpense = (form: Record<string, string>) => {
    setExpenses((current) => [{ id: uid('e'), date: form.date || dateToday(), category: form.category, amount: Number(form.amount), description: form.description, paidBy: form.paidBy || session?.name || 'Owner' }, ...current]);
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
  const handleCheckout = (payment: SalePayment, customerId?: string, customerName?: string) => {
    if (!cart.length) return null;
    const items = cart.map(({ product, qty }) => ({ productId: product.id, name: product.name, qty, price: product.price, cost: product.cost, total: product.price * qty, profit: (product.price - product.cost) * qty }));
    const total = items.reduce((sum, item) => sum + item.total, 0);
    const sale: Sale = { id: uid('bill'), date: dateToday(), time: timeNow(), customerId, customerName: customerName || 'Walk-in customer', payment, items, subtotal: total, grandTotal: total, profit: items.reduce((sum, item) => sum + item.profit, 0) };
    setSales((current) => [sale, ...current]);
    setProducts((current) => current.map((product) => {
      const item = cart.find((entry) => entry.product.id === product.id);
      return item ? { ...product, quantity: Math.max(0, product.quantity - item.qty) } : product;
    }));
    if (customerId) {
      setCustomers((current) => current.map((customer) => customer.id === customerId ? { ...customer, totalPurchases: customer.totalPurchases + total, balance: payment === 'Udhaar' ? customer.balance - total : customer.balance, lastContact: dateToday() } : customer));
      if (payment === 'Udhaar') {
        setUdhaar((current) => {
          const entry: UdhaarEntry = { id: uid('u'), customerId, customerName: customerName || 'Customer', phone: current.find((account) => account.customerId === customerId)?.phone || '', date: dateToday(), amount: total, type: 'credit', note: `Bill ${sale.id.slice(-6)} on credit` };
          const existing = current.find((account) => account.customerId === customerId);
          return existing ? current.map((account) => account.customerId === customerId ? { ...account, balance: account.balance + total, lastTransaction: dateToday(), entries: [entry, ...account.entries] } : account) : [...current, { customerId, customerName: customerName || 'Customer', phone: entry.phone, balance: total, lastTransaction: dateToday(), entries: [entry] }];
        });
      }
    }
    setCart([]); setLastSale(sale); setFlash(`Bill ${sale.id.slice(-6)} saved · stock updated through billing`);
    notify({ title: 'Bill created', message: `${money(total)} sale recorded via ${payment}`, type: 'success' });
    return sale;
  };
  const recordPayment = (account: UdhaarAccount, amount: number) => {
    const entry: UdhaarEntry = { id: uid('u'), customerId: account.customerId, customerName: account.customerName, phone: account.phone, date: dateToday(), amount, type: 'payment', note: 'Payment received' };
    setUdhaar((current) => current.map((item) => item.customerId === account.customerId ? { ...item, balance: Math.max(0, item.balance - amount), lastTransaction: dateToday(), entries: [entry, ...item.entries] } : item));
    setCustomers((current) => current.map((customer) => customer.id === account.customerId ? { ...customer, balance: Math.min(0, customer.balance + amount) } : customer));
    setFlash(`${money(amount)} payment added for ${account.customerName}`);
    notify({ title: 'Payment received', message: `${account.customerName} paid ${money(amount)}`, type: 'success' });
  };
  const importInventory = async (file: File) => {
    try {
      const imported = inventoryRows(await readSpreadsheet(file));
      if (!imported.length) throw new Error('No product rows found. Use headers like name, sku, price and quantity.');
      setProducts((current) => {
        const next = [...current];
        imported.forEach((item) => {
          const matchIndex = next.findIndex((product) => product.sku.toLowerCase() === item.sku.toLowerCase());
          if (matchIndex >= 0) next[matchIndex] = { ...next[matchIndex], ...item, id: next[matchIndex].id };
          else next.unshift(item);
        });
        return next;
      });
      setFlash(`${imported.length} products imported and stock updated`);
      notify({ title: 'Inventory imported', message: `${imported.length} product rows were read from ${file.name}`, type: 'info' });
    } catch (error) {
      setFlash(error instanceof Error ? error.message : 'Could not read this file');
    }
  };
  const deleteProduct = (id: string) => {
    if (!window.confirm('Delete this product from inventory?')) return;
    setProducts((current) => current.filter((item) => item.id !== id));
    setFlash('Product removed');
  };
  const printSale = (sale: Sale) => {
    setLastSale(sale);
    window.setTimeout(() => window.print(), 100);
  };
  if (!session) return <Login onLogin={(next) => { setSession(next); writeStore('nexa_session', next); }} />;

  return (
    <div className="nexa-noise min-h-[100dvh] bg-background text-foreground">
      <div className="flex min-h-[100dvh]">
        <Sidebar active={active} open={sidebarOpen} onClose={() => setSidebarOpen(false)} session={session} onLogout={() => { setSession(null); localStorage.removeItem('nexa_session'); }} />
        <main className="min-w-0 flex-1 lg:pl-[248px]">
          <Topbar active={active} search={search} onSearch={setSearch} notifications={notifications} onReadAll={() => setNotifications((current) => current.map((item) => ({ ...item, read: true })))} dark={dark} onTheme={() => setDark((value) => !value)} onMenu={() => setSidebarOpen(true)} />
          <div className="mx-auto max-w-[1560px] px-4 pb-12 pt-5 sm:px-6 lg:px-9">
            {active === 'overview' && <Dashboard products={products} customers={customers} expenses={expenses} udhaar={udhaar} sales={sales} go={go} />}
            {active === 'pos' && <POS products={products} customers={customers} cart={cart} setCart={setCart} onCheckout={handleCheckout} sales={sales} lastSale={lastSale} onPrint={printSale} />}
            {active === 'inventory' && <Inventory products={products} search={search} setSearch={setSearch} onAdd={() => setModal('product')} onDelete={deleteProduct} onAddStock={(id) => { setProducts((current) => current.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item)); setFlash('Stock added. Billing remains the only stock-out action.'); }} onImport={importInventory} />}
            {active === 'udhaar' && <Udhaar accounts={udhaar} sales={sales} onPayment={recordPayment} />}
            {active === 'expenses' && <Expenses expenses={expenses} onAdd={() => setModal('expense')} />}
            {active === 'clients' && <Clients customers={customers} sales={sales} onAdd={() => setModal('client')} onFlash={setFlash} />}
            {active === 'staff' && <Staff staff={staff} onAdd={() => setModal('staff')} onToggle={(id) => setStaff((current) => current.map((item) => item.id === id ? { ...item, status: item.status === 'active' ? 'blocked' : 'active' } : item))} />}
            {active === 'reports' && <Reports expenses={expenses} products={products} sales={sales} />}
          </div>
        </main>
      </div>
      {modal && <EntryModal kind={modal} onClose={() => setModal(null)} onSubmit={modal === 'product' ? addProduct : modal === 'expense' ? addExpense : modal === 'client' ? addClient : addStaff} />}
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
  return <div className="surface-grid flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#103c35] px-4 py-8"><div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-[#e9bd55]/20 blur-3xl" /><div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-[#e97752]/25 blur-3xl" /><div className="relative grid w-full max-w-5xl overflow-hidden rounded-[1.6rem] border border-white/15 bg-[#f8f1e4] shadow-2xl lg:grid-cols-[1.05fr_.95fr]"><div className="hidden flex-col justify-between bg-[#103c35] p-10 text-[#f8f1e4] lg:flex"><div><div className="mb-14 flex items-center gap-3"><Logo inverted /><span className="font-display text-xl font-semibold tracking-tight">nexa</span></div><p className="max-w-sm font-display text-5xl font-semibold leading-[1.04]">Run the shop.<br /><span className="text-[#e9bd55]">Keep your head clear.</span></p><p className="mt-6 max-w-sm text-sm leading-6 text-white/65">A calm daily command centre for sales, stock, people and the little details that keep Indian businesses moving.</p></div><div className="flex items-center gap-3 text-xs text-white/55"><ShieldCheck size={16} /> Your demo workspace stays in this browser.</div></div><div className="p-7 sm:p-10 lg:p-12"><div className="mb-10 lg:hidden"><Logo /></div><div className="mb-8"><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-primary">Welcome back</p><h1 className="font-display text-3xl font-semibold tracking-tight text-[#103c35]">Good to see you.</h1><p className="mt-2 text-sm text-slate-500">Sign in to pick up where your business left off.</p></div><form onSubmit={submit} className="space-y-5"><Field label="Username"><input autoComplete="username" data-testid="input-login-username" value={username} onChange={(event) => setUsername(event.target.value)} /></Field><Field label="Password"><input autoComplete="current-password" data-testid="input-login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></Field>{error && <p data-testid="status-login-error" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}<button data-testid="button-login" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#103c35] font-semibold text-[#f8f1e4] transition hover:bg-[#195c4f]">Enter workspace <ChevronRight size={17} /></button></form><div className="mt-8 rounded-xl border border-[#dcd2c2] bg-[#efe6d7] p-4"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#62736d]">Demo account</p><div className="mt-2 flex items-center justify-between text-sm"><span className="font-semibold text-[#103c35]">owner</span><span className="font-mono text-xs text-[#62736d]">owner123</span></div></div><p className="mt-8 text-center text-xs text-slate-400">Local demo · no account or server required</p></div></div></div>;
}

function Sidebar({ active, open, onClose, session, onLogout }: { active: ModuleId; open: boolean; onClose: () => void; session: { name: string; username: string; business: string }; onLogout: () => void }) {
  return <aside className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}><div className="flex h-[76px] items-center justify-between border-b border-sidebar-border px-6"><Link href="/" className="flex items-center gap-3" onClick={onClose}><Logo inverted /><span className="font-display text-xl font-semibold tracking-tight">nexa</span></Link><button data-testid="button-close-sidebar" onClick={onClose} className="rounded-lg p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent lg:hidden"><X size={18} /></button></div><div className="border-b border-sidebar-border px-5 py-5"><p className="mb-1 text-[10px] font-bold uppercase tracking-[.18em] text-sidebar-foreground/45">Your workspace</p><p className="truncate text-sm font-semibold">{session.business}</p><div className="mt-3 flex items-center gap-2 text-[11px] text-sidebar-foreground/55"><span className="h-2 w-2 rounded-full bg-[#e9bd55]" /> Local demo mode</div></div><nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-5">{navGroups.map((group) => <div key={group.label} className="mb-6"><p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-sidebar-foreground/38">{group.label}</p>{group.items.map((item) => { const Icon = item.icon; const selected = active === item.id; return <Link key={item.id} href={item.path} onClick={onClose} data-testid={`link-nav-${item.id}`} className={`group mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${selected ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm' : 'text-sidebar-foreground/67 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}><Icon size={17} strokeWidth={selected ? 2.4 : 1.8} /><span>{item.label}</span>{item.id === 'udhaar' && <span className={`ml-auto rounded px-1.5 py-0.5 text-[10px] ${selected ? 'bg-sidebar-primary-foreground/15' : 'bg-sidebar-accent text-sidebar-foreground/50'}`}>credit</span>}</Link>; })}</div>)}</nav><div className="border-t border-sidebar-border p-3"><div className="flex items-center gap-3 rounded-lg px-3 py-2.5"><Avatar name={session.name} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{session.name}</p><p className="text-[10px] text-sidebar-foreground/45">Owner access</p></div><button data-testid="button-logout" onClick={onLogout} title="Sign out" className="text-sidebar-foreground/45 hover:text-sidebar-foreground"><LogOut size={16} /></button></div></div></aside>;
}

function Topbar({ active, search, onSearch, notifications, onReadAll, dark, onTheme, onMenu }: { active: ModuleId; search: string; onSearch: (value: string) => void; notifications: AppNotification[]; onReadAll: () => void; dark: boolean; onTheme: () => void; onMenu: () => void }) {
  const [open, setOpen] = useState(false);
  const label = navGroups.flatMap((group) => group.items).find((item) => item.id === active)?.label || 'Overview';
  const unread = notifications.filter((item) => !item.read).length;
  return <header className="sticky top-0 z-30 flex h-[76px] items-center gap-3 border-b border-border/80 bg-background/90 px-4 backdrop-blur-md sm:px-6 lg:px-9"><button data-testid="button-open-sidebar" onClick={onMenu} className="rounded-lg p-2 hover:bg-muted lg:hidden"><Menu size={20} /></button><div className="min-w-0 flex-1"><p className="text-[11px] font-medium text-muted-foreground">Shree Business Hub /</p><h1 className="truncate font-display text-lg font-semibold tracking-tight">{label}</h1></div><div className="hidden w-full max-w-xs items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:flex"><Search size={16} className="text-muted-foreground" /><input data-testid="input-global-search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search anything..." className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/70" /></div><button data-testid="button-theme" onClick={onTheme} className="rounded-lg border border-border bg-card p-2.5 text-muted-foreground hover:text-foreground">{dark ? <Sun size={17} /> : <Moon size={17} />}</button><div className="relative"><button data-testid="button-notifications" onClick={() => setOpen((value) => !value)} className="relative rounded-lg border border-border bg-card p-2.5 text-muted-foreground hover:text-foreground"><Bell size={17} />{unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground">{unread}</span>}</button>{open && <div className="absolute right-0 top-12 z-50 w-[330px] rounded-xl border border-border bg-card p-3 shadow-2xl"><div className="flex items-center justify-between border-b border-border pb-3"><div><p className="text-sm font-semibold">Notifications</p><p className="text-[11px] text-muted-foreground">{unread} unread updates</p></div><button onClick={onReadAll} className="text-[11px] font-semibold text-primary hover:underline">Mark all read</button></div><div className="scrollbar-thin max-h-[360px] overflow-y-auto pt-2">{notifications.length ? notifications.map((item) => <div key={item.id} className={`flex gap-3 rounded-lg p-3 ${item.read ? '' : 'bg-primary/5'}`}><span className={`mt-0.5 rounded-md p-1.5 ${item.type === 'warning' || item.type === 'error' ? 'bg-accent/12 text-accent' : 'bg-primary/10 text-primary'}`}>{item.type === 'warning' || item.type === 'error' ? <CircleAlert size={14} /> : <CheckCircle2 size={14} />}</span><div className="min-w-0"><p className="text-xs font-semibold">{item.title}</p><p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{item.message}</p><p className="mt-1 text-[10px] text-muted-foreground/70">{item.time}</p></div></div>) : <EmptyState icon={Bell} title="All caught up" detail="New bills, payments, stock and expiry alerts will appear here." />}</div></div>}</div></header>;
}

function Dashboard({ products, customers, expenses, udhaar, sales, go }: { products: Product[]; customers: Customer[]; expenses: Expense[]; udhaar: UdhaarAccount[]; sales: Sale[]; go: (path: string) => void }) {
  const lowStock = products.filter((item) => item.quantity < 15);
  const totalDue = udhaar.reduce((sum, item) => sum + item.balance, 0);
  const currentSales = sales.filter((item) => item.date >= daysAgo(7)).reduce((sum, item) => sum + item.grandTotal, 0);
  const recentDays = Array.from({ length: 7 }, (_, index) => daysAgo(6 - index));
  return <PageHeader eyebrow={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} title="Good morning, Sachin." description="Here is the pulse of your business today." actions={<button data-testid="button-dashboard-pos" onClick={() => go('/pos')} className="button-primary"><ShoppingCart size={16} /> New sale</button>}><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Sales this week" value={money(currentSales)} note={`${sales.filter((item) => item.date >= daysAgo(7)).length} bills saved`} trend="up" icon={IndianRupee} /><MetricCard label="Outstanding udhaar" value={money(totalDue)} note={`${udhaar.filter((item) => item.balance > 0).length} customers to follow up`} trend="down" icon={CreditCard} tone="coral" /><MetricCard label="Items in stock" value={products.reduce((sum, item) => sum + item.quantity, 0).toLocaleString('en-IN')} note={`${lowStock.length} need attention`} trend="neutral" icon={Package} tone="gold" /><MetricCard label="Operating expenses" value={money(expenses.reduce((sum, item) => sum + item.amount, 0))} note={`${expenses.length} entries tracked`} trend="neutral" icon={Wallet} tone="ink" /></div><div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]"><section className="card-surface min-h-[330px]"><SectionHeading title="Cash flow" detail="Last 7 days" action={<button data-testid="button-view-reports" onClick={() => go('/reports')} className="text-xs font-bold text-primary">Open deep reports <ChevronRight className="inline" size={14} /></button>} /><div className="mt-7 flex h-[215px] items-end gap-2 sm:gap-4">{recentDays.map((date) => { const value = sales.filter((sale) => sale.date === date).reduce((sum, sale) => sum + sale.grandTotal, 0); const height = currentSales ? Math.max(7, (value / Math.max(currentSales / 2, 1)) * 100) : 7; return <div key={date} className="group flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="relative flex h-full w-full items-end justify-center"><div className="w-[55%] rounded-t-md bg-primary/80 transition-all group-hover:bg-primary" style={{ height: `${Math.min(100, height)}%` }} /><div className="pointer-events-none absolute -top-1 hidden rounded-md bg-foreground px-2 py-1 text-[10px] text-background group-hover:block">{money(value)}</div></div><span className="text-[10px] font-medium text-muted-foreground">{new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'short' })}</span></div>; })}</div><div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-primary" /> Sales are calculated from saved bills</div></section><section className="card-surface"><SectionHeading title="Needs your eye" detail="Actionable today" /><div className="mt-5 space-y-2.5">{lowStock.slice(0, 3).map((item) => <button data-testid={`button-low-stock-${item.id}`} key={item.id} onClick={() => go('/inventory')} className="flex w-full items-center gap-3 rounded-lg border border-border bg-muted/45 p-3 text-left transition hover:border-primary/40 hover:bg-muted"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent"><Package size={16} /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{item.name}</span><span className="text-[11px] text-muted-foreground">{item.quantity} {item.unit}s left · {item.rack}</span></span><ChevronRight size={15} className="text-muted-foreground" /></button>)}<button data-testid="button-open-udhaar" onClick={() => go('/udhaar')} className="flex w-full items-center gap-3 rounded-lg border border-border bg-muted/45 p-3 text-left transition hover:border-primary/40 hover:bg-muted"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><CreditCard size={16} /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold">Udhaar follow-ups</span><span className="text-[11px] text-muted-foreground">{money(totalDue)} due from regulars</span></span><ChevronRight size={15} className="text-muted-foreground" /></button><button data-testid="button-open-billing-history" onClick={() => go('/pos')} className="flex w-full items-center gap-3 rounded-lg border border-border bg-muted/45 p-3 text-left transition hover:border-primary/40 hover:bg-muted"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e9bd55]/20 text-[#9a6b15]"><Receipt size={16} /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold">Billing history is ready</span><span className="text-[11px] text-muted-foreground">{sales.length} date-wise bills available</span></span><ChevronRight size={15} className="text-muted-foreground" /></button></div></section></div><div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><section className="card-surface"><SectionHeading title="Top customers" detail="By lifetime value" action={<button data-testid="button-view-clients" onClick={() => go('/clients')} className="text-xs font-bold text-primary">View all</button>} /><div className="mt-4 overflow-x-auto"><table className="data-table"><thead><tr><th>Customer</th><th>Last visit</th><th className="text-right">Lifetime</th></tr></thead><tbody>{customers.slice().sort((a, b) => b.totalPurchases - a.totalPurchases).slice(0, 4).map((customer) => <tr key={customer.id}><td><div className="flex items-center gap-2.5"><Avatar name={customer.name} small /><span className="font-semibold">{customer.name}</span></div></td><td className="text-muted-foreground">{customer.lastContact}</td><td className="text-right font-display font-semibold">{money(customer.totalPurchases)}</td></tr>)}</tbody></table></div></section><section className="card-surface"><SectionHeading title="Quick start" detail="Make today lighter" /><div className="mt-4 grid grid-cols-2 gap-2">{[{ label: 'Record sale', icon: Receipt, path: '/pos' }, { label: 'Add stock', icon: Package, path: '/inventory' }, { label: 'Log expense', icon: Wallet, path: '/expenses' }, { label: 'Add client', icon: UserPlus, path: '/clients' }].map((item) => { const Icon = item.icon; return <button data-testid={`button-quick-${item.label.replace(' ', '-').toLowerCase()}`} key={item.label} onClick={() => go(item.path)} className="flex flex-col items-start gap-3 rounded-xl border border-border bg-muted/30 p-3.5 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card"><span className="rounded-lg bg-primary/10 p-2 text-primary"><Icon size={16} /></span><span className="text-xs font-semibold">{item.label}</span></button>; })}</div></section></div></PageHeader>;
}

function POS({ products, customers, cart, setCart, onCheckout, sales, lastSale, onPrint }: { products: Product[]; customers: Customer[]; cart: { product: Product; qty: number }[]; setCart: (value: { product: Product; qty: number }[]) => void; onCheckout: (payment: SalePayment, customerId?: string, customerName?: string) => Sale | null; sales: Sale[]; lastSale: Sale | null; onPrint: (sale: Sale) => void }) {
  const [query, setQuery] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [fromDate, setFromDate] = useState(daysAgo(30));
  const [toDate, setToDate] = useState(dateToday());
  const [historyOpen, setHistoryOpen] = useState(true);
  const printedId = useRef('');
  useEffect(() => { if (lastSale && printedId.current !== lastSale.id) { printedId.current = lastSale.id; window.setTimeout(() => window.print(), 150); } }, [lastSale]);
  const filtered = products.filter((item) => `${item.name} ${item.sku} ${item.category}`.toLowerCase().includes(query.toLowerCase())).slice(0, 12);
  const total = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const history = sales.filter((sale) => sale.date >= fromDate && sale.date <= toDate);
  const add = (product: Product) => setCart(cart.some((item) => item.product.id === product.id) ? cart.map((item) => item.product.id === product.id ? { ...item, qty: Math.min(product.quantity, item.qty + 1) } : item) : [...cart, { product, qty: 1 }]);
  return <PageHeader eyebrow="Point of sale" title="Make a sale" description="Every completed bill reduces stock, creates a history row, and updates reports." actions={<div className="flex items-center gap-2"><button data-testid="button-print-last-bill" onClick={() => lastSale && onPrint(lastSale)} disabled={!lastSale} className="button-secondary disabled:opacity-40"><Printer size={14} /> Print last bill</button><span className="status-pill"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Printer option ready</span></div>}><div className="grid gap-5 xl:grid-cols-[1fr_380px]"><section className="card-surface"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-base font-semibold">Catalogue</h2><p className="text-xs text-muted-foreground">Tap an item to add it to the bill</p></div><div className="flex w-full items-center gap-2 rounded-lg border border-border bg-muted/35 px-3 py-2 sm:w-64"><Search size={16} className="text-muted-foreground" /><input data-testid="input-pos-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search product or SKU" className="w-full bg-transparent text-xs outline-none" /></div></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((product) => <button data-testid={`button-pos-product-${product.id}`} key={product.id} onClick={() => add(product)} disabled={product.quantity === 0} className="group rounded-xl border border-border bg-muted/25 p-3 text-left transition hover:-translate-y-0.5 hover:border-primary/45 hover:bg-card disabled:cursor-not-allowed disabled:opacity-45"><div className="mb-5 flex items-start justify-between"><span className="rounded-md bg-primary/10 px-1.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">{product.category}</span><Plus size={16} className="text-muted-foreground transition group-hover:text-primary" /></div><p className="line-clamp-2 min-h-9 text-xs font-semibold">{product.name}</p><div className="mt-2 flex items-center justify-between"><span className="font-display text-sm font-semibold">{money(product.price)}</span><span className="text-[10px] text-muted-foreground">{product.quantity} left</span></div></button>)}</div></section><section className="card-surface flex min-h-[520px] flex-col"><div className="flex items-start justify-between border-b border-border pb-4"><div><h2 className="font-display text-base font-semibold">Current bill</h2><p className="text-xs text-muted-foreground">Stock out happens only after payment</p></div><button data-testid="button-clear-cart" onClick={() => setCart([])} disabled={!cart.length} className="text-xs font-semibold text-muted-foreground hover:text-destructive disabled:opacity-30">Clear</button></div>{cart.length ? <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto py-4">{cart.map((item) => <div key={item.product.id} className="flex items-center gap-2"><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{item.product.name}</p><p className="text-[10px] text-muted-foreground">{money(item.product.price)} each</p></div><div className="flex items-center rounded-md border border-border"><button data-testid={`button-pos-minus-${item.product.id}`} onClick={() => setCart(item.qty === 1 ? cart.filter((entry) => entry.product.id !== item.product.id) : cart.map((entry) => entry.product.id === item.product.id ? { ...entry, qty: entry.qty - 1 } : entry))} className="px-2 py-1 text-muted-foreground hover:text-foreground">−</button><span className="w-6 text-center text-xs font-semibold">{item.qty}</span><button data-testid={`button-pos-plus-${item.product.id}`} onClick={() => add(item.product)} className="px-2 py-1 text-muted-foreground hover:text-foreground">+</button></div><span className="w-16 text-right font-display text-xs font-semibold">{money(item.product.price * item.qty)}</span></div>)}</div> : <div className="flex flex-1 flex-col items-center justify-center text-center"><div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground"><ShoppingCart size={22} /></div><p className="text-sm font-semibold">Your bill is empty</p><p className="mt-1 max-w-[200px] text-xs leading-5 text-muted-foreground">Select products from the catalogue to start a quick bill.</p></div>}<div className="border-t border-border pt-4"><label className="mb-3 block text-xs font-semibold">Customer on this bill <select data-testid="select-pos-customer" value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="mt-1"><option value="">Walk-in customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {customer.phone}</option>)}</select></label><div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>Subtotal</span><span>{money(total)}</span></div><div className="mb-4 flex justify-between text-base font-bold"><span>Total</span><span className="font-display">{money(total)}</span></div><button data-testid="button-proceed-payment" onClick={() => setPaymentOpen(true)} disabled={!cart.length} className="button-primary h-11 w-full justify-center disabled:cursor-not-allowed disabled:opacity-40">Proceed to payment <ChevronRight size={16} /></button></div></section></div>{paymentOpen && <div className="mt-3 flex flex-wrap items-center justify-end gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3"><span className="mr-auto text-xs font-semibold">Choose payment mode</span>{(['Cash', 'UPI', 'Card', 'Udhaar'] as SalePayment[]).map((mode) => <button data-testid={`button-payment-${mode.toLowerCase()}`} key={mode} onClick={() => { const customer = customers.find((item) => item.id === customerId); onCheckout(mode, customerId || undefined, customer?.name); setPaymentOpen(false); }} className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold hover:border-primary">{mode}</button>)}</div>}<section className="card-surface mt-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-base font-semibold">Billing history</h2><p className="text-xs text-muted-foreground">Date-wise bills and direct print controls</p></div><button data-testid="button-toggle-billing-history" onClick={() => setHistoryOpen((value) => !value)} className="button-secondary"><Eye size={14} /> {historyOpen ? 'Hide' : 'Show'} bills</button></div>{historyOpen && <><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><Field label="From"><input data-testid="input-billing-from" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></Field><Field label="To"><input data-testid="input-billing-to" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></Field><ExportActions filename="billing-history" headers={['Bill ID', 'Date', 'Time', 'Customer', 'Payment', 'Items', 'Total', 'Profit']} rows={history.map((sale) => [sale.id, sale.date, sale.time, sale.customerName, sale.payment, sale.items.reduce((sum, item) => sum + item.qty, 0), sale.grandTotal, sale.profit])} /></div><div className="mt-4 overflow-x-auto"><table className="data-table"><thead><tr><th>Bill</th><th>Date</th><th>Customer</th><th>Payment</th><th>Items</th><th className="text-right">Total</th><th className="text-right">Print</th></tr></thead><tbody>{history.map((sale) => <tr key={sale.id}><td className="font-mono text-xs">{sale.id.slice(-8)}</td><td className="text-muted-foreground">{sale.date}<br /><span className="text-[10px]">{sale.time}</span></td><td className="font-semibold">{sale.customerName}</td><td><span className="soft-pill">{sale.payment}</span></td><td>{sale.items.reduce((sum, item) => sum + item.qty, 0)}</td><td className="text-right font-display font-semibold">{money(sale.grandTotal)}</td><td className="text-right"><button data-testid={`button-print-bill-${sale.id}`} onClick={() => onPrint(sale)} className="icon-button"><Printer size={14} /></button></td></tr>)}</tbody></table>{!history.length && <EmptyState icon={Receipt} title="No bills for these dates" detail="Complete a POS bill or widen the date range." />}</div></>}</section><div className="print-only"><ReceiptPrint sale={lastSale} /></div></PageHeader>;
}

function ReceiptPrint({ sale }: { sale: Sale | null }) {
  if (!sale) return null;
  return <div className="receipt-paper"><div className="text-center"><h1 className="text-lg font-bold">Shree Business Hub</h1><p className="text-xs">Nexa ERP bill</p></div><div className="my-3 border-y border-dashed border-black py-2 text-xs"><p>Bill: {sale.id}</p><p>{sale.date} · {sale.time}</p><p>Customer: {sale.customerName}</p><p>Payment: {sale.payment}</p></div><table className="w-full text-xs"><tbody>{sale.items.map((item) => <tr key={item.productId}><td className="py-1">{item.name} × {item.qty}</td><td className="py-1 text-right">{money(item.total)}</td></tr>)}</tbody><tfoot><tr><td className="border-t border-black pt-2 font-bold">Total</td><td className="border-t border-black pt-2 text-right font-bold">{money(sale.grandTotal)}</td></tr></tfoot></table></div>;
}

function Inventory({ products, search, setSearch, onAdd, onDelete, onAddStock, onImport }: { products: Product[]; search: string; setSearch: (value: string) => void; onAdd: () => void; onDelete: (id: string) => void; onAddStock: (id: string) => void; onImport: (file: File) => Promise<void> }) {
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const filtered = products.filter((item) => `${item.name} ${item.sku} ${item.category}`.toLowerCase().includes(search.toLowerCase())).filter((item) => filter === 'low' ? item.quantity > 0 && item.quantity < 15 : filter === 'out' ? item.quantity === 0 : true);
  const rows = products.map((product) => [product.name, product.sku, product.category, product.price, product.cost, product.quantity, product.unit, product.rack || '']);
  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) await onImport(file); event.target.value = ''; };
  return <PageHeader eyebrow="Stock room" title="Inventory" description={`${products.length} products · stock goes out only through completed billing`} actions={<div className="flex flex-wrap items-center gap-2"><input ref={inputRef} data-testid="input-import-inventory" type="file" accept=".xlsx,.xls,.csv,.tsv,.txt" className="hidden" onChange={handleFile} /><button data-testid="button-import-inventory" onClick={() => inputRef.current?.click()} className="button-secondary"><Upload size={14} /> Import Excel / CSV</button><button data-testid="button-add-product" onClick={onAdd} className="button-primary"><Plus size={16} /> Add product</button></div>}><div className="mb-5 grid gap-4 sm:grid-cols-3"><MiniStat label="Stock value at cost" value={money(products.reduce((sum, item) => sum + item.cost * item.quantity, 0))} tone="gold" /><MiniStat label="Units on hand" value={products.reduce((sum, item) => sum + item.quantity, 0).toLocaleString('en-IN')} /><MiniStat label="Needs refill" value={String(products.filter((item) => item.quantity < 15).length)} tone="coral" /></div><section className="card-surface"><div className="mb-5 flex flex-wrap gap-3"><div className="flex min-w-[230px] flex-1 items-center gap-2 rounded-lg border border-border bg-muted/35 px-3 py-2"><Search size={16} className="text-muted-foreground" /><input data-testid="input-inventory-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search stock, SKU or category" className="w-full bg-transparent text-xs outline-none" /></div><select data-testid="select-stock-filter" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="w-auto"><option value="all">All stock</option><option value="low">Low stock</option><option value="out">Out of stock</option></select><ExportActions filename="inventory" headers={['Product', 'SKU', 'Category', 'Sell price', 'Cost price', 'Quantity', 'Unit', 'Rack']} rows={rows} /></div><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Sell price</th><th>Cost price</th><th>Available</th><th className="text-right">Actions</th></tr></thead><tbody>{filtered.map((product) => <tr key={product.id}><td><div className="flex items-center gap-3"><div className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold ${product.quantity < 15 ? 'bg-accent/15 text-accent' : 'bg-primary/10 text-primary'}`}>{product.name.slice(0, 2).toUpperCase()}</div><div><p className="font-semibold">{product.name}</p><p className="text-[11px] text-muted-foreground">{product.rack || 'Unassigned rack'} · per {product.unit}</p></div></div></td><td className="font-mono text-xs text-muted-foreground">{product.sku}</td><td><span className="soft-pill">{product.category}</span></td><td className="font-display font-semibold">{money(product.price)}</td><td className="font-display text-xs text-muted-foreground">{money(product.cost)}</td><td><span className={`font-semibold ${product.quantity < 15 ? 'text-accent' : ''}`}>{product.quantity}</span> <span className="text-xs text-muted-foreground">{product.unit}s</span></td><td><div className="flex justify-end gap-1"><button data-testid={`button-stock-plus-${product.id}`} onClick={() => onAddStock(product.id)} title="Add incoming stock" className="icon-button"><Plus size={15} /></button><button data-testid={`button-delete-product-${product.id}`} onClick={() => onDelete(product.id)} title="Delete product" className="icon-button text-muted-foreground hover:text-destructive"><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>{!filtered.length && <EmptyState icon={Package} title="No stock found" detail="Try a different product, SKU or stock filter." />}</section><div className="mt-4 flex items-start gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4 text-xs text-muted-foreground"><FileSpreadsheet size={17} className="mt-0.5 shrink-0 text-primary" /><p><span className="font-semibold text-foreground">Bulk inventory import:</span> upload Excel, CSV, TSV or TXT with columns such as name, sku, category, price, cost and quantity. Existing SKUs update; new rows are added automatically.</p></div></PageHeader>;
}

function Udhaar({ accounts, sales, onPayment }: { accounts: UdhaarAccount[]; sales: Sale[]; onPayment: (account: UdhaarAccount, amount: number) => void }) {
  const [selected, setSelected] = useState<UdhaarAccount | null>(null);
  const total = accounts.reduce((sum, account) => sum + account.balance, 0);
  const customerSales = selected ? sales.filter((sale) => sale.customerId === selected.customerId || sale.customerName === selected.customerName) : [];
  return <PageHeader eyebrow="The trusted ledger" title="Udhaar" description="Open any person to see credit entries, payments, bills, products and dates together." actions={<span className="status-pill"><CreditCard size={14} /> {money(total)} outstanding</span>}><div className="mb-5 grid gap-4 sm:grid-cols-3"><MiniStat label="Total outstanding" value={money(total)} tone="coral" /><MiniStat label="Customers on credit" value={String(accounts.filter((item) => item.balance > 0).length)} /><MiniStat label="Collected this month" value={money(accounts.flatMap((item) => item.entries).filter((entry) => entry.type === 'payment').reduce((sum, entry) => sum + entry.amount, 0))} tone="gold" /></div><section className="card-surface"><SectionHeading title="Open balances" detail="Tap a customer to see their complete ledger" /><div className="mt-4 grid gap-2 md:grid-cols-2">{accounts.map((account) => <button data-testid={`button-udhaar-account-${account.customerId}`} key={account.customerId} onClick={() => setSelected(account)} className="flex items-center gap-3 rounded-xl border border-border p-3 text-left transition hover:border-primary/45 hover:bg-muted/35"><Avatar name={account.customerName} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{account.customerName}</p><p className="text-[11px] text-muted-foreground">{account.phone} · Last activity {account.lastTransaction}</p></div><div className="text-right"><p className="font-display text-sm font-bold text-accent">{money(account.balance)}</p><p className="text-[10px] text-muted-foreground">due <ChevronRight className="inline" size={12} /></p></div></button>)}</div></section>{selected && <Modal wide title={selected.customerName} subtitle={`${selected.phone} · ${money(selected.balance)} currently due`} onClose={() => setSelected(null)}><div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]"><div><SectionHeading title="Credit and payment entries" detail="Every ledger movement" /><div className="mt-3 space-y-2">{selected.entries.map((entry) => <div key={entry.id} className="flex items-center gap-3 rounded-lg bg-muted/45 p-3"><span className={`rounded-md p-1.5 ${entry.type === 'payment' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>{entry.type === 'payment' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}</span><div className="flex-1"><p className="text-xs font-semibold">{entry.note}</p><p className="text-[10px] text-muted-foreground">{entry.date} · {entry.type === 'payment' ? 'Payment received' : 'Credit added'}</p></div><span className={`font-display text-xs font-semibold ${entry.type === 'payment' ? 'text-primary' : 'text-accent'}`}>{entry.type === 'payment' ? '−' : '+'}{money(entry.amount)}</span></div>)}</div></div><div><SectionHeading title="Bills and products taken" detail={`${customerSales.length} saved bills for this customer`} /><div className="mt-3 space-y-2">{customerSales.map((sale) => <div key={sale.id} className="rounded-lg border border-border p-3"><div className="flex items-center justify-between"><p className="text-xs font-semibold">{sale.date} · {sale.payment}</p><p className="font-display text-xs font-bold">{money(sale.grandTotal)}</p></div><p className="mt-2 text-[11px] leading-5 text-muted-foreground">{sale.items.map((item) => `${item.name} × ${item.qty}`).join(' · ')}</p></div>)}{!customerSales.length && <p className="rounded-lg bg-muted/40 p-4 text-xs text-muted-foreground">Older ledger entries are available on the left. New POS bills for this customer will appear here.</p>}</div></div></div><div className="mt-5 flex gap-2"><button data-testid="button-udhaar-payment" onClick={() => { const amount = Number(window.prompt(`Payment from ${selected.customerName}`, String(selected.balance))); if (amount > 0) { onPayment(selected, Math.min(amount, selected.balance)); setSelected(null); } }} className="button-primary flex-1 justify-center"><IndianRupee size={15} /> Record payment</button><button data-testid="button-udhaar-reminder" onClick={() => setSelected(null)} className="button-secondary flex-1 justify-center">Close ledger</button></div></Modal>}</PageHeader>;
}

function Expenses({ expenses, onAdd }: { expenses: Expense[]; onAdd: () => void }) {
  const categories = [...new Set(expenses.map((item) => item.category))];
  return <PageHeader eyebrow="Money out" title="Expenses" description="Know where the rupees are going, before month-end." actions={<button data-testid="button-add-expense" onClick={onAdd} className="button-primary"><Plus size={16} /> Log expense</button>}><div className="mb-5 grid gap-4 sm:grid-cols-3"><MiniStat label="Total tracked" value={money(expenses.reduce((sum, item) => sum + item.amount, 0))} /><MiniStat label="Largest category" value={categories[0] || 'None'} tone="gold" /><MiniStat label="Entries" value={String(expenses.length)} /></div><section className="card-surface"><SectionHeading title="Recent expenses" detail="Newest first" action={<ExportActions filename="expenses" headers={['Date', 'Description', 'Category', 'Paid by', 'Amount']} rows={expenses.map((item) => [item.date, item.description, item.category, item.paidBy, item.amount])} />} /><div className="mt-4 overflow-x-auto"><table className="data-table"><thead><tr><th>Date</th><th>Expense</th><th>Category</th><th>Paid by</th><th className="text-right">Amount</th></tr></thead><tbody>{expenses.map((expense) => <tr key={expense.id}><td className="text-muted-foreground">{expense.date}</td><td><p className="font-semibold">{expense.description}</p></td><td><span className="soft-pill">{expense.category}</span></td><td className="text-muted-foreground">{expense.paidBy}</td><td className="text-right font-display font-semibold">{money(expense.amount)}</td></tr>)}</tbody></table></div></section></PageHeader>;
}

function Clients({ customers, sales, onAdd, onFlash }: { customers: Customer[]; sales: Sale[]; onAdd: () => void; onFlash: (message: string) => void }) {
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'clear' | 'pending'>('all');
  const [selected, setSelected] = useState<Customer | null>(null);
  const [menuId, setMenuId] = useState('');
  const filtered = customers.filter((customer) => paymentFilter === 'all' || paymentFilter === 'clear' ? (paymentFilter === 'clear' ? customer.balance >= 0 : true) : customer.balance < 0);
  const customerSales = selected ? sales.filter((sale) => sale.customerId === selected.id || sale.customerName === selected.name) : [];
  return <PageHeader eyebrow="People who return" title="Clients" description="Your customer book, with payment status, bill history and products bought." actions={<button data-testid="button-add-client" onClick={onAdd} className="button-primary"><UserPlus size={16} /> Add client</button>}><section className="card-surface"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><SectionHeading title="Customer book" detail={`${filtered.length} of ${customers.length} people`} /><div className="flex items-center gap-2"><select data-testid="select-client-payment-filter" value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value as typeof paymentFilter)} className="w-auto"><option value="all">All payments</option><option value="clear">Payment clear</option><option value="pending">Payment pending</option></select><ExportActions filename="clients" headers={['Name', 'Phone', 'Email', 'Payment status', 'Balance', 'Lifetime purchases']} rows={filtered.map((item) => [item.name, item.phone, item.email, item.balance < 0 ? 'Pending' : 'Clear', Math.abs(item.balance), item.totalPurchases])} /></div></div><div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{filtered.map((customer) => <div data-testid={`card-client-${customer.id}`} key={customer.id} className="group relative rounded-xl border border-border bg-muted/20 p-4 transition hover:border-primary/35 hover:bg-card"><div className="flex items-start gap-3"><Avatar name={customer.name} /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold">{customer.name}</p>{customer.status === 'vip' && <span className="rounded bg-[#e9bd55]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#9a6b15]">VIP</span>}</div><p className="mt-0.5 text-xs text-muted-foreground">{customer.phone}</p></div><button data-testid={`button-client-menu-${customer.id}`} onClick={() => setMenuId(menuId === customer.id ? '' : customer.id)} className="rounded p-1 text-muted-foreground hover:bg-muted"><MoreHorizontal size={17} /></button>{menuId === customer.id && <div className="absolute right-3 top-12 z-10 w-36 rounded-lg border border-border bg-card p-1 shadow-xl"><button onClick={() => { navigator.clipboard?.writeText(customer.phone); onFlash('Phone number copied'); setMenuId(''); }} className="block w-full rounded px-2 py-2 text-left text-xs hover:bg-muted">Copy phone</button><button onClick={() => { downloadDataset(`ledger-${customer.name.replace(/\s+/g, '-')}`, ['Bill', 'Date', 'Payment', 'Products', 'Total'], customerSales.map((sale) => [sale.id, sale.date, sale.payment, sale.items.map((item) => `${item.name} x ${item.qty}`).join(' | '), sale.grandTotal]), 'excel'); setMenuId(''); }} className="block w-full rounded px-2 py-2 text-left text-xs hover:bg-muted">Export ledger</button></div>}</div><button onClick={() => setSelected(customer)} className="mt-4 w-full border-t border-border pt-3 text-left"><div className="flex items-end justify-between"><div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Lifetime spend</p><p className="font-display text-sm font-semibold">{money(customer.totalPurchases)}</p></div><div className="text-right"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Payment</p><p className={`font-display text-sm font-semibold ${customer.balance < 0 ? 'text-accent' : 'text-primary'}`}>{customer.balance < 0 ? `${money(customer.balance)} pending` : 'Clear'}</p></div></div><p className="mt-3 text-[11px] text-primary">Open complete purchase history <ChevronRight className="inline" size={13} /></p></button></div>)}</div></section>{selected && <Modal wide title={selected.name} subtitle={`${selected.phone} · ${selected.balance < 0 ? `${money(selected.balance)} pending` : 'Payment clear'}`} onClose={() => setSelected(null)}><div className="mb-4 grid gap-3 sm:grid-cols-3"><MiniStat label="Lifetime purchases" value={money(selected.totalPurchases)} /><MiniStat label="Bills found" value={String(customerSales.length)} /><MiniStat label="Payment status" value={selected.balance < 0 ? 'Pending' : 'Clear'} tone={selected.balance < 0 ? 'coral' : 'gold'} /></div><SectionHeading title="What they took and when" detail="Every matching POS bill, product and date" /><div className="mt-3 space-y-2">{customerSales.map((sale) => <div key={sale.id} className="rounded-lg border border-border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold">{sale.date} · {sale.time}</p><p className="text-[10px] text-muted-foreground">{sale.id} · {sale.payment}</p></div><p className="font-display text-sm font-bold">{money(sale.grandTotal)}</p></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{sale.items.map((item) => <div key={item.productId} className="flex justify-between rounded bg-muted/45 px-2 py-1.5 text-[11px]"><span>{item.name} × {item.qty}</span><span className="font-semibold">{money(item.total)}</span></div>)}</div></div>)}{!customerSales.length && <EmptyState icon={Receipt} title="No POS bills yet" detail="The next bill attached to this customer will appear here." />}</div></Modal>}</PageHeader>;
}

function Staff({ staff, onAdd, onToggle }: { staff: StaffMember[]; onAdd: () => void; onToggle: (id: string) => void }) {
  return <PageHeader eyebrow="Your people" title="Staff & attendance" description="Know who is in, who needs support and where the shift stands." actions={<button data-testid="button-add-staff" onClick={onAdd} className="button-primary"><UserPlus size={16} /> Add team member</button>}><section className="card-surface"><SectionHeading title="Team roster" detail={`${staff.filter((item) => item.status === 'active').length} active today`} /><div className="mt-5 overflow-x-auto"><table className="data-table"><thead><tr><th>Team member</th><th>Role</th><th>Department</th><th>Attendance</th><th>Status</th><th className="text-right">Manage</th></tr></thead><tbody>{staff.map((member) => <tr key={member.id}><td><div className="flex items-center gap-3"><Avatar name={member.name} /><div><p className="font-semibold">{member.name}</p><p className="text-[11px] text-muted-foreground">{member.phone}</p></div></div></td><td>{member.role}</td><td className="text-muted-foreground">{member.department}</td><td><div className="flex items-center gap-2"><div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (member.attendance / 30) * 100)}%` }} /></div><span className="text-xs font-semibold">{member.attendance}/30</span></div></td><td><span className={`status-pill ${member.status === 'active' ? 'text-primary' : 'text-accent'}`}><span className={`h-1.5 w-1.5 rounded-full ${member.status === 'active' ? 'bg-primary' : 'bg-accent'}`} />{member.status === 'active' ? 'Active' : 'Blocked'}</span></td><td className="text-right"><button data-testid={`button-toggle-staff-${member.id}`} onClick={() => onToggle(member.id)} className="text-xs font-semibold text-primary hover:underline">{member.status === 'active' ? 'Block' : 'Activate'}</button></td></tr>)}</tbody></table></div></section></PageHeader>;
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
  const productStats = products.map((product) => {
    const sold = filteredSales.flatMap((sale) => sale.items).filter((item) => item.productId === product.id);
    return { ...product, soldQty: sold.reduce((sum, item) => sum + item.qty, 0), sales: sold.reduce((sum, item) => sum + item.total, 0), profit: sold.reduce((sum, item) => sum + item.profit, 0) };
  }).sort((a, b) => b.sales - a.sales);
  const dailyStats = [...new Set(filteredSales.map((sale) => sale.date))].sort().reverse().map((date) => {
    const daySales = filteredSales.filter((sale) => sale.date === date);
    return { date, bills: daySales.length, items: daySales.flatMap((sale) => sale.items).reduce((sum, item) => sum + item.qty, 0), sales: daySales.reduce((sum, sale) => sum + sale.grandTotal, 0), profit: daySales.reduce((sum, sale) => sum + sale.profit, 0) };
  });
  const reportRows = productStats.map((item) => [item.name, item.sku, item.soldQty, item.sales, item.cost * item.quantity, item.profit]);
  return <PageHeader eyebrow="Make better calls" title="Reports" description="Go from the day total to the exact bill, product, stock value and benefit behind it." actions={<ExportActions filename="nexa-report" headers={['Product', 'SKU', 'Sold quantity', 'Gross sales', 'Remaining stock value', 'Gross profit']} rows={reportRows} />}><section className="card-surface mb-5"><div className="flex flex-wrap items-end gap-3"><div className="flex-1"><p className="mb-2 text-xs font-semibold">Report period</p><div className="grid gap-3 sm:grid-cols-2"><Field label="From"><input data-testid="input-report-from" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></Field><Field label="To"><input data-testid="input-report-to" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></Field></div></div><div className="rounded-lg bg-muted/45 p-3 text-xs text-muted-foreground"><CalendarDays size={15} className="mb-1 text-primary" />{filteredSales.length} bills · {filteredSales.flatMap((sale) => sale.items).reduce((sum, item) => sum + item.qty, 0)} items sold</div></div></section><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><MetricCard label="Gross sales" value={money(grossSales)} note={`${filteredSales.length} bills in selected period`} trend="up" icon={TrendingUp} /><MetricCard label="Gross profit" value={money(grossProfit)} note="Sales minus product cost" trend="up" icon={BarChart3} tone="gold" /><MetricCard label="Net profit after expenses" value={money(grossProfit - expenseTotal)} note={`${money(expenseTotal)} expenses deducted`} trend={grossProfit - expenseTotal >= 0 ? 'up' : 'down'} icon={IndianRupee} tone="ink" /><MetricCard label="Stock value" value={money(products.reduce((sum, item) => sum + item.cost * item.quantity, 0))} note="Remaining stock at cost price" trend="neutral" icon={Boxes} tone="coral" /></div><div className="mt-5 flex flex-wrap gap-2"><button data-testid="button-report-daily" onClick={() => setTab('daily')} className={tab === 'daily' ? 'button-primary' : 'button-secondary'}><CalendarDays size={14} /> Day-wise sales</button><button data-testid="button-report-products" onClick={() => setTab('products')} className={tab === 'products' ? 'button-primary' : 'button-secondary'}><BarChart3 size={14} /> Product profit</button><button data-testid="button-report-stock" onClick={() => setTab('stock')} className={tab === 'stock' ? 'button-primary' : 'button-secondary'}><Boxes size={14} /> Remaining stock</button></div>{tab === 'daily' && <section className="card-surface mt-4"><SectionHeading title="Daily sales deep dive" detail="Which day sold how much, how many bills, items and profit" /><div className="mt-4 overflow-x-auto"><table className="data-table"><thead><tr><th>Date</th><th>Bills</th><th>Items sold</th><th className="text-right">Gross sales</th><th className="text-right">Gross profit</th></tr></thead><tbody>{dailyStats.map((day) => <tr key={day.date}><td className="font-semibold">{day.date}</td><td>{day.bills}</td><td>{day.items}</td><td className="text-right font-display font-semibold">{money(day.sales)}</td><td className="text-right font-display font-semibold text-primary">{money(day.profit)}</td></tr>)}</tbody></table>{!dailyStats.length && <EmptyState icon={BarChart3} title="No sales in this period" detail="Complete a POS bill or expand the date range." />}</div></section>}{tab === 'products' && <section className="card-surface mt-4"><SectionHeading title="Product-wise gross sales and benefit" detail="Exactly which item made how much money" /><div className="mt-4 overflow-x-auto"><table className="data-table"><thead><tr><th>Product</th><th>SKU</th><th>Sold qty</th><th className="text-right">Gross sales</th><th className="text-right">Gross profit</th><th className="text-right">Margin</th></tr></thead><tbody>{productStats.filter((item) => item.soldQty > 0).map((item) => <tr key={item.id}><td className="font-semibold">{item.name}</td><td className="font-mono text-xs text-muted-foreground">{item.sku}</td><td>{item.soldQty}</td><td className="text-right font-display font-semibold">{money(item.sales)}</td><td className="text-right font-display font-semibold text-primary">{money(item.profit)}</td><td className="text-right text-xs">{item.sales ? `${Math.round((item.profit / item.sales) * 100)}%` : '0%'}</td></tr>)}</tbody></table>{!productStats.some((item) => item.soldQty > 0) && <EmptyState icon={BarChart3} title="No product sales yet" detail="Your completed bills will populate this table." />}</div></section>}{tab === 'stock' && <section className="card-surface mt-4"><SectionHeading title="What is left in stock" detail="Quantity, cost value and potential sell value for every product" /><div className="mt-4 overflow-x-auto"><table className="data-table"><thead><tr><th>Product</th><th>Category</th><th>On hand</th><th className="text-right">Cost value</th><th className="text-right">Potential sales value</th><th className="text-right">Potential margin</th></tr></thead><tbody>{products.slice().sort((a, b) => (a.cost * a.quantity) - (b.cost * b.quantity)).reverse().map((item) => <tr key={item.id}><td className="font-semibold">{item.name}<p className="text-[10px] font-normal text-muted-foreground">{item.sku} · {item.rack || 'No rack'}</p></td><td><span className="soft-pill">{item.category}</span></td><td><span className={item.quantity < 15 ? 'font-semibold text-accent' : 'font-semibold'}>{item.quantity}</span> {item.unit}s</td><td className="text-right font-display font-semibold">{money(item.cost * item.quantity)}</td><td className="text-right font-display">{money(item.price * item.quantity)}</td><td className="text-right font-display text-primary">{money((item.price - item.cost) * item.quantity)}</td></tr>)}</tbody></table></div></section>}</PageHeader>;
}

function ExportActions({ filename, headers, rows }: { filename: string; headers: string[]; rows: (string | number)[][] }) {
  const [format, setFormat] = useState<ExportFormat>('excel');
  return <div className="flex items-center gap-1"><select aria-label="Download format" value={format} onChange={(event) => setFormat(event.target.value as ExportFormat)} className="w-auto text-[11px]"><option value="excel">Excel / Sheets</option><option value="txt">TXT</option><option value="zip">ZIP</option></select><button data-testid={`button-export-${filename}`} onClick={() => downloadDataset(filename, headers, rows, format)} className="button-secondary"><Download size={14} /> Download</button></div>;
}

function EntryModal({ kind, onClose, onSubmit }: { kind: Exclude<ModalKind, null>; onClose: () => void; onSubmit: (form: Record<string, string>) => void }) {
  const [form, setForm] = useState<Record<string, string>>({});
  const config: Record<Exclude<ModalKind, null>, { title: string; subtitle: string; fields: { key: string; label: string; type?: string; placeholder?: string }[]; submit: string }> = {
    product: { title: 'Add a product', subtitle: 'Keep your catalogue ready for the next sale.', submit: 'Add product', fields: [{ key: 'name', label: 'Product name', placeholder: 'e.g. Aashirvaad Atta 5kg' }, { key: 'sku', label: 'SKU', placeholder: 'Optional code' }, { key: 'category', label: 'Category', placeholder: 'e.g. Grocery' }, { key: 'price', label: 'Selling price', type: 'number', placeholder: '0' }, { key: 'cost', label: 'Cost price', type: 'number', placeholder: '0' }, { key: 'quantity', label: 'Opening quantity', type: 'number', placeholder: '0' }, { key: 'unit', label: 'Unit', placeholder: 'piece, packet, bag' }, { key: 'rack', label: 'Rack / location', placeholder: 'A-1' }] },
    expense: { title: 'Log an expense', subtitle: 'A small note now saves a scramble later.', submit: 'Save expense', fields: [{ key: 'description', label: 'What was it for?', placeholder: 'e.g. Shop rent for January' }, { key: 'category', label: 'Category', placeholder: 'e.g. Rent, Transport, Salary' }, { key: 'amount', label: 'Amount', type: 'number', placeholder: '0' }, { key: 'date', label: 'Date', type: 'date' }, { key: 'paidBy', label: 'Paid by', placeholder: 'Owner' }] },
    client: { title: 'Add a client', subtitle: 'Save the details you will want at the counter.', submit: 'Add client', fields: [{ key: 'name', label: 'Full name', placeholder: 'e.g. Meera Nair' }, { key: 'phone', label: 'Phone number', placeholder: '10 digit mobile number' }, { key: 'email', label: 'Email', type: 'email', placeholder: 'Optional' }, { key: 'address', label: 'Address', placeholder: 'Optional' }] },
    staff: { title: 'Add team member', subtitle: 'Keep your roster current and clear.', submit: 'Add member', fields: [{ key: 'name', label: 'Full name', placeholder: 'e.g. Kavya Rao' }, { key: 'phone', label: 'Phone number', placeholder: '10 digit mobile number' }, { key: 'role', label: 'Role', placeholder: 'e.g. Sales executive' }, { key: 'department', label: 'Department', placeholder: 'e.g. Sales' }, { key: 'salary', label: 'Monthly salary', type: 'number', placeholder: '0' }] },
  };
  const current = config[kind];
  const update = (key: string, value: string) => setForm((valueMap) => ({ ...valueMap, [key]: value }));
  return <Modal title={current.title} subtitle={current.subtitle} onClose={onClose}><form onSubmit={(event) => { event.preventDefault(); onSubmit(form); }} className="space-y-4">{current.fields.map((field) => <Field key={field.key} label={field.label}><input data-testid={`input-${kind}-${field.key}`} required={['name', 'description', 'amount', 'price', 'quantity', 'phone', 'role'].includes(field.key)} type={field.type || 'text'} placeholder={field.placeholder} value={form[field.key] || ''} onChange={(event) => update(field.key, event.target.value)} /></Field>)}<div className="flex gap-2 pt-3"><button data-testid={`button-submit-${kind}`} className="button-primary flex-1 justify-center">{current.submit}</button><button type="button" data-testid={`button-cancel-${kind}`} onClick={onClose} className="button-secondary flex-1 justify-center">Cancel</button></div></form></Modal>;
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
function Modal({ title, subtitle, onClose, children, wide = false }: { title: string; subtitle: string; onClose: () => void; children: ReactNode; wide?: boolean }) { return <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#103c35]/35 p-0 backdrop-blur-sm sm:items-center sm:p-4"><div className={`animate-nexa-pop max-h-[90dvh] w-full ${wide ? 'max-w-4xl' : 'max-w-md'} overflow-y-auto rounded-t-2xl border border-border bg-card p-6 shadow-2xl sm:rounded-2xl`}><div className="mb-6 flex items-start justify-between gap-4"><div><h2 className="font-display text-xl font-semibold">{title}</h2><p className="mt-1 text-xs text-muted-foreground">{subtitle}</p></div><button data-testid="button-close-modal" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><X size={18} /></button></div>{children}</div></div>; }
function EmptyState({ icon: Icon, title, detail }: { icon: typeof Package; title: string; detail: string }) { return <div className="py-12 text-center"><Icon size={24} className="mx-auto text-muted-foreground" /><p className="mt-3 text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>; }

export default App;