/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AppEvent, AppNotification, Supplier, Client, Quote, CRMTask } from '../types';
import type { Product } from '../types/product';
import type { PurchaseDocument, CostType } from '../types/purchase';
import type { SalesReport } from '../types/sales';
import type { SupplyRecord, ProductRequest } from '../types/supply';
import type { InventoryMovement } from '../lib/inventory/types';
import type { Brand } from '../lib/catalog/brands';
import { loadBrands, saveBrands } from '../lib/catalog/brands';
import { parseCfdi, parseSalesReport } from '../lib/parsers';
import { getEffectiveCostType, invoiceHasStockableLines } from '../lib/analytics/financial';

export * from '../types';

interface DataContextType {
  events: AppEvent[];
  setEvents: React.Dispatch<React.SetStateAction<AppEvent[]>>;

  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  updateProduct: (id: string, product: Partial<Product>) => void;
  bulkUpdateProducts: (ids: string[], updates: Partial<Product>) => void;

  incomes: SalesReport[];
  addIncome: (income: SalesReport) => void;
  deleteIncome: (id: string) => void;

  expenses: PurchaseDocument[];
  addExpense: (expense: PurchaseDocument) => void;
  deleteExpense: (id: string) => void;
  updateExpense: (id: string, updates: Partial<PurchaseDocument>) => void;
  updateLineCostType: (docId: string, lineId: string, costType: CostType) => void;

  suppliers: Supplier[];
  updateSupplier: (rfc: string, updates: Partial<Supplier>) => void;

  brands: Brand[];
  addBrand: (brand: Brand) => void;
  deleteBrand: (id: string) => void;

  supplyRecords: SupplyRecord[];
  addSupplyRecord: (record: SupplyRecord) => void;
  updateSupplyRecord: (id: string, updates: Partial<SupplyRecord>) => void;
  deleteSupplyRecord: (id: string) => void;

  productRequests: ProductRequest[];
  addProductRequest: (request: ProductRequest) => void;
  updateProductRequest: (id: string, updates: Partial<ProductRequest>) => void;
  deleteProductRequest: (id: string) => void;

  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  markNotificationAsRead: (id: string) => void;

  inventoryMovements: InventoryMovement[];

  // CRM
  clients: Client[];
  addClient: (client: Client) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  quotes: Quote[];
  addQuote: (quote: Quote) => void;
  updateQuote: (id: string, updates: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;

  crmTasks: CRMTask[];
  addCRMTask: (task: CRMTask) => void;
  updateCRMTask: (id: string, updates: Partial<CRMTask>) => void;
  deleteCRMTask: (id: string) => void;
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

  // Brands
  const [brands, setBrands] = useState<Brand[]>([]);

  // Supply chain
  const [supplyRecords, setSupplyRecords] = useState<SupplyRecord[]>([]);
  const [productRequests, setProductRequests] = useState<ProductRequest[]>([]);

  // CRM
  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [crmTasks, setCrmTasks] = useState<CRMTask[]>([]);

  // Supplier overrides (contact info persisted separately)
  const [supplierOverrides, setSupplierOverrides] = useState<Record<string, Partial<Supplier>>>({});

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
        try { savedExp = JSON.parse(storedExp); } catch { /* empty */ }
      }

      let savedInc: SalesReport[] = [];
      const storedInc = localStorage.getItem('mitron_incomes_v2') || localStorage.getItem('mitron_incomes');
      if (storedInc) {
        try { savedInc = JSON.parse(storedInc); } catch { /* empty */ }
      }

      let savedProds: Product[] = [];
      const storedProds = localStorage.getItem('mitron_products_v2') || localStorage.getItem('mitron_products');
      if (storedProds) {
        try { savedProds = JSON.parse(storedProds); } catch { /* empty */ }
      }

      // Load events
      let savedEvents: AppEvent[] = [];
      const storedEvents = localStorage.getItem('mitron_events_v1');
      if (storedEvents) {
        try { savedEvents = JSON.parse(storedEvents); } catch { /* empty */ }
      }

      // Load supplier overrides
      let savedSupplierOverrides: Record<string, Partial<Supplier>> = {};
      const storedSupOv = localStorage.getItem('mitron_supplier_overrides_v1');
      if (storedSupOv) {
        try { savedSupplierOverrides = JSON.parse(storedSupOv); } catch { /* empty */ }
      }

      // Load supply records
      let savedSupply: SupplyRecord[] = [];
      const storedSupply = localStorage.getItem('mitron_supply_v1');
      if (storedSupply) {
        try { savedSupply = JSON.parse(storedSupply); } catch { /* empty */ }
      }

