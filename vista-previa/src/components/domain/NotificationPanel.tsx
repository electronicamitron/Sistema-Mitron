
import { X, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export function NotificationPanel({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '50px',
      right: '28px',
      width: '320px',
      backgroundColor: 'var(--mt-surface)',
      border: '1px solid var(--mt-border)',
      borderRadius: '8px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '400px'
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--mt-border-subtle)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Notificaciones</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--mt-text-secondary)', cursor: 'pointer' }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ padding: '8px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        <div className="mt-notif-item">
          <AlertTriangle size={16} color="#E5A93C" />
          <div className="mt-notif-content">
            <div className="mt-notif-title">Stock bajo: PROD-001</div>
            <div className="mt-notif-meta">Quedan 3 unidades (Límite: 5)</div>
          </div>
        </div>

        <div className="mt-notif-item">
          <Clock size={16} color="#79A8D7" />
          <div className="mt-notif-content">
            <div className="mt-notif-title">Vencimiento Factura PROVEEDOR EJEMPLO</div>
            <div className="mt-notif-meta">En 3 días - $10,000.00</div>
          </div>
        </div>

        <div className="mt-notif-item">
          <CheckCircle size={16} color="#7CE38B" />
          <div className="mt-notif-content">
            <div className="mt-notif-title">Importación exitosa</div>
            <div className="mt-notif-meta">Ventas de prueba procesadas</div>
          </div>
        </div>

      </div>
    </div>
  );
}
