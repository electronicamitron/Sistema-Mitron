/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type EventType = 'pago' | 'fiscal' | 'operativo' | 'inventario';
export type EventStatus = 'pendiente' | 'completado';

export interface AppEvent {
  id: string;
  title: string;
  date: string; // ISO string YYYY-MM-DD
  type: EventType;
  description: string;
  status: EventStatus;
  isMock?: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  cost: number;
  price: number;
  supplier: string;
  stock: number | null;
  minStock: number;
  status: 'vigente' | 'descontinuado';
  isMock?: boolean;
}

export interface Income {
  id: string;
  period: string;
  date: string;
  filename: string;
  amount: number;
  total: number;
  status: 'verificado' | 'pendiente' | 'error';
  createdAt: string;
}

export interface Expense {
  id: string;
  date: string;
  supplier: string;
  invoiceId: string;
  category: string;
  total: number;
  status: 'pagado' | 'ppd' | 'pendiente';
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  read: boolean;
  createdAt: string;
}

interface DataContextType {
  events: AppEvent[];
  setEvents: React.Dispatch<React.SetStateAction<AppEvent[]>>;
  addEvent: (event: Omit<AppEvent, 'id'>) => void;
  updateEvent: (id: string, event: Partial<AppEvent>) => void;
  deleteEvent: (id: string) => void;
  
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  
  incomes: Income[];
  setIncomes: React.Dispatch<React.SetStateAction<Income[]>>;
  addIncome: (income: Omit<Income, 'id'>) => void;
  
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  markNotificationAsRead: (id: string) => void;
  
  // Helpers
  getStockStatus: (stock: number | null, minStock: number) => { status: 'disponible' | 'bajo' | 'sin' | 'revisar'; label: string; color: string; bgColor: string };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const initialProducts: Product[] = [
  { id: '1', sku: 'PROD-001', name: 'Producto Premium Alpha', category: 'Electrónica', cost: 120, price: 250, supplier: 'PROVEEDOR EJEMPLO S.A.', stock: 12, minStock: 5, status: 'vigente', isMock: true },
  { id: '2', sku: 'AUDIO-102', name: 'Auriculares In-Ear', category: 'Audio', cost: 45, price: 89.99, supplier: 'SONIDOS MUNDO S.A.', stock: 2, minStock: 5, status: 'vigente', isMock: true },
  { id: '3', sku: 'ACC-CBL-05', name: 'Cable HDMI 2.1 2M', category: 'Accesorios', cost: 8.5, price: 25, supplier: 'CABLES Y MAS C.A.', stock: 0, minStock: 10, status: 'vigente', isMock: true },
  { id: '4', sku: 'DISP-MON-27', name: 'Monitor 4K 27"', category: 'Pantallas', cost: 350, price: 599, supplier: 'PANTALLAS TECH', stock: null, minStock: 2, status: 'vigente', isMock: true },
];

const initialEvents: AppEvent[] = [
  { id: '1', title: 'Ejemplo: Pago a PROVEEDOR EJEMPLO', date: new Date(new Date().getFullYear(), new Date().getMonth(), 8).toISOString().split('T')[0], type: 'pago', description: 'Pago programado factura RF-131812', status: 'pendiente', isMock: true },
  { id: '2', title: 'Ejemplo: Declaración provisional', date: new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString().split('T')[0], type: 'fiscal', description: 'Impuestos del mes anterior', status: 'pendiente', isMock: true },
  { id: '3', title: 'Ejemplo: Cierre de inventario', date: new Date(new Date().getFullYear(), new Date().getMonth(), 28).toISOString().split('T')[0], type: 'inventario', description: 'Revisión mensual de stock', status: 'pendiente', isMock: true },
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<AppEvent[]>(() => {
    const saved = localStorage.getItem('mitron_events');
    return saved ? JSON.parse(saved) : initialEvents;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('mitron_products');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [incomes, setIncomes] = useState<Income[]>(() => {
    const saved = localStorage.getItem('mitron_incomes');
    return saved ? JSON.parse(saved) : [];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('mitron_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('mitron_notifications');
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'Bienvenido al Sistema Mitron', description: 'El sistema está en modo demostración. Los datos se guardan en tu navegador localmente.', type: 'info', read: false, createdAt: new Date().toISOString() }
    ];
  });

  useEffect(() => { localStorage.setItem('mitron_events', JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem('mitron_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('mitron_incomes', JSON.stringify(incomes)); }, [incomes]);
  useEffect(() => { localStorage.setItem('mitron_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('mitron_notifications', JSON.stringify(notifications)); }, [notifications]);

  // Methods
  const addEvent = (event: Omit<AppEvent, 'id'>) => {
    setEvents(prev => [...prev, { ...event, id: Date.now().toString() }]);
  };
  
  const updateEvent = (id: string, updatedEvent: Partial<AppEvent>) => {
    setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, ...updatedEvent } : ev));
  };
  
  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(ev => ev.id !== id));
  };

  const addProduct = (product: Omit<Product, 'id'>) => {
    setProducts(prev => [...prev, { ...product, id: Date.now().toString() }]);
  };

  const updateProduct = (id: string, updatedProduct: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedProduct } : p));
  };

  const addIncome = (income: Omit<Income, 'id'>) => {
    setIncomes(prev => [...prev, { ...income, id: Date.now().toString() }]);
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    setExpenses(prev => [...prev, { ...expense, id: Date.now().toString() }]);
  };

  const addNotification = (notif: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
    setNotifications(prev => [{ ...notif, id: Date.now().toString(), read: false, createdAt: new Date().toISOString() }, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getStockStatus = (stock: number | null, minStock: number): { status: 'disponible' | 'bajo' | 'sin' | 'revisar'; label: string; color: string; bgColor: string } => {
    if (stock === null) return { status: 'revisar', label: 'Por conciliar', color: 'text-blue-400', bgColor: 'bg-blue-400/10' };
    if (stock === 0) return { status: 'sin', label: 'Sin existencias', color: 'text-rose-400', bgColor: 'bg-rose-400/10' };
    if (stock <= minStock) return { status: 'bajo', label: 'Stock bajo', color: 'text-amber-400', bgColor: 'bg-amber-400/10' };
    return { status: 'disponible', label: 'Disponible', color: 'text-emerald-400', bgColor: 'bg-emerald-400/10' };
  };

  return (
    <DataContext.Provider value={{
      events, setEvents, addEvent, updateEvent, deleteEvent,
      products, setProducts, addProduct, updateProduct,
      incomes, setIncomes, addIncome,
      expenses, setExpenses, addExpense,
      notifications, setNotifications, addNotification, markNotificationAsRead,
      getStockStatus
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
