import type { Product, Customer, StaffMember, Expense, Lead, UdhaarAccount, AppNotification } from '../types/erp';

export const mockProducts: Product[] = [
  { id: 'p1', name: 'Basmati Rice 5kg', sku: 'GRC001', price: 450, cost: 380, quantity: 120, category: 'Grains', rack: 'A-1', unit: 'bag', hsn: '1006' },
  { id: 'p2', name: 'Tata Salt 1kg', sku: 'GRC002', price: 20, cost: 15, quantity: 300, category: 'Grocery', rack: 'A-2', unit: 'packet', hsn: '2501' },
  { id: 'p3', name: 'Amul Butter 500g', sku: 'DAI001', price: 260, cost: 220, quantity: 45, category: 'Dairy', rack: 'B-1', expiryDate: '2025-03-15', unit: 'piece', hsn: '0405' },
  { id: 'p4', name: 'Pantene Shampoo 200ml', sku: 'HPC001', price: 180, cost: 140, quantity: 80, category: 'Personal Care', rack: 'C-2', unit: 'bottle', hsn: '3305' },
  { id: 'p5', name: 'Surf Excel 2kg', sku: 'HPC002', price: 290, cost: 240, quantity: 60, category: 'Detergent', rack: 'C-1', unit: 'bag', hsn: '3402' },
  { id: 'p6', name: 'Dolo 650mg Tab', sku: 'MED001', price: 30, cost: 22, quantity: 8, category: 'Medicine', rack: 'D-1', expiryDate: '2026-06-30', unit: 'strip', hsn: '3004', substitute: 'Crocin 650mg / Paracetamol 650mg' },
  { id: 'p7', name: 'Crocin Pain Relief', sku: 'MED002', price: 55, cost: 40, quantity: 25, category: 'Medicine', rack: 'D-2', expiryDate: '2025-12-31', unit: 'strip', hsn: '3004', substitute: 'Dolo 650mg / Combiflam' },
  { id: 'p8', name: 'Colgate Toothpaste 200g', sku: 'HPC003', price: 120, cost: 90, quantity: 150, category: 'Personal Care', rack: 'C-3', unit: 'tube', hsn: '3306' },
  { id: 'p9', name: 'Maggi Noodles 70g', sku: 'FNB001', price: 15, cost: 10, quantity: 200, category: 'Food', rack: 'A-3', unit: 'packet', hsn: '1902' },
  { id: 'p10', name: 'Bru Coffee 100g', sku: 'BEV001', price: 145, cost: 110, quantity: 35, category: 'Beverages', rack: 'A-4', unit: 'jar', hsn: '2101' },
  { id: 'p11', name: 'Parle G Biscuit 1kg', sku: 'FNB002', price: 60, cost: 45, quantity: 180, category: 'Food', rack: 'A-5', unit: 'pack', hsn: '1905' },
  { id: 'p12', name: 'Lifebuoy Soap 100g', sku: 'HPC004', price: 35, cost: 26, quantity: 250, category: 'Personal Care', rack: 'C-4', unit: 'piece', hsn: '3401' },
  { id: 'p13', name: 'Fortune Sunflower Oil 1L', sku: 'OIL001', price: 135, cost: 115, quantity: 12, category: 'Oils', rack: 'B-2', unit: 'bottle', hsn: '1512' },
  { id: 'p14', name: 'Vim Dishwash Bar', sku: 'HPC005', price: 25, cost: 18, quantity: 300, category: 'Household', rack: 'C-5', unit: 'piece', hsn: '3402' },
  { id: 'p15', name: 'Britannia Bread 400g', sku: 'FNB003', price: 45, cost: 35, quantity: 5, category: 'Food', rack: 'A-6', expiryDate: '2025-02-05', unit: 'loaf', hsn: '1905' },
];

