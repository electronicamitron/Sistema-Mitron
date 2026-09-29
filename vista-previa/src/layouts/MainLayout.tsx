import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Package, List, Calendar as CalendarIcon, Bell, Settings, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import { NotificationPanel } from '../components/domain/NotificationPanel';
import { useAuth } from '../context/AuthContext';

export default function MainLayout() {
  const location = useLocation();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { logout } = useAuth();

  const getPageTitle = () => {
    if (location.pathname.includes('dashboard')) return 'Dashboard';
    if (location.pathname.includes('administration')) return 'Administración';
    if (location.pathname.includes('inventory')) return 'Inventario';
    if (location.pathname.includes('catalog')) return 'Catálogo';
    if (location.pathname.includes('calendar')) return 'Calendario';
    return '';
  };

  return (
    <div className="mt-app">
      <aside className="mt-sidebar">
        <div className="mt-nav-section">
          <div className="mt-brand" style={{ padding: '0 8px 16px', borderBottom: '1px solid var(--mt-border-subtle)', background: 'transparent' }}>
            <img src="/logo2.png" alt="Mitron Logo" style={{ height: '60px', objectFit: 'contain', width: '100%' }} />
          </div>
          
          <div style={{ marginTop: '16px' }}>
            <NavLink to="/dashboard" className={({ isActive }) => `mt-nav-item ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={16} />
              Dashboard
            </NavLink>
            <NavLink to="/administration" className={({ isActive }) => `mt-nav-item ${isActive ? 'active' : ''}`}>
              <Briefcase size={16} />
              Administración
            </NavLink>
            <NavLink to="/inventory" className={({ isActive }) => `mt-nav-item ${isActive ? 'active' : ''}`}>
              <Package size={16} />
              Inventario
              <span className="mt-badge warning" style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: '12px' }}>14</span>
            </NavLink>
            <NavLink to="/catalog" className={({ isActive }) => `mt-nav-item ${isActive ? 'active' : ''}`}>
              <List size={16} />
              Catálogo
            </NavLink>
            <NavLink to="/calendar" className={({ isActive }) => `mt-nav-item ${isActive ? 'active' : ''}`}>
              <CalendarIcon size={16} />
              Calendario
            </NavLink>
          </div>
        </div>

        <div className="mt-sidebar-bottom">
          <button className="mt-nav-item" onClick={() => alert('Ajustes no disponibles en esta demo')}>
            <Settings size={16} />
            Ajustes
          </button>
          <button className="mt-nav-item" onClick={logout} style={{ color: 'var(--mt-text-secondary)' }}>
            <LogOut size={16} />
            Cerrar Sesión
          </button>
          <div className="mt-user-card" style={{ backgroundColor: 'var(--mt-surface)', borderColor: 'var(--mt-border-subtle)' }}>
            <div className="mt-user-avatar" style={{ backgroundColor: '#2C2C2C', color: '#FFFFFF', border: 'none' }}>EV</div>
            <div className="mt-user-info">
              <span className="mt-user-name">Evelin</span>
              <span className="mt-user-role">Administración</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="mt-main">
        <header className="mt-header" style={{ position: 'relative' }}>
          <div className="mt-breadcrumbs">
            <span>Sistema Mitron</span>
            <span>/</span>
            <span className="mt-breadcrumb-current">{getPageTitle()}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              style={{ background: 'transparent', border: 'none', color: 'var(--mt-text-secondary)', cursor: 'pointer', position: 'relative', transition: 'color 0.2s' }}
            >
              <Bell size={20} />
              <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, backgroundColor: 'var(--mt-warning-text)', borderRadius: '50%' }}></span>
            </button>
            <div className="mt-user-avatar"><User size={14} /></div>
            <NotificationPanel isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
          </div>
        </header>
        <div className="mt-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
