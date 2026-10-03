import { Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@mitron/ui';
import { Drawer } from '../ui/Drawer';
import type { PurchaseDocument, CostType } from '../../types';
import { formatDateHuman } from '../../lib/utils';
import { useData } from '../../context/DataContext';

interface InvoiceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: PurchaseDocument | null;
}

export function InvoiceDrawer({ isOpen, onClose, invoice }: InvoiceDrawerProps) {
  const { updateLineCostType } = useData();

  if (!isOpen || !invoice) return null;



  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  };

  const hasLines = invoice.lines && invoice.lines.length > 0;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Detalle de factura" width="550px">
      <div className="flex flex-col h-full">
        <div className="sticky top-0 bg-mt-bg z-10 pb-4 border-b border-mt-border flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-mt-surface-subtle p-3 rounded-lg border border-mt-border">
              <div className="text-[11px] text-mt-text-secondary mb-0.5">Proveedor</div>
              <div className="font-semibold text-sm text-mt-text-primary truncate">{invoice.supplierName}</div>
              {invoice.supplierRfc && <div className="text-[10px] font-mono text-mt-text-secondary">{invoice.supplierRfc}</div>}
            </div>
            <div className="bg-mt-surface-subtle p-3 rounded-lg border border-mt-border">
              <div className="text-[11px] text-mt-text-secondary mb-0.5">Documento</div>
              <div className="font-semibold text-sm text-mt-text-primary truncate">Serie/Folio: {invoice.serie || ''} {invoice.folio || 'S/N'}</div>
              <div className="text-[10px] text-mt-text-secondary">Fecha: {formatDateHuman(invoice.date)}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-mt-surface border border-mt-border p-2 rounded-lg flex flex-col items-center">
              <span className="text-[9px] uppercase font-bold text-mt-text-secondary tracking-wider">Subtotal</span>
              <span className="text-sm font-semibold text-mt-text-primary">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="bg-mt-surface border border-mt-border p-2 rounded-lg flex flex-col items-center">
              <span className="text-[9px] uppercase font-bold text-mt-text-secondary tracking-wider">IVA</span>
              <span className="text-sm font-semibold text-mt-text-primary">{formatCurrency(invoice.iva || 0)}</span>
            </div>
            <div className="bg-mt-surface border border-mt-border p-2 rounded-lg flex flex-col items-center">
              <span className="text-[9px] uppercase font-bold text-mt-text-secondary tracking-wider">Total</span>
              <span className="text-sm font-bold text-mt-text-primary">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 flex-1 overflow-y-auto pr-1">
          <h3 className="text-[13px] font-semibold text-mt-text-primary mb-3 uppercase tracking-wider">Conceptos</h3>
          {!hasLines ? (
            <div className="p-4 bg-mt-surface-subtle border border-mt-border border-dashed rounded-lg text-center text-[13px] text-mt-text-muted italic">
              No hay conceptos disponibles en este registro.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {invoice.lines.map((line, idx) => (
                <div key={idx} className="p-2.5 bg-mt-surface-subtle border border-mt-border rounded-lg flex flex-col gap-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-mt-text-primary leading-tight">
                        {line.description}
                      </div>
                      {line.sku && <div className="text-[10px] font-mono text-mt-text-secondary mt-0.5 truncate">{line.sku}</div>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[12px] font-bold text-mt-text-primary">{formatCurrency(line.amount)}</div>
                      <div className="text-[10px] text-mt-text-secondary">{line.quantity} un. @ {formatCurrency(line.unitCost)}</div>
                    </div>
                  </div>
                  {!line.stockable && (
                    <div className="mt-1 flex items-center justify-between border-t border-mt-border/50 pt-1.5">
                      <span className="text-[10px] text-mt-text-secondary font-medium">Clasificación financiera:</span>
                      <div className="w-[180px]">
                        <Select 
                          value={line.costType || 'OPERATING_EXPENSE'} 
                          onValueChange={(val) => updateLineCostType(invoice.id, line.id, val as CostType)}
                        >
                          <SelectTrigger className="h-6 text-[10px] px-2"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MERCHANDISE" className="text-[10px]">Mercancía</SelectItem>
                            <SelectItem value="PURCHASE_DIRECT_COST" className="text-[10px]">Costo asociado a compra</SelectItem>
                            <SelectItem value="OPERATING_EXPENSE" className="text-[10px]">Gasto operativo</SelectItem>
                            <SelectItem value="OTHER_NON_STOCK" className="text-[10px]">Otro no inventariable</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto pt-6 border-t border-mt-border flex justify-end">
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </Drawer>
  );
}
