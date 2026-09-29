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
      <div className="mb-4">
        <p className="m-0 mb-1 text-[11px] text-mt-text-secondary">Producto</p>
        <p className="m-0 font-medium">{itemName}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-[11px] text-mt-text-secondary mb-1">Costo actual</label>
          <Input type="number" value={cost.toFixed(2)} readOnly className="bg-mt-surface-subtle" />
        </div>
        <div>
          <label className="block text-[11px] text-mt-text-secondary mb-1">Margen (%)</label>
          <Input type="number" value={margin} onChange={e => setMargin(Number(e.target.value))} />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-[11px] text-mt-text-secondary mb-1">IVA (%)</label>
        <Input type="number" value={iva} onChange={e => setIva(Number(e.target.value))} />
      </div>

      <div className="bg-mt-surface-subtle p-4 rounded-md mb-6">
        <div className="flex justify-between mb-2 text-mt-text-secondary">
          <span>Precio sugerido (sin IVA)</span>
          <span>${priceNoIva.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold text-sm border-t border-mt-border pt-2 text-mt-text-primary">
          <span>Precio final (con IVA)</span>
          <span className="text-[#7CE38B]">${finalPrice.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={onClose}>Aplicar precio</Button>
      </div>
    </Modal>
  );
}
