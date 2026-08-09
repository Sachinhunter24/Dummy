export type Role = 'owner' | 'manager' | 'staff';

export type CategoryId =
  | 'retail'
  | 'realEstate'
  | 'ca'
  | 'lawyers'
  | 'logistics'
  | 'pharmacy'
  | 'grocery'
  | 'hotel'
  | 'hospital'
  | 'security';

export type ModuleId =
  | 'overview'
  | 'pos'
  | 'inventory'
  | 'udhaar'
  | 'expenses'
  | 'clients'
  | 'pipeline'
  | 'staff'
  | 'reports'
  | 'category';

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  quantity: number;
  category: string;
  rack?: string;
  expiryDate?: string;
  unit: string;
  hsn?: string;
  substitute?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: 'active' | 'vip' | 'inactive';
  balance: number;
  lastContact: string;
  totalPurchases: number;
  address?: string;
  gstin?: string;
  notes?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  salary: number;
  attendance: number;
  status: 'active' | 'blocked';
  joiningDate: string;
  phone: string;
  department: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  paidBy: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  value: number;
  stage: 'new' | 'discussion' | 'proposal' | 'closed';
  assignedTo: string;
  lastActivity: string;
  phone: string;
}

export interface UdhaarEntry {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  date: string;
  amount: number;
  type: 'credit' | 'payment';
  note: string;
}

export interface UdhaarAccount {
  customerId: string;
  customerName: string;
  phone: string;
  balance: number;
  lastTransaction: string;
  entries: UdhaarEntry[];
}

export interface CartItem {
  product: Product;
  qty: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface RegisteredUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  businessName: string;
  category: CategoryId;
  role: Role;
  username: string;
  password: string;
  pin: string;
  createdAt: string;
}

export interface InvoiceItem {
  name: string;
  qty: number;
  price: number;
  gst: number;
  total: number;
}

export interface Invoice {
  id: string;
  date: string;
  customerName: string;
  customerPhone: string;
  items: InvoiceItem[];
  subtotal: number;
  gstTotal: number;
  discount: number;
  grandTotal: number;
  gstEnabled: boolean;
}

export const CATEGORIES: { id: CategoryId; label: string; icon: string }[] = [
  { id: 'retail', label: 'Retail / General Store', icon: '🛒' },
  { id: 'realEstate', label: 'Real Estate', icon: '🏢' },
  { id: 'ca', label: 'CA & Tax Consultancy', icon: '📊' },
  { id: 'lawyers', label: 'Law Firm', icon: '⚖️' },
  { id: 'logistics', label: 'Logistics & Delivery', icon: '🚚' },
  { id: 'pharmacy', label: 'Pharmacy / Medical', icon: '💊' },
  { id: 'grocery', label: 'Grocery & Kirana', icon: '🧺' },
  { id: 'hotel', label: 'Hotel / Restaurant', icon: '🍽️' },
  { id: 'hospital', label: 'Hospital / Clinic', icon: '🏥' },
  { id: 'security', label: 'Gate & Security', icon: '🔐' },
];
