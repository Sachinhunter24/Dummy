import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Product, Customer, StaffMember, Lead, Expense, UdhaarAccount } from '../types/erp';
import { mockProducts, mockCustomers, mockStaff, mockLeads, mockExpenses, mockUdhaarAccounts } from '../data/mockData';

interface DataContextValue {
  // Products
  products: Product[];
  addProduct: (p: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  importProducts: (rows: Omit<Product, 'id'>[]) => void;

  // Customers
  customers: Customer[];
  addCustomer: (c: Omit<Customer, 'id'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  importCustomers: (rows: Omit<Customer, 'id'>[]) => void;

  // Staff
  staff: StaffMember[];
  addStaff: (s: Omit<StaffMember, 'id'>) => void;
  updateStaff: (id: string, updates: Partial<StaffMember>) => void;

  // Leads
  leads: Lead[];
  addLead: (l: Omit<Lead, 'id'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;

  // Expenses
  expenses: Expense[];
  addExpense: (e: Omit<Expense, 'id'>) => void;

  // Udhaar
  udhaarAccounts: UdhaarAccount[];
  setUdhaarAccounts: (accounts: UdhaarAccount[]) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

function uid() { return `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }

export function DataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [staff, setStaff] = useState<StaffMember[]>(mockStaff);
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [udhaarAccounts, setUdhaarAccounts] = useState<UdhaarAccount[]>(mockUdhaarAccounts);

  const addProduct = (p: Omit<Product, 'id'>) => setProducts(prev => [{ ...p, id: uid() }, ...prev]);
  const updateProduct = (id: string, upd: Partial<Product>) => setProducts(prev => prev.map(p => p.id === id ? { ...p, ...upd } : p));
  const deleteProduct = (id: string) => setProducts(prev => prev.filter(p => p.id !== id));
  const importProducts = (rows: Omit<Product, 'id'>[]) => setProducts(prev => [...prev, ...rows.map(r => ({ ...r, id: uid() }))]);

  const addCustomer = (c: Omit<Customer, 'id'>) => setCustomers(prev => [{ ...c, id: uid() }, ...prev]);
  const updateCustomer = (id: string, upd: Partial<Customer>) => setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...upd } : c));
  const importCustomers = (rows: Omit<Customer, 'id'>[]) => setCustomers(prev => [...prev, ...rows.map(r => ({ ...r, id: uid() }))]);

  const addStaff = (s: Omit<StaffMember, 'id'>) => setStaff(prev => [{ ...s, id: uid() }, ...prev]);
  const updateStaff = (id: string, upd: Partial<StaffMember>) => setStaff(prev => prev.map(s => s.id === id ? { ...s, ...upd } : s));

  const addLead = (l: Omit<Lead, 'id'>) => setLeads(prev => [{ ...l, id: uid() }, ...prev]);
  const updateLead = (id: string, upd: Partial<Lead>) => setLeads(prev => prev.map(l => l.id === id ? { ...l, ...upd } : l));

  const addExpense = (e: Omit<Expense, 'id'>) => setExpenses(prev => [{ ...e, id: uid() }, ...prev]);

  return (
    <DataContext.Provider value={{
      products, addProduct, updateProduct, deleteProduct, importProducts,
      customers, addCustomer, updateCustomer, importCustomers,
      staff, addStaff, updateStaff,
      leads, addLead, updateLead,
      expenses, addExpense,
      udhaarAccounts, setUdhaarAccounts,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

// ── CSV utilities ──────────────────────────────────────────────────────────

export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = (lines[0] ?? '').split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (vals[i] ?? '').trim(); });
    return row;
  });
}

export function exportToCSV(headers: string[], rows: string[][], filename: string) {
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
