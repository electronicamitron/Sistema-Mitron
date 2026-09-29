import { useState } from 'react';
import { Modal, Input, Button } from '@mitron/ui';

export function PriceCalculatorModal({ isOpen, onClose, itemName, cost }: { isOpen: boolean, onClose: () => void, itemName: string, cost: number }) {
  const [margin, setMargin] = useState(30);
  const [iva, setIva] = useState(16);

  const marginDec = margin / 100;
  const priceNoIva = cost / (1 - marginDec);
  const finalPrice = priceNoIva * (1 + (iva / 100));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Calculadora de Precios">
      <div style={{ marginBottom: '16px' }}>
        <p style={{ margin: '0 0 4px', fontSize: '11px', color: 'var(--mt-text-secondary)' }}>Producto</p>
        <p style={{ margin: 0, fontWeight: 500 }}>{itemName}</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--mt-text-secondary)', marginBottom: '4px' }}>Costo actual</label>
          <Input type="number" value={cost.toFixed(2)} readOnly style={{ background: 'var(--mt-surface-subtle)' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: 'var(--mt-text-secondary)', marginBottom: '4px' }}>Margen (%)</label>
          <Input type="number" value={margin} onChange={e => setMargin(Number(e.target.value))} />
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '11px', color: 'var(--mt-text-secondary)', marginBottom: '4px' }}>IVA (%)</label>
        <Input type="number" value={iva} onChange={e => setIva(Number(e.target.value))} />
      </div>

      <div style={{ background: 'var(--mt-surface-subtle)', padding: '16px', borderRadius: '6px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: 'var(--mt-text-secondary)' }}>Precio sugerido (sin IVA)</span>
          <span>${priceNoIva.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '14px', borderTop: '1px solid var(--mt-border)', paddingTop: '8px' }}>
          <span>Precio final (con IVA)</span>
          <span style={{ color: '#7CE38B' }}>${finalPrice.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={onClose}>Aplicar precio</Button>
      </div>
    </Modal>
  );
}
