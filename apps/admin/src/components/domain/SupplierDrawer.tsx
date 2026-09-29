
import { Drawer } from '../ui/Drawer';
import { StatCard } from '../ui/Card';

export function SupplierDrawer({ isOpen, onClose, supplierName, rfc }: { isOpen: boolean, onClose: () => void, supplierName: string, rfc: string }) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Detalle de Proveedor" width="500px">
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 600, color: 'var(--mt-text-primary)' }}>{supplierName}</h3>
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
        <div style={{ borderRadius: '8px', border: '1px solid var(--mt-border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--mt-surface-subtle)' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 500, color: 'var(--mt-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fecha</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 500, color: 'var(--mt-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Folio</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 500, color: 'var(--mt-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 500, color: 'var(--mt-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderTop: '1px solid var(--mt-border)' }}>
                <td style={{ padding: '12px 14px', color: 'var(--mt-text-primary)' }}>08/07/2026</td>
                <td style={{ padding: '12px 14px', color: 'var(--mt-text-primary)' }}>RF-131812</td>
                <td style={{ padding: '12px 14px', color: 'var(--mt-text-primary)' }}>$10,000.00</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, backgroundColor: 'var(--mt-warning-bg)', borderColor: 'var(--mt-warning-border)', color: 'var(--mt-warning-text)', border: '1px solid var(--mt-warning-border)' }}>PPD</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Drawer>
  );
}
