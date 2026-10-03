import { Drawer } from '../ui/Drawer';
import { Button } from '@mitron/ui';
import { useData } from '../../context/DataContext';
import { formatDateHuman } from '../../lib/utils';
import { Mail, Phone, MessageCircle, Edit } from 'lucide-react';

export function SupplierDrawer({ isOpen, onClose, rfc, onEdit }: { isOpen: boolean, onClose: () => void, rfc: string, onEdit?: () => void }) {
  const { suppliers, expenses, products } = useData();
  
  const supplier = suppliers.find(s => s.rfc === rfc);
  
  if (!supplier) return null;

  const supplierExpenses = expenses.filter(e => e.supplierRfc === rfc).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalPurchased = supplierExpenses.reduce((sum, curr) => sum + curr.total, 0);
  const lastPurchase = supplierExpenses[0]?.date;
  
  // Relations
  const suppliedProductSkus = new Set(supplierExpenses.flatMap(e => e.lines.map(l => l.sku)));
  const suppliedProductsCount = suppliedProductSkus.size;
  const suppliedBrandsCount = new Set(Array.from(suppliedProductSkus).map(sku => products.find(p => p.sku === sku)?.brandId).filter(Boolean)).size;


  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Ficha del Proveedor" width="500px">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h3 className="m-0 mb-1 text-lg font-semibold text-mt-text-primary flex items-center gap-2">
            {supplier.name}
          </h3>
          <p className="m-0 text-sm text-mt-text-secondary font-mono bg-mt-surface-subtle inline-block px-2 py-0.5 rounded border border-mt-border">RFC: {rfc}</p>
        </div>
        {onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit} className="gap-2">
            <Edit size={14} /> Editar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-mt-surface-subtle border border-mt-border rounded-lg p-4 flex flex-col gap-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-mt-text-secondary">Contacto</div>
          <div>
            <div className="text-xs text-mt-text-secondary mb-0.5">Nombre</div>
            <div className="text-sm font-medium text-mt-text-primary">{supplier.contactName || 'Sin contacto'}</div>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-mt-text-secondary mb-0.5">Teléfono</div>
              <div className="text-sm font-medium text-mt-text-primary">{supplier.phone || 'Sin teléfono'}</div>
            </div>
            {supplier.phone && (
              <div className="flex gap-2">
                <a href={`tel:${supplier.phone.replace(/[^0-9+]/g, '')}`} className="text-mt-text-secondary hover:text-mt-text-primary transition-colors"><Phone size={14} /></a>
                <a href={`https://wa.me/${supplier.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-mt-text-secondary hover:text-emerald-400 transition-colors"><MessageCircle size={14} /></a>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-mt-text-secondary mb-0.5">Correo</div>
              <div className="text-sm font-medium text-mt-text-primary truncate max-w-[120px]" title={supplier.email}>{supplier.email || 'Sin correo'}</div>
            </div>
            {supplier.email && (
              <a href={`mailto:${supplier.email}`} className="text-mt-text-secondary hover:text-blue-400 transition-colors"><Mail size={14} /></a>
            )}
          </div>
        </div>

        <div className="bg-mt-surface border border-mt-border rounded-lg p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-mt-text-secondary mb-3">Operación</div>
          <div className="flex justify-between items-end mb-3">
            <span className="text-xs text-mt-text-secondary">Total comprado</span>
            <span className="text-sm font-semibold text-mt-text-primary">{formatCurrency(totalPurchased)}</span>
          </div>
          <div className="flex justify-between items-end mb-3">
            <span className="text-xs text-mt-text-secondary">Facturas</span>
            <span className="text-sm font-semibold text-mt-text-primary">{supplierExpenses.length}</span>
          </div>
          <div className="flex justify-between items-end mb-3">
            <span className="text-xs text-mt-text-secondary">Última compra</span>
            <span className="text-sm font-semibold text-mt-text-primary">{lastPurchase ? formatDateHuman(lastPurchase) : 'Sin datos'}</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-xs text-mt-text-secondary">Entrega (días)</span>
            <span className="text-sm font-semibold text-mt-text-primary">{supplier.leadTimeDays || 'Sin dato'}</span>
          </div>
        </div>
      </div>

      <div className="bg-mt-surface border border-mt-border rounded-lg p-4 mb-6">
        <div className="text-[10px] font-bold uppercase tracking-wider text-mt-text-secondary mb-3">Relaciones</div>
        <div className="flex justify-between items-end mb-3">
          <span className="text-xs text-mt-text-secondary">Marcas</span>
          <span className="text-sm font-semibold text-mt-text-primary">{suppliedBrandsCount}</span>
        </div>
        <div className="flex justify-between items-end">
          <span className="text-xs text-mt-text-secondary">Productos</span>
          <span className="text-sm font-semibold text-mt-text-primary">{suppliedProductsCount}</span>
        </div>
      </div>

      <div>
        <h4 className="text-[13px] font-semibold mb-3 text-mt-text-secondary uppercase tracking-wide">Facturas Recientes</h4>
        <div className="rounded-lg border border-mt-border overflow-hidden">
          {supplierExpenses.length === 0 ? (
            <div className="p-6 text-center text-mt-text-muted text-sm bg-mt-surface-subtle">No hay facturas registradas</div>
          ) : (
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-mt-surface-subtle border-b border-mt-border">
                  <th className="px-3.5 py-2.5 text-left text-[11px] font-medium text-mt-text-secondary uppercase tracking-[0.5px]">Fecha</th>
                  <th className="px-3.5 py-2.5 text-left text-[11px] font-medium text-mt-text-secondary uppercase tracking-[0.5px]">Documento</th>
                  <th className="px-3.5 py-2.5 text-right text-[11px] font-medium text-mt-text-secondary uppercase tracking-[0.5px]">Total</th>
                  <th className="px-3.5 py-2.5 text-center text-[11px] font-medium text-mt-text-secondary uppercase tracking-[0.5px]">Estado</th>
                </tr>
              </thead>
              <tbody>
                {supplierExpenses.slice(0, 10).map((expense) => {
                  const hasReference = expense.serie || expense.folio;
                  const id = hasReference ? `${expense.serie || ''} ${expense.folio || ''}`.trim() : (expense.uuid ? expense.uuid.split('-')[0] : 'S/N');
                  return (
                    <tr key={expense.id} className="border-b border-mt-border last:border-0 hover:bg-mt-surface-hover transition-colors">
                      <td className="px-3.5 py-3 text-mt-text-primary whitespace-nowrap">{formatDateHuman(expense.date)}</td>
                      <td className="px-3.5 py-3 text-mt-text-secondary font-mono">{id}</td>
                      <td className="px-3.5 py-3 text-mt-text-primary text-right font-medium">{formatCurrency(expense.total)}</td>
                      <td className="px-3.5 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-emerald-500/10 text-emerald-400`}>
                          PROCESADA
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Drawer>
  );
}
