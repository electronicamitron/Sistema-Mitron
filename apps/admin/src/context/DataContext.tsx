/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AppEvent, AppNotification, Supplier } from '../types';
import type { Product } from '../types/product';
import type { PurchaseDocument } from '../types/purchase';
import type { SalesReport } from '../types/sales';
import type { InventoryMovement } from '../lib/inventory/types';
import { parseCfdi, parseSalesReport } from '../lib/parsers';

export * from '../types';

interface DataContextType {
  events: AppEvent[];
  setEvents: React.Dispatch<React.SetStateAction<AppEvent[]>>;
  
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  updateProduct: (id: string, product: Partial<Product>) => void;
  
  incomes: SalesReport[];
  addIncome: (income: SalesReport) => void;
  deleteIncome: (id: string) => void;
  
  expenses: PurchaseDocument[];
  addExpense: (expense: PurchaseDocument) => void;
  deleteExpense: (id: string) => void;
  
  suppliers: Supplier[];
  
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  markNotificationAsRead: (id: string) => void;
  
  inventoryMovements: InventoryMovement[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const REAL_DATA_V1 = 'REAL_DATA_V1';

export function DataProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  // States
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  // Master Documents
  const [expenses, setExpenses] = useState<PurchaseDocument[]>([]);
  const [incomes, setIncomes] = useState<SalesReport[]>([]);
  
  // Derived state that also needs manual overrides (salePrice)
  const [products, setProducts] = useState<Product[]>([]);

  // Derived completely on the fly
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Initialization & Migration
  useEffect(() => {
    const initData = async () => {
      const currentVersion = localStorage.getItem('mitron_schema_version');
      
      // Always load existing data first
      let savedExp: PurchaseDocument[] = [];
      const storedExp = localStorage.getItem('mitron_expenses_v2') || localStorage.getItem('mitron_expenses');
      if (storedExp) {
        try { savedExp = JSON.parse(storedExp); } catch(e) {}
      }
      
      let savedInc: SalesReport[] = [];
      const storedInc = localStorage.getItem('mitron_incomes_v2') || localStorage.getItem('mitron_incomes');
      if (storedInc) {
        try { savedInc = JSON.parse(storedInc); } catch(e) {}
      }

      let savedProds: Product[] = [];
      const storedProds = localStorage.getItem('mitron_products_v2') || localStorage.getItem('mitron_products');
      if (storedProds) {
        try { savedProds = JSON.parse(storedProds); } catch(e) {}
      }
      
      if (currentVersion !== REAL_DATA_V1) {
        localStorage.setItem('mitron_schema_version', REAL_DATA_V1);
        
        // Seed new data and deduplicate
        try {
          const xmlRes = await fetch('/test-data/compras/KEL990126MW9FRF131812/KEL990126MW9FRF131812.xml');
          if (xmlRes.ok) {
            const xmlText = await xmlRes.text();
            const purchase = parseCfdi(xmlText, 'KEL990126MW9FRF131812.xml', 'KEL990126MW9FRF131812.pdf');
            
            // Deduplicate CFDI
            const isDuplicate = savedExp.some(e => 
              (e.uuid && purchase.uuid && e.uuid === purchase.uuid) || 
              (!e.uuid && e.supplierRfc === purchase.supplierRfc && e.serie === purchase.serie && e.folio === purchase.folio && e.date === purchase.date)
            );
            
            if (!isDuplicate) {
              savedExp.push(purchase);
            }
          }
          
          const txtRes = await fetch('/test-data/ventas/2026-07/Julio Ventas por Articulo.txt');
          if (txtRes.ok) {
             const txtBuffer = await txtRes.arrayBuffer();
             const decoder = new TextDecoder('windows-1252');
             const txtText = decoder.decode(txtBuffer);
             
             const sales = parseSalesReport(txtText, 'Julio Ventas por Articulo.txt', 'Julio Ventas por articulo.pdf');
             const isDuplicate = savedInc.some(i => i.txtFileRef === sales.txtFileRef);
             
             if (!isDuplicate) {
               savedInc.push(sales);
             }
          }
        } catch (e) {
          console.error('Error seeding data:', e);
        }
      }

      setExpenses(savedExp);
      setIncomes(savedInc);
      setProducts(savedProds);
      setIsReady(true);
    };
    initData();
  }, []);

  // Persist Manual Overrides
  useEffect(() => {
    if (isReady) {
      localStorage.setItem('mitron_expenses_v2', JSON.stringify(expenses));
      localStorage.setItem('mitron_incomes_v2', JSON.stringify(incomes));
      localStorage.setItem('mitron_products_v2', JSON.stringify(products));
    }
  }, [expenses, incomes, products, isReady]);

  // DERIVATION ENGINE
  useEffect(() => {
    if (!isReady) return;
    
    const newMovements: InventoryMovement[] = [];
    const derivedSuppliers: Record<string, Supplier> = {};
    const derivedProducts: Record<string, Product> = {};

    // 1. Process Expenses (Purchases)
    expenses.forEach(exp => {
      // Derive supplier
      if (!derivedSuppliers[exp.supplierRfc]) {
        derivedSuppliers[exp.supplierRfc] = {
          id: exp.supplierRfc,
          rfc: exp.supplierRfc,
          name: exp.supplierName,
        };
      }
      
      // Derive products and movements
      exp.lines.forEach(line => {
        if (!line.sku) return; // Ignore lines without SKU for products
        if (!line.stockable) return; // Ignore E48/Services, don't create products or movements
        
        if (!derivedProducts[line.sku]) {
          derivedProducts[line.sku] = {
            id: line.sku,
            sku: line.sku,
            description: line.description,
            unit: line.unit,
            category: null,
            purchaseCost: line.unitCost,
            salePrice: null,
            salePriceSource: 'REPORT' as const,
            lastPurchaseAt: exp.date,
            hasPurchaseHistory: true,
            sources: ['XML']
          };
        } else {
          // Update to latest purchase cost
          const p = derivedProducts[line.sku];
          if (!p.lastPurchaseAt || new Date(exp.date) > new Date(p.lastPurchaseAt)) {
            p.purchaseCost = line.unitCost;
            p.lastPurchaseAt = exp.date;
            p.description = line.description;
            p.unit = line.unit;
          }
          if (!p.sources.includes('XML')) p.sources.push('XML');
        }

        // Inventory movement if stockable
        newMovements.push({
          id: `mov-pur-${line.id}`,
          productId: line.sku,
          type: 'PURCHASE',
          quantityDelta: line.quantity,
          occurredAt: exp.date,
          sourceType: 'XML',
          sourceId: exp.id,
          sourceLineId: line.id
        });
      });
    });

    // 2. Process Incomes (Sales)
    incomes.forEach(inc => {
      inc.lines.forEach(line => {
        if (!line.sku) return;
        
        if (!derivedProducts[line.sku]) {
          derivedProducts[line.sku] = {
            id: line.sku,
            sku: line.sku,
            description: line.description, // Fallback
            unit: line.unit, // Fallback
            category: null,
            purchaseCost: null, // "Sin costo de compra"
            salePrice: line.unitPrice,
            salePriceSource: 'REPORT' as const,
            lastPurchaseAt: null,
            hasPurchaseHistory: false,
            sources: ['TXT']
          };
        } else {
          const p = derivedProducts[line.sku];
          if (!p.sources.includes('TXT')) p.sources.push('TXT');
          if (p.salePriceSource !== 'MANUAL' && line.quantity > 0) {
             p.salePrice = line.total / line.quantity;
          }
        }
        
        // Sales are always movements reducing stock
        newMovements.push({
          id: `mov-sal-${line.id}`,
          productId: line.sku,
          type: 'SALE',
          quantityDelta: -line.quantity,
          occurredAt: inc.periodEnd, // Approximation
          sourceType: 'TXT',
          sourceId: inc.id,
          sourceLineId: line.id
        });
      });
    });

    // 3. Merge Manual Overrides (Prices)
    const mergedProducts = Object.values(derivedProducts).map(dp => {
      const existing = products.find(p => p.sku === dp.sku);
      if (existing && existing.salePriceSource === 'MANUAL') {
        return { ...dp, salePrice: existing.salePrice, salePriceSource: 'MANUAL' as const };
      }
      return dp;
    });

    // To prevent infinite loops, check if products actually changed lengths or keys
    // We only update if necessary, but easiest is just replace since we depend on `isReady`.
    // Wait, setting state inside useEffect depending on `expenses` will trigger it if we set `products`.
    // We shouldn't put `products` in the dependency array.
    
    setInventoryMovements(newMovements);
    setSuppliers(Object.values(derivedSuppliers));
    setProducts(mergedProducts);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, incomes, isReady]); 

  const updateProduct = (id: string, updatedProduct: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedProduct } : p));
  };

  const addIncome = (income: SalesReport) => {
    setIncomes(prev => [...prev, income]);
  };
  
  const deleteIncome = (id: string) => {
    setIncomes(prev => prev.filter(i => i.id !== id));
  };

  const addExpense = (expense: PurchaseDocument) => {
    setExpenses(prev => [...prev, expense]);
  };
  
  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const addNotification = (notif: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
    setNotifications(prev => [{ ...notif, id: Date.now().toString(), read: false, createdAt: new Date().toISOString() }, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  if (!isReady) return null;

  return (
    <DataContext.Provider value={{
      events, setEvents,
      products, setProducts, updateProduct,
      incomes, addIncome, deleteIncome,
      expenses, addExpense, deleteExpense,
      suppliers, 
      notifications, setNotifications, addNotification, markNotificationAsRead,
      inventoryMovements
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
