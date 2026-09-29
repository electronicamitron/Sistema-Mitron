
import { Drawer } from '../ui/Drawer';
import { StatCard } from '../ui/Card';
import { DataTable } from '../ui/Table';
import { StatusBadge } from '../ui/Badge';

export function SupplierDrawer({ isOpen, onClose, supplierName, rfc }: { isOpen: boolean, onClose: () => void, supplierName: string, rfc: string }) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Detalle de Proveedor" width="500px">
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 600 }}>{supplierName}</h3>
        <p style={{ margin: 0, color: 'var(--mt-text-secondary)' }}>RFC: {rfc}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <StatCard title="Total Comprado" value="$10,000.00" caption="Este año" />
        <StatCard title="Facturas" value="1" caption="1 pendiente" />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--mt-text-secondary)', textTransform: 'uppercase' }}>Contacto y Notas</h4>
        <div style={{ background: 'var(--mt-surface-subtle)', padding: '16px', borderRadius: '6px', border: '1px solid var(--mt-border)' }}>
          <p style={{ margin: '0 0 8px', color: 'var(--mt-text-primary)' }}><strong>Tel:</strong> 55 1234 5678</p>
          <p style={{ margin: '0 0 8px', color: 'var(--mt-text-primary)' }}><strong>Email:</strong> contacto@ejemplo.com</p>
          <p style={{ margin: 0, color: 'var(--mt-text-muted)', fontSize: '11px' }}>Notas: Entregas los días martes.</p>
        </div>
      </div>

      <div>
        <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--mt-text-secondary)', textTransform: 'uppercase' }}>Facturas Recientes</h4>
        <DataTable columns={["Fecha", "Folio", "Total", "Estado"]}>
          <tr>
            <td>08/07/2026</td>
            <td>RF-131812</td>
            <td>$10,000.00</td>
            <td><StatusBadge status="warning">PPD</StatusBadge></td>
          </tr>
        </DataTable>
      </div>
    </Drawer>
  );
}
