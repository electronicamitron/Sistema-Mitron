import { Drawer } from '../ui/Drawer';
import type { SalesReport } from '../../types/sales';

import { DataTable } from '../ui/DataTable';
import { useMemo } from 'react';
import type { ColumnDef, CellContext } from '@tanstack/react-table';
import { formatPeriod } from '../../lib/utils';

interface IncomeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  income: SalesReport | null;
}

export function IncomeDrawer({ isOpen, onClose, income }: IncomeDrawerProps) {
  const columns: ColumnDef<any, any>[] = useMemo(() => [
    { accessorKey: 'sku', header: 'SKU', cell: (info: CellContext<any, any>) => <span className="font-semibold text-mt-text-primary text-[12px]">{info.getValue() as string}</span> },
    { accessorKey: 'description', header: 'Descripción', cell: (info: CellContext<any, any>) => <span className="font-medium text-mt-text-primary text-[12px] truncate max-w-[200px] block" title={info.getValue() as string}>{info.getValue() as string}</span> },
    { accessorKey: 'quantity', header: 'Cant.', cell: (info: CellContext<any, any>) => <span className="font-medium text-[12px]">{info.getValue() as number}</span> },
    { accessorKey: 'total', header: 'Total', cell: (info: CellContext<any, any>) => <span className="font-semibold text-emerald-400 text-[12px]">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(info.getValue() as number)}</span> },
  ], []);

  if (!isOpen || !income) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  };



  const totalUnits = income.lines.reduce((s, l) => s + l.quantity, 0);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Detalle de Reporte de Ventas" width="600px">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-mt-surface-subtle p-4 rounded-lg border border-mt-border">
            <div className="text-xs text-mt-text-secondary mb-1">Archivo de origen</div>
            <div className="font-semibold text-mt-text-primary break-all">{income.txtFileRef}</div>
          </div>
          <div className="bg-mt-surface-subtle p-4 rounded-lg border border-mt-border">
            <div className="text-xs text-mt-text-secondary mb-1">Periodo reportado</div>
            <div className="font-semibold text-mt-text-primary">
              {formatPeriod(income.periodStart, income.periodEnd)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-mt-surface border border-mt-border p-4 rounded-lg text-center">
            <div className="text-xs text-mt-text-secondary uppercase tracking-wider mb-2 font-semibold">Registros</div>
            <div className="text-2xl font-bold text-mt-text-primary">{income.lines.length}</div>
          </div>
          <div className="bg-mt-surface border border-mt-border p-4 rounded-lg text-center">
            <div className="text-xs text-mt-text-secondary uppercase tracking-wider mb-2 font-semibold">Unidades</div>
            <div className="text-2xl font-bold text-mt-text-primary">{totalUnits}</div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg text-center">
            <div className="text-xs text-emerald-400/80 uppercase tracking-wider mb-2 font-semibold">Total Ingreso</div>
            <div className="text-2xl font-bold text-emerald-400">{formatCurrency(income.total)}</div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-mt-text-primary mb-4 pb-2 border-b border-mt-border">Desglose de productos vendidos</h3>
          <DataTable columns={columns} data={income.lines} searchKey="description" searchPlaceholder="Buscar artículo..." />
        </div>
      </div>
    </Drawer>
  );
}
