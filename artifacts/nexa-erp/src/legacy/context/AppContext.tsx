import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Role, CategoryId, ModuleId, CartItem, AppNotification, RegisteredUser } from '../types/erp';
import { mockNotifications } from '../data/mockData';

const USERS_KEY = 'nexaerp_users_v1';
const SESSION_KEY = 'nexaerp_session_v1';

const DEFAULT_USERS: RegisteredUser[] = [
  { id: 'u_owner', name: 'Sachin Rajojha', phone: '9876543210', email: 'owner@nexaerp.com', businessName: 'Shree Business Hub', category: 'retail', role: 'owner', username: 'owner', password: 'owner123', pin: '1234', createdAt: '2024-01-01' },
  { id: 'u_mgr', name: 'Arjun Patel', phone: '9876123456', email: 'manager@nexaerp.com', businessName: 'Shree Business Hub', category: 'retail', role: 'manager', username: 'manager', password: 'manager123', pin: '5678', createdAt: '2024-01-01' },
  { id: 'u_staff', name: 'Neha Singh', phone: '8765012345', email: 'staff@nexaerp.com', businessName: 'Shree Business Hub', category: 'retail', role: 'staff', username: 'staff', password: 'staff123', pin: '9012', createdAt: '2024-01-01' },
  { id: 'u_pharma', name: 'Dr. Rajesh Mehta', phone: '9988776655', email: 'pharma@nexaerp.com', businessName: 'City Medical Store', category: 'pharmacy', role: 'owner', username: 'pharma', password: 'pharma123', pin: '4321', createdAt: '2024-01-01' },
  { id: 'u_hotel', name: 'Ramesh Gupta', phone: '8877665544', email: 'hotel@nexaerp.com', businessName: 'Grand Palace Restaurant', category: 'hotel', role: 'owner', username: 'hotel', password: 'hotel123', pin: '8765', createdAt: '2024-01-01' },
  { id: 'u_realty', name: 'Vikram Sharma', phone: '7766554433', email: 'realty@nexaerp.com', businessName: 'Prime Properties', category: 'realEstate', role: 'owner', username: 'realty', password: 'realty123', pin: '1357', createdAt: '2024-01-01' },
];

function loadUsers(): RegisteredUser[] {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as RegisteredUser[];
      // Merge: always ensure default users exist (by id)
      const ids = new Set(parsed.map((u) => u.id));
      const merged = [...parsed, ...DEFAULT_USERS.filter((u) => !ids.has(u.id))];
      return merged;
    }
  } catch { /* ignore */ }
  localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS;
}

function saveUsers(users: RegisteredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

interface AppContextValue {
  // Auth
  registeredUsers: RegisteredUser[];
  currentUser: RegisteredUser | null;
  login: (username: string, password: string) => { ok: boolean; error?: string };
  register: (user: Omit<RegisteredUser, 'id' | 'createdAt'>) => void;
  logout: () => void;
  updateProfile: (updates: Partial<RegisteredUser>) => void;
  changePIN: (oldPin: string, newPin: string) => boolean;
  addStaffUser: (user: Omit<RegisteredUser, 'id' | 'createdAt'>) => void;
  // UI
  isLoggedIn: boolean;
  activeModule: ModuleId;
  setActiveModule: (m: ModuleId) => void;
  activeCategory: CategoryId;
  role: Role;
  darkMode: boolean;
  toggleDarkMode: () => void;
  isAIOpen: boolean;
  setIsAIOpen: (v: boolean) => void;
  isScannerOpen: boolean;
  setIsScannerOpen: (v: boolean) => void;
  notifications: AppNotification[];
  markAllRead: () => void;
  addNotification: (n: Omit<AppNotification, 'id' | 'time' | 'read'>) => void;
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
  globalSearch: string;
  setGlobalSearch: (v: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(loadUsers);
  const [currentUser, setCurrentUser] = useState<RegisteredUser | null>(() => {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      return s ? (JSON.parse(s) as RegisteredUser) : null;
    } catch { return null; }
  });
  const [activeModule, setActiveModule] = useState<ModuleId>('overview');
  const [darkMode, setDarkMode] = useState(true);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(mockNotifications);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [globalSearch, setGlobalSearch] = useState('');

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(d => {
      const next = !d;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  };

  const login = (username: string, password: string) => {
    const u = registeredUsers.find(r => r.username.toLowerCase() === username.toLowerCase() && r.password === password);
    if (!u) return { ok: false, error: 'Invalid username or password' };
    setCurrentUser(u);
    localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    return { ok: true };
  };

  const register = (user: Omit<RegisteredUser, 'id' | 'createdAt'>) => {
    const newUser: RegisteredUser = { ...user, id: `u_${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) };
    const updated = [...registeredUsers, newUser];
    setRegisteredUsers(updated);
    saveUsers(updated);
    setCurrentUser(newUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
    setActiveModule('overview');
  };

  const updateProfile = (updates: Partial<RegisteredUser>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    const newList = registeredUsers.map(u => u.id === updated.id ? updated : u);
    setRegisteredUsers(newList);
    saveUsers(newList);
  };

  const changePIN = (oldPin: string, newPin: string): boolean => {
    if (!currentUser || currentUser.pin !== oldPin) return false;
    updateProfile({ pin: newPin });
    return true;
  };

  const addStaffUser = (user: Omit<RegisteredUser, 'id' | 'createdAt'>) => {
    const newUser: RegisteredUser = { ...user, id: `u_${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) };
    const updated = [...registeredUsers, newUser];
    setRegisteredUsers(updated);
    saveUsers(updated);
  };

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const addNotification = (n: Omit<AppNotification, 'id' | 'time' | 'read'>) => {
    const notif: AppNotification = { ...n, id: Date.now().toString(), time: 'Just now', read: false };
    setNotifications(prev => [notif, ...prev]);
  };

  return (
    <AppContext.Provider value={{
      registeredUsers, currentUser, login, register, logout, updateProfile, changePIN, addStaffUser,
      isLoggedIn: currentUser !== null,
      activeModule, setActiveModule,
      activeCategory: currentUser?.category ?? 'retail',
      role: currentUser?.role ?? 'owner',
      darkMode, toggleDarkMode,
      isAIOpen, setIsAIOpen,
      isScannerOpen, setIsScannerOpen,
      notifications, markAllRead, addNotification,
      cart, setCart,
      globalSearch, setGlobalSearch,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
