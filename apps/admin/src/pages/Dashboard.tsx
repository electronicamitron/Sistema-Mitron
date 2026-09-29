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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
  };

  const getFilteredData = (data: Array<{date: string}>) => {
    const today = new Date();
    const targetMonth = period === '0' ? today.getMonth() : (today.getMonth() - 1 + 12) % 12;
    const targetYear = period === '0' ? today.getFullYear() : (today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear());
    
    return data.filter(item => {
      if (!item.date) return false;
      const date = new Date(item.date);
      return date.getMonth() === targetMonth && date.getFullYear() === targetYear;
    });
  };

  const filteredIncomes = getFilteredData(incomes) as typeof incomes;
  const filteredExpenses = getFilteredData(expenses) as typeof expenses;

  const totalIngresos = filteredIncomes.reduce((acc, curr) => acc + curr.total, 0);
  const totalGastos = filteredExpenses.reduce((acc, curr) => acc + curr.total, 0);
  const totalCompras = filteredExpenses.filter(e => e.category === 'Mercancía' || e.category === 'Importación').reduce((acc, curr) => acc + curr.total, 0);
  const stockAtencionReal = products.filter(p => !p.isMock && ((p.stock !== null && p.stock <= p.minStock) || p.stock === null)).length;
  const stockAtencionDemo = products.filter(p => p.isMock && ((p.stock !== null && p.stock <= p.minStock) || p.stock === null)).length;
  const stockAtencion = stockAtencionReal + stockAtencionDemo;

  const recentActivity = useMemo(() => {
    const activity: Array<{ id: string; title: string; time: string; icon: React.ReactNode; dateObj: Date }> = [];
    filteredIncomes.forEach(i => activity.push({ id: `i-${i.id}`, title: `Ingreso registrado: ${i.filename}`, time: i.createdAt, icon: <ArrowUpRight size={16} style={{ color: '#34d399' }} />, dateObj: new Date(i.createdAt) }));
    filteredExpenses.forEach(e => activity.push({ id: `e-${e.id}`, title: `Gasto registrado: ${e.supplier}`, time: e.createdAt, icon: <ArrowDownRight size={16} style={{ color: '#fb7185' }} />, dateObj: new Date(e.createdAt) }));
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

    const sortedData = Array.from(dataMap.values()).sort((a, b) => {
      const [d1, m1] = a.name.split('/').map(Number);
      const [d2, m2] = b.name.split('/').map(Number);
      if (m1 !== m2) return m1 - m2;
      return d1 - d2;
    });

    return sortedData;
  }, [filteredIncomes, filteredExpenses]);

  const activeNotifs = notifications.slice(0, 4);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="mt-page-header" style={{ alignItems: 'flex-start', marginBottom: 0 }}>
        <div>
          <h1 className="mt-page-title" style={{ fontSize: '28px', letterSpacing: '-0.8px', marginBottom: '4px' }}>Dashboard</h1>
          <p className="mt-page-subtitle" style={{ fontSize: '14px', color: 'var(--mt-text-secondary)' }}>Resumen mensual y métricas clave.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', width: '180px' }}>
          <Select value={period} onValueChange={(val) => setPeriod(val)}>
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

      <div className="mt-stats-grid animate-fade-in delay-100" style={{ gap: '20px' }}>
        <StatCard 
          title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><TrendingUp size={14} style={{ color: '#34d399' }} /> INGRESOS</div>} 
          value={formatCurrency(totalIngresos)} 
          caption={<span style={{ color: totalIngresos > 0 ? '#34d399' : 'var(--mt-text-muted)', fontWeight: 500 }}>{totalIngresos > 0 ? 'Actualizado' : 'Sin registros'}</span>} 
        />
        <StatCard 
          title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ArrowDownRight size={14} style={{ color: '#fb7185' }} /> GASTOS OPERATIVOS</div>} 
          value={formatCurrency(totalGastos)} 
          caption={<span style={{ color: totalGastos > 0 ? '#fb7185' : 'var(--mt-text-muted)', fontWeight: 500 }}>{totalGastos > 0 ? 'Actualizado' : 'Sin registros'}</span>} 
        />
        <StatCard 
          title={<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ShoppingBag size={14} style={{ color: '#60a5fa' }} /> COMPRAS</div>} 
          value={formatCurrency(totalCompras)} 
          caption={<span style={{ color: 'var(--mt-text-muted)' }}>{filteredExpenses.length} facturas registradas</span>} 
        />
        <StatCard 
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Package size={14} style={{ color: '#fbbf24' }} /> STOCK Y CONCILIACIÓN</span>
            </div>
          } 
          value={
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span>{stockAtencion}</span>
              <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--mt-text-secondary)' }}>alertas</span>
            </div>
          } 
          caption={
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {stockAtencionReal > 0 && <span style={{ color: '#fbbf24', fontWeight: 600 }}>{stockAtencionReal} reales</span>}
              {stockAtencionDemo > 0 && <span style={{ color: 'var(--mt-text-muted)', fontSize: '11px', padding: '2px 6px', backgroundColor: 'var(--mt-surface-subtle)', borderRadius: '4px' }}>{stockAtencionDemo} DEMO</span>}
              {stockAtencion === 0 && <span style={{ color: 'var(--mt-text-muted)', fontWeight: 500 }}>Todo en orden</span>}
            </div>
          }
        />
      </div>
      
      <div className="mt-dashboard-columns animate-fade-in delay-200" style={{ gridTemplateColumns: '1fr', gap: '20px' }}>
        <div className="mt-panel" style={{ backgroundColor: 'var(--mt-surface)', borderColor: 'var(--mt-border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div className="mt-panel-header" style={{ borderBottom: '1px solid var(--mt-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px' }}>
            <h3 className="mt-panel-title" style={{ fontSize: '15px' }}>Evolución de ingresos y gastos</h3>
            <button className="mt-panel-action" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--mt-text-primary)', fontWeight: 500 }} onClick={() => navigate('/administration')}>
              Detalles <ArrowUpRight size={14} />
            </button>
          </div>
          <div style={{ padding: '32px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <div className="mt-chart-legend" style={{ marginBottom: 0, gap: '32px' }}>
                <div className="mt-legend-item">
                  <div className="mt-legend-line" style={{ backgroundColor: '#10B981', width: '16px', borderRadius: '2px' }}></div>
                  <span style={{ color: 'var(--mt-text-primary)', fontSize: '13px', fontWeight: 500 }}>Ingresos</span>
                </div>
                <div className="mt-legend-item">
                  <div className="mt-legend-line" style={{ backgroundColor: '#F43F5E', width: '16px', borderRadius: '2px' }}></div>
                  <span style={{ color: 'var(--mt-text-primary)', fontSize: '13px', fontWeight: 500 }}>Gastos</span>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', fontWeight: 500 }}>Mes actual</div>
            </div>
            
            {chartData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--mt-text-muted)' }}>
                <div style={{ fontSize: '14px', marginBottom: '8px' }}>No hay datos suficientes para generar la gráfica en este periodo.</div>
                <div style={{ fontSize: '12px' }}>Importa archivos en Administración para visualizar la evolución.</div>
              </div>
            ) : (
              <div style={{ height: '260px', width: '100%', marginTop: '20px' }}>
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
      
      <div className="mt-dashboard-columns animate-fade-in delay-300" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="mt-panel" style={{ borderRadius: '12px' }}>
          <div className="mt-panel-header" style={{ padding: '20px 24px' }}>
            <h3 className="mt-panel-title">Actividad reciente</h3>
            <button className="mt-panel-action" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--mt-text-primary)', fontWeight: 500 }}>Ver todo <ArrowUpRight size={14} /></button>
          </div>
          <div style={{ padding: '8px' }}>
            {recentActivity.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--mt-text-muted)' }}>Sin actividad reciente</div>
            ) : recentActivity.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--mt-surface-subtle)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--mt-surface)', border: '1px solid var(--mt-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--mt-text-primary)' }}>{item.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', marginTop: '4px' }}>{new Date(item.time).toLocaleDateString()} {new Date(item.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-panel" style={{ borderRadius: '12px' }}>
          <div className="mt-panel-header" style={{ padding: '20px 24px' }}>
            <h3 className="mt-panel-title">Avisos y notificaciones</h3>
            <button className="mt-panel-action" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--mt-text-primary)', fontWeight: 500 }}>Ver todas <ArrowUpRight size={14} /></button>
          </div>
          <div style={{ padding: '8px' }}>
             {activeNotifs.length === 0 ? (
               <div style={{ padding: '24px', textAlign: 'center', color: 'var(--mt-text-muted)' }}>No hay notificaciones</div>
             ) : activeNotifs.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--mt-surface-subtle)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <div style={{ marginTop: '4px' }}>
                  <AlertCircle size={18} style={{ color: item.type === 'warning' ? '#fbbf24' : item.type === 'alert' ? '#fb7185' : item.type === 'success' ? '#34d399' : '#60a5fa' }} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--mt-text-primary)' }}>{item.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--mt-text-secondary)', marginTop: '4px' }}>{item.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
