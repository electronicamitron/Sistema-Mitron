import { Button } from '@mitron/ui';
import { Drawer } from '../ui/Drawer';
import type { PurchaseDocument } from '../../types';
import { formatDateHuman } from '../../lib/utils';

interface InvoiceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: PurchaseDocument | null;
}

export function InvoiceDrawer({ isOpen, onClose, invoice }: InvoiceDrawerProps) {
  if (!isOpen || !invoice) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  };

  const hasLines = invoice.lines && invoice.lines.length > 0;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Detalle de factura" width="550px">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-mt-surface-subtle p-4 rounded-lg border border-mt-border">
            <div className="text-xs text-mt-text-secondary mb-1">Proveedor</div>
            <div className="font-semibold text-mt-text-primary">{invoice.supplierName}</div>
            {invoice.supplierRfc && <div className="text-[11px] font-mono text-mt-text-secondary mt-1">{invoice.supplierRfc}</div>}
          </div>
          <div className="bg-mt-surface-subtle p-4 rounded-lg border border-mt-border">
            <div className="text-xs text-mt-text-secondary mb-1">Documento</div>
            <div className="font-semibold text-mt-text-primary">Serie/Folio: {invoice.serie || ''} {invoice.folio || 'S/N'}</div>
            <div className="text-[11px] font-mono text-mt-text-secondary mt-1">UUID: {invoice.uuid || 'N/A'}</div>
            <div className="text-[11px] text-mt-text-secondary mt-1">Fecha: {formatDateHuman(invoice.date)}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-mt-surface border border-mt-border p-3 rounded-lg flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-mt-text-secondary tracking-wider">Subtotal</span>
            <span className="text-sm font-semibold text-mt-text-primary">{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="bg-mt-surface border border-mt-border p-3 rounded-lg flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-mt-text-secondary tracking-wider">IVA</span>
            <span className="text-sm font-semibold text-mt-text-primary">{formatCurrency(invoice.iva || 0)}</span>
          </div>
          <div className="bg-mt-surface border border-mt-border p-3 rounded-lg flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-mt-text-secondary tracking-wider">Total</span>
            <span className="text-sm font-semibold text-mt-text-primary">{formatCurrency(invoice.total)}</span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-mt-text-primary mb-3">Conceptos</h3>
          {!hasLines ? (
            <div className="p-6 bg-mt-surface-subtle border border-mt-border border-dashed rounded-lg text-center text-sm text-mt-text-muted italic">
              No hay conceptos disponibles en este registro.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {invoice.lines.map((line, idx) => (
                <div key={idx} className="p-3 bg-mt-surface-subtle border border-mt-border rounded-lg flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="text-[13px] font-medium text-mt-text-primary flex items-center gap-2">
                        {line.description}
                        {!line.stockable && <span className="bg-mt-surface border border-mt-border text-[9px] uppercase px-1.5 py-0.5 rounded text-mt-text-secondary">Servicio</span>}
                      </div>
                      {line.sku && <div className="text-[10px] font-mono text-mt-text-secondary mt-0.5">{line.sku}</div>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[13px] font-semibold">{formatCurrency(line.amount)}</div>
                      <div className="text-[11px] text-mt-text-secondary">{line.quantity} un. @ {formatCurrency(line.unitCost)}</div>
                    </div>
                  </div>
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
