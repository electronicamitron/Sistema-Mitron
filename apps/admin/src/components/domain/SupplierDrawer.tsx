import { Drawer } from '../ui/Drawer';
import { StatCard } from '../ui/Card';
import { useData } from '../../context/DataContext';
import { formatDateHuman } from '../../lib/utils';

export function SupplierDrawer({ isOpen, onClose, rfc }: { isOpen: boolean, onClose: () => void, rfc: string }) {
  const { suppliers, expenses } = useData();
  
  const supplier = suppliers.find(s => s.rfc === rfc);
  
  if (!supplier) return null;

  const supplierExpenses = expenses.filter(e => e.supplierRfc === rfc).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalPurchased = supplierExpenses.reduce((sum, curr) => sum + curr.total, 0);

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Ficha del Proveedor" width="500px">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h3 className="m-0 mb-1 text-lg font-semibold text-mt-text-primary flex items-center gap-2">
            {supplier.name}
          </h3>
          <p className="m-0 text-sm text-mt-text-secondary font-mono bg-mt-surface-subtle inline-block px-2 py-0.5 rounded">RFC: {rfc}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard title="Total Comprado" value={formatCurrency(totalPurchased)} caption="Histórico" />
        <StatCard title="Facturas" value={supplierExpenses.length.toString()} caption="0 pendiente(s)" />
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
                  <th className="px-3.5 py-2.5 text-left text-[11px] font-medium text-mt-text-secondary uppercase tracking-[0.5px]">Folio/UUID</th>
                  <th className="px-3.5 py-2.5 text-right text-[11px] font-medium text-mt-text-secondary uppercase tracking-[0.5px]">Total</th>
                  <th className="px-3.5 py-2.5 text-center text-[11px] font-medium text-mt-text-secondary uppercase tracking-[0.5px]">Estado</th>
                </tr>
              </thead>
              <tbody>
                {supplierExpenses.slice(0, 10).map((expense) => {
                  const id = expense.uuid ? expense.uuid.split('-')[0] : (expense.folio || expense.serie || 'S/N');
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
