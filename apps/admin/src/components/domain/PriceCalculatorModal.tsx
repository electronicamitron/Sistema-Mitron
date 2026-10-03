import { useState, useMemo, useEffect } from 'react';
import { Modal, Input, Button } from '@mitron/ui';
import { calculatePrice, loadCostingProfile } from '../../lib/pricing/costing';
import { Check, Settings2, Calculator } from 'lucide-react';
import type { CostingProfile } from '../../lib/pricing/costing';

export function PriceCalculatorModal({ isOpen, onClose, itemName, cost, onApply }: { isOpen: boolean, onClose: () => void, itemName: string, cost: number, onApply?: (price: number) => void }) {
  const [profile, setProfile] = useState<CostingProfile | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      setProfile(loadCostingProfile());
    }
  }, [isOpen]);

  const [marginOverride, setMarginOverride] = useState<number | ''>('');
  const [useProfile, setUseProfile] = useState(true);

  const activeMargin = marginOverride !== '' ? Number(marginOverride) : (profile?.defaultMarginPct ?? 30);
  const activeVat = profile?.defaultVatPct ?? 16;

  const calculation = useMemo(() => {
    if (!profile) return null;
    if (useProfile) {
      return calculatePrice(cost, profile, activeMargin, activeVat);
    } else {
      // Simple fallback (0% indirect costs)
      return calculatePrice(cost, { ...profile, 
        adqFletesPct: 0, 
        adqSeguroPct: 0, 
        adqLogisticaPct: 0, 
        adqOtrosPct: 0,
        opNominaPct: 0, 
        opRentaPct: 0, 
        opServiciosPct: 0,
        opAdminPct: 0,
        comComisionPct: 0, 
        comFinanciamientoPct: 0,
        comOtrosPct: 0 
      }, activeMargin, activeVat);
    }
  }, [cost, profile, useProfile, activeMargin, activeVat]);

  const handleApply = () => {
    if (calculation && onApply) {
      onApply(calculation.finalPrice);
    }
    onClose();
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Calculadora de Precio Sugerido" width="480px">
      <div className="flex flex-col gap-4">
        <div className="bg-mt-surface-subtle border border-mt-border p-3 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] text-mt-text-secondary uppercase font-semibold tracking-wider mb-0.5">Producto</div>
            <div className="text-sm font-medium text-mt-text-primary">{itemName}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-mt-text-secondary uppercase font-semibold tracking-wider mb-0.5">Costo Unitario</div>
            <div className="text-sm font-bold text-mt-text-primary">{formatCurrency(cost)}</div>
          </div>
        </div>

        <div className="flex gap-4 p-1 bg-mt-surface-subtle rounded-lg border border-mt-border">
          <button 
            onClick={() => setUseProfile(true)}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${useProfile ? 'bg-mt-text-primary text-mt-bg shadow-sm' : 'text-mt-text-secondary hover:bg-mt-surface-hover'}`}
          >
            <div className="flex items-center justify-center gap-1.5"><Settings2 size={14} /> Perfil Completo</div>
          </button>
          <button 
            onClick={() => setUseProfile(false)}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${!useProfile ? 'bg-mt-text-primary text-mt-bg shadow-sm' : 'text-mt-text-secondary hover:bg-mt-surface-hover'}`}
          >
            <div className="flex items-center justify-center gap-1.5"><Calculator size={14} /> Cálculo Simple</div>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] text-mt-text-primary font-medium mb-1.5">Margen sobre venta (%)</label>
            <Input 
              type="number" 
              value={marginOverride} 
              onChange={e => setMarginOverride(e.target.value === '' ? '' : Number(e.target.value))} 
              placeholder={profile?.defaultMarginPct.toString() || '30'}
              min={0} max={99.9} step={0.1}
            />
          </div>
          <div>
            <label className="block text-[12px] text-mt-text-primary font-medium mb-1.5">IVA (%)</label>
            <Input type="number" value={activeVat} readOnly disabled className="bg-mt-surface/50 text-mt-text-muted" />
          </div>
        </div>

        {calculation && (
          <div className="border border-mt-border rounded-lg overflow-hidden bg-mt-surface">
            <div className="p-4 space-y-3 text-[13px]">
              <div className="flex justify-between items-center">
                <span className="text-mt-text-secondary">Costo de compra</span>
                <span className="font-medium">{formatCurrency(calculation.purchaseCost)}</span>
              </div>
              {useProfile && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-mt-text-secondary">Adquisición</span>
                    <span className="text-rose-400">+{formatCurrency(calculation.adqCosts)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-mt-text-secondary">Operación asignada</span>
                    <span className="text-rose-400">+{formatCurrency(calculation.opCosts)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-mt-text-secondary">Comercial</span>
                    <span className="text-rose-400">+{formatCurrency(calculation.comCosts)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-mt-border-subtle">
                <span className="text-mt-text-secondary font-medium">Costo Económico Total</span>
                <span className="font-bold">{formatCurrency(calculation.economicCost)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-mt-text-secondary">Utilidad bruta estimada ({calculation.marginPct}%)</span>
                <span className="font-medium text-emerald-400">+{formatCurrency(calculation.profit)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-mt-text-secondary">Precio sugerido (Sin IVA)</span>
                <span className="font-semibold">{formatCurrency(calculation.priceBeforeVat)}</span>
              </div>
              <div className="flex justify-between items-center text-mt-text-muted">
                <span>IVA ({calculation.vatPct}%)</span>
                <span>+{formatCurrency(calculation.vatAmount)}</span>
              </div>
            </div>
            
            <div className="bg-mt-surface-subtle p-4 border-t border-mt-border text-center">
              <div className="text-[11px] font-semibold text-mt-text-secondary tracking-wider uppercase mb-1">Precio Final de Venta</div>
              <div className="text-2xl font-bold text-mt-text-primary">{formatCurrency(calculation.finalPrice)}</div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button variant="primary" onClick={handleApply} className="flex-1 gap-2">
            <Check size={16} /> Aplicar precio
          </Button>
        </div>
      </div>
    </Modal>
  );
}
