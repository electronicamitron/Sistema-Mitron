import { useState, useMemo } from 'react';
import { DataTable } from '../components/ui/DataTable';
import { Button, Modal } from '@mitron/ui';
import { InventoryMovements } from '../components/domain/InventoryMovements';
import { PackageCheck, PackageMinus, PackageX, Eye, AlertCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { getRawStock, getInventoryStatus, hasIncompleteHistory } from '../lib/inventory/selectors';
import type { ColumnDef, CellContext } from '@tanstack/react-table';
import type { Product } from '../types/product';

export default function Inventory() {
  const { products, inventoryMovements } = useData();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [activeTab, setActiveTab] = useState<'existencias' | 'movimientos'>('existencias');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const formatCurrency = (val: number | null | undefined) => {
    if (val == null) return 'Sin definir';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  };

  const handleDetailClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  const inventoryColumns: ColumnDef<any, any>[] = useMemo(() => [
    { 
      accessorKey: 'description', 
      header: 'Producto / SKU', 
      cell: (info: CellContext<any, any>) => {
        const p = info.row.original;
        return (
          <div>
            <div className="font-semibold text-mt-text-primary">{p.description}</div>
            <div className="text-xs text-mt-text-secondary mt-0.5">{p.sku}</div>
          </div>
        )
      } 
    },
    { accessorKey: 'unit', header: 'Unidad', cell: (info: CellContext<any, any>) => <span className="text-mt-text-secondary">{info.getValue() as string}</span> },
    { id: 'existencia', header: 'Existencia', cell: (info: CellContext<any, any>) => {
        const p = info.row.original;
        const rawStock = getRawStock(p.id, inventoryMovements);
        const hasAlert = hasIncompleteHistory(rawStock, p.hasPurchaseHistory);
        
        if (hasAlert) {
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-[15px] text-mt-text-secondary">—</span>
              <span className="text-[10px] text-mt-text-muted font-medium">Sin dato</span>
            </div>
          );
        }
        
        const displayed = Math.max(0, rawStock);
        return (
          <div className="flex flex-col">
            <span className={`font-semibold text-[15px] ${rawStock <= 0 ? 'text-rose-400' : 'text-inherit'}`}>{displayed}</span>
          </div>
        );
    }},
    { id: 'costo', header: 'Costo', cell: (info: CellContext<any, any>) => {
        const p = info.row.original;
        return <span className="text-mt-text-secondary">{formatCurrency(p.purchaseCost)}</span>;
    }},
    { id: 'precio', header: 'Precio de venta', cell: (info: CellContext<any, any>) => {
        const p = info.row.original;
        return <span className="font-medium text-mt-text-primary">{formatCurrency(p.salePrice)}</span>;
    }},
    { id: 'status', header: 'Estado', cell: (info: CellContext<any, any>) => {
        const p = info.row.original;
        const rawStock = getRawStock(p.id, inventoryMovements);
        const status = getInventoryStatus(rawStock, p.hasPurchaseHistory);
        const hasAlert = hasIncompleteHistory(rawStock, p.hasPurchaseHistory);
        
        return (
          <div 
            title={hasAlert ? 'Sin historial de compra' : ''}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border border-transparent ${
             hasAlert ? 'bg-blue-500/10 text-blue-400' :
             status === 'DISPONIBLE' ? 'bg-emerald-500/10 text-emerald-400' :
             status === 'STOCK BAJO' ? 'bg-amber-500/10 text-amber-400' :
             'bg-rose-500/10 text-rose-400'
          }`}>
            {hasAlert && <AlertCircle size={14} />}
            {!hasAlert && status === 'DISPONIBLE' && <PackageCheck size={14} />}
            {!hasAlert && status === 'STOCK BAJO' && <PackageMinus size={14} />}
            {!hasAlert && status === 'SIN EXISTENCIAS' && <PackageX size={14} />}
            {hasAlert ? 'SIN HISTORIAL' : status}
          </div>
        );
    }},
    { id: 'actions', header: 'Acciones', cell: (info: CellContext<any, any>) => (
      <Button variant="ghost" size="sm" onClick={() => handleDetailClick(info.row.original)} className="flex items-center gap-1.5 px-2">
        <Eye size={14} /> Detalle
      </Button>
    )}
  ], [inventoryMovements]);

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="mt-page-header mb-0">
        <div>
          <h1 className="mt-page-title text-[28px] tracking-tight mb-1">Inventario</h1>
          <p className="mt-page-subtitle text-sm text-mt-text-secondary">Existencias derivadas automáticamente desde facturas y reportes.</p>
        </div>
      </div>

      <div className="flex gap-6 mt-6 border-b border-mt-border">
        <button
          onClick={() => setActiveTab('existencias')}
          className={`bg-transparent border-none text-sm cursor-pointer pb-3 transition-all -mb-[1px] ${activeTab === 'existencias' ? 'text-mt-text-primary font-semibold border-b-2 border-mt-text-primary' : 'text-mt-text-secondary font-medium border-b-2 border-transparent'}`}
        >
          Existencias
        </button>
        <button
          onClick={() => setActiveTab('movimientos')}
          className={`bg-transparent border-none text-sm cursor-pointer pb-3 transition-all -mb-[1px] ${activeTab === 'movimientos' ? 'text-mt-text-primary font-semibold border-b-2 border-mt-text-primary' : 'text-mt-text-secondary font-medium border-b-2 border-transparent'}`}
        >
          Movimientos
        </button>
      </div>

      {activeTab === 'existencias' ? (
        <div className="mt-panel rounded-xl border border-mt-border bg-mt-surface p-5 animate-fade-in">
          <div className="mb-6 flex gap-2">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'DISPONIBLE', label: 'Disponibles' },
              { id: 'STOCK BAJO', label: 'Stock bajo' },
              { id: 'SIN EXISTENCIAS', label: 'Sin existencias' },
              { id: 'SIN HISTORIAL', label: 'Sin historial' }
            ].map(f => (
              <button 
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${filterStatus === f.id ? 'bg-mt-text-primary text-mt-bg' : 'bg-mt-surface-subtle text-mt-text-secondary hover:bg-mt-surface-hover border border-mt-border'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <DataTable 
            columns={inventoryColumns} 
            data={products.filter(p => {
              if (filterStatus === 'all') return true;
              const rawStock = getRawStock(p.id, inventoryMovements);
              const status = getInventoryStatus(rawStock, p.hasPurchaseHistory);
              const hasAlert = hasIncompleteHistory(rawStock, p.hasPurchaseHistory);
              if (filterStatus === 'SIN HISTORIAL') return hasAlert;
              if (hasAlert) return false;
              return status === filterStatus;
            })} 
            searchKey="description" 
            searchPlaceholder="Buscar por producto o SKU..." 
          />
        </div>
      ) : (
        <InventoryMovements />
      )}

      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Detalle de Inventario" width="450px">
        {selectedProduct && (() => {
          const rawStock = getRawStock(selectedProduct.id, inventoryMovements);
          const hasAlert = hasIncompleteHistory(rawStock, selectedProduct.hasPurchaseHistory);
          const totalPurchased = inventoryMovements.filter(m => m.productId === selectedProduct.id && m.type === 'PURCHASE').reduce((s, m) => s + m.quantityDelta, 0);
          const totalSold = inventoryMovements.filter(m => m.productId === selectedProduct.id && m.type === 'SALE').reduce((s, m) => s + Math.abs(m.quantityDelta), 0);

          return (
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-mt-surface-subtle border border-mt-border rounded-lg">
                <div className="text-sm font-semibold text-mt-text-primary">{selectedProduct.description}</div>
                <div className="text-xs text-mt-text-secondary mt-1">SKU: {selectedProduct.sku} | Unidad: {selectedProduct.unit}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-mt-surface border border-mt-border rounded-lg text-center">
                  <div className="text-[11px] text-mt-text-secondary mb-1">Comprado registrado</div>
                  <div className="text-lg font-bold text-emerald-400">{totalPurchased}</div>
                </div>
                <div className="p-3 bg-mt-surface border border-mt-border rounded-lg text-center">
                  <div className="text-[11px] text-mt-text-secondary mb-1">Vendido registrado</div>
                  <div className="text-lg font-bold text-rose-400">{totalSold}</div>
                </div>
              </div>

              <div className="p-4 bg-mt-surface border border-mt-border rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-mt-text-secondary mb-1">Existencia calculada</div>
                  {hasAlert ? (
                    <div className="text-xl font-bold text-mt-text-secondary">No disponible</div>
                  ) : (
                    <div className="text-2xl font-bold text-mt-text-primary">{Math.max(0, rawStock)}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-mt-text-secondary mb-1">Estado</div>
                  <div className="text-sm font-semibold text-mt-text-primary">{getInventoryStatus(rawStock, selectedProduct.hasPurchaseHistory)}</div>
                </div>
              </div>

              {hasAlert && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3 items-start">
                  <AlertCircle size={16} className="text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-mt-text-secondary leading-relaxed">
                    No hay compras suficientes registradas para calcular la existencia de este producto.
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-mt-border flex justify-end">
                <Button variant="ghost" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
