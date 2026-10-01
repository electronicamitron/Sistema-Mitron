import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import type { ColumnDef, CellContext } from '@tanstack/react-table';
import { DataTable } from '../ui/DataTable';
import { formatDateHuman } from '../../lib/utils';

export function InventoryMovements() {
  const { inventoryMovements, products, expenses, incomes } = useData();
  const [filterType, setFilterType] = useState<string>('all');

  const movementsColumns: ColumnDef<any, any>[] = useMemo(() => [
    {
      accessorKey: 'occurredAt',
      header: 'Fecha / Periodo',
      cell: (info: CellContext<any, any>) => {
        const val = info.getValue() as string;
        if (val.includes(' ')) return <span className="text-mt-text-secondary text-sm">{val}</span>; // "Julio 2026"
        if (val.includes('T') || val.includes('-')) return <span className="text-mt-text-secondary text-sm">{formatDateHuman(val)}</span>;
        return <span className="text-mt-text-secondary text-sm">{formatDateHuman(val)}</span>;
      }
    },
    {
      accessorKey: 'productId',
      header: 'Producto',
      cell: (info: CellContext<any, any>) => {
        const prod = products.find(p => p.id === info.getValue());
        return (
          <div>
            <div className="font-semibold text-mt-text-primary text-sm">{prod?.description || 'Desconocido'}</div>
            <div className="text-[11px] text-mt-text-secondary">{prod?.sku || info.getValue()}</div>
          </div>
        );
      }
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: (info: CellContext<any, any>) => {
        const type = info.getValue() as string;
        const label = type === 'PURCHASE' ? 'Compra' : type === 'SALE' ? 'Venta' : type;
        return (
          <span className="text-mt-text-secondary text-xs bg-mt-surface-subtle px-2 py-0.5 rounded border border-mt-border">
            {label}
          </span>
        );
      }
    },
    {
      accessorKey: 'quantityDelta',
      header: 'Cantidad',
      cell: (info: CellContext<any, any>) => {
        const val = info.getValue() as number;
        return (
          <span className={`font-medium ${val > 0 ? 'text-emerald-400' : val < 0 ? 'text-rose-400' : 'text-mt-text-secondary'}`}>
            {val > 0 ? '+' : ''}{val}
          </span>
        );
      }
    },
    {
      accessorKey: 'sourceId',
      header: 'Documento origen',
      cell: (info: CellContext<any, any>) => {
        const id = info.getValue() as string;
        const type = info.row.original.type;
        
        let display = id;
        if (type === 'PURCHASE') {
          const expense = expenses.find(e => e.id === id);
          if (expense) {
            display = expense.serie ? `${expense.serie}-${expense.folio}` : expense.folio || id;
          }
        } else if (type === 'SALE') {
          const income = incomes.find(i => i.id === id);
          if (income) {
            display = income.txtFileRef || 'Ventas';
          }
        }
        
        if (display.length > 30) display = display.substring(0, 27) + '...';
        
        return (
          <button 
            onClick={() => { window.location.href = '/administration'; }}
            className="text-blue-400 hover:text-blue-300 transition-colors text-xs font-mono bg-transparent border-none cursor-pointer p-0 text-left"
          >
            {display}
          </button>
        );
      }
    }
  ], [products, expenses, incomes]);

  const filteredMovements = useMemo(() => {
    let filtered = [...inventoryMovements];
    if (filterType !== 'all') {
      filtered = filtered.filter(m => m.type === filterType);
    }
    return filtered.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  }, [inventoryMovements, filterType]);

  return (
    <div className="mt-panel rounded-xl border border-mt-border bg-mt-surface p-5 animate-fade-in">
      <div className="mb-6 flex gap-2">
        {['all', 'PURCHASE', 'SALE'].map(t => (
          <button 
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${filterType === t ? 'bg-mt-text-primary text-mt-bg' : 'bg-mt-surface-subtle text-mt-text-secondary hover:bg-mt-surface-hover border border-mt-border'}`}
          >
            {t === 'all' ? 'Todos' : t === 'PURCHASE' ? 'Compras' : 'Ventas'}
          </button>
        ))}
      </div>

      <DataTable 
        columns={movementsColumns}
        data={filteredMovements}
        searchKey="productId"
        searchPlaceholder="Buscar por producto..."
      />
    </div>
  );
}
