import { useNavigate } from 'react-router-dom';
import { StatCard } from '../components/ui/Card';
import { TrendingUp, AlertCircle, ShoppingBag, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';
import { useData } from '../context/DataContext';
import { getRawStock, getInventoryStatus, hasIncompleteHistory } from '../lib/inventory/selectors';
import { useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, Button } from '@mitron/ui';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';
import { formatDateHuman } from '../lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const { incomes, expenses, products, notifications, inventoryMovements } = useData();
  
  const [today] = useState(() => new Date());
  
  const getDocumentDate = (item: any) => {
    // Para ventas usamos periodEnd (o periodStart). Para compras usamos date.
    return item.periodEnd || item.date || item.importedAt || new Date().toISOString();
  };

  const availablePeriods = useMemo(() => {
    const periods = new Set<string>();
    incomes.forEach(i => {
      const d = new Date(getDocumentDate(i));
      periods.add(`${d.getFullYear()}-${d.getMonth()}`);
    });
    expenses.forEach(e => {
      const d = new Date(getDocumentDate(e));
      periods.add(`${d.getFullYear()}-${d.getMonth()}`);
    });
    
    if (periods.size === 0) {
      periods.add(`${today.getFullYear()}-${today.getMonth()}`);
    }
    
    return Array.from(periods).sort((a, b) => {
      const [y1, m1] = a.split('-').map(Number);
      const [y2, m2] = b.split('-').map(Number);
      if (y1 !== y2) return y2 - y1;
      return m2 - m1;
    });
  }, [incomes, expenses, today]);

  const [period, setPeriod] = useState<string>('');

  // Auto-select latest period
  if (!period && availablePeriods.length > 0) {
    setPeriod(availablePeriods[0]);
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  };

  const getFilteredData = (data: any[], periodVal: string) => {
    if (!periodVal) return [];
    const [targetYear, targetMonth] = periodVal.split('-').map(Number);
    
    return data.filter(item => {
      const dateStr = getDocumentDate(item);
      const date = new Date(dateStr);
      return date.getMonth() === targetMonth && date.getFullYear() === targetYear;
    });
  };

  const filteredIncomes = useMemo(() => getFilteredData(incomes, period) as typeof incomes, [incomes, period]);
  const filteredExpenses = useMemo(() => getFilteredData(expenses, period) as typeof expenses, [expenses, period]);

  const totalIngresos = useMemo(() => filteredIncomes.reduce((acc, curr) => acc + curr.total, 0), [filteredIncomes]);
  const totalGastos = 0; // Gastos operativos not implemented yet
  const totalCompras = useMemo(() => filteredExpenses.reduce((acc, curr) => acc + curr.total, 0), [filteredExpenses]);
  
  const inventorySummary = useMemo(() => {
    let disponibles = 0;
    let sinExist = 0;
    let bajo = 0;
    let porRevisar = 0;
    
    products.forEach(p => {
      const rawStock = getRawStock(p.id, inventoryMovements);
      const status = getInventoryStatus(rawStock, p.hasPurchaseHistory);
      
      if (hasIncompleteHistory(rawStock, p.hasPurchaseHistory)) {
        porRevisar++;
      } else if (status === 'SIN EXISTENCIAS') {
        sinExist++;
      } else if (status === 'STOCK BAJO') {
        bajo++;
      } else {
        disponibles++;
      }
    });

    return { disponibles, sinExist, bajo, porRevisar, totalAlertas: sinExist + bajo };
  }, [products, inventoryMovements]);

  const recentActivity = useMemo(() => {
    const activity: Array<{ id: string; title: string; time: string; icon: React.ReactNode; dateObj: Date }> = [];
    filteredIncomes.forEach(i => {
      const time = getDocumentDate(i);
      activity.push({ id: `i-${i.id}`, title: `Ingreso registrado: ${i.txtFileRef}`, time, icon: <ArrowUpRight size={16} className="text-emerald-400" />, dateObj: new Date(time) });
    });
    filteredExpenses.forEach(e => {
      const time = getDocumentDate(e);
      activity.push({ id: `e-${e.id}`, title: `Compra registrada: ${e.supplierName}`, time, icon: <ArrowDownRight size={16} className="text-blue-400" />, dateObj: new Date(time) });
    });
    return activity.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime()).slice(0, 5);
  }, [filteredIncomes, filteredExpenses]);

  const chartData = useMemo(() => {
    const dataMap = new Map<string, { sortKey: number, name: string, ingresos: number, compras: number }>();
    
    const addToMap = (dateStr: string, type: 'ingresos' | 'compras', amount: number) => {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;
      const sortKey = d.getTime();
      const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const name = `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]}`;
      if (!dataMap.has(name)) {
        dataMap.set(name, { sortKey, name, ingresos: 0, compras: 0 });
      }
      dataMap.get(name)![type] += amount;
    };

    filteredIncomes.forEach(i => addToMap(getDocumentDate(i), 'ingresos', i.total));
    filteredExpenses.forEach(e => addToMap(getDocumentDate(e), 'compras', e.total));

    return Array.from(dataMap.values()).sort((a, b) => a.sortKey - b.sortKey);
  }, [filteredIncomes, filteredExpenses]);

  const activeNotifs = notifications.slice(0, 4);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Sistema Mitron', 14, 22);
    doc.setFontSize(12);
    doc.text('Resumen Ejecutivo', 14, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha de generación: ${formatDateHuman(today.toISOString())}`, 14, 38);
    doc.text(`Periodo seleccionado: ${period}`, 14, 44);
    
    // KPIs
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Métricas Clave', 14, 55);
    
    autoTable(doc, {
      startY: 60,
      head: [['Indicador', 'Valor']],
      body: [
        ['Ingresos', formatCurrency(totalIngresos)],
        ['Gastos Operativos', formatCurrency(totalGastos)],
        ['Compras de Mercancía', formatCurrency(totalCompras)],
        ['Balance del periodo', formatCurrency(totalIngresos - totalGastos)],
        ['Facturas registradas', filteredExpenses.length.toString()],
        ['Alertas de inventario', inventorySummary.totalAlertas.toString()],
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 44, 45] }
    });
    
    // Activity
    const nextY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text('Actividad Reciente', 14, nextY);
    
    autoTable(doc, {
      startY: nextY + 5,
      head: [['Fecha', 'Descripción']],
      body: recentActivity.map(a => [formatDateHuman(a.time), a.title]),
      theme: 'striped',
      headStyles: { fillColor: [41, 44, 45] }
    });
    
    // Note
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Indicador operativo basado en los datos registrados en Mitron; no sustituye un estado financiero contable.', 14, finalY);
    doc.text('El plano físico del local requiere autenticación real antes de exponerlo en producción.', 14, finalY + 5);
    
    doc.save(`Resumen_Ejecutivo_Mitron_${Date.now()}.pdf`);
  };

  const handleExportExcel = () => {
    const ws_data = [
      ['Sistema Mitron - Resumen Ejecutivo'],
      [`Fecha de generación:`, formatDateHuman(today.toISOString())],
      [`Periodo seleccionado:`, period],
      [],
      ['MÉTRICAS CLAVE', ''],
      ['Ingresos', totalIngresos],
      ['Gastos Operativos', totalGastos],
      ['Compras de Mercancía', totalCompras],
      ['Balance del periodo', totalIngresos - totalGastos],
      ['Facturas registradas', filteredExpenses.length],
      ['Alertas de inventario', inventorySummary.totalAlertas],
      [],
      ['ACTIVIDAD RECIENTE', 'Fecha'],
      ...recentActivity.map(a => [a.title, formatDateHuman(a.time)]),
      [],
      ['Nota:', 'Indicador operativo basado en los datos registrados en Mitron; no sustituye un estado financiero contable.']
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resumen");
    XLSX.writeFile(wb, `Resumen_Ejecutivo_Mitron_${Date.now()}.xlsx`);
  };

  return (
    <div className="animate-fade-in flex flex-col gap-8">
      <div className="mt-page-header items-start mb-0">
        <div>
          <h1 className="mt-page-title text-[28px] tracking-tight mb-1">Dashboard</h1>
          <p className="mt-page-subtitle text-sm text-mt-text-secondary">Resumen mensual y métricas clave.</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="w-[180px]">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione periodo" />
              </SelectTrigger>
              <SelectContent>
                {availablePeriods.map(p => {
                  const [y, m] = p.split('-');
                  const date = new Date(Number(y), Number(m), 1);
                  const label = date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).toUpperCase();
                  return <SelectItem key={p} value={p}>{label}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="gap-2">
                <Download size={16} /> Exportar resumen
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
                <Download size={14} /> Descargar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel} className="gap-2 cursor-pointer">
                <Download size={14} /> Descargar Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 animate-fade-in delay-100">
        <StatCard 
          title={<div className="flex items-center gap-2"><TrendingUp size={14} className="text-emerald-400" /> INGRESOS</div>} 
          value={formatCurrency(totalIngresos)} 
          caption={<span className={`font-medium ${totalIngresos > 0 ? 'text-emerald-400' : 'text-mt-text-muted'}`}>{totalIngresos > 0 ? 'Actualizado' : 'Sin registros'}</span>} 
        />
        <StatCard 
          title={<div className="flex items-center gap-2"><ArrowDownRight size={14} className="text-rose-400" /> GASTOS OPERATIVOS</div>} 
          value={formatCurrency(totalGastos)} 
          caption={<span className={`font-medium ${totalGastos > 0 ? 'text-rose-400' : 'text-mt-text-muted'}`}>{totalGastos > 0 ? 'Actualizado' : 'Sin registros'}</span>} 
        />
        <StatCard 
          title={<div className="flex items-center gap-2"><ShoppingBag size={14} className="text-blue-400" /> COMPRAS</div>} 
          value={formatCurrency(totalCompras)} 
          caption={<span className="text-mt-text-muted">{filteredExpenses.length} facturas registradas</span>} 
        />
        <StatCard 
          title={
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center gap-2"><Package size={14} className="text-amber-400" /> INVENTARIO</span>
            </div>
          } 
          value={
            <div className="flex items-baseline gap-2">
              <span>{inventorySummary.totalAlertas}</span>
              <span className="text-base font-medium text-mt-text-secondary">alertas</span>
            </div>
          } 
          caption={
            <div className="flex gap-2 items-center flex-wrap mt-1">
              {inventorySummary.disponibles > 0 && <span className="text-emerald-400 font-semibold text-xs">{inventorySummary.disponibles} disponibles</span>}
              {inventorySummary.sinExist > 0 && <span className="text-rose-400 font-semibold text-xs">{inventorySummary.sinExist} agotados</span>}
              {inventorySummary.bajo > 0 && <span className="text-amber-400 font-semibold text-xs">{inventorySummary.bajo} bajos</span>}
              {inventorySummary.porRevisar > 0 && <span className="text-blue-400 font-semibold text-xs">{inventorySummary.porRevisar} por revisar</span>}
              {inventorySummary.totalAlertas === 0 && <span className="text-emerald-400 font-medium text-xs">Inventario saludable</span>}
            </div>
          }
        />
      </div>
      
      <div className="grid grid-cols-1 gap-5 animate-fade-in delay-200">
        <div className="mt-panel bg-mt-surface border-mt-border rounded-xl overflow-hidden mb-0">
          <div className="mt-panel-header border-b border-mt-border flex justify-between items-center px-6 py-5">
            <h3 className="mt-panel-title text-[15px]">Evolución de ingresos y compras</h3>
            <button className="mt-panel-action flex items-center gap-1 text-mt-text-primary font-medium" onClick={() => navigate('/administration')}>
              Detalles <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="px-6 py-8">
            <div className="flex justify-between items-center mb-10">
              <div className="mt-chart-legend mb-0 gap-8">
                <div className="mt-legend-item">
                  <div className="mt-legend-line bg-emerald-500 w-4 rounded-sm h-0.5"></div>
                  <span className="text-mt-text-primary text-[13px] font-medium">Ingresos</span>
                </div>
                <div className="mt-legend-item">
                  <div className="mt-legend-line bg-blue-500 w-4 rounded-sm h-0.5"></div>
                  <span className="text-mt-text-primary text-[13px] font-medium">Compras</span>
                </div>
              </div>
              <div className="text-xs text-mt-text-secondary font-medium">Mes actual</div>
            </div>
            
            {chartData.length === 0 ? (
              <div className="text-center py-16 text-mt-text-muted">
                <div className="text-sm mb-2">No hay datos suficientes para generar la gráfica en este periodo.</div>
                <div className="text-xs">Importa archivos en Administración para visualizar la evolución.</div>
              </div>
            ) : (
              <div className="h-[260px] w-full mt-5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--mt-border-subtle)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--mt-text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis 
                      stroke="var(--mt-text-secondary)" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--mt-surface)', borderColor: 'var(--mt-border)', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: any) => [new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value), '']}
                      cursor={{fill: 'var(--mt-surface-subtle)'}}
                    />
                    <Bar dataKey="ingresos" fill="#10B981" radius={[4, 4, 0, 0]} name="Ingresos" maxBarSize={50} />
                    <Bar dataKey="compras" fill="#60A5FA" radius={[4, 4, 0, 0]} name="Compras" maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-5 animate-fade-in delay-300">
        <div className="mt-panel rounded-xl mb-0">
          <div className="mt-panel-header px-6 py-5">
            <h3 className="mt-panel-title">Actividad reciente</h3>
            <button className="mt-panel-action flex items-center gap-1 text-mt-text-primary font-medium">Ver todo <ArrowUpRight size={14} /></button>
          </div>
          <div className="p-2">
            {recentActivity.length === 0 ? (
              <div className="p-6 text-center text-mt-text-muted">Sin actividad reciente</div>
            ) : recentActivity.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-colors hover:bg-mt-surface-subtle">
                <div className="w-10 h-10 rounded-full bg-mt-surface border border-mt-border flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <div className="text-sm font-medium text-mt-text-primary">{item.title}</div>
                  <div className="text-xs text-mt-text-secondary mt-1">{formatDateHuman(item.time, true)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-panel rounded-xl mb-0">
          <div className="mt-panel-header px-6 py-5">
            <h3 className="mt-panel-title">Avisos y notificaciones</h3>
            <button className="mt-panel-action flex items-center gap-1 text-mt-text-primary font-medium">Ver todas <ArrowUpRight size={14} /></button>
          </div>
          <div className="p-2">
             {activeNotifs.length === 0 ? (
               <div className="p-6 text-center text-mt-text-muted">No hay notificaciones</div>
             ) : activeNotifs.map(item => (
              <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-colors hover:bg-mt-surface-subtle">
                <div className="mt-1">
                  <AlertCircle size={18} className={item.type === 'warning' ? 'text-amber-400' : item.type === 'alert' ? 'text-rose-400' : item.type === 'success' ? 'text-emerald-400' : 'text-blue-400'} />
                </div>
                <div>
                  <div className="text-sm font-medium text-mt-text-primary">{item.title}</div>
                  <div className="text-xs text-mt-text-secondary mt-1">{item.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