      let savedRequests: ProductRequest[] = [];
      const legacyTasksFromReqs: CRMTask[] = [];
      const storedReqs = localStorage.getItem('mitron_requests_v1');
      if (storedReqs) {
        try { 
          savedRequests = JSON.parse(storedReqs).map((r: any) => {
            let status = r.status;
            if (['INVESTIGANDO', 'COTIZANDO', 'PEDIDO'].includes(status)) status = 'EN PROCESO';
            if (status === 'CONSEGUIDO') status = 'RESUELTA';
            if (status === 'NO DISPONIBLE' || status === 'CERRADO') status = 'CERRADA';
            if (!['PENDIENTE', 'EN PROCESO', 'RESUELTA', 'CERRADA'].includes(status)) status = 'PENDIENTE';
            
            // Migrate legacy followUpDate
            if (r.followUpDate) {
              legacyTasksFromReqs.push({
                id: `migrated_task_${r.id}`,
                title: 'Seguimiento de solicitud',
                reason: r.description,
                relatedTo: 'SOLICITUD',
                dueDate: r.followUpDate,
                status: 'PENDIENTE',
                clientId: r.clientId,
                createdAt: r.date || new Date().toISOString()
              });
              delete r.followUpDate;
            }

            return { ...r, status };
          }); 
        } catch { /* empty */ }
      }

      // Load CRM
      let savedClients: Client[] = [];
      try { 
        savedClients = JSON.parse(localStorage.getItem('mitron_clients_v1') || '[]').map((c: any) => ({
          ...c,
          type: ['FISICA', 'MORAL'].includes(c.type) ? c.type : undefined,
          status: ['PROSPECTO', 'CLIENTE', 'INACTIVO'].includes(c.status) ? c.status : 'PROSPECTO'
        })); 
      } catch { /* empty */ }
      let savedQuotes: Quote[] = [];
      try { 
        savedQuotes = JSON.parse(localStorage.getItem('mitron_quotes_v1') || '[]').map((q: any) => {
          let st = q.status;
          if (st === 'VIGENTE') st = 'ENVIADA';
          if (!['BORRADOR', 'ENVIADA', 'ACEPTADA', 'RECHAZADA', 'VENCIDA'].includes(st)) st = 'BORRADOR';
          return { ...q, status: st };
        }); 
      } catch { /* empty */ }
      let savedTasks: CRMTask[] = [];
      try { 
        savedTasks = JSON.parse(localStorage.getItem('mitron_crmtasks_v1') || '[]'); 
      } catch { /* empty */ }
      
