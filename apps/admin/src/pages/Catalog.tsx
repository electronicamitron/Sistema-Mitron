import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../components/ui/DataTable';
import { PackageX } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Button } from '@mitron/ui';
import type { ColumnDef, CellContext } from '@tanstack/react-table';
import type { Product } from '../types/product';

export default function Catalog() {
  const { products } = useData();
  const navigate = useNavigate();

  const formatCurrency = (val: number | null | undefined) => {
    if (val == null) return 'Sin definir';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  };

  const handleOpenEdit = useCallback((p: Product) => {
    navigate('/administration', { state: { tab: 'precios', selectedProductId: p.id } });
  }, [navigate]);

  const catalogColumns: ColumnDef<any, any>[] = useMemo(() => [
    { accessorKey: 'sku', header: 'SKU', cell: (info: CellContext<any, any>) => <span className="font-semibold text-mt-text-primary">{info.getValue() as string}</span> },
    { accessorKey: 'description', header: 'Descripción', cell: (info: CellContext<any, any>) => <span className="font-medium text-mt-text-primary">{info.getValue() as string}</span> },
    { accessorKey: 'unit', header: 'Unidad', cell: (info: CellContext<any, any>) => <span className="text-mt-text-secondary">{info.getValue() as string}</span> },
    { accessorKey: 'purchaseCost', header: 'Costo ref.', cell: (info: CellContext<any, any>) => <span className="text-mt-text-secondary">{info.getValue() !== null ? formatCurrency(info.getValue() as number) : 'Sin costo de compra'}</span> },
    { accessorKey: 'salePrice', header: 'Precio de venta', cell: (info: CellContext<any, any>) => {
        const val = info.getValue();
        return <span className={`font-semibold ${val !== null ? 'text-emerald-400' : 'text-mt-text-muted'}`}>{val !== null ? formatCurrency(val as number) : 'Sin precio'}</span>;
    }},
    { id: 'actions', header: 'Acciones', cell: (info: CellContext<any, any>) => {
        const hasPrice = info.row.original.salePrice !== null;
        const hasCost = info.row.original.purchaseCost !== null && info.row.original.purchaseCost > 0;
        
        if (!hasCost) {
          return <span className="text-xs text-mt-text-muted italic px-2">Sin costo de compra</span>;
        }

        return (
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEdit(info.row.original)}
            className="text-blue-400 hover:text-blue-300 px-2"
          >
            {hasPrice ? 'Recalcular' : 'Definir precio'}
          </Button>
        );
    }}
  ], [handleOpenEdit]);



  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="mt-page-header mb-0 items-center">
        <div>
          <h1 className="mt-page-title text-[28px] tracking-tight mb-1">Catálogo</h1>
          <p className="mt-page-subtitle text-sm text-mt-text-secondary">Directorio de productos derivados de los documentos importados.</p>
        </div>
      </div>

      <div className="mt-panel rounded-xl border border-mt-border bg-mt-surface p-5">
        {products.length === 0 ? (
           <div className="py-16 flex flex-col items-center justify-center text-mt-text-muted">
             <PackageX size={48} className="mb-4 opacity-50" />
             <p className="text-sm font-medium">El catálogo está vacío.</p>
             <p className="text-xs mt-1">Importa facturas o reportes de ventas para generar los productos automáticamente.</p>
           </div>
        ) : (
          <DataTable 
            columns={catalogColumns} 
            data={products} 
            searchKey="description" 
            searchPlaceholder="Buscar por producto o SKU..." 
          />
        )}
      </div>


    </div>
  );
}
