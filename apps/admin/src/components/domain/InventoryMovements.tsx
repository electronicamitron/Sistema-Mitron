import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import type { ColumnDef, CellContext } from '@tanstack/react-table';
import { DataTable } from '../ui/DataTable';
import { Modal, Button, Input } from '@mitron/ui';
import { formatDateHuman, formatPeriod } from '../../lib/utils';
import { getDocumentDate } from '../../lib/analytics/financial';
import { FileText, Eye, FileSpreadsheet } from 'lucide-react';

export function InventoryMovements() {
  const { inventoryMovements, products, expenses, incomes, suppliers } = useData();
  const [viewMode, setViewMode] = useState<'document' | 'product'>('document');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // --- Document View ---
  const documents = useMemo(() => {
    const docs: any[] = [];
    expenses.forEach(e => {
      const stockableLines = e.lines.filter(l => l.stockable);
      if (stockableLines.length > 0) {
        const supplier = suppliers.find(s => s.rfc === e.supplierRfc);
        docs.push({
          id: e.id,
          type: 'PURCHASE',
          title: `Compra · ${supplier?.name || e.supplierName}`,
          reference: e.serie ? `${e.serie}-${e.folio}` : e.folio || e.uuid?.split('-')[0],
          date: e.date,
          linesCount: stockableLines.length,
          totalUnits: stockableLines.reduce((s, l) => s + l.quantity, 0),
          totalCost: e.total,
          source: e
        });
      }
    });

    incomes.forEach(i => {
      docs.push({
        id: i.id,
        type: 'SALE',
        title: 'Ventas',
        reference: i.txtFileRef,
        date: getDocumentDate(i),
        linesCount: i.lines.length,
        totalUnits: i.lines.reduce((s, l) => s + l.quantity, 0),
        totalCost: i.total,
        source: i
      });
    });

    return docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, incomes, suppliers]);

  const docColumns: ColumnDef<any, any>[] = useMemo(() => [
    {
      accessorKey: 'reference',
      header: 'Documento',
      cell: (info: CellContext<any, any>) => (
        <div className="flex flex-col">
          <span className="font-semibold text-mt-text-primary text-[13px] break-all">{info.getValue() as string}</span>
          <span className="text-[11px] text-mt-text-secondary">{info.row.original.title}</span>
        </div>
      )
    },
    {
      accessorKey: 'date',
      header: 'Fecha / Periodo',
      cell: (info: CellContext<any, any>) => {
        const val = info.getValue() as string;
        const o = info.row.original;
        if (o.type === 'SALE') {
          return <span className="text-mt-text-secondary text-xs">{formatPeriod(o.source.periodStart, o.source.periodEnd)}</span>;
        }
        return <span className="text-mt-text-secondary text-xs">{formatDateHuman(val)}</span>;
      }
    },
    {
      accessorKey: 'linesCount',
      header: 'Registros',
      cell: (info: CellContext<any, any>) => <span className="text-xs">{info.getValue() as number} {info.row.original.type === 'PURCHASE' ? 'líneas' : 'registros'}</span>
    },
    {
      accessorKey: 'totalUnits',
      header: 'Unidades',
      cell: (info: CellContext<any, any>) => <span className="text-xs font-medium text-emerald-400">{info.getValue() as number} un.</span>
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: (info: CellContext<any, any>) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedDocId(info.row.original.id)} className="gap-2">
          <Eye size={14} /> Ver detalle
        </Button>
      )
    }
  ], []);

  // --- Product View ---
  const [productSearch, setProductSearch] = useState('');
  const productMovements = useMemo(() => {
    let movs = [...inventoryMovements];
    if (productSearch) {
      const q = productSearch.toLowerCase();
      const matchedProdIds = new Set(products.filter(p => p.sku.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)).map(p => p.id));
      movs = movs.filter(m => matchedProdIds.has(m.productId));
    }
    return movs.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  }, [inventoryMovements, products, productSearch]);

  const prodColumns: ColumnDef<any, any>[] = useMemo(() => [
    {
      accessorKey: 'occurredAt',
      header: 'Fecha',
      cell: (info: CellContext<any, any>) => {
        const val = info.getValue() as string;
        if (val.includes(' ')) return <span className="text-mt-text-secondary text-xs">{val}</span>;
        return <span className="text-mt-text-secondary text-xs">{formatDateHuman(val)}</span>;
      }
    },
    {
      accessorKey: 'productId',
      header: 'Producto',
      cell: (info: CellContext<any, any>) => {
        const prod = products.find(p => p.id === info.getValue());
        return (
          <div>
            <div className="font-semibold text-mt-text-primary text-[12px] truncate max-w-[200px]">{prod?.description || 'Desconocido'}</div>
            <div className="text-[10px] text-mt-text-secondary">{prod?.sku || info.getValue()}</div>
          </div>
        );
      }
    },
    {
      accessorKey: 'quantityDelta',
      header: 'Cant.',
      cell: (info: CellContext<any, any>) => {
        const val = info.getValue() as number;
        return (
          <span className={`font-medium text-xs ${val > 0 ? 'text-emerald-400' : val < 0 ? 'text-rose-400' : 'text-mt-text-secondary'}`}>
            {val > 0 ? '+' : ''}{val}
          </span>
        );
      }
    },
    {
      accessorKey: 'sourceId',
      header: 'Documento',
      cell: (info: CellContext<any, any>) => {
        const id = info.getValue() as string;
        const type = info.row.original.type;
        let display = id;
        if (type === 'PURCHASE') {
          const expense = expenses.find(e => e.id === id);
          if (expense) display = expense.serie ? `${expense.serie}-${expense.folio}` : expense.folio || id;
        } else if (type === 'SALE') {
          const income = incomes.find(i => i.id === id);
          if (income) display = income.txtFileRef || 'Ventas';
        }
        return <span className="text-[11px] font-mono text-mt-text-secondary truncate max-w-[150px] inline-block" title={display}>{display}</span>;
      }
    }
  ], [products, expenses, incomes]);

  // --- Modal Detail ---
  const selectedDocMovements = useMemo(() => {
    if (!selectedDocId) return [];
    return inventoryMovements.filter(m => m.sourceId === selectedDocId);
  }, [selectedDocId, inventoryMovements]);

  const detailColumns: ColumnDef<any, any>[] = useMemo(() => [
    {
      accessorKey: 'productId',
      header: 'SKU',
      cell: (info: CellContext<any, any>) => {
        const prod = products.find(p => p.id === info.getValue());
        return <span className="font-semibold text-mt-text-primary text-[12px]">{prod?.sku || info.getValue()}</span>;
      }
    },
    {
      id: 'desc',
      header: 'Producto',
      cell: (info: CellContext<any, any>) => {
        const prod = products.find(p => p.id === info.row.original.productId);
        return <span className="font-medium text-[12px] text-mt-text-primary truncate max-w-[200px] block" title={prod?.description}>{prod?.description || 'Desconocido'}</span>;
      }
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: (info: CellContext<any, any>) => <span className="text-[10px] text-mt-text-secondary uppercase tracking-wider">{info.getValue() === 'PURCHASE' ? 'Compra' : 'Venta'}</span>
    },
    {
      accessorKey: 'quantityDelta',
      header: 'Cantidad',
      cell: (info: CellContext<any, any>) => {
        const val = info.getValue() as number;
        return <span className={`font-semibold text-[12px] ${val > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{val > 0 ? '+' : ''}{val}</span>;
      }
    }
  ], [products]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  const selectedDocObj = documents.find(d => d.id === selectedDocId);

  return (
    <div className="mt-panel rounded-xl border border-mt-border bg-mt-surface p-5 animate-fade-in">
      <div className="mb-6 flex gap-4 border-b border-mt-border pb-4">
        <button 
          onClick={() => setViewMode('document')}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border-none cursor-pointer ${viewMode === 'document' ? 'bg-mt-text-primary text-mt-bg' : 'bg-mt-surface-subtle text-mt-text-secondary hover:text-mt-text-primary'}`}
        >
          <FileText size={16} /> Documentos
        </button>
        <button 
          onClick={() => setViewMode('product')}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border-none cursor-pointer ${viewMode === 'product' ? 'bg-mt-text-primary text-mt-bg' : 'bg-mt-surface-subtle text-mt-text-secondary hover:text-mt-text-primary'}`}
        >
          <FileSpreadsheet size={16} /> Por Producto
        </button>
      </div>

      {viewMode === 'document' ? (
        <DataTable 
          columns={docColumns}
          data={documents}
          searchKey="reference"
          searchPlaceholder="Buscar documento..."
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="w-[300px]">
            <Input 
              type="text" 
              placeholder="Buscar por SKU o producto..." 
              value={productSearch} 
              onChange={e => setProductSearch(e.target.value)}
            />
          </div>
          <DataTable 
            columns={prodColumns}
            data={productMovements}
          />
        </div>
      )}

      {/* Document Detail Modal */}
      <Modal isOpen={!!selectedDocId} onClose={() => setSelectedDocId(null)} title={selectedDocObj?.title || 'Detalle de documento'} width="650px">
        {selectedDocObj && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start bg-mt-surface-subtle p-4 rounded-lg border border-mt-border">
              <div>
                <div className="text-xs text-mt-text-secondary mb-1">Referencia</div>
                <div className="font-mono text-sm text-mt-text-primary break-all">{selectedDocObj.reference}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-mt-text-secondary mb-1">Fecha / Periodo</div>
                <div className="font-semibold text-sm text-mt-text-primary">
                  {selectedDocObj.type === 'SALE' 
                    ? formatPeriod(selectedDocObj.source.periodStart, selectedDocObj.source.periodEnd)
                    : formatDateHuman(selectedDocObj.date)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-2">
              <div className="bg-mt-surface border border-mt-border rounded-lg p-3 text-center">
                <div className="text-[10px] uppercase tracking-wider text-mt-text-secondary mb-1 font-semibold">Registros</div>
                <div className="text-lg font-bold text-mt-text-primary">{selectedDocObj.linesCount}</div>
              </div>
              <div className="bg-mt-surface border border-mt-border rounded-lg p-3 text-center">
                <div className="text-[10px] uppercase tracking-wider text-mt-text-secondary mb-1 font-semibold">Unidades</div>
                <div className="text-lg font-bold text-mt-text-primary">{selectedDocObj.totalUnits}</div>
              </div>
              <div className="bg-mt-surface border border-mt-border rounded-lg p-3 text-center">
                <div className="text-[10px] uppercase tracking-wider text-mt-text-secondary mb-1 font-semibold">{selectedDocObj.type === 'PURCHASE' ? 'Total factura' : 'Total'}</div>
                <div className="text-lg font-bold text-mt-text-primary">{formatCurrency(selectedDocObj.totalCost)}</div>
              </div>
            </div>
            <div className="h-[300px] overflow-hidden rounded-lg border border-mt-border">
              <DataTable 
                columns={detailColumns}
                data={selectedDocMovements}
              />
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setSelectedDocId(null)}>Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
