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

// Helper Functions
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

const writeStore = (key: string, value: unknown) =>
  localStorage.setItem(key, JSON.stringify(value));

type ModuleId =
  | 'overview' | 'pos' | 'inventory' | 'udhaar'
  | 'expenses' | 'clients' | 'staff' | 'reports';

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

const navGroups: {
  label: string;
  items: {
    id: ModuleId;
    label: string;
    icon: typeof LayoutDashboard;
    path: string;
  }[];
}[] = [
  {
    label: 'Workspace',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/' },
      { id: 'pos', label: 'POS billing', icon: ShoppingCart, path: '/pos' },
      { id: 'inventory', label: 'Inventory', icon: Boxes, path: '/inventory' },
      { id: 'udhaar', label: 'Udhaar', icon: CreditCard, path: '/udhaar' },
      { id: 'expenses', label: 'Expenses', icon: Wallet, path: '/expenses' },
    ],
  },
  {
    label: 'Relationships',
    items: [
      { id: 'clients', label: 'Clients', icon: Users, path: '/clients' },
    ],
  },
  {
    label: 'Business',
    items: [
      { id: 'staff', label: 'Staff & attendance', icon: BriefcaseBusiness, path: '/staff' },
      { id: 'reports', label: 'Reports', icon: FileBarChart, path: '/reports' },
    ],
  },
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
      payment: (
        ['Cash', 'UPI', 'Card', 'Cash', 'Udhaar', 'UPI', 'Cash'] as SalePayment[]
      )[day],
      items,
      subtotal,
      grandTotal: subtotal,
      profit: items.reduce((sum, item) => sum + item.profit, 0),
    };
  });
}

function normaliseHeader(value: string) {
  return value
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
    .replace(/[^\w]/g, '');
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
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim());

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
    const result = new Uint8Array(
      parts.reduce((sum, part) => sum + part.length, 0),
    );

    let cursor = 0;

    parts.forEach((part) => {
      result.set(part, cursor);
      cursor += part.length;
    });

    return result;
  };

  const crc32 = (bytes: Uint8Array) => {
    let crc = 0 ^ -1;

    for (const byte of bytes) {
      crc ^= byte;

      for (let bit = 0; bit < 8; bit += 1) {
        crc =
          (crc >>> 1) ^
          (0xEDB88320 & -(crc & 1));
      }
    }

    return (crc ^ -1) >>> 0;
  };

  entries.forEach((entry) => {
    const name = encoder.encode(entry.name);
    const data = encoder.encode(entry.data);

    const local = join([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc32(data)),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      name,
      data,
    ]);

    chunks.push(local);

    const central = join([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc32(data)),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      name,
    ]);

    directory.push(central);
    offset += local.length;
  });

  const centralBytes = join(directory);

  const end = join([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(entries.length),
    u16(entries.length),
    u32(centralBytes.length),
    u32(offset),
    u16(0),
  ]);

  const blobParts = [...chunks, centralBytes, end].map(
    (part) =>
      part.buffer.slice(
        part.byteOffset,
        part.byteOffset + part.byteLength,
      ) as ArrayBuffer,
  );

  return new Blob(blobParts, { type: 'application/zip' });
}

