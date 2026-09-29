import { useState, useEffect } from 'react';
import { Modal, Button } from '@mitron/ui';
import { useData } from '../../context/DataContext';

export function StockConfigModal({ isOpen, onClose, productId }: { isOpen: boolean, onClose: () => void, productId: string | null }) {
  const { products, updateProduct, addNotification } = useData();
  const product = products.find(p => p.id === productId);
  const [limit, setLimit] = useState(0);

  useEffect(() => {
    if (product) {
      setLimit(product.minStock);
    }
  }, [product, isOpen]);

  if (!product) return null;

  const handleSave = () => {
    updateProduct(product.id, { minStock: limit });
    addNotification({
      title: 'Límite actualizado',
      description: `El límite mínimo para ${product.name} es ahora ${limit}.`,
      type: 'info'
    });
    onClose();
  };

  const badgeStyle = (color: string, bg: string, border: string) => ({
    display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '9999px',
    fontSize: '12px', fontWeight: 500, backgroundColor: bg, border: `1px solid ${border}`, color
  } as const);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurar Límite de Stock" width="360px">
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 600, color: 'var(--mt-text-primary)' }}>{product.name}</p>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--mt-text-secondary)' }}>SKU: {product.sku}</p>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
        <p style={{ fontSize: '13px', color: 'var(--mt-text-secondary)', marginBottom: '12px' }}>Avisar cuando las existencias bajen de:</p>
        <div style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '8px', border: '1px solid var(--mt-border)', overflow: 'hidden', backgroundColor: 'var(--mt-surface-subtle)' }}>
          <button 
            onClick={() => setLimit(Math.max(0, limit - 1))} 
            style={{ backgroundColor: 'var(--mt-surface)', color: 'var(--mt-text-primary)', border: 'none', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', fontWeight: 600 }}
          >−</button>
          <div style={{ minWidth: '56px', textAlign: 'center', fontSize: '16px', fontWeight: 600, color: 'var(--mt-text-primary)', padding: '0 12px' }}>{limit}</div>
          <button 
            onClick={() => setLimit(limit + 1)} 
            style={{ backgroundColor: 'var(--mt-surface)', color: 'var(--mt-text-primary)', border: 'none', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '18px', fontWeight: 600 }}
          >+</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
        <span style={badgeStyle('#7CE38B', '#142818', '#1E4624')}>Verde &gt; {limit}</span>
        <span style={badgeStyle('var(--mt-warning-text)', 'var(--mt-warning-bg)', 'var(--mt-warning-border)')}>Ámbar ≤ {limit}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'stretch', gap: '8px' }}>
        <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</Button>
        <Button variant="primary" onClick={handleSave} style={{ flex: 1 }}>Guardar límite</Button>
      </div>
    </Modal>
  );
}
