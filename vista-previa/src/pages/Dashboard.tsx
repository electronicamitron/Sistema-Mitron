
import { StatCard } from '../components/ui/Card';

export default function Dashboard() {
  const showMockAlert = () => alert('Acción de interfaz visual. Sin conexión a backend.');

  return (
    <div>
      <div className="mt-page-header">
        <div>
          <h1 className="mt-page-title">Dashboard</h1>
          <p className="mt-page-subtitle">Resumen general de actividad</p>
        </div>
      </div>
      <div className="mt-stats-grid">
        <StatCard title="Ingresos" value="$58,000.00" caption="Mes actual" />
        <StatCard title="Gastos" value="$0.00" caption="Sin otros gastos" />
        <StatCard title="Compras" value="$10,000.00" caption="Mes actual" />
        <StatCard title="Estado de Inventario" value="1" caption="Producto con stock bajo" />
      </div>
      
      <div className="mt-dashboard-columns">
        <div className="mt-panel">
          <div className="mt-panel-header">
            <h3 className="mt-panel-title">Evolución</h3>
            <button className="mt-panel-action" onClick={showMockAlert}>Filtrar</button>
          </div>
          <div style={{ padding: '16px', height: '155px', position: 'relative' }}>
            <svg width="100%" height="100%" viewBox="0 0 500 150" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7CE38B" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#7CE38B" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="30" x2="500" y2="30" stroke="var(--mt-border-subtle)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="var(--mt-border-subtle)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="var(--mt-border-subtle)" strokeWidth="1" />
              <path d="M0,120 L100,90 L200,100 L300,40 L400,60 L500,20 L500,150 L0,150 Z" fill="url(#chartGradient)" />
              <path d="M0,120 L100,90 L200,100 L300,40 L400,60 L500,20" fill="none" stroke="#7CE38B" strokeWidth="3" />
              <circle cx="100" cy="90" r="4" fill="var(--mt-surface)" stroke="#7CE38B" strokeWidth="2" />
              <circle cx="200" cy="100" r="4" fill="var(--mt-surface)" stroke="#7CE38B" strokeWidth="2" />
              <circle cx="300" cy="40" r="4" fill="var(--mt-surface)" stroke="#7CE38B" strokeWidth="2" />
              <circle cx="400" cy="60" r="4" fill="var(--mt-surface)" stroke="#7CE38B" strokeWidth="2" />
              <circle cx="500" cy="20" r="4" fill="var(--mt-surface)" stroke="#7CE38B" strokeWidth="2" />
            </svg>
          </div>
          <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--mt-text-secondary)', padding: '8px' }}>Gráfica de ejemplo visual</div>
        </div>
        <div className="mt-panel">
          <div className="mt-panel-header">
            <h3 className="mt-panel-title">Actividad Reciente</h3>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '12px' }}>
              <span style={{ color: '#7CE38B', marginRight: '8px' }}>●</span>
              Ventas mes actual importadas
              <div style={{ color: 'var(--mt-text-secondary)', fontSize: '11px', marginLeft: '16px', marginTop: '2px' }}>Hace 2 horas</div>
            </div>
            <div style={{ fontSize: '12px' }}>
              <span style={{ color: '#E5A93C', marginRight: '8px' }}>●</span>
              Límite de stock actualizado (PROD-001)
              <div style={{ color: 'var(--mt-text-secondary)', fontSize: '11px', marginLeft: '16px', marginTop: '2px' }}>Ayer</div>
            </div>
            <div style={{ fontSize: '12px' }}>
              <span style={{ color: 'var(--mt-text-primary)', marginRight: '8px' }}>●</span>
              Nuevo proveedor registrado
              <div style={{ color: 'var(--mt-text-secondary)', fontSize: '11px', marginLeft: '16px', marginTop: '2px' }}>Hace 3 días</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