      // Deduplicate migrated tasks
      for (const t of legacyTasksFromReqs) {
        if (!savedTasks.some(st => st.id === t.id)) {
          savedTasks.push(t);
        }
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

      // Apply cost type defaults for existing docs that don't have them
      savedExp = savedExp.map(doc => {
        const hasStockable = doc.lines.some(l => l.stockable);
        return {
          ...doc,
          lines: doc.lines.map(line => ({
            ...line,
            costType: line.costType || getEffectiveCostType(line, hasStockable),
          })),
        };
      });

      setExpenses(savedExp);
      setIncomes(savedInc);
      setProducts(savedProds);
      setEvents(savedEvents);
      setSupplierOverrides(savedSupplierOverrides);
      setBrands(loadBrands());
      setSupplyRecords(savedSupply);
      setProductRequests(savedRequests);
      setClients(savedClients);
      setQuotes(savedQuotes);
      setCrmTasks(savedTasks);
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
      localStorage.setItem('mitron_events_v1', JSON.stringify(events));
      localStorage.setItem('mitron_supplier_overrides_v1', JSON.stringify(supplierOverrides));
      localStorage.setItem('mitron_supply_v1', JSON.stringify(supplyRecords));
      localStorage.setItem('mitron_requests_v1', JSON.stringify(productRequests));
      localStorage.setItem('mitron_clients_v1', JSON.stringify(clients));
      localStorage.setItem('mitron_quotes_v1', JSON.stringify(quotes));
      localStorage.setItem('mitron_crmtasks_v1', JSON.stringify(crmTasks));
      saveBrands(brands);
    }
  }, [expenses, incomes, products, events, supplierOverrides, brands, supplyRecords, productRequests, clients, quotes, crmTasks, isReady]);

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

    // 3. Merge Manual Overrides (Prices + classification)
    const mergedProducts = Object.values(derivedProducts).map(dp => {
      const existing = products.find(p => p.sku === dp.sku);
      if (existing) {
        const merged = { ...dp };
        // Preserve manual price
        if (existing.salePriceSource === 'MANUAL') {
          merged.salePrice = existing.salePrice;
          merged.salePriceSource = 'MANUAL' as const;
        }
        // Preserve classification
        if (existing.categoryId !== undefined) merged.categoryId = existing.categoryId;
        if (existing.subcategoryId !== undefined) merged.subcategoryId = existing.subcategoryId;
        if (existing.brandId !== undefined) merged.brandId = existing.brandId;
        if (existing.tags !== undefined) merged.tags = existing.tags;
        return merged;
      }
      return dp;
    });

    // Apply supplier overrides
    Object.entries(supplierOverrides).forEach(([rfc, overrides]) => {
      if (derivedSuppliers[rfc]) {
        Object.assign(derivedSuppliers[rfc], overrides);
      }
    });

    setInventoryMovements(newMovements);
    setSuppliers(Object.values(derivedSuppliers));
    setProducts(mergedProducts);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, incomes, isReady, supplierOverrides]);

  const updateProduct = useCallback((id: string, updatedProduct: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedProduct } : p));
  }, []);

  const bulkUpdateProducts = useCallback((ids: string[], updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => ids.includes(p.id) ? { ...p, ...updates } : p));
  }, []);

  const addIncome = useCallback((income: SalesReport) => {
    setIncomes(prev => [...prev, income]);
  }, []);

  const deleteIncome = useCallback((id: string) => {
    setIncomes(prev => prev.filter(i => i.id !== id));
  }, []);

  const addExpense = useCallback((expense: PurchaseDocument) => {
    // Assign default cost types on import
    const hasStockable = invoiceHasStockableLines(expense);
    const processed: PurchaseDocument = {
      ...expense,
      lines: expense.lines.map(line => ({
        ...line,
        costType: getEffectiveCostType(line, hasStockable),
      })),
    };
    setExpenses(prev => [...prev, processed]);
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const updateExpense = useCallback((id: string, updates: Partial<PurchaseDocument>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, []);

  const updateLineCostType = useCallback((docId: string, lineId: string, costType: CostType) => {
    setExpenses(prev => prev.map(doc => {
      if (doc.id !== docId) return doc;
      return {
        ...doc,
        lines: doc.lines.map(line => {
          if (line.id !== lineId) return line;
          if (line.stockable) return line; // Cannot change stockable items
          return { ...line, costType };
        }),
      };
    }));
  }, []);

  const updateSupplier = useCallback((rfc: string, updates: Partial<Supplier>) => {
    setSupplierOverrides(prev => ({
      ...prev,
      [rfc]: { ...prev[rfc], ...updates },
    }));
  }, []);

  const addBrand = useCallback((brand: Brand) => {
    setBrands(prev => [...prev, brand]);
  }, []);

  const deleteBrand = useCallback((id: string) => {
    setBrands(prev => prev.filter(b => b.id !== id));
  }, []);

  const addSupplyRecord = useCallback((record: SupplyRecord) => {
    setSupplyRecords(prev => [...prev, record]);
  }, []);

  const updateSupplyRecord = useCallback((id: string, updates: Partial<SupplyRecord>) => {
    setSupplyRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const deleteSupplyRecord = useCallback((id: string) => {
    setSupplyRecords(prev => prev.filter(r => r.id !== id));
  }, []);

  const addProductRequest = useCallback((request: ProductRequest) => {
    setProductRequests(prev => [...prev, request]);
  }, []);

  const updateProductRequest = useCallback((id: string, updates: Partial<ProductRequest>) => {
    setProductRequests(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const deleteProductRequest = useCallback((id: string) => {
    setProductRequests(prev => prev.filter(r => r.id !== id));
  }, []);

  const addClient = useCallback((client: Client) => setClients(prev => [...prev, client]), []);
  const updateClient = useCallback((id: string, updates: Partial<Client>) => setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c)), []);
  const deleteClient = useCallback((id: string) => setClients(prev => prev.filter(c => c.id !== id)), []);

  const addQuote = useCallback((quote: Quote) => setQuotes(prev => [...prev, quote]), []);
  const updateQuote = useCallback((id: string, updates: Partial<Quote>) => setQuotes(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q)), []);
  const deleteQuote = useCallback((id: string) => setQuotes(prev => prev.filter(q => q.id !== id)), []);

  const addCRMTask = useCallback((task: CRMTask) => setCrmTasks(prev => [...prev, task]), []);
  const updateCRMTask = useCallback((id: string, updates: Partial<CRMTask>) => setCrmTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t)), []);
  const deleteCRMTask = useCallback((id: string) => setCrmTasks(prev => prev.filter(t => t.id !== id)), []);

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
    setNotifications(prev => [{ ...notif, id: Date.now().toString(), read: false, createdAt: new Date().toISOString() }, ...prev]);
  }, []);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  if (!isReady) return null;

  return (
    <DataContext.Provider value={{
      events, setEvents,
      products, setProducts, updateProduct, bulkUpdateProducts,
      incomes, addIncome, deleteIncome,
      expenses, addExpense, deleteExpense, updateExpense, updateLineCostType,
      suppliers, updateSupplier,
      brands, addBrand, deleteBrand,
      supplyRecords, addSupplyRecord, updateSupplyRecord, deleteSupplyRecord,
      productRequests, addProductRequest, updateProductRequest, deleteProductRequest,
      clients, addClient, updateClient, deleteClient,
      quotes, addQuote, updateQuote, deleteQuote,
      crmTasks, addCRMTask, updateCRMTask, deleteCRMTask,
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
