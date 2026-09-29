import { useState, useMemo } from 'react';
import { DataTable } from '../components/ui/DataTable';
import { Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@mitron/ui';
import { StockConfigModal } from '../components/domain/StockConfigModal';
import { Settings2, PackageCheck, PackageMinus, PackageX, AlertCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import type { ColumnDef, CellContext } from '@tanstack/react-table';

export default function Inventory() {
  const { products, getStockStatus } = useData();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');

  const handleConfigClick = (id: string) => {
    setSelectedProductId(id);
    setIsConfigOpen(true);
  };

  const inventoryColumns: ColumnDef<any, any>[] = useMemo(() => [
    { 
      accessorKey: 'name', 
      header: 'Producto / SKU', 
      cell: (info: CellContext<any, any>) => {
        const p = info.row.original;
        return (
          <div>
            <div className="flex items-center gap-2">
              <div className="font-semibold text-mt-text-primary">{p.name}</div>
              {p.isMock && <span className="text-[9px] bg-mt-surface-subtle text-mt-text-secondary px-1.5 py-0.5 rounded font-semibold">DEMO</span>}
            </div>
            <div className="text-xs text-mt-text-secondary mt-0.5">{p.sku}</div>
          </div>
        )
      } 
    },
    { accessorKey: 'supplier', header: 'Proveedor', cell: (info: CellContext<any, any>) => <span className="text-mt-text-secondary">{info.getValue() as string}</span> },
    { accessorKey: 'stock', header: 'Saldo', cell: (info: CellContext<any, any>) => {
        const stock = info.getValue() as number | null;
        return <span className={`font-semibold text-[15px] ${(stock !== null && stock < 0) ? 'text-rose-400' : 'text-inherit'}`}>{stock !== null ? stock : '-'}</span>;
    }},
    { accessorKey: 'minStock', header: 'Mínimo', cell: (info: CellContext<any, any>) => <span className="text-mt-text-secondary">{info.getValue() as number}</span> },
    { id: 'status', header: 'Estado', cell: (info: CellContext<any, any>) => {
        const p = info.row.original;
        const statusObj = getStockStatus(p.stock, p.minStock);
        // Using classes instead of inline styles
        return (
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-transparent ${statusObj.bgColor} ${statusObj.color}`}>
            {statusObj.status === 'disponible' && <PackageCheck size={14} />}
            {statusObj.status === 'bajo' && <PackageMinus size={14} />}
            {statusObj.status === 'sin' && <PackageX size={14} />}
            {statusObj.status === 'revisar' && <AlertCircle size={14} />}
            {statusObj.label}
          </div>
        );
    }},
    { id: 'actions', header: 'Acciones', cell: (info: CellContext<any, any>) => (
      <Button variant="ghost" size="sm" onClick={() => handleConfigClick(info.row.original.id)} className="flex items-center gap-1.5">
        <Settings2 size={14} /> Configurar
      </Button>
    )}
  ], [getStockStatus]);

  const filteredProducts = products.filter(p => {
    const statusObj = getStockStatus(p.stock, p.minStock);
    const matchStatus = statusFilter === 'all' || statusFilter === '' || statusObj.status === statusFilter;
    return matchStatus;
  });

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="mt-page-header mb-0">
        <div>
          <h1 className="mt-page-title text-[28px] tracking-tight mb-1">Inventario</h1>
          <p className="mt-page-subtitle text-sm text-mt-text-secondary">Existencias, movimientos y alertas de stock.</p>
        </div>
      </div>

      <div className="mt-panel rounded-xl border border-mt-border bg-mt-surface p-5">
        <div className="flex flex-wrap gap-4 mb-6 justify-end">
          <div className="w-[200px]">
            <Select value={statusFilter || 'all'} onValueChange={(val) => setStatusFilter(val === 'all' ? '' : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="bajo">Stock Bajo</SelectItem>
                <SelectItem value="sin">Sin Existencias</SelectItem>
                <SelectItem value="revisar">Por Conciliar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DataTable 
          columns={inventoryColumns} 
          data={filteredProducts} 
          searchKey="name" 
          searchPlaceholder="Buscar por producto o SKU..." 
        />
      </div>

      <StockConfigModal 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
        productId={selectedProductId} 
      />
    </div>
  );
}
