import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../components/ui/Card';
import { TrendingUp, ShoppingBag, ArrowDownRight, Package, AlertTriangle, ArrowUpRight, FileBarChart } from 'lucide-react';
import { useData } from '../context/DataContext';
import { getRawStock, getInventoryStatus } from '../lib/inventory/selectors';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@mitron/ui';
import { computePeriodFinancials, computeYearFinancials, buildMonthChartData, buildYearChartData, getDocumentDate, getNormalizedDate } from '../lib/analytics/financial';
import { aggregateSalesByProduct, topByUnits, topByRevenue, topByProfit } from '../lib/analytics/products';
import { generateInsights } from '../lib/analytics/insights';
import ReportsDrawer from '../components/domain/ReportsDrawer';

export default function Dashboard() {
  const navigate = useNavigate();
  const { incomes, expenses, products, inventoryMovements, supplyRecords, productRequests } = useData();

  const [today] = useState(() => new Date());
  const [reportsOpen, setReportsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [metricView, setMetricView] = useState<'rendimiento' | 'flujo'>('rendimiento');

  const availablePeriods = useMemo(() => {
    const periods = new Set<string>();
    incomes.forEach(i => {
      const norm = getNormalizedDate(getDocumentDate(i));
      if (norm) periods.add(`${norm.year}-${norm.month}`);
    });
    expenses.forEach(e => {
      const norm = getNormalizedDate(getDocumentDate(e));
      if (norm) periods.add(`${norm.year}-${norm.month}`);
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

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    incomes.forEach(i => {
      const norm = getNormalizedDate(getDocumentDate(i));
      if (norm) years.add(norm.year);
    });
    expenses.forEach(e => {
      const norm = getNormalizedDate(getDocumentDate(e));
      if (norm) years.add(norm.year);
    });
    if (years.size === 0) years.add(today.getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [incomes, expenses, today]);

  const [period, setPeriod] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());

  useEffect(() => {
    if (!period && availablePeriods.length > 0) {
      setPeriod(availablePeriods[0]);
    }
  }, [availablePeriods, period]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  const financials = useMemo(() => {
    if (viewMode === 'year') {
      return computeYearFinancials(incomes, expenses, selectedYear);
    }
    if (!period) return null;
    const [y, m] = period.split('-').map(Number);
    return computePeriodFinancials(incomes, expenses, y, m);
  }, [incomes, expenses, period, viewMode, selectedYear]);

  // Previous period for comparison
  const prevFinancials = useMemo(() => {
    if (viewMode === 'year') return null;
    if (!period) return null;
    const [y, m] = period.split('-').map(Number);
    const prevMonth = m === 0 ? 11 : m - 1;
    const prevYear = m === 0 ? y - 1 : y;
    return computePeriodFinancials(incomes, expenses, prevYear, prevMonth);
  }, [incomes, expenses, period, viewMode]);

  const chartData = useMemo(() => {
    if (viewMode === 'year') {
      return buildYearChartData(incomes, expenses, selectedYear);
    }
    if (!period) return [];
    const [y, m] = period.split('-').map(Number);
    return buildMonthChartData(incomes, expenses, y, m);
  }, [incomes, expenses, period, viewMode, selectedYear]);

  const inventorySummary = useMemo(() => {
    let disponibles = 0, sinExist = 0, bajo = 0, porRevisar = 0;
    products.forEach(p => {
      const rawStock = getRawStock(p.id, inventoryMovements);
      const status = getInventoryStatus(rawStock, p.hasPurchaseHistory);
      if (!p.hasPurchaseHistory) porRevisar++;
      else if (status === 'SIN EXISTENCIAS') sinExist++;
      else if (status === 'STOCK BAJO') bajo++;
      else disponibles++;
    });
    return { disponibles, sinExist, bajo, porRevisar };
  }, [products, inventoryMovements]);

  const salesMap = useMemo(() => aggregateSalesByProduct(incomes), [incomes]);
  const [productsTab, setProductsTab] = useState<'units' | 'revenue' | 'profit'>('units');

  const topProducts = useMemo(() => {
    if (productsTab === 'units') return topByUnits(salesMap, products);
    if (productsTab === 'revenue') return topByRevenue(salesMap, products);
    return topByProfit(salesMap, products);
  }, [salesMap, products, productsTab]);

  const insights = useMemo(() => {
    if (!financials) return [];
    return generateInsights(financials, prevFinancials, products, inventoryMovements, expenses, supplyRecords, productRequests, today);
  }, [financials, prevFinancials, products, inventoryMovements, expenses, supplyRecords, productRequests, today]);

  const pendingSupply = supplyRecords.filter(s => s.status === 'PEDIDO' || s.status === 'EN TRÁNSITO').length;
  const pendingRequests = productRequests.filter(r => r.status !== 'CERRADA' && r.status !== 'RESUELTA').length;
  const dueSoonCount = expenses.filter(e => {
    if (!e.dueDate) return false;
    const paid = e.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
    const remaining = e.total - paid;
    if (remaining <= 0) return false;
    const due = new Date(e.dueDate);
    return due <= new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
  }).length;

  return (
    <div className="animate-fade-in flex flex-col gap-8">
      <div className="mt-page-header items-start mb-0">
        <div>
          <h1 className="mt-page-title text-[28px] tracking-tight mb-1">Dashboard</h1>
          <p className="mt-page-subtitle text-sm text-mt-text-secondary">Resumen y métricas clave.</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex bg-mt-surface-subtle border border-mt-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-xs font-medium border-none cursor-pointer transition-colors ${viewMode === 'month' ? 'bg-mt-text-primary text-mt-bg' : 'bg-transparent text-mt-text-secondary hover:text-mt-text-primary'}`}
            >Mes</button>
            <button
              onClick={() => setViewMode('year')}
              className={`px-3 py-1.5 text-xs font-medium border-none cursor-pointer transition-colors ${viewMode === 'year' ? 'bg-mt-text-primary text-mt-bg' : 'bg-transparent text-mt-text-secondary hover:text-mt-text-primary'}`}
            >Año</button>
          </div>
          <div className="flex bg-mt-surface-subtle border border-mt-border rounded-lg overflow-hidden ml-2">
            <button
              onClick={() => setMetricView('rendimiento')}
              className={`px-3 py-1.5 text-xs font-medium border-none cursor-pointer transition-colors ${metricView === 'rendimiento' ? 'bg-mt-text-primary text-mt-bg' : 'bg-transparent text-mt-text-secondary hover:text-mt-text-primary'}`}
            >Rendimiento</button>
            <button
              onClick={() => setMetricView('flujo')}
              className={`px-3 py-1.5 text-xs font-medium border-none cursor-pointer transition-colors ${metricView === 'flujo' ? 'bg-mt-text-primary text-mt-bg' : 'bg-transparent text-mt-text-secondary hover:text-mt-text-primary'}`}
            >Flujo</button>
          </div>
          {viewMode === 'month' ? (
            <div className="w-[180px]">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger><SelectValue placeholder="Periodo" /></SelectTrigger>
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
          ) : (
            <div className="w-[120px]">
              <Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <button
            onClick={() => setReportsOpen(true)}
            className="flex items-center gap-2 bg-mt-surface-subtle border border-mt-border px-4 py-2.5 rounded-lg cursor-pointer text-mt-text-primary transition-all font-medium hover:bg-mt-surface-hover hover:border-mt-text-muted"
          >
            <FileBarChart size={16} /> <span className="text-sm">Reportes</span>
          </button>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 animate-fade-in delay-100">
        {metricView === 'rendimiento' ? (
          <>
            <StatCard
              title={<div className="flex items-center gap-2"><TrendingUp size={14} className="text-emerald-400" /> VENTAS</div>}
              value={formatCurrency(financials?.totalIncome ?? 0)}
              caption={<span className={financials && financials.totalIncome > 0 ? 'text-emerald-400 font-medium' : 'text-mt-text-muted font-medium'}>{financials && financials.totalIncome > 0 ? 'Actualizado' : 'Sin registros'}</span>}
            />
            <StatCard
              title={<div className="flex items-center gap-2"><ShoppingBag size={14} className="text-blue-400" /> COSTO DE VENTA</div>}
              value={financials?.totalSalesCost != null ? formatCurrency(financials.totalSalesCost) : '---'}
              caption={<span className="text-mt-text-muted">{financials?.totalSalesCost != null ? 'Costo mercancía vendida' : 'Sin datos suficientes'}</span>}
            />
            <StatCard
              title={<div className="flex items-center gap-2"><ArrowUpRight size={14} className="text-amber-400" /> UTILIDAD BRUTA REPORTADA</div>}
              value={financials?.reportedProfit != null ? formatCurrency(financials.reportedProfit) : '---'}
              caption={<span className="text-mt-text-muted">{financials?.grossMargin != null ? `Margen: ${(financials.grossMargin * 100).toFixed(1)}%` : 'No calculable'}</span>}
            />
            <StatCard
              title={<div className="flex items-center gap-2"><TrendingUp size={14} className="text-amber-400" /> RESULTADO ESTIMADO</div>}
              value={financials?.estimatedResult != null ? formatCurrency(financials.estimatedResult) : '---'}
              caption={<span className="text-mt-text-muted">Gastos Op: {formatCurrency(financials?.totalOperatingExpenses ?? 0)}</span>}
            />
          </>
        ) : (
          <>
            <StatCard
              title={<div className="flex items-center gap-2"><TrendingUp size={14} className="text-emerald-400" /> INGRESOS</div>}
              value={formatCurrency(financials?.totalIncome ?? 0)}
              caption={<span className={financials && financials.totalIncome > 0 ? 'text-emerald-400 font-medium' : 'text-mt-text-muted font-medium'}>{financials && financials.totalIncome > 0 ? 'Flujo de entrada' : 'Sin registros'}</span>}
            />
            <StatCard
              title={<div className="flex items-center gap-2"><ShoppingBag size={14} className="text-blue-400" /> COMPRAS</div>}
              value={formatCurrency(financials?.totalPurchases ?? 0)}
              caption={<span className="text-mt-text-muted">{financials?.totalMerchandise ? `Mercancía: ${formatCurrency(financials.totalMerchandise)}` : 'Flujo de salida'}</span>}
            />
            <StatCard
              title={<div className="flex items-center gap-2"><ArrowDownRight size={14} className="text-rose-400" /> GASTOS OPERATIVOS</div>}
              value={formatCurrency(financials?.totalOperatingExpenses ?? 0)}
              caption={<span className="text-mt-text-muted">{financials && financials.totalOperatingExpenses > 0 ? 'Derivado de XML' : '$0.00'}</span>}
            />
            <StatCard
              title={<div className="flex items-center gap-2"><Package size={14} className="text-mt-text-secondary" /> FLUJO NETO</div>}
              value={formatCurrency((financials?.totalIncome ?? 0) - ((financials?.totalPurchases ?? 0) + (financials?.totalOperatingExpenses ?? 0)))}
              caption={<span className="text-mt-text-muted">Ingresos - Egresos</span>}
            />
          </>
        )}
      </div>

      {/* Chart */}
      <div className="mt-panel bg-mt-surface border-mt-border rounded-xl overflow-hidden mb-0 animate-fade-in delay-200">
        <div className="mt-panel-header border-b border-mt-border flex justify-between items-center px-6 py-5">
          <h3 className="mt-panel-title text-[15px]">Evolución financiera</h3>
          <button className="mt-panel-action flex items-center gap-1 text-mt-text-primary font-medium" onClick={() => navigate('/administration')}>
            Detalles <ArrowUpRight size={14} />
          </button>
        </div>
        <div className="px-6 py-8">
          {chartData.length === 0 ? (
            <div className="text-center py-16 text-mt-text-muted">
              <div className="text-sm mb-2">No hay datos suficientes para generar la gráfica en este periodo.</div>
              <div className="text-xs">Importa archivos en Administración para visualizar la evolución.</div>
            </div>
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--mt-border-subtle)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--mt-text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--mt-text-secondary)" fontSize={12} tickLine={false} axisLine={false}
                    tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--mt-surface)', borderColor: 'var(--mt-border)', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: any) => [formatCurrency(Number(value)), '']}
                    cursor={{ fill: 'var(--mt-surface-subtle)' }}
                  />
                  <Legend />
                  {metricView === 'rendimiento' ? (
                    <>
                      <Bar dataKey="ingresos" fill="#10B981" radius={[4, 4, 0, 0]} name="Ventas" maxBarSize={50} />
                      <Bar dataKey="costoVenta" fill="#60A5FA" radius={[4, 4, 0, 0]} name="Costo de venta" maxBarSize={50} />
                      <Bar dataKey="utilidad" fill="#FBBF24" radius={[4, 4, 0, 0]} name="Utilidad bruta" maxBarSize={50} />
                    </>
                  ) : (
                    <>
                      <Bar dataKey="ingresos" fill="#10B981" radius={[4, 4, 0, 0]} name="Ingresos" maxBarSize={50} />
                      <Bar dataKey="compras" fill="#60A5FA" radius={[4, 4, 0, 0]} name="Compras" maxBarSize={50} />
                      <Bar dataKey="gastos" fill="#F87171" radius={[4, 4, 0, 0]} name="Gastos Op." maxBarSize={50} />
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-5 animate-fade-in delay-300">
        {/* Product Performance */}
        <div className="mt-panel rounded-xl mb-0">
          <div className="mt-panel-header px-6 py-5 flex justify-between items-center">
            <h3 className="mt-panel-title">Desempeño de productos</h3>
          </div>
          <div className="px-6 pb-2">
            <div className="flex gap-4 border-b border-mt-border mb-4">
              {([
                { id: 'units' as const, label: 'Más vendidos' },
                { id: 'revenue' as const, label: 'Mayor ingreso' },
                { id: 'profit' as const, label: 'Mayor utilidad' },
              ]).map(tab => (
                <button key={tab.id} onClick={() => setProductsTab(tab.id)}
                  className={`bg-transparent border-none text-xs cursor-pointer pb-2 transition-all -mb-[1px] ${productsTab === tab.id ? 'text-mt-text-primary font-semibold border-b-2 border-mt-text-primary' : 'text-mt-text-secondary font-medium border-b-2 border-transparent'}`}
                >{tab.label}</button>
              ))}
            </div>
            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-mt-text-muted text-sm">Sin datos de ventas</div>
            ) : (
              <div className="flex flex-col">
                {topProducts.map((item, idx) => (
                  <div key={item.sku} className="flex items-center gap-3 py-3 border-b border-mt-border last:border-0 cursor-pointer hover:bg-mt-surface-subtle rounded-lg px-2 transition-colors"
                    onClick={() => navigate('/inventory', { state: { productSku: item.sku } })}>
                    <span className="text-xs text-mt-text-muted w-5 text-center font-bold">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-mt-text-primary truncate">{item.description}</div>
                      <div className="text-[11px] text-mt-text-secondary">{item.sku}</div>
                    </div>
                    <span className="text-sm font-semibold text-mt-text-primary shrink-0">
                      {productsTab === 'units' ? `${item.value} un.` : formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Operations Block */}
        <div className="flex flex-col gap-5">
          <div className="mt-panel rounded-xl mb-0">
            <div className="mt-panel-header px-6 py-5">
              <h3 className="mt-panel-title flex items-center gap-2"><Package size={14} className="text-amber-400" /> Operación</h3>
            </div>
            <div className="px-6 pb-4">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center py-2 border-b border-mt-border last:border-0 cursor-pointer hover:bg-mt-surface-subtle rounded px-2 transition-colors" onClick={() => navigate('/inventory')}>
                  <span className="text-sm text-mt-text-secondary">Stock bajo</span>
                  <span className={`text-sm font-semibold ${inventorySummary.bajo > 0 ? 'text-amber-400' : 'text-mt-text-muted'}`}>{inventorySummary.bajo}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-mt-border last:border-0 cursor-pointer hover:bg-mt-surface-subtle rounded px-2 transition-colors" onClick={() => navigate('/inventory')}>
                  <span className="text-sm text-mt-text-secondary">Agotados</span>
                  <span className={`text-sm font-semibold ${inventorySummary.sinExist > 0 ? 'text-rose-400' : 'text-mt-text-muted'}`}>{inventorySummary.sinExist}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-mt-border last:border-0 cursor-pointer hover:bg-mt-surface-subtle rounded px-2 transition-colors" onClick={() => navigate('/inventory', { state: { tab: 'abastecimiento' } })}>
                  <span className="text-sm text-mt-text-secondary">Por recibir</span>
                  <span className={`text-sm font-semibold ${pendingSupply > 0 ? 'text-blue-400' : 'text-mt-text-muted'}`}>{pendingSupply}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-mt-border last:border-0 cursor-pointer hover:bg-mt-surface-subtle rounded px-2 transition-colors" onClick={() => navigate('/administration', { state: { tab: 'cuentas' } })}>
                  <span className="text-sm text-mt-text-secondary">Cuentas próximas</span>
                  <span className={`text-sm font-semibold ${dueSoonCount > 0 ? 'text-amber-400' : 'text-mt-text-muted'}`}>{dueSoonCount}</span>
                </div>
                <div className="flex justify-between items-center py-2 cursor-pointer hover:bg-mt-surface-subtle rounded px-2 transition-colors" onClick={() => navigate('/crm', { state: { tab: 'solicitudes' } })}>
                  <span className="text-sm text-mt-text-secondary">Solicitudes pendientes</span>
                  <span className={`text-sm font-semibold ${pendingRequests > 0 ? 'text-blue-400' : 'text-mt-text-muted'}`}>{pendingRequests}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="mt-panel rounded-xl mb-0">
              <div className="mt-panel-header px-6 py-5">
                <h3 className="mt-panel-title flex items-center gap-2"><AlertTriangle size={14} className="text-amber-400" /> Indicadores</h3>
              </div>
              <div className="px-6 pb-4">
                <div className="flex flex-col gap-2">
                  {insights.map(insight => (
                    <div key={insight.id} className="flex items-start gap-3 py-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${insight.type === 'alert' ? 'bg-rose-400' : insight.type === 'warning' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                      <span className="text-sm text-mt-text-secondary">{insight.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ReportsDrawer 
        isOpen={reportsOpen} 
        onClose={() => setReportsOpen(false)} 
        initialPeriodType={viewMode}
        initialPeriod={period}
        initialYear={selectedYear}
      />
    </div>
  );
}
