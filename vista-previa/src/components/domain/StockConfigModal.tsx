import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/Badge';

export function StockConfigModal({ isOpen, onClose, itemName, sku, currentLimit = 5 }: { isOpen: boolean, onClose: () => void, itemName: string, sku: string, currentLimit?: number }) {
  const [limit, setLimit] = useState(currentLimit);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurar Límite de Stock" width="320px">
      <div style={{ marginBottom: '16px', textAlign: 'center' }}>
        <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600 }}>{itemName}</p>
        <p style={{ margin: 0, fontSize: '11px', color: 'var(--mt-text-secondary)' }}>SKU: {sku}</p>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
        <p style={{ fontSize: '11px', color: 'var(--mt-text-secondary)', marginBottom: '8px' }}>Avisar cuando las existencias bajen de:</p>
        <div className="mt-stepper">
          <button className="mt-stepper-btn" onClick={() => setLimit(Math.max(0, limit - 1))}>−</button>
          <div className="mt-stepper-val">{limit}</div>
          <button className="mt-stepper-btn" onClick={() => setLimit(limit + 1)}>+</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
        <StatusBadge status="success">Verde &gt; {limit}</StatusBadge>
        <StatusBadge status="warning">Ámbar ≤ {limit}</StatusBadge>
      </div>

      <div style={{ display: 'flex', justifyContent: 'stretch', gap: '8px' }}>
        <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
        <Button variant="primary" onClick={() => { alert('Acción de interfaz visual. Sin conexión a backend.'); onClose(); }} style={{ flex: 1 }}>Guardar límite</Button>
      </div>
    </Modal>
  );
}
