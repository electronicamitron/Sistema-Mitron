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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontWeight: 600, color: 'var(--mt-text-primary)' }}>{p.name}</div>
              {p.isMock && <span style={{ fontSize: '9px', backgroundColor: 'var(--mt-surface-subtle)', color: 'var(--mt-text-secondary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>DEMO</span>}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', marginTop: '2px' }}>{p.sku}</div>
          </div>
        )
      } 
    },
    { accessorKey: 'supplier', header: 'Proveedor', cell: (info: CellContext<any, any>) => <span style={{ color: 'var(--mt-text-secondary)' }}>{info.getValue() as string}</span> },
    { accessorKey: 'stock', header: 'Saldo', cell: (info: CellContext<any, any>) => {
        const stock = info.getValue() as number | null;
        return <span style={{ fontWeight: 600, fontSize: '15px', color: (stock !== null && stock < 0) ? '#fb7185' : 'inherit' }}>{stock !== null ? stock : '-'}</span>;
    }},
    { accessorKey: 'minStock', header: 'Mínimo', cell: (info: CellContext<any, any>) => <span style={{ color: 'var(--mt-text-secondary)' }}>{info.getValue() as number}</span> },
    { id: 'status', header: 'Estado', cell: (info: CellContext<any, any>) => {
        const p = info.row.original;
        const statusObj = getStockStatus(p.stock, p.minStock);
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: statusObj.bgColor, color: statusObj.color, padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 500, border: `1px solid ${statusObj.bgColor}` }}>
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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="mt-page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="mt-page-title" style={{ fontSize: '28px', letterSpacing: '-0.8px', marginBottom: '4px' }}>Inventario</h1>
          <p className="mt-page-subtitle" style={{ fontSize: '14px', color: 'var(--mt-text-secondary)' }}>Existencias, movimientos y alertas de stock.</p>
        </div>
      </div>

      <div className="mt-panel" style={{ borderRadius: '12px', border: '1px solid var(--mt-border)', backgroundColor: 'var(--mt-surface)', padding: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', justifyContent: 'flex-end' }}>
          <div style={{ width: '200px' }}>
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