async function parseXlsx(file: File): Promise<string[][]> {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  let eocd = -1;

  for (
    let index = bytes.length - 22;
    index >= Math.max(0, bytes.length - 65557);
    index -= 1
  ) {
    if (view.getUint32(index, true) === 0x06054b50) {
      eocd = index;
      break;
    }
  }

  if (eocd < 0) {
    throw new Error('This Excel file could not be opened.');
  }

  const entries: {
    name: string;
    compression: number;
    compressedSize: number;
    localOffset: number;
  }[] = [];

  const decoder = new TextDecoder();

  const entryCount = view.getUint16(eocd + 10, true);
  let cursor = view.getUint32(eocd + 16, true);

  for (let index = 0; index < entryCount; index += 1) {
    if (view.getUint32(cursor, true) !== 0x02014b50) break;

    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);

    entries.push({
      name: decoder.decode(
        bytes.slice(cursor + 46, cursor + 46 + nameLength),
      ),
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

    const content = bytes.slice(
      local + 30 + nameLength + extraLength,
      local +
        30 +
        nameLength +
        extraLength +
        entry.compressedSize,
    );

    if (entry.compression === 0) {
      return decoder.decode(content);
    }

    if (entry.compression !== 8) {
      throw new Error('This Excel compression format is not supported.');
    }

    const stream = new Blob([content])
      .stream()
      .pipeThrough(new DecompressionStream('deflate-raw'));

    return decoder.decode(
      await new Response(stream).arrayBuffer(),
    );
  };

  const stringsXml = await readEntry('xl/sharedStrings.xml');

  const sheetName = entries.find(
    (entry) => /^xl\/worksheets\/sheet\d+\.xml$/.test(entry.name),
  )?.name;

  const sheetXml = sheetName ? await readEntry(sheetName) : '';

  if (!sheetXml) {
    throw new Error('No worksheet was found in this Excel file.');
  }

  const sharedDocument = stringsXml
    ? new DOMParser().parseFromString(stringsXml, 'application/xml')
    : null;

  const sharedStrings = sharedDocument
    ? Array.from(sharedDocument.querySelectorAll('si')).map(
        (item) =>
          Array.from(item.querySelectorAll('t'))
            .map((text) => text.textContent || '')
            .join(''),
      )
    : [];

  const sheetDocument = new DOMParser().parseFromString(
    sheetXml,
    'application/xml',
  );

  const columnIndex = (
    reference: string | null,
    fallback: number,
  ) => {
    const letters = reference
      ?.match(/[A-Z]+/i)?.[0]
      ?.toUpperCase();

    if (!letters) return fallback;

    return (
      letters
        .split('')
        .reduce(
          (sum, letter) =>
            sum * 26 + letter.charCodeAt(0) - 64,
          0,
        ) - 1
    );
  };

  return Array.from(
    sheetDocument.querySelectorAll('sheetData > row'),
  ).map((row) => {
    const output: string[] = [];

    Array.from(
      row.querySelectorAll(':scope > c'),
    ).forEach((cell, index) => {
      const type = cell.getAttribute('t');
      const value =
        cell.querySelector('v')?.textContent || '';

      const inline = Array.from(
        cell.querySelectorAll('is t'),
      )
        .map((text) => text.textContent || '')
        .join('');

      const parsed =
        type === 's'
          ? sharedStrings[Number(value)] || ''
          : type === 'inlineStr'
            ? inline
            : value;

      output[
        columnIndex(cell.getAttribute('r'), index)
      ] = parsed;
    });

    return output.map((value) => value || '');
  });
}

async function readSpreadsheet(file: File) {
  return /\.(xlsx|xls)$/i.test(file.name)
    ? parseXlsx(file)
    : parseDelimited(await file.text());
}

function toCsv(
  headers: string[],
  rows: (string | number)[][],
) {
  const quote = (value: string | number) =>
    `"${String(value ?? '').replace(/"/g, '""')}"`;

  return [headers, ...rows]
    .map((row) => row.map(quote).join(','))
    .join('\n');
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();

  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

function downloadDataset(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
  format: ExportFormat,
) {
  const csv = toCsv(headers, rows);

  if (format === 'zip') {
    downloadBlob(
      `${filename}.zip`,
      zipText([
        {
          name: `${filename}.csv`,
          data: csv,
        },
        {
          name: 'README.txt',
          data:
            'This folder contains an Excel-compatible CSV export from Nexa ERP. Open the CSV in Excel or Google Sheets.',
        },
      ]),
    );
  } else {
    downloadBlob(
      `${filename}.${format === 'excel' ? 'csv' : 'txt'}`,
      new Blob([csv], {
        type:
          format === 'excel'
            ? 'text/csv;charset=utf-8'
            : 'text/plain;charset=utf-8',
      }),
    );
  }
}

function inventoryRows(rows: string[][]) {
  if (rows.length < 2) return [];

  const headers = rows[0].map(normaliseHeader);

  const indexOf = (...names: string[]) =>
    names
      .map(normaliseHeader)
      .map((name) => headers.indexOf(name))
      .find((index) => index >= 0) ?? -1;

  const nameIndex = indexOf(
    'name',
    'product',
    'productname',
    'item',
    'itemname',
  );

  const skuIndex = indexOf(
    'sku',
    'code',
    'productcode',
    'barcode',
  );

  const categoryIndex = indexOf(
    'category',
    'group',
    'department',
  );

  const priceIndex = indexOf(
    'price',
    'sellingprice',
    'sellprice',
    'rate',
    'mrp',
  );

  const costIndex = indexOf(
    'cost',
    'costprice',
    'purchaseprice',
  );

  const quantityIndex = indexOf(
    'quantity',
    'qty',
    'stock',
    'openingstock',
    'available',
  );

  const unitIndex = indexOf('unit', 'uom');
  const rackIndex = indexOf('rack', 'shelf', 'location');

  return rows
    .slice(1)
    .map((row, rowIndex) => ({
      id: uid(`import_${rowIndex}`),
      name:
        row[nameIndex >= 0 ? nameIndex : 0]?.trim() || '',
      sku:
        row[skuIndex]?.trim() ||
        `IMP${Date.now().toString().slice(-5)}${rowIndex}`,
      category:
        row[categoryIndex]?.trim() || 'Imported',
      price: parseNumber(row[priceIndex]),
      cost:
        parseNumber(row[costIndex]) ||
        parseNumber(row[priceIndex]),
      quantity: parseNumber(row[quantityIndex]),
      unit: row[unitIndex]?.trim() || 'piece',
      rack: row[rackIndex]?.trim() || 'Imported',
    }))
    .filter((item) => item.name);
}

// Main Application Component
function MainApp() {
  const [location] = useLocation();
  const [products, setProducts] = useState<Product[]>(() => readStore('nexa_products', mockProducts));
  const [customers, setCustomers] = useState<Customer[]>(() => readStore('nexa_customers', mockCustomers));
  const [sales, setSales] = useState<Sale[]>(() => readStore('nexa_sales', makeSeedSales(mockProducts, mockCustomers)));

  useEffect(() => { writeStore('nexa_products', products); }, [products]);
  useEffect(() => { writeStore('nexa_customers', customers); }, [customers]);
  useEffect(() => { writeStore('nexa_sales', sales); }, [sales]);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between">
        <div className="p-4">
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Nexa ERP</h1>
              <p className="text-xs text-slate-400">Business Suite</p>
            </div>
          </div>

          <nav className="space-y-6">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 px-2">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location === item.path;
                    return (
                      <Link
                        key={item.id}
                        href={item.path}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <span>Status: Connected</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-900 p-6">
        <Switch>
          <Route path="/" component={() => (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Business Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <p className="text-xs text-slate-400">Total Sales</p>
                  <p className="text-xl font-bold mt-1">{money(sales.reduce((acc, s) => acc + s.grandTotal, 0))}</p>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <p className="text-xs text-slate-400">Total Products</p>
                  <p className="text-xl font-bold mt-1">{products.length}</p>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <p className="text-xs text-slate-400">Clients</p>
                  <p className="text-xl font-bold mt-1">{customers.length}</p>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <p classNam
