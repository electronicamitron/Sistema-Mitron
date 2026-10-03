import { useState, useMemo, useEffect } from 'react';
import { Drawer } from '../ui/Drawer';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@mitron/ui';
import { FileText, Sheet, Download } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { getDocumentDate } from '../../lib/analytics/financial';
import { generateExecutivePDF, generateDetailedExcel } from '../../lib/reports/builders';

export default function ReportsDrawer({ 
  isOpen, 
  onClose,
  initialPeriodType,
  initialPeriod,
  initialYear
}: { 
  isOpen: boolean; 
  onClose: () => void;
  initialPeriodType?: 'month' | 'year';
  initialPeriod?: string;
  initialYear?: number;
}) {
  const { incomes, expenses, products, inventoryMovements, suppliers, brands, supplyRecords, productRequests, clients, quotes, crmTasks, addNotification } = useData();

  const [periodType, setPeriodType] = useState<'month' | 'year'>(initialPeriodType || 'month');
  const [isGenerating, setIsGenerating] = useState(false);

  const today = new Date();

  const availablePeriods = useMemo(() => {
    const periods = new Set<string>();
    const extract = (d: string) => {
      const parts = d.split('T')[0].split('-');
      return { y: Number(parts[0]), m: Number(parts[1]) - 1 };
    };
    incomes.forEach(i => { const {y, m} = extract(getDocumentDate(i)); if(!isNaN(y) && !isNaN(m)) periods.add(`${y}-${m}`); });
    expenses.forEach(e => { const {y, m} = extract(getDocumentDate(e)); if(!isNaN(y) && !isNaN(m)) periods.add(`${y}-${m}`); });
    if (periods.size === 0) periods.add(`${today.getFullYear()}-${today.getMonth()}`);
    return Array.from(periods).sort((a, b) => {
      const [y1, m1] = a.split('-').map(Number);
      const [y2, m2] = b.split('-').map(Number);
      return y1 !== y2 ? y2 - y1 : m2 - m1;
    });
  }, [incomes, expenses]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    const extractY = (d: string) => Number(d.split('T')[0].split('-')[0]);
    incomes.forEach(i => { const y = extractY(getDocumentDate(i)); if(!isNaN(y)) years.add(y); });
    expenses.forEach(e => { const y = extractY(getDocumentDate(e)); if(!isNaN(y)) years.add(y); });
    if (years.size === 0) years.add(today.getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [incomes, expenses]);

  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod || availablePeriods[0] || `${today.getFullYear()}-${today.getMonth()}`);
  const [selectedYear, setSelectedYear] = useState(initialYear || today.getFullYear());

  useEffect(() => {
    if (isOpen) {
      if (initialPeriodType) setPeriodType(initialPeriodType);
      if (initialPeriod) setSelectedPeriod(initialPeriod);
      if (initialYear) setSelectedYear(initialYear);
    }
  }, [isOpen, initialPeriodType, initialPeriod, initialYear]);

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const getParams = () => {
    if (periodType === 'year') {
      return { periodType: 'year' as const, year: selectedYear, month: 0 };
    }
    const [y, m] = selectedPeriod.split('-').map(Number);
    return { periodType: 'month' as const, year: y, month: m };
  };

  const handlePDF = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        generateExecutivePDF(
          { ...getParams(), reportType: 'executive' },
          incomes, expenses, products, inventoryMovements, suppliers,
          supplyRecords, productRequests
        );
        addNotification({ title: 'PDF generado', description: 'El resumen ejecutivo se descargó correctamente.', type: 'success' });
      } catch (err: any) {
        addNotification({ title: 'Error al generar PDF', description: err.message, type: 'alert' });
      }
      setIsGenerating(false);
    }, 200);
  };

  const handleExcel = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        generateDetailedExcel(
          { ...getParams(), reportType: 'detailed' },
          incomes, expenses, products, inventoryMovements, suppliers, brands,
          supplyRecords, productRequests, clients, quotes, crmTasks
        );
        addNotification({ title: 'Excel generado', description: 'El reporte detallado se descargó correctamente.', type: 'success' });
      } catch (err: any) {
        addNotification({ title: 'Error al generar Excel', description: err.message, type: 'alert' });
      }
      setIsGenerating(false);
    }, 200);
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Generador de Reportes" width="450px">
      <div className="flex flex-col gap-6">
        <div>
          <label className="block text-[13px] text-mt-text-primary mb-2 font-medium">Tipo de periodo</label>
          <div className="flex bg-mt-surface-subtle border border-mt-border rounded-lg overflow-hidden">
            <button onClick={() => setPeriodType('month')} className={`flex-1 px-3 py-2 text-xs font-medium border-none cursor-pointer transition-colors ${periodType === 'month' ? 'bg-mt-text-primary text-mt-bg' : 'bg-transparent text-mt-text-secondary'}`}>Mensual</button>
            <button onClick={() => setPeriodType('year')} className={`flex-1 px-3 py-2 text-xs font-medium border-none cursor-pointer transition-colors ${periodType === 'year' ? 'bg-mt-text-primary text-mt-bg' : 'bg-transparent text-mt-text-secondary'}`}>Anual</button>
          </div>
        </div>

        <div>
          <label className="block text-[13px] text-mt-text-primary mb-2 font-medium">Periodo</label>
          {periodType === 'month' ? (
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger><SelectValue placeholder="Seleccionar periodo" /></SelectTrigger>
              <SelectContent>
                {availablePeriods.map(p => {
                  const [y, m] = p.split('-');
                  return <SelectItem key={p} value={p}>{monthNames[Number(m)]} {y}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          ) : (
            <Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <button
            onClick={handlePDF}
            disabled={isGenerating}
            className="flex items-center gap-3 p-4 bg-mt-surface-subtle border border-mt-border rounded-lg cursor-pointer text-left transition-all hover:bg-mt-surface-hover hover:border-mt-text-muted group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
              <FileText size={20} className="text-rose-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-mt-text-primary">Resumen Ejecutivo (PDF)</div>
              <div className="text-xs text-mt-text-secondary mt-0.5">KPIs, rankings, inventario y cuentas por pagar</div>
            </div>
            <Download size={16} className="text-mt-text-muted group-hover:text-mt-text-primary transition-colors" />
          </button>

          <button
            onClick={handleExcel}
            disabled={isGenerating}
            className="flex items-center gap-3 p-4 bg-mt-surface-subtle border border-mt-border rounded-lg cursor-pointer text-left transition-all hover:bg-mt-surface-hover hover:border-mt-text-muted group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Sheet size={20} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-mt-text-primary">Reporte Detallado (Excel)</div>
              <div className="text-xs text-mt-text-secondary mt-0.5">Ventas, compras, inventario, proveedores, solicitudes</div>
            </div>
            <Download size={16} className="text-mt-text-muted group-hover:text-mt-text-primary transition-colors" />
          </button>
        </div>

        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-mt-text-secondary m-0 leading-relaxed">
            Los reportes se generan exclusivamente con datos registrados en el sistema. 
            No sustituyen un estado financiero contable ni una auditoría formal.
          </p>
        </div>
      </div>
    </Drawer>
  );
}
