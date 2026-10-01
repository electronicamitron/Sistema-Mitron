import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@mitron/ui';
import { Calculator, Search, AlertCircle, ExternalLink, Check } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Precios() {
  const { products, updateProduct, addNotification } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedProductId, setSelectedProductId] = useState<string | null>(location.state?.selectedProductId || null);
  const [margin, setMargin] = useState<number>(30);
  const [iva, setIva] = useState<number>(16);
  const [copied, setCopied] = useState(false);

  const product = useMemo(() => products.find(p => p.id === selectedProductId), [products, selectedProductId]);

  const cost = product?.purchaseCost ?? 0;
  
  // margin bruto sobre venta (%)
  let priceNoIva = 0;
  let finalPrice = 0;
  let utilidad = 0;
  let finalMarginStr = '0.0';
  
  if (cost > 0 && margin >= 0 && margin < 100) {
    const marginDec = margin / 100;
    priceNoIva = cost / (1 - marginDec);
    finalPrice = priceNoIva * (1 + (iva / 100));
    utilidad = priceNoIva - cost;
    finalMarginStr = ((utilidad / priceNoIva) * 100).toFixed(1);
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  const handleApply = () => {
    if (product && finalPrice > 0) {
      updateProduct(product.id, { salePrice: finalPrice, salePriceSource: 'MANUAL' });
      addNotification({ title: 'Precio actualizado', description: `Se actualizó el precio de ${product.description}`, type: 'success' });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenCatalog = () => {
    navigate('/catalog'); // In a real app we'd pass the product ID to open it directly, or filter
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6 max-w-4xl">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <div className="mt-panel rounded-xl border border-mt-border bg-mt-surface p-5">
            <h3 className="text-[15px] font-semibold text-mt-text-primary mb-4 flex items-center gap-2">
              <Search size={16} /> 1. Seleccionar Producto
            </h3>
            <Select value={selectedProductId || ''} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Buscar producto por nombre o SKU..." />
              </SelectTrigger>
              <SelectContent>
                {products.filter(p => p.purchaseCost !== null && p.purchaseCost > 0).map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex flex-col">
                      <span>{p.description}</span>
                      <span className="text-[11px] text-mt-text-secondary">{p.sku} | Costo: {p.purchaseCost !== null ? formatCurrency(p.purchaseCost) : 'Sin costo de compra'}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {product && (
              <div className="mt-4 p-4 bg-mt-surface-subtle border border-mt-border rounded-lg text-sm">
                <div className="grid grid-cols-2 gap-y-2">
                  <div className="text-mt-text-secondary">SKU:</div>
                  <div className="font-medium text-mt-text-primary text-right">{product.sku}</div>
                  <div className="text-mt-text-secondary">Costo de referencia:</div>
                  <div className="font-semibold text-mt-text-primary text-right">{product.purchaseCost !== null ? formatCurrency(product.purchaseCost) : 'N/A'}</div>
                  <div className="text-mt-text-secondary">Precio de venta actual:</div>
                  <div className="font-semibold text-mt-text-primary text-right">{product.salePrice !== null ? formatCurrency(product.salePrice) : 'No definido'}</div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-panel rounded-xl border border-mt-border bg-mt-surface p-5 opacity-100 transition-opacity" style={{ opacity: product ? 1 : 0.5, pointerEvents: product ? 'auto' : 'none' }}>
            <h3 className="text-[15px] font-semibold text-mt-text-primary mb-4 flex items-center gap-2">
              <Calculator size={16} /> 2. Parámetros de Simulación
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[13px] text-mt-text-secondary mb-1">Margen bruto sobre venta (%)</label>
                <Input 
                  type="number" 
                  value={margin} 
                  onChange={e => setMargin(Number(e.target.value))} 
                  min={0} max={99.9} step={0.1}
                />
              </div>
              <div>
                <label className="block text-[13px] text-mt-text-secondary mb-1">IVA (%)</label>
                <Input 
                  type="number" 
                  value={iva} 
                  onChange={e => setIva(Number(e.target.value))} 
                  min={0} step={1}
                />
              </div>
            </div>
            <div className="flex gap-2 items-start text-xs text-mt-text-secondary bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
              <AlertCircle size={14} className="text-blue-400 shrink-0 mt-0.5" />
              <p className="m-0 text-blue-100/80">El margen bruto sobre venta define qué porcentaje del precio final (sin IVA) es tu ganancia. Fórmula: <code>Costo / (1 - Margen)</code>.</p>
            </div>
          </div>
        </div>

        <div>
          <div className="mt-panel rounded-xl border border-mt-border bg-mt-surface p-6 sticky top-6" style={{ opacity: product ? 1 : 0.5 }}>
            <h3 className="text-lg font-semibold text-mt-text-primary mb-6 border-b border-mt-border pb-3">Resultados</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-sm">
                <span className="text-mt-text-secondary">Costo base</span>
                <span className="font-medium text-mt-text-primary">{formatCurrency(cost)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-mt-text-secondary">Precio sugerido (Sin IVA)</span>
                <span className="font-medium text-mt-text-primary">{formatCurrency(priceNoIva)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-mt-text-secondary">IVA ({iva}%)</span>
                <span className="font-medium text-mt-text-primary">{formatCurrency(finalPrice - priceNoIva)}</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-4 border-t border-mt-border-subtle">
                <span className="text-mt-text-secondary">Utilidad monetaria (bruta)</span>
                <span className="font-semibold text-emerald-400">{formatCurrency(utilidad)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-mt-text-secondary">Margen resultante</span>
                <span className="font-semibold text-emerald-400">{finalMarginStr}%</span>
              </div>
            </div>

            <div className="bg-mt-surface-subtle p-5 rounded-xl border border-mt-border mb-8 text-center">
              <div className="text-[13px] text-mt-text-secondary mb-1 uppercase tracking-wider font-semibold">Precio Final Sugerido</div>
              <div className="text-3xl font-bold text-mt-text-primary tracking-tight">
                {formatCurrency(finalPrice)}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                variant="primary" 
                size="lg" 
                onClick={handleApply}
                className="w-full flex items-center justify-center gap-2"
                disabled={!product || finalPrice <= 0}
              >
                {copied ? <Check size={18} /> : <Check size={18} />}
                {copied ? 'Precio actualizado' : 'Aplicar precio sugerido'}
              </Button>
              <Button 
                variant="secondary" 
                size="lg" 
                onClick={handleOpenCatalog}
                className="w-full flex items-center justify-center gap-2"
                disabled={!product}
              >
                <ExternalLink size={18} />
                Abrir producto en Catálogo
              </Button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
