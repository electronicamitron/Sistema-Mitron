import { Drawer } from '../ui/Drawer';
import { StatCard } from '../ui/Card';

export function SupplierDrawer({ isOpen, onClose, supplierName, rfc }: { isOpen: boolean, onClose: () => void, supplierName: string, rfc: string }) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Detalle de Proveedor" width="500px">
      <div className="mb-6">
        <h3 className="m-0 mb-1 text-lg font-semibold text-mt-text-primary">{supplierName}</h3>
        <p className="m-0 text-mt-text-secondary">RFC: {rfc}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard title="Total Comprado" value="$10,000.00" caption="Este año" />
        <StatCard title="Facturas" value="1" caption="1 pendiente" />
      </div>

      <div className="mb-6">
        <h4 className="text-[13px] font-semibold mb-3 text-mt-text-secondary uppercase tracking-wide">Contacto y Notas</h4>
        <div className="bg-mt-surface-subtle p-4 rounded-md border border-mt-border">
          <p className="m-0 mb-2 text-mt-text-primary"><strong>Tel:</strong> 55 1234 5678</p>
          <p className="m-0 mb-2 text-mt-text-primary"><strong>Email:</strong> contacto@ejemplo.com</p>
          <p className="m-0 text-mt-text-muted text-[11px]">Notas: Entregas los días martes.</p>
        </div>
      </div>

      <div>
        <h4 className="text-[13px] font-semibold mb-3 text-mt-text-secondary uppercase tracking-wide">Facturas Recientes</h4>
        <div className="rounded-lg border border-mt-border overflow-hidden">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-mt-surface-subtle">
                <th className="px-3.5 py-2.5 text-left text-[11px] font-medium text-mt-text-secondary uppercase tracking-[0.5px]">Fecha</th>
                <th className="px-3.5 py-2.5 text-left text-[11px] font-medium text-mt-text-secondary uppercase tracking-[0.5px]">Folio</th>
                <th className="px-3.5 py-2.5 text-left text-[11px] font-medium text-mt-text-secondary uppercase tracking-[0.5px]">Total</th>
                <th className="px-3.5 py-2.5 text-left text-[11px] font-medium text-mt-text-secondary uppercase tracking-[0.5px]">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-mt-border">
                <td className="px-3.5 py-3 text-mt-text-primary">08/07/2026</td>
                <td className="px-3.5 py-3 text-mt-text-primary">RF-131812</td>
                <td className="px-3.5 py-3 text-mt-text-primary">$10,000.00</td>
                <td className="px-3.5 py-3">
                  <span className="inline-flex items-center px-2.5 py-[3px] rounded-full text-xs font-medium bg-mt-warning-bg border border-mt-warning-border text-mt-warning-text">PPD</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Drawer>
  );
}
