import { useNavigate } from 'react-router-dom';
import { StatCard } from '../components/ui/Card';
import { TrendingUp, AlertCircle, ShoppingBag, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@mitron/ui';

export default function Dashboard() {
  const navigate = useNavigate();
  const { incomes, expenses, products, notifications } = useData();
  
  const [period, setPeriod] = useState('0'); // 0 = Mes actual
  
  const today = useMemo(() => new Date(), []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  };

  const getFilteredData = (data: Array<{date: string}>, periodVal: string, baseDate: Date) => {
    const targetMonth = periodVal === '0' ? baseDate.getMonth() : (baseDate.getMonth() - 1 + 12) % 12;
    const targetYear = periodVal === '0' ? baseDate.getFullYear() : (baseDate.getMonth() === 0 ? baseDate.getFullYear() - 1 : baseDate.getFullYear());
    
    return data.filter(item => {
      if (!item.date) return false;
      const date = new Date(item.date);
      return date.getMonth() === targetMonth && date.getFullYear() === targetYear;
    });
  };

  const filteredIncomes = useMemo(() => getFilteredData(incomes, period, today) as typeof incomes, [incomes, period, today]);
  const filteredExpenses = useMemo(() => getFilteredData(expenses, period, today) as typeof expenses, [expenses, period, today]);

  const totalIngresos = useMemo(() => filteredIncomes.reduce((acc, curr) => acc + curr.total, 0), [filteredIncomes]);
  const totalGastos = useMemo(() => filteredExpenses.reduce((acc, curr) => acc + curr.total, 0), [filteredExpenses]);
  const totalCompras = useMemo(() => filteredExpenses.filter(e => e.category === 'Mercancía' || e.category === 'Importación').reduce((acc, curr) => acc + curr.total, 0), [filteredExpenses]);
  
  const stockAtencionReal = products.filter(p => !p.isMock && ((p.stock !== null && p.stock <= p.minStock) || p.stock === null)).length;
  const stockAtencionDemo = products.filter(p => p.isMock && ((p.stock !== null && p.stock <= p.minStock) || p.stock === null)).length;
  const stockAtencion = stockAtencionReal + stockAtencionDemo;

  const recentActivity = useMemo(() => {
    const activity: Array<{ id: string; title: string; time: string; icon: React.ReactNode; dateObj: Date }> = [];
    filteredIncomes.forEach(i => activity.push({ id: `i-${i.id}`, title: `Ingreso registrado: ${i.filename}`, time: i.createdAt, icon: <ArrowUpRight size={16} className="text-emerald-400" />, dateObj: new Date(i.createdAt) }));
    filteredExpenses.forEach(e => activity.push({ id: `e-${e.id}`, title: `Gasto registrado: ${e.supplier}`, time: e.createdAt, icon: <ArrowDownRight size={16} className="text-rose-400" />, dateObj: new Date(e.createdAt) }));
    return activity.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime()).slice(0, 5);
  }, [filteredIncomes, filteredExpenses]);

  const chartData = useMemo(() => {
    const dataMap = new Map<string, { name: string, ingresos: number, gastos: number }>();
    
    const addToMap = (dateStr: string, type: 'ingresos' | 'gastos', amount: number) => {
      const d = new Date(dateStr);
      const name = `${d.getDate()}/${d.getMonth() + 1}`;
      if (!dataMap.has(name)) {
        dataMap.set(name, { name, ingresos: 0, gastos: 0 });
      }
      dataMap.get(name)![type] += amount;
    };

    filteredIncomes.forEach(i => addToMap(i.date, 'ingresos', i.total));
    filteredExpenses.forEach(e => addToMap(e.date, 'gastos', e.total));

    return Array.from(dataMap.values()).sort((a, b) => {
      const [d1, m1] = a.name.split('/').map(Number);
      const [d2, m2] = b.name.split('/').map(Number);
      if (m1 !== m2) return m1 - m2;
      return d1 - d2;
    });
  }, [filteredIncomes, filteredExpenses]);

  const activeNotifs = notifications.slice(0, 4);

  return (
    <div className="animate-fade-in flex flex-col gap-8">
      <div className="mt-page-header items-start mb-0">
        <div>
          <h1 className="mt-page-title text-[28px] tracking-tight mb-1">Dashboard</h1>
          <p className="mt-page-subtitle text-sm text-mt-text-secondary">Resumen mensual y métricas clave.</p>
        </div>
        <div className="flex gap-3 w-[180px]">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Mes actual</SelectItem>
              <SelectItem value="1">Mes anterior</SelectItem>
            </SelectContent>
          </Select>
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
              <span className="flex items-center gap-2"><Package size={14} className="text-amber-400" /> STOCK Y CONCILIACIÓN</span>
            </div>
          } 
          value={
            <div className="flex items-baseline gap-2">
              <span>{stockAtencion}</span>
              <span className="text-base font-medium text-mt-text-secondary">alertas</span>
            </div>
          } 
          caption={
            <div className="flex gap-2 items-center">
              {stockAtencionReal > 0 && <span className="text-amber-400 font-semibold">{stockAtencionReal} reales</span>}
              {stockAtencionDemo > 0 && <span className="text-mt-text-muted text-[11px] px-1.5 py-0.5 bg-mt-surface-subtle rounded">{stockAtencionDemo} DEMO</span>}
              {stockAtencion === 0 && <span className="text-mt-text-muted font-medium">Todo en orden</span>}
            </div>
          }
        />
      </div>
      
      <div className="grid grid-cols-1 gap-5 animate-fade-in delay-200">
        <div className="mt-panel bg-mt-surface border-mt-border rounded-xl overflow-hidden mb-0">
          <div className="mt-panel-header border-b border-mt-border flex justify-between items-center px-6 py-5">
            <h3 className="mt-panel-title text-[15px]">Evolución de ingresos y gastos</h3>
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
                  <div className="mt-legend-line bg-rose-500 w-4 rounded-sm h-0.5"></div>
                  <span className="text-mt-text-primary text-[13px] font-medium">Gastos</span>
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
                  <LineChart data={chartData}>
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
                    />
                    <Line type="monotone" dataKey="ingresos" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#121212', strokeWidth: 2 }} activeDot={{ r: 6 }} name="Ingresos" />
                    <Line type="monotone" dataKey="gastos" stroke="#F43F5E" strokeWidth={3} dot={{ r: 4, fill: '#121212', strokeWidth: 2 }} activeDot={{ r: 6 }} name="Gastos" />
                  </LineChart>
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
                  <div className="text-xs text-mt-text-secondary mt-1">{new Date(item.time).toLocaleDateString()} {new Date(item.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
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
