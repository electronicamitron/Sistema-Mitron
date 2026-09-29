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

  const badgeClass = (colorClass: string, bgClass: string, borderClass: string) => 
    `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${bgClass} ${borderClass} ${colorClass}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurar Límite de Stock" width="360px">
      <div className="mb-5 text-center">
        <p className="m-0 mb-1 text-[15px] font-semibold text-mt-text-primary">{product.name}</p>
        <p className="m-0 text-xs text-mt-text-secondary">SKU: {product.sku}</p>
      </div>
      
      <div className="flex flex-col items-center mb-6">
        <p className="text-[13px] text-mt-text-secondary mb-3">Avisar cuando las existencias bajen de:</p>
        <div className="inline-flex items-center rounded-lg border border-mt-border overflow-hidden bg-mt-surface-subtle">
          <button 
            onClick={() => setLimit(Math.max(0, limit - 1))} 
            className="bg-mt-surface text-mt-text-primary border-none w-10 h-10 flex items-center justify-center cursor-pointer text-lg font-semibold hover:bg-mt-surface-hover"
          >−</button>
          <div className="min-w-[56px] text-center text-base font-semibold text-mt-text-primary px-3">{limit}</div>
          <button 
            onClick={() => setLimit(limit + 1)} 
            className="bg-mt-surface text-mt-text-primary border-none w-10 h-10 flex items-center justify-center cursor-pointer text-lg font-semibold hover:bg-mt-surface-hover"
          >+</button>
        </div>
      </div>

      <div className="flex gap-2 justify-center mb-6">
        <span className={badgeClass('text-[#7CE38B]', 'bg-[#142818]', 'border-[#1E4624]')}>Verde &gt; {limit}</span>
        <span className={badgeClass('text-mt-warning-text', 'bg-mt-warning-bg', 'border-mt-warning-border')}>Ámbar ≤ {limit}</span>
      </div>

      <div className="flex justify-stretch gap-2">
        <Button variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
        <Button variant="primary" onClick={handleSave} className="flex-1">Guardar límite</Button>
      </div>
    </Modal>
  );
}
