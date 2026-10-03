import { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@mitron/ui';
import { Calculator, Search, Check, Save, Settings2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadCostingProfile, saveCostingProfile, calculatePrice } from '../lib/pricing/costing';
import type { CostingProfile } from '../lib/pricing/costing';

export default function Precios() {
  const { products, updateProduct, addNotification } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedProductId, setSelectedProductId] = useState<string | null>(location.state?.selectedProductId || null);
  const [profile, setProfile] = useState<CostingProfile | null>(null);
  
  useEffect(() => {
    setProfile(loadCostingProfile());
  }, []);

  const product = useMemo(() => products.find(p => p.id === selectedProductId), [products, selectedProductId]);
  const cost = product?.purchaseCost ?? 0;
  
  const [marginOverride, setMarginOverride] = useState<number | ''>('');
  
  const calculation = useMemo(() => {
    if (!profile || cost <= 0) return null;
    const margin = marginOverride !== '' ? Number(marginOverride) : profile.defaultMarginPct;
    return calculatePrice(cost, profile, margin, profile.defaultVatPct);
  }, [cost, profile, marginOverride]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  const handleApply = () => {
    if (product && calculation && calculation.finalPrice > 0) {
      updateProduct(product.id, { salePrice: calculation.finalPrice, salePriceSource: 'MANUAL' });
      addNotification({ title: 'Precio actualizado', description: `Se actualizó el precio de ${product.description}`, type: 'success' });
      navigate('/catalog');
    }
  };

  const updateProfileField = (field: keyof CostingProfile, val: string) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: Number(val) });
  };

  const saveProfile = () => {
    if (profile) {
      saveCostingProfile(profile);
      addNotification({ title: 'Perfil guardado', description: 'El perfil de costeo ha sido actualizado.', type: 'success' });
    }
  };

  if (!profile) return null;

  return (
    <div className="animate-fade-in flex flex-col gap-6 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        
        <div className="flex flex-col gap-6">
          <div className="mt-panel rounded-xl border border-mt-border bg-mt-surface p-5">
            <h3 className="text-[15px] font-semibold text-mt-text-primary mb-4 flex items-center gap-2">
              <Search size={16} className="text-mt-text-secondary" /> 1. Seleccionar Producto
            </h3>
            <Select value={selectedProductId || ''} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Buscar producto por nombre o SKU..." />
              </SelectTrigger>
              <SelectContent>
                {products.filter(p => p.purchaseCost !== null && p.purchaseCost > 0).map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex flex-col text-left">
                      <span className="font-medium text-mt-text-primary">{p.description}</span>
                      <span className="text-[11px] text-mt-text-secondary mt-0.5">{p.sku} | Costo: {formatCurrency(p.purchaseCost!)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {product && (
              <div className="mt-4 p-4 bg-mt-surface-subtle border border-mt-border rounded-lg grid grid-cols-2 gap-y-3 gap-x-4">
                <div>
                  <div className="text-[11px] text-mt-text-secondary uppercase font-semibold tracking-wider">SKU</div>
                  <div className="font-medium text-sm text-mt-text-primary">{product.sku}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-mt-text-secondary uppercase font-semibold tracking-wider">Costo Base</div>
                  <div className="font-bold text-sm text-mt-text-primary">{formatCurrency(cost)}</div>
                </div>
                <div className="col-span-2 pt-3 border-t border-mt-border-subtle flex justify-between items-center">
                  <span className="text-[11px] text-mt-text-secondary uppercase font-semibold tracking-wider">Precio de venta actual</span>
                  <span className="font-semibold text-sm text-mt-text-primary">{product.salePrice !== null ? formatCurrency(product.salePrice) : 'No definido'}</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-panel rounded-xl border border-mt-border bg-mt-surface p-5">
            <div className="flex items-center justify-between mb-4 border-b border-mt-border pb-3">
              <h3 className="text-[15px] font-semibold text-mt-text-primary flex items-center gap-2">
                <Settings2 size={16} className="text-mt-text-secondary" /> 2. Perfil de Costeo Base
              </h3>
              <Button variant="ghost" size="sm" onClick={saveProfile} className="gap-1.5"><Save size={14} /> Guardar perfil</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <h4 className="text-xs font-semibold text-mt-text-primary uppercase tracking-wider mb-3">Adquisición (%)</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[13px] text-mt-text-secondary">Flete / Transporte</label>
                    <Input type="number" value={profile.adqFletesPct} onChange={e => updateProfileField('adqFletesPct', e.target.value)} className="w-20 text-right" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[13px] text-mt-text-secondary">Seguro</label>
                    <Input type="number" value={profile.adqSeguroPct} onChange={e => updateProfileField('adqSeguroPct', e.target.value)} className="w-20 text-right" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[13px] text-mt-text-secondary">Logística / Maniobras</label>
                    <Input type="number" value={profile.adqLogisticaPct} onChange={e => updateProfileField('adqLogisticaPct', e.target.value)} className="w-20 text-right" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[13px] text-mt-text-secondary">Otros</label>
                    <Input type="number" value={profile.adqOtrosPct} onChange={e => updateProfileField('adqOtrosPct', e.target.value)} className="w-20 text-right" />
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-semibold text-mt-text-primary uppercase tracking-wider mb-3">Operativos (%)</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[13px] text-mt-text-secondary">Nómina</label>
                    <Input type="number" value={profile.opNominaPct} onChange={e => updateProfileField('opNominaPct', e.target.value)} className="w-20 text-right" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[13px] text-mt-text-secondary">Renta</label>
                    <Input type="number" value={profile.opRentaPct} onChange={e => updateProfileField('opRentaPct', e.target.value)} className="w-20 text-right" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[13px] text-mt-text-secondary">Servicios</label>
                    <Input type="number" value={profile.opServiciosPct} onChange={e => updateProfileField('opServiciosPct', e.target.value)} className="w-20 text-right" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[13px] text-mt-text-secondary">Administración</label>
                    <Input type="number" value={profile.opAdminPct} onChange={e => updateProfileField('opAdminPct', e.target.value)} className="w-20 text-right" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-mt-text-primary uppercase tracking-wider mb-3">Comerciales (%)</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[13px] text-mt-text-secondary">Comisión</label>
                    <Input type="number" value={profile.comComisionPct} onChange={e => updateProfileField('comComisionPct', e.target.value)} className="w-20 text-right" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[13px] text-mt-text-secondary">Financiamiento</label>
                    <Input type="number" value={profile.comFinanciamientoPct} onChange={e => updateProfileField('comFinanciamientoPct', e.target.value)} className="w-20 text-right" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[13px] text-mt-text-secondary">Otros</label>
                    <Input type="number" value={profile.comOtrosPct} onChange={e => updateProfileField('comOtrosPct', e.target.value)} className="w-20 text-right" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-mt-border grid grid-cols-2 gap-6">
              <div className="flex items-center justify-between gap-3">
                <label className="text-[13px] font-medium text-mt-text-primary">Margen base (%)</label>
                <Input type="number" value={profile.defaultMarginPct} onChange={e => updateProfileField('defaultMarginPct', e.target.value)} className="w-24 text-right font-medium" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <label className="text-[13px] font-medium text-mt-text-primary">IVA (%)</label>
                <Input type="number" value={profile.defaultVatPct} onChange={e => updateProfileField('defaultVatPct', e.target.value)} className="w-24 text-right" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="mt-panel rounded-xl border border-mt-border bg-mt-surface p-0 sticky top-6 overflow-hidden transition-opacity" style={{ opacity: product && calculation ? 1 : 0.4, pointerEvents: product && calculation ? 'auto' : 'none' }}>
            <div className="p-5 border-b border-mt-border bg-mt-surface-subtle">
              <h3 className="text-[15px] font-semibold text-mt-text-primary flex items-center gap-2">
                <Calculator size={16} className="text-blue-400" /> Resultado del Costeo
              </h3>
            </div>
            
            {calculation && (
              <div className="p-5 space-y-4 text-sm">
                <div className="flex justify-between items-center pb-2 border-b border-mt-border-subtle">
                  <span className="text-mt-text-secondary">Costo base de compra</span>
                  <span className="font-medium text-mt-text-primary">{formatCurrency(calculation.purchaseCost)}</span>
                </div>
                <div className="flex justify-between items-center text-rose-400">
                  <span>Adquisición ({profile.adqFletesPct + profile.adqSeguroPct + profile.adqLogisticaPct + profile.adqOtrosPct}%)</span>
                  <span>+{formatCurrency(calculation.directCosts)}</span>
                </div>
                <div className="flex justify-between items-center text-rose-400 pb-2 border-b border-mt-border-subtle">
                  <span>Operativos y Comerciales ({profile.opNominaPct + profile.opRentaPct + profile.opServiciosPct + profile.opAdminPct + profile.comComisionPct + profile.comFinanciamientoPct + profile.comOtrosPct}%)</span>
                  <span>+{formatCurrency(calculation.indirectCosts)}</span>
                </div>
                
                <div className="flex justify-between items-center pt-1 font-semibold text-[15px] text-mt-text-primary">
                  <span>Costo Económico Total</span>
                  <span>{formatCurrency(calculation.economicCost)}</span>
                </div>
                
                <div className="pt-4 mt-2">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[13px] text-mt-text-secondary">Margen deseado (%)</label>
                    <Input 
                      type="number" 
                      value={marginOverride} 
                      onChange={e => setMarginOverride(e.target.value === '' ? '' : Number(e.target.value))} 
                      placeholder={profile.defaultMarginPct.toString()}
                      className="w-20 text-right h-8"
                    />
                  </div>
                  <div className="flex justify-between items-center text-emerald-400 pb-2 border-b border-mt-border-subtle">
                    <span>Utilidad esperada</span>
                    <span className="font-medium">+{formatCurrency(calculation.profit)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-mt-text-secondary">Precio Sugerido (Sin IVA)</span>
                  <span className="font-semibold">{formatCurrency(calculation.priceBeforeVat)}</span>
                </div>
                <div className="flex justify-between items-center text-mt-text-muted">
                  <span>IVA ({calculation.vatPct}%)</span>
                  <span>+{formatCurrency(calculation.vatAmount)}</span>
                </div>
              </div>
            )}

            {calculation && (
              <div className="bg-mt-surface-subtle p-5 border-t border-mt-border">
                <div className="text-center mb-5">
                  <div className="text-[11px] text-mt-text-secondary uppercase font-semibold tracking-wider mb-1">Precio Final a Público</div>
                  <div className="text-3xl font-bold text-mt-text-primary tracking-tight">{formatCurrency(calculation.finalPrice)}</div>
                </div>
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={handleApply}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Check size={18} /> Aplicar precio y volver al Catálogo
                </Button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