export const mockCustomers: Customer[] = [
  { id: 'c1', name: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@gmail.com', status: 'vip', balance: -2500, lastContact: '2025-01-20', totalPurchases: 45000, address: '12, MG Road, Delhi', gstin: '07AABCU9603R1ZP' },
  { id: 'c2', name: 'Priya Sharma', phone: '9871234567', email: 'priya.s@gmail.com', status: 'active', balance: 0, lastContact: '2025-01-22', totalPurchases: 18500, address: '45, Park Street, Mumbai' },
  { id: 'c3', name: 'Amit Singh', phone: '9988776655', email: 'amit.singh@yahoo.com', status: 'active', balance: -800, lastContact: '2025-01-18', totalPurchases: 12000 },
  { id: 'c4', name: 'Sunita Patel', phone: '8765432109', email: 'sunita@hotmail.com', status: 'inactive', balance: -300, lastContact: '2024-11-15', totalPurchases: 8500, address: '23, Gandhi Nagar, Ahmedabad' },
  { id: 'c5', name: 'Mohan Yadav', phone: '7654321098', email: 'mohan.y@gmail.com', status: 'vip', balance: 0, lastContact: '2025-01-23', totalPurchases: 72000, address: '5, Civil Lines, Lucknow', gstin: '09BMHPY6278K1ZS' },
  { id: 'c6', name: 'Kavita Joshi', phone: '9123456789', email: 'kavita.j@gmail.com', status: 'active', balance: -1200, lastContact: '2025-01-19', totalPurchases: 22000, address: '18, Shivaji Nagar, Pune' },
  { id: 'c7', name: 'Deepak Verma', phone: '8901234567', email: 'deepak.v@gmail.com', status: 'inactive', balance: -4500, lastContact: '2024-10-30', totalPurchases: 5500, notes: 'Follow up urgently for payment' },
  { id: 'c8', name: 'Anita Gupta', phone: '9234567890', email: 'anita.g@gmail.com', status: 'active', balance: 0, lastContact: '2025-01-21', totalPurchases: 31000, address: '56, Anna Nagar, Chennai' },
  { id: 'c9', name: 'Suresh Menon', phone: '7890123456', email: 'suresh.m@gmail.com', status: 'vip', balance: 0, lastContact: '2025-01-23', totalPurchases: 95000, address: '11, Marine Drive, Kochi', gstin: '32AAPFU0939F1ZV' },
  { id: 'c10', name: 'Ritu Agarwal', phone: '8123456789', email: 'ritu.a@gmail.com', status: 'active', balance: -600, lastContact: '2025-01-17', totalPurchases: 16500 },
];

export const mockStaff: StaffMember[] = [
  { id: 's1', name: 'Arjun Patel', role: 'Manager', salary: 35000, attendance: 26, status: 'active', joiningDate: '2022-03-01', phone: '9876123456', department: 'Operations' },
  { id: 's2', name: 'Neha Singh', role: 'Cashier', salary: 18000, attendance: 25, status: 'active', joiningDate: '2023-06-15', phone: '8765012345', department: 'Sales' },
  { id: 's3', name: 'Rahul Mishra', role: 'Sales Executive', salary: 22000, attendance: 24, status: 'active', joiningDate: '2023-01-10', phone: '7654901234', department: 'Sales' },
  { id: 's4', name: 'Pooja Kumari', role: 'Inventory Manager', salary: 25000, attendance: 28, status: 'active', joiningDate: '2021-11-20', phone: '9543210987', department: 'Warehouse' },
  { id: 's5', name: 'Vikas Sharma', role: 'Delivery Staff', salary: 16000, attendance: 22, status: 'blocked', joiningDate: '2024-02-01', phone: '8432109876', department: 'Logistics' },
  { id: 's6', name: 'Sita Devi', role: 'Housekeeping', salary: 14000, attendance: 27, status: 'active', joiningDate: '2022-08-01', phone: '7321098765', department: 'Support' },
  { id: 's7', name: 'Manoj Kumar', role: 'Security Guard', salary: 18000, attendance: 30, status: 'active', joiningDate: '2020-05-10', phone: '9210987654', department: 'Security' },
  { id: 's8', name: 'Divya Tiwari', role: 'Accountant', salary: 28000, attendance: 26, status: 'active', joiningDate: '2021-07-15', phone: '8109876543', department: 'Finance' },
];

export const mockExpenses: Expense[] = [
  { id: 'e1', date: '2025-01-23', category: 'Rent', amount: 25000, description: 'Monthly shop rent', paidBy: 'Owner' },
  { id: 'e2', date: '2025-01-23', category: 'Electricity', amount: 3500, description: 'BESCOM bill payment', paidBy: 'Arjun Patel' },
  { id: 'e3', date: '2025-01-22', category: 'Transport', amount: 1200, description: 'Goods delivery charges', paidBy: 'Rahul Mishra' },
  { id: 'e4', date: '2025-01-22', category: 'Salary', amount: 18000, description: 'Neha Singh salary advance', paidBy: 'Owner' },
  { id: 'e5', date: '2025-01-21', category: 'Marketing', amount: 5000, description: 'Social media ad campaign', paidBy: 'Owner' },
  { id: 'e6', date: '2025-01-21', category: 'Maintenance', amount: 800, description: 'AC servicing', paidBy: 'Arjun Patel' },
  { id: 'e7', date: '2025-01-20', category: 'Stationery', amount: 450, description: 'Office supplies & bills', paidBy: 'Neha Singh' },
  { id: 'e8', date: '2025-01-19', category: 'Internet', amount: 1500, description: 'Monthly broadband + GST', paidBy: 'Owner' },
  { id: 'e9', date: '2025-01-18', category: 'Packaging', amount: 2300, description: 'Carry bags and boxes', paidBy: 'Pooja Kumari' },
  { id: 'e10', date: '2025-01-17', category: 'Miscellaneous', amount: 650, description: 'Tea/snacks for staff', paidBy: 'Arjun Patel' },
];

export const mockLeads: Lead[] = [
  { id: 'l1', name: 'Vikram Industries', company: 'Vikram Industries Pvt Ltd', value: 250000, stage: 'new', assignedTo: 'Rahul Mishra', lastActivity: '2025-01-23', phone: '9876001234' },
  { id: 'l2', name: 'Shree Traders', company: 'Shree Traders & Sons', value: 180000, stage: 'discussion', assignedTo: 'Arjun Patel', lastActivity: '2025-01-22', phone: '8765002345' },
  { id: 'l3', name: 'Global Tech Solutions', company: 'Global Tech Solutions', value: 450000, stage: 'proposal', assignedTo: 'Rahul Mishra', lastActivity: '2025-01-21', phone: '7654003456' },
  { id: 'l4', name: 'Patel Enterprises', company: 'Patel Enterprises LLP', value: 120000, stage: 'closed', assignedTo: 'Arjun Patel', lastActivity: '2025-01-20', phone: '9543004567' },
  { id: 'l5', name: 'Star Distributors', company: 'Star Distributors', value: 320000, stage: 'new', assignedTo: 'Neha Singh', lastActivity: '2025-01-23', phone: '8432005678' },
  { id: 'l6', name: 'Metro Retail Ltd', company: 'Metro Retail Pvt Ltd', value: 680000, stage: 'discussion', assignedTo: 'Arjun Patel', lastActivity: '2025-01-20', phone: '7321006789' },
  { id: 'l7', name: 'Kumar Brothers', company: 'Kumar Brothers & Co', value: 95000, stage: 'closed', assignedTo: 'Rahul Mishra', lastActivity: '2025-01-19', phone: '9210007890' },
  { id: 'l8', name: 'Sunrise Exports', company: 'Sunrise Exports Pvt Ltd', value: 1200000, stage: 'proposal', assignedTo: 'Arjun Patel', lastActivity: '2025-01-18', phone: '8109008901' },
];

export const mockUdhaarAccounts: UdhaarAccount[] = [
  {
    customerId: 'c1', customerName: 'Rajesh Kumar', phone: '9876543210', balance: 2500, lastTransaction: '2025-01-20',
    entries: [
      { id: 'u1', customerId: 'c1', customerName: 'Rajesh Kumar', phone: '9876543210', date: '2025-01-20', amount: 1500, type: 'credit', note: 'Grocery purchase' },
      { id: 'u2', customerId: 'c1', customerName: 'Rajesh Kumar', phone: '9876543210', date: '2025-01-15', amount: 2000, type: 'credit', note: 'Monthly supplies' },
      { id: 'u3', customerId: 'c1', customerName: 'Rajesh Kumar', phone: '9876543210', date: '2025-01-10', amount: 1000, type: 'payment', note: 'Cash payment' },
    ]
  },
  {
    customerId: 'c3', customerName: 'Amit Singh', phone: '9988776655', balance: 800, lastTransaction: '2025-01-18',
    entries: [
      { id: 'u4', customerId: 'c3', customerName: 'Amit Singh', phone: '9988776655', date: '2025-01-18', amount: 800, type: 'credit', note: 'Purchase on credit' },
    ]
  },
  {
    customerId: 'c6', customerName: 'Kavita Joshi', phone: '9123456789', balance: 1200, lastTransaction: '2025-01-19',
    entries: [
      { id: 'u5', customerId: 'c6', customerName: 'Kavita Joshi', phone: '9123456789', date: '2025-01-19', amount: 2000, type: 'credit', note: 'Bulk purchase' },
      { id: 'u6', customerId: 'c6', customerName: 'Kavita Joshi', phone: '9123456789', date: '2025-01-12', amount: 800, type: 'payment', note: 'UPI payment' },
    ]
  },
  {
    customerId: 'c7', customerName: 'Deepak Verma', phone: '8901234567', balance: 4500, lastTransaction: '2024-10-30',
    entries: [
      { id: 'u7', customerId: 'c7', customerName: 'Deepak Verma', phone: '8901234567', date: '2024-10-30', amount: 4500, type: 'credit', note: 'Old dues pending' },
    ]
  },
  {
    customerId: 'c10', customerName: 'Ritu Agarwal', phone: '8123456789', balance: 600, lastTransaction: '2025-01-17',
    entries: [
      { id: 'u8', customerId: 'c10', customerName: 'Ritu Agarwal', phone: '8123456789', date: '2025-01-17', amount: 600, type: 'credit', note: 'Items on credit' },
    ]
  },
];

export const mockNotifications: AppNotification[] = [
  { id: 'n1', title: 'Low Stock Alert', message: 'Dolo 650mg Tab has only 8 units left', time: '10 min ago', read: false, type: 'warning' },
  { id: 'n2', title: 'Payment Received', message: 'Rajesh Kumar paid ₹1,000 towards dues', time: '25 min ago', read: false, type: 'success' },
  { id: 'n3', title: 'New Lead', message: 'Vikram Industries added to pipeline', time: '1 hr ago', read: false, type: 'info' },
  { id: 'n4', title: 'Overdue Reminder', message: 'Deepak Verma has ₹4,500 pending (85 days)', time: '2 hr ago', read: true, type: 'error' },
  { id: 'n5', title: 'Expiry Alert', message: 'Britannia Bread expires in 13 days', time: '5 hr ago', read: true, type: 'warning' },
];

export const revenueData = [
  { day: 'Mon', revenue: 18500, expenses: 8200 },
  { day: 'Tue', revenue: 22000, expenses: 9100 },
  { day: 'Wed', revenue: 15800, expenses: 7500 },
  { day: 'Thu', revenue: 28000, expenses: 11000 },
  { day: 'Fri', revenue: 32500, expenses: 12800 },
  { day: 'Sat', revenue: 41000, expenses: 14200 },
  { day: 'Sun', revenue: 25500, expenses: 9800 },
];

export const expenseCategoryData = [
  { name: 'Salary', value: 176000, color: '#8b5cf6' },
  { name: 'Rent', value: 25000, color: '#06b6d4' },
  { name: 'Marketing', value: 15000, color: '#f59e0b' },
  { name: 'Utilities', value: 8500, color: '#10b981' },
  { name: 'Transport', value: 6200, color: '#f43f5e' },
  { name: 'Misc', value: 4800, color: '#6366f1' },
];
